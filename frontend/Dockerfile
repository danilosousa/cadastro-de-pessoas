# syntax=docker/dockerfile:1

# ---------- Estágio 1: build (Node + npm) ----------
FROM node:22-alpine AS build
WORKDIR /app

# Primeiro só o que define as dependências: enquanto o lockfile não mudar,
# esta camada fica em cache e o npm ci não se repete.
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# Credenciais do login automático (ADR 0012). Variáveis VITE_* são embutidas
# no JavaScript no momento do build, por isso entram como ARG e não em runtime.
ARG VITE_API_USUARIO=admin
ARG VITE_API_SENHA=admin123

# Depois o código. Os testes rodam fora do Docker (npm test).
COPY . .
RUN npm run build

# ---------- Estágio 2: nginx servindo os estáticos (sem Node, sem código-fonte) ----------
# A variante "unprivileged" já roda como usuário sem privilégios, na porta 8080.
FROM nginxinc/nginx-unprivileged:stable-alpine
COPY nginx/ /etc/nginx/conf.d/
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
