import { blindIndex, decryptField, encryptField, isEncrypted } from './field-crypto';

/**
 * Transparent field-encryption middleware for the Prisma client. Attach via
 * `applyFieldEncryption(client, cipher)` so callers keep using plaintext everywhere:
 * writes encrypt configured fields (+ populate blind-index columns), plaintext equality
 * lookups are remapped to the blind index, and reads decrypt on the way out.
 *
 * Shared by the API's PrismaService and the DB seeds so there is exactly one code path
 * that reads/writes encrypted PII.
 */

export interface FieldCipher {
  encrypt(value: string): string;
  decrypt(value: string): string;
  blindIndex(value: string): string;
  isEncrypted(value: string): boolean;
}

/** Build a FieldCipher from raw keys (for seeds / scripts without NestJS DI). */
export function makeCipher(keys: { aesKey: Buffer; blindIndexKey: Buffer }): FieldCipher {
  return {
    encrypt: (v) => encryptField(v, keys.aesKey),
    decrypt: (v) => decryptField(v, keys.aesKey),
    blindIndex: (v) => blindIndex(v, keys.blindIndexKey),
    isEncrypted: (v) => isEncrypted(v),
  };
}

interface ModelCrypto {
  fields: string[];
  json: string[];
  hash: Record<string, string>;
}

const MODELS: Record<string, ModelCrypto> = {
  User: {
    fields: ['phone', 'nomineePhone', 'nomineeName'],
    json: [],
    hash: { phone: 'phoneHash' },
  },
  Dealer: { fields: ['bankAccountDetails'], json: ['bankAccountDetails'], hash: {} },
  Lead: { fields: ['contactPhone', 'contactName'], json: [], hash: {} },
  DpdpGrievance: { fields: ['contact'], json: [], hash: {} },
};

// Union of every encrypted field name (+ which are JSON) drives the recursive decrypt
// walk, so nested relations are decrypted without tracking each nested model's type.
const ALL_FIELDS = new Set<string>();
const JSON_FIELDS = new Set<string>();
for (const cfg of Object.values(MODELS)) {
  cfg.fields.forEach((f) => ALL_FIELDS.add(f));
  cfg.json.forEach((f) => JSON_FIELDS.add(f));
}

const WRITE_ACTIONS = new Set(['create', 'createMany', 'update', 'updateMany', 'upsert']);

export function isWriteAction(action: string): boolean {
  return WRITE_ACTIONS.has(action);
}

/** Encrypt configured fields on a write payload and populate blind-index columns. */
export function encryptWriteData(
  model: string | undefined,
  data: Record<string, any> | undefined,
  cipher: FieldCipher,
): void {
  const cfg = model ? MODELS[model] : undefined;
  if (!cfg || !data || typeof data !== 'object') return;

  for (const field of cfg.fields) {
    const value = data[field];
    if (value === undefined || value === null) continue;

    const alreadyCipher = typeof value === 'string' && cipher.isEncrypted(value);

    // Blind index is derived from plaintext — set it before we overwrite the field,
    // and only when the caller didn't explicitly provide the hash (e.g. anonymization
    // passes hash: null to opt out).
    const hashField = cfg.hash[field];
    if (hashField && !(hashField in data) && !alreadyCipher) {
      data[hashField] = cipher.blindIndex(String(value));
    }

    if (alreadyCipher) continue; // idempotent — don't double-encrypt
    const plaintext = cfg.json.includes(field) ? JSON.stringify(value) : String(value);
    data[field] = cipher.encrypt(plaintext);
  }
}

/** Rewrite `where` equality on a plaintext field to its blind-index column. */
export function remapWhere(
  model: string | undefined,
  where: Record<string, any> | undefined,
  cipher: FieldCipher,
): void {
  const cfg = model ? MODELS[model] : undefined;
  if (!cfg || !where || typeof where !== 'object') return;

  for (const [field, hashField] of Object.entries(cfg.hash)) {
    const cond = where[field];
    if (cond === undefined) continue;

    let value: string | undefined;
    if (typeof cond === 'string') value = cond;
    else if (cond && typeof cond === 'object' && typeof cond.equals === 'string')
      value = cond.equals;
    if (value === undefined) continue; // non-equality (e.g. contains) can't use the blind index

    where[hashField] = cipher.blindIndex(value);
    delete where[field];
  }
}

/** Recursively decrypt configured fields anywhere in a query result (incl. nested relations). */
export function decryptResult(value: any, cipher: FieldCipher): any {
  if (value == null || typeof value !== 'object') return value;
  if (value instanceof Date || Buffer.isBuffer(value)) return value;

  if (Array.isArray(value)) {
    for (const item of value) decryptResult(item, cipher);
    return value;
  }

  for (const key of Object.keys(value)) {
    const v = value[key];
    if (typeof v === 'string' && ALL_FIELDS.has(key) && cipher.isEncrypted(v)) {
      const plain = cipher.decrypt(v);
      value[key] = JSON_FIELDS.has(key) ? safeParse(plain) : plain;
    } else if (v && typeof v === 'object') {
      decryptResult(v, cipher);
    }
  }
  return value;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    /* not JSON — return raw string */
    return text;
  }
}

/** Register the encrypt/remap/decrypt middleware on a Prisma client. */
export function applyFieldEncryption(
  client: { $use: (mw: any) => void },
  cipher: FieldCipher,
): void {
  client.$use(async (params: any, next: (p: any) => Promise<any>) => {
    const { model, action, args } = params;

    if (isWriteAction(action)) {
      if (action === 'upsert') {
        remapWhere(model, args?.where, cipher);
        encryptWriteData(model, args?.create, cipher);
        encryptWriteData(model, args?.update, cipher);
      } else if (action === 'createMany' && Array.isArray(args?.data)) {
        args.data.forEach((row: Record<string, any>) => encryptWriteData(model, row, cipher));
      } else {
        if (args?.where) remapWhere(model, args.where, cipher);
        encryptWriteData(model, args?.data, cipher);
      }
    } else if (args?.where) {
      remapWhere(model, args.where, cipher);
    }

    return decryptResult(await next(params), cipher);
  });
}
