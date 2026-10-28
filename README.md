# UGS Creators

SaaS-платформа управления креаторами для брендов и агентств.

## Дизайн
Чёрно-бело-серая основа; серо-синий акцент используется для активной навигации, ссылок и ключевых действий. Интерфейс подключён к авторизованному API: демонстрационные показатели отключены, реестры организаций/кампаний загружаются из backend.

## Структура
- `apps/frontend` — React + TypeScript.
- `apps/api` — NestJS, JWT auth, Prisma, campaign endpoints, presigned S3 uploads and BullMQ queue producer.
- `apps/worker` — отдельный BullMQ процесс: ClamAV scan, ffprobe, FFmpeg 360p/720p/1080p, thumbnail, S3 output.
- `packages/shared` — общие типы.
- `database/schema.sql` — расширенная начальная SQL-схема.
- `apps/api/prisma/schema.prisma` — Prisma schema for current API models.
- `docs/` — architecture, API contract and Russian compliance checklist.

## Запуск локально
1. Node.js 22 и pnpm 10.
2. Скопировать `.env.example` в `.env`, указать секреты и доступы к PostgreSQL в РФ и S3-совместимому хранилищу в РФ.
3. `pnpm install`
4. `pnpm db:generate`
5. Для локальной разработки: `pnpm db:push`. Для окружения с миграциями: `pnpm db:migrate` после проверки резервной копии и применимости SQL.
6. `docker compose up --build`
7. Frontend: `pnpm dev:web`; API: `pnpm dev:api`; worker: `pnpm dev:worker`.

## Первичное создание администратора

Самостоятельная регистрация по умолчанию выключена. После установки зависимостей и применения схемы/миграций создайте первого администратора **один раз** через безопасную локальную среду, где доступен production или staging `DATABASE_URL`:

```bash
ADMIN_BOOTSTRAP_EMAIL=admin@example.com \
ADMIN_BOOTSTRAP_NAME="Platform Administrator" \
ADMIN_BOOTSTRAP_PASSWORD='use-a-unique-random-password-of-at-least-16-characters' \
pnpm --filter @ugs/api admin:bootstrap
```

Используйте уникальный пароль из менеджера паролей; не сохраняйте его в репозитории, shell-скриптах или CI-логах. Скрипт создаёт `SUPER_ADMIN` только если таблица пользователей пуста, иначе завершается без изменений. После успешного запуска удалите bootstrap-переменные из окружения. Команда не предназначена для регулярного создания пользователей.

## Медиа и обработка видео

API создаёт постоянную запись `MediaAsset` при выдаче presigned URL. Состояния: `UPLOAD_PENDING`, `QUEUED`, `PROCESSING`, `READY` и `FAILED`. Воркер обновляет статус и метаданные в PostgreSQL; заказчик с доступом к кампании получает список материалов через `GET /media/campaign/:campaignId`. Примените миграции через `pnpm db:migrate` и пересоберите worker после обновления зависимостей.

## Важно перед production
Это активный инженерный каркас, а не готовая к коммерческому запуску система. Авторизация, кампании, выдача presigned upload URL и очередь видео заложены, но нужны интеграционные тесты и проверка сборки в CI. Реализованы базовые членства в организациях, API организаций и проверки доступа к кампаниям/загрузке медиа; остаются интеграционные тесты изоляции tenants, chunked multipart upload orchestration, private CDN signing, полноценный creator CRUD, electronic signatures, actual ORD/FNS/bank provider integrations, accounting reconciliation and legal review. Не подключать реальные выплаты до подтверждения договоров и сценариев провайдера.

PostgreSQL хранит только метаданные и object keys, никогда не видео. API не запускает FFmpeg. Для реальных данных использовать только провайдеров с подтверждённым размещением в РФ. Не коммитить `.env`, ключи S3, JWT secrets, банковские и паспортные данные. Публичная доступность репозитория требует отдельной проверки перед загрузкой конфиденциальных данных.

См. `docs/SECURITY-RU.md` перед запуском в production.
