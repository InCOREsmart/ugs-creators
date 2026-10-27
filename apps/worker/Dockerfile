FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @ugs/worker build
FROM node:22-alpine
RUN apk add --no-cache ffmpeg clamav clamav-daemon
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S worker && adduser -S worker -G worker
COPY --from=build --chown=worker:worker /app .
USER worker
CMD ["pnpm","--filter","@ugs/worker","start"]
