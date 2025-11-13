# Dockerfile para producción Next.js

# 1) Etapa de construcción
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./ 2>/dev/null || true
RUN npm install

COPY . .
RUN npm run build

# 2) Etapa de ejecución
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Next recomienda deshabilitar la telemetría en contenedores
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/next.config.mjs ./next.config.mjs 2>/dev/null || true
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
