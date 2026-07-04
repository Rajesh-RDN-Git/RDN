# RDN Prod — Backup & Restore Runbook (AWS RDS, ap-south-1)

Covers the PostgreSQL database. All commands assume AWS CLI configured for the prod
account, region `ap-south-1`. DB instance identifier: `rdn-prod`.

## What's backed up automatically

- **Automated backups**: enabled, **7-day retention** (`rds.tf` → `backup_retention_period = 7`
  in prod). Enables **point-in-time recovery (PITR)** to any second within the window.
- **Storage encryption**: on (`storage_encrypted = true`).
- **Final snapshot**: taken on destroy in prod (`rdn-final-snapshot`).
- Media in S3 is separately versioned (bucket versioning on the media bucket).

> Application-level note: PII columns are AES-256-GCM encrypted at rest. A restore brings
> back ciphertext — it is only readable with the same `AES_ENCRYPTION_KEY` / `BLIND_INDEX_KEY`
> in Secrets Manager. **Never lose those keys**; back up the `rdn/prod/jwt-secret` secret.

## Take a manual snapshot (before a risky migration/deploy)

```bash
aws rds create-db-snapshot \
  --db-instance-identifier rdn-prod \
  --db-snapshot-identifier rdn-prod-manual-$(date +%Y%m%d-%H%M) \
  --region ap-south-1
# wait until available
aws rds wait db-snapshot-available --db-snapshot-identifier <id> --region ap-south-1
```

## Restore — point in time (recover from bad data/deploy)

RDS restores to a **new instance** (you can't overwrite in place).

```bash
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier rdn-prod \
  --target-db-instance-identifier rdn-prod-restore \
  --restore-time 2026-07-04T12:30:00Z \
  --db-subnet-group-name rdn-prod \
  --vpc-security-group-ids <rds-sg-id> \
  --region ap-south-1
```

Then either:

- **Promote**: repoint the app's `DATABASE_URL` (in the `rdn/prod/db-credentials` secret)
  to the restored instance's endpoint and force a new ECS deployment, or
- **Copy data out** of the restore and re-import into the live instance.

## Restore — from a snapshot

```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier rdn-prod-restore \
  --db-snapshot-identifier <snapshot-id> \
  --db-subnet-group-name rdn-prod \
  --vpc-security-group-ids <rds-sg-id> \
  --region ap-south-1
```

## After any restore

1. Update `DATABASE_URL` in Secrets Manager (`rdn/prod/db-credentials`) to the new endpoint.
2. `aws ecs update-service --cluster rdn-prod --service rdn-prod-api --force-new-deployment`
3. Verify: `curl https://api.rdnetwork.in/v1/health` → 200; smoke-test login (blind-index
   lookup) to confirm the encryption keys still decrypt the restored rows.
4. Delete the temporary restore instance once cutover is confirmed.

## Test cadence

Do a **restore drill quarterly**: restore to `rdn-prod-restore`, run the health + login
smoke test, then delete it. A backup you've never restored is not a backup.
