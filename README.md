# Event Booking Platform

Semester project and portfolio repository for a distributed event booking system built with TypeScript, Node.js, MongoDB, RabbitMQ, gRPC, Docker and Kubernetes.

The project is structured as a small microservice platform with an API gateway, a static frontend, domain services and deployment manifests. The repository is intentionally organized as a monorepo so the full system can be reviewed, run and deployed from one place.

## System Overview

- `apps/frontend` contains the browser client served by the gateway container.
- `apps/gateway` exposes the public API, handles authentication and routes requests to backend services.
- `services/UserService` manages users.
- `services/EventService` manages events and exposes event data over HTTP/gRPC.
- `services/BookingService` manages bookings and calls the event service over gRPC.
- `services/PaymentService` handles payment-related workflow state.
- `services/NotificationService` handles notification workflow state.
- `infrastructure/kubernetes` contains Kubernetes manifests for deployment.
- `docs` contains project documentation aimed at reviewers and future maintainers.

## Architecture

The platform uses HTTP at the edge through the API gateway and service-specific HTTP APIs. Internal service communication uses RabbitMQ for asynchronous messaging and gRPC where a synchronous service-to-service contract is useful.

MongoDB is used as the persistence layer for the services. The local development environment is described in `docker-compose.yml`, while deployment resources live in `infrastructure/kubernetes`.

For more detail, see [docs/architecture.md](docs/architecture.md).

## Repository Structure

```text
event-booking/
|-- apps/
|   |-- frontend/
|   `-- gateway/
|-- docs/
|-- infrastructure/
|   `-- kubernetes/
|-- services/
|   |-- BookingService/
|   |-- EventService/
|   |-- NotificationService/
|   |-- PaymentService/
|   `-- UserService/
|-- docker-compose.yml
|-- Dockerfile
`-- .gitlab-ci.yml
```

## Getting Started

Start the complete local stack with Docker Compose:

```bash
docker compose up --build
```

If your Docker installation uses the legacy Compose binary, run:

```bash
docker-compose up --build
```

Useful local endpoints:

- API gateway: `http://localhost:3000`
- User service: `http://localhost:3001`
- Event service: `http://localhost:3002`
- Booking service: `http://localhost:3003`
- Payment service: `http://localhost:3004`
- Notification service: `http://localhost:3005`
- RabbitMQ management UI: `http://localhost:15672`
- MongoDB: `localhost:27017`

## Development

Each TypeScript service can be installed, built and run independently:

```bash
cd services/EventService
npm install
npm run dev
```

The gateway follows the same pattern:

```bash
cd apps/gateway
npm install
npm run dev
```

Common scripts across services:

- `npm run dev` starts the service in watch mode.
- `npm run build` compiles TypeScript.
- `npm run start` runs the compiled service.
- `npm run test` runs the test suite where tests are implemented.
- `npm run lint` runs ESLint where configured.

## Deployment

The repository includes:

- `docker-compose.yml` for local orchestration.
- Service-level Dockerfiles for container builds.
- `infrastructure/kubernetes` for Kubernetes manifests.
- `.gitlab-ci.yml` for GitLab build, publish and deployment automation.

## Portfolio Notes

This repository demonstrates:

- Microservice decomposition by business capability.
- API gateway routing and authentication.
- Service-to-service communication with gRPC.
- Event-driven messaging with RabbitMQ.
- Containerized development and deployment workflows.
- Kubernetes deployment configuration.
