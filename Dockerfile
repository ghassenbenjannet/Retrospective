FROM node:22-alpine AS builder
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY server/package.json ./
EXPOSE 3001
CMD ["node", "dist/index.js"]
