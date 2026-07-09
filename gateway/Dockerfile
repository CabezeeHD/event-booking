FROM node:20-alpine AS builder
WORKDIR /app
COPY gateway/package*.json gateway/tsconfig.json ./
RUN npm install
COPY gateway/ ./
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY frontend ./public
EXPOSE 3000
CMD ["node", "dist/server.js"]
