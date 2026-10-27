# UGS Creators

SaaS-платформа управления креаторами для брендов и агентств.

## Design system
- Основа: чёрный, белый и нейтральные серые.
- Серо-синий используется только для активной навигации, ссылок, ключевых метрик и основных действий.
- Раздельные рабочие пространства: заказчик, креатор, администратор.

## Repository layout
- `apps/frontend`: React + TypeScript dashboard prototype.
- `apps/api`: NestJS API bootstrap and health endpoints.
- `apps/worker`: isolated BullMQ worker process. FFmpeg jobs remain disabled until storage/scanning adapters are configured.
- `database/schema.sql`: initial PostgreSQL schema.
- `docker-compose.yml`: API, worker and Redis services.

## Local development
1. Install Node.js 22 and pnpm.
2. Copy `.env.example` to `.env` and set local values.
3. Run `pnpm install`.
4. Start local dependencies and apps as the packages are completed.

Production secrets must never be committed. PostgreSQL, object storage, backups, worker servers and CDN must be selected/configured with Russian data residency confirmed by each provider. PostgreSQL stores metadata and object keys only; media binaries belong in private S3-compatible storage.

## Current state
The dashboard is a UI prototype with representative sample data. API and worker scaffolding are present; authentication, persistence, S3 multipart upload, FFmpeg processing, payment and ORD integrations are not yet production-ready.
