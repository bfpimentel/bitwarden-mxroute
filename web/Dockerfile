FROM oven/bun:alpine AS builder

WORKDIR /app

COPY web/package.json web/bun.lock ./

RUN bun install

COPY web/ .

RUN bun run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY web/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 6124

CMD ["nginx", "-g", "daemon off;"]
