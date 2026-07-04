import { PrismaClient } from '@prisma/client';
import { getFieldKeys, encryptField, blindIndex, isEncrypted } from '../src/field-crypto';

/**
 * One-off, idempotent backfill: encrypt any plaintext PII rows written before field
 * encryption was enabled, and populate the phone blind index. Safe to re-run — rows
 * already tagged `v1:` are skipped. Uses a RAW PrismaClient (no encryption middleware)
 * so values are read/written exactly as stored.
 *
 *   AES_ENCRYPTION_KEY=… BLIND_INDEX_KEY=… pnpm --filter @rdn/db exec ts-node \
 *     --compiler-options '{"module":"CommonJS"}' prisma/backfill-encrypt.ts
 *
 * Run against UAT first, verify login/admin/payout/export, then prod. The keys MUST be
 * the same ones the API runs with, or encrypted data becomes unreadable.
 */
const prisma = new PrismaClient();
const { aesKey, blindIndexKey } = getFieldKeys();

const enc = (v: string) => encryptField(v, aesKey);

async function backfill<T extends { id: string }>(
  label: string,
  rows: T[],
  build: (row: T) => Record<string, unknown> | null,
  update: (id: string, data: Record<string, unknown>) => Promise<unknown>,
): Promise<void> {
  let changed = 0;
  let skipped = 0;
  for (const row of rows) {
    const data = build(row);
    if (data && Object.keys(data).length > 0) {
      try {
        await update(row.id, data);
        changed++;
      } catch (e: any) {
        // A duplicate blind index (e.g. two rows share a phone) can't both take the
        // unique phone_hash — skip the offender and keep going rather than abort.
        if (e?.code === 'P2002') {
          skipped++;
          console.warn(
            `  ${label}: skipped ${row.id} (duplicate ${JSON.stringify(e.meta?.target)})`,
          );
        } else {
          throw e;
        }
      }
    }
  }
  console.log(
    `  ${label}: ${changed}/${rows.length} rows encrypted${skipped ? `, ${skipped} skipped (dupes)` : ''}`,
  );
}

async function main() {
  console.log('Backfilling encrypted PII…');

  const users = await prisma.user.findMany({
    select: { id: true, phone: true, phoneHash: true, nomineePhone: true, nomineeName: true },
  });
  await backfill(
    'users',
    users,
    (u) => {
      const data: Record<string, unknown> = {};
      if (u.phone && !isEncrypted(u.phone)) {
        data.phone = enc(u.phone);
        if (!u.phoneHash) data.phoneHash = blindIndex(u.phone, blindIndexKey);
      }
      if (u.nomineePhone && !isEncrypted(u.nomineePhone)) data.nomineePhone = enc(u.nomineePhone);
      if (u.nomineeName && !isEncrypted(u.nomineeName)) data.nomineeName = enc(u.nomineeName);
      return data;
    },
    (id, data) => prisma.user.update({ where: { id }, data }),
  );

  const dealers = await prisma.dealer.findMany({ select: { id: true, bankAccountDetails: true } });
  await backfill(
    'dealers',
    dealers,
    (d) =>
      d.bankAccountDetails && !isEncrypted(d.bankAccountDetails)
        ? { bankAccountDetails: enc(d.bankAccountDetails) }
        : null,
    (id, data) => prisma.dealer.update({ where: { id }, data }),
  );

  const leads = await prisma.lead.findMany({
    select: { id: true, contactPhone: true, contactName: true },
  });
  await backfill(
    'leads',
    leads,
    (l) => {
      const data: Record<string, unknown> = {};
      if (l.contactPhone && !isEncrypted(l.contactPhone)) data.contactPhone = enc(l.contactPhone);
      if (l.contactName && !isEncrypted(l.contactName)) data.contactName = enc(l.contactName);
      return data;
    },
    (id, data) => prisma.lead.update({ where: { id }, data }),
  );

  const grievances = await prisma.dpdpGrievance.findMany({ select: { id: true, contact: true } });
  await backfill(
    'dpdp_grievances',
    grievances,
    (g) => (g.contact && !isEncrypted(g.contact) ? { contact: enc(g.contact) } : null),
    (id, data) => prisma.dpdpGrievance.update({ where: { id }, data }),
  );

  console.log('Backfill complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
