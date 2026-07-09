FROM node:20-alpine AS gateway-builder
WORKDIR /app/gateway
COPY gateway/package*.json ./
RUN npm ci
COPY gateway/ ./
RUN npm run build


FROM node:20-alpine AS user-service-builder
WORKDIR /app/services/UserService
COPY services/UserService/package*.json ./
RUN npm ci
COPY services/UserService/ ./
RUN npm run build


FROM node:20-alpine AS event-service-builder
WORKDIR /app/services/EventService
COPY services/EventService/package*.json ./
RUN npm ci
COPY services/EventService/ ./
RUN npm run build


FROM node:20-alpine AS booking-service-builder
WORKDIR /app/services/BookingService
COPY services/BookingService/package*.json ./
RUN npm ci
COPY services/BookingService/ ./
RUN npm run build


FROM node:20-alpine AS payment-service-builder
WORKDIR /app/services/PaymentService
COPY services/PaymentService/package*.json ./
RUN npm ci
COPY services/PaymentService/ ./
RUN npm run build


FROM node:20-alpine AS notification-service-builder
WORKDIR /app/services/NotificationService
COPY services/NotificationService/package*.json ./
RUN npm ci
COPY services/NotificationService/ ./
RUN npm run build


FROM node:20-alpine
WORKDIR /app/gateway
COPY --from=gateway-builder /app/gateway/dist ./dist
COPY --from=gateway-builder /app/gateway/node_modules ./node_modules
COPY frontend ./public
EXPOSE 3000
CMD ["node", "dist/server.js"]
