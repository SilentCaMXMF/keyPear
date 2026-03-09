FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package*.json ./

RUN npm ci --only=production

COPY src/ ./src/

RUN mkdir -p /app/storage/user-files /app/storage/thumbnails /app/storage/chunks && \
    chown -R node:node /app

USER node

EXPOSE 3001

ENV NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "src/server.js"]
