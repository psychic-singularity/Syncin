FROM node:20-alpine AS builder

WORKDIR /app

# Copy schema and generate Prisma client
COPY prisma/ ./prisma/
COPY ws-server/package*.json ./ws-server/

WORKDIR /app/ws-server
RUN npm ci

COPY ws-server/ ./
RUN npx prisma generate --schema=../prisma/schema.prisma
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app/ws-server

ENV NODE_ENV=production

COPY prisma/ ../prisma/
COPY ws-server/package*.json ./
RUN npm ci --only=production
RUN npx prisma generate --schema=../prisma/schema.prisma

COPY --from=builder /app/ws-server/dist ./dist

EXPOSE 4001 4002

CMD ["node", "dist/server.js"]

