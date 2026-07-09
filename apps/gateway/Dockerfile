FROM node:20-alpine AS builder
WORKDIR /app
COPY apps/gateway/package*.json apps/gateway/tsconfig.json ./
RUN npm install
COPY apps/gateway/ ./
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY apps/frontend ./public
EXPOSE 3000
CMD ["node", "dist/server.js"]
