FROM node:22-bookworm-slim AS dependencies

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo

COPY packages/radar-contract/package.json packages/radar-contract/package.json
COPY packages/radar-contract/index.js packages/radar-contract/index.js
COPY packages/radar-contract/index.d.ts packages/radar-contract/index.d.ts
COPY packages/radar-contract/research-bundle.schema.json packages/radar-contract/research-bundle.schema.json
COPY apps/radar/package.json apps/radar/package-lock.json apps/radar/
RUN npm ci --prefix apps/radar

FROM dependencies AS builder

COPY apps/radar apps/radar
RUN npm --prefix apps/radar run build

FROM node:22-bookworm-slim AS runner

ENV HOME=/tmp \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    PORT=3000 \
    RADAR_DATA_DIR=/data

RUN addgroup --system --gid 10001 radar \
    && adduser --system --uid 10001 --ingroup radar --home /nonexistent --no-create-home radar \
    && mkdir -p /app /data \
    && chown -R radar:radar /app /data

WORKDIR /app
COPY --from=builder --chown=radar:radar /repo/apps/radar/.next/standalone ./
COPY --from=builder --chown=radar:radar /repo/apps/radar/.next/static ./apps/radar/.next/static
COPY --from=builder --chown=radar:radar /repo/apps/radar/public ./apps/radar/public

USER 10001:10001
EXPOSE 3000

CMD ["node", "apps/radar/server.js"]
