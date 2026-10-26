# ---------------------------------------------------------------------------
# Estagio 1: build do bundle estatico (Vite)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

# Copia apenas os manifestos primeiro para aproveitar o cache de camadas:
# enquanto o lockfile nao mudar, `pnpm install` nao roda de novo.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ---------------------------------------------------------------------------
# Estagio 2: Nginx servindo o dist e encaminhando /api para o Spring Boot
# ---------------------------------------------------------------------------
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
