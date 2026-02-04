FROM node:20-alpine AS builder

WORKDIR /app

COPY web/package*.json ./

RUN npm install

COPY web/ .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY web/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 6124

CMD ["nginx", "-g", "daemon off;"]
