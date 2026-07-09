# EventService

A microservice scaffold for the Event Booking exam project.

## What it includes
- HTTP API with `/health`, `/health/alive`, `/health/ready`, and `/events`
- gRPC server on port `50051` with `GetEvent` and `ListEvents`
- RabbitMQ integration via `amqplib`
- MongoDB connection helper
- Dockerfile for production image

## Run locally

```bash
cd event-booking/services/EventService
npm install
npm run build
npm start
```

## Development

```bash
npm install
npm run dev
```

## Testing

```bash
npm install
npm test
```

## Environment variables
- `PORT` - HTTP port (default `3002`)
- `GRPC_PORT` - gRPC port (default `50051`)
- `RABBITMQ_URL` - RabbitMQ connection URL
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DBNAME` - MongoDB database name
