# KeyPear Backend Dockerfile - Optimized for Raspberry Pi (arm64)

FROM node:20-alpine

# Install system dependencies for Sharp and file operations
RUN apk add --no-cache \
    dumb-init \
    vips-dev \
    glib-dev \
    cairo-dev \
    pkgconfig \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies (allow sharp to build from source)
RUN npm install --omit=dev --ignore-scripts

# Copy source code
COPY src/ ./src/

# Create required directories
RUN mkdir -p /app/data /app/storage/user-files /app/storage/thumbnails /app/storage/chunks \
    && chown -R node:node /app

USER node

EXPOSE 3001

ENV NODE_ENV=production \
    PORT=3001

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "src/server.js"]
