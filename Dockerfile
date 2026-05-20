FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8443
ENV DOMAIN=nuri.com

COPY package.json ./
COPY src ./src
COPY public ./public
COPY config ./config

EXPOSE 8443

CMD ["node", "src/server.mjs"]
