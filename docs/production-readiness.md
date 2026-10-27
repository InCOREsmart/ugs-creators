# Production readiness checklist

## Implemented in repository
- React + TypeScript interface with grayscale and slate-blue accents.
- NestJS API, JWT auth flow, Prisma/PostgreSQL models, creator and campaign endpoints.
- Rate limiting and health endpoints.
- Presigned S3 upload URL generation and BullMQ enqueue service.
- Separate worker process with FFmpeg conversion and S3 output.
- Docker Compose split between API, worker and Redis.
- Typed frontend HTTP client.

## Required before production
- [ ] Run install/build/test for every workspace package in CI and fix all errors.
- [ ] Add integration tests with PostgreSQL + Redis; verify tenant boundaries on every endpoint.
- [ ] Complete refresh-token rotation/revocation, password recovery, email verification and session management.
- [ ] Verify multipart uploads for files over 100 MB, file type/size limits, checksums, abort/cleanup and persistence.
- [ ] Scan quarantined uploads with ClamAV before FFmpeg processing or user download; fail closed if scanner is unavailable.
- [ ] Persist media records and processing state transactionally; make retries idempotent and clean orphaned objects.
- [ ] Add RBAC and audit events for all personal-data access.
- [ ] Integrate an actual Russian ORD provider only after provider credentials, test environment and reporting schema are available.
- [ ] Integrate a Russian payout provider and legally reviewed tax-status verification. Never treat a stub as a successful FNS check.
- [ ] Have Russian legal/accounting specialists validate ad marking, consent wording, contracts, self-employed receipts and NDFL flows.
- [ ] Confirm Russian data residency for DB, object storage, CDN logs, backups, monitoring, email and all subprocessors.
- [ ] Configure HTTPS, secrets management, WAF, backups, alerting and restore drills.
- [ ] Load-test 15 concurrent video jobs, upload sizes, CDN egress and recovery targets RTO <4h / RPO <1h.

## Security boundary
Never commit .env files, credentials, real creator personal data, bank details, passport scans, or provider tokens. Public repository is source code only.