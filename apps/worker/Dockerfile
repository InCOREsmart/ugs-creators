FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @ugs/worker build

FROM node:22-alpine
RUN apk add --no-cache ffmpeg clamav clamav-daemon su-exec
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S worker && adduser -S worker -G worker
COPY --from=build --chown=worker:worker /app .
COPY apps/worker/entrypoint.sh /usr/local/bin/ugs-worker-entrypoint
RUN chmod 755 /usr/local/bin/ugs-worker-entrypoint && mkdir -p /var/lib/clamav && chown -R worker:worker /var/lib/clamav
ENTRYPOINT ["/usr/local/bin/ugs-worker-entrypoint"]
