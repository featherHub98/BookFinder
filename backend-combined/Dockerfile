FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package.json ./

RUN npm config set registry https://registry.npmmirror.com && \
    npm install --legacy-peer-deps

COPY . .

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bookworm && \
    chown -R bookworm:nodejs /app

USER bookworm

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["npx", "tsx", "index.ts"]
