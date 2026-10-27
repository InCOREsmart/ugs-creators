# UGS Creators

SaaS-платформа управления креаторами для брендов и агентств.

## Design system
- Основа: чёрный, белый и нейтральные серые.
- Серо-синий используется только для активной навигации, ссылок, ключевых метрик и primary actions.
- Отдельные рабочие пространства: заказчик, креатор, администратор.

## Architecture
- `apps/api`: NestJS REST API
- `apps/worker`: отдельные BullMQ workers и FFmpeg
- `apps/frontend`: React + TypeScript
- `packages/shared`: общие типы и схемы
- PostgreSQL хранит бизнес-данные и ссылки/ключи объектов, не бинарные медиа.
- Медиа хранится в S3-совместимом хранилище в РФ.

## Local development
См. `docker-compose.yml` и `.env.example`. Реальные секреты не коммитить.