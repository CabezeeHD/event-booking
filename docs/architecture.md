# Architecture

## Purpose

Event Booking Platform is a distributed booking system organized as a TypeScript monorepo. The goal is to keep each domain area isolated while still making the full system easy to run, inspect and deploy as a semester project portfolio.

## Components

| Component | Path | Responsibility |
| --- | --- | --- |
| Frontend | `apps/frontend` | Static browser client served through the gateway image |
| API Gateway | `apps/gateway` | Public HTTP entry point, authentication and request routing |
| User Service | `services/UserService` | User data and user-related operations |
| Event Service | `services/EventService` | Event catalogue, event persistence and event gRPC API |
| Booking Service | `services/BookingService` | Booking lifecycle and event availability checks |
| Payment Service | `services/PaymentService` | Payment workflow state |
| Notification Service | `services/NotificationService` | Notification workflow state |
| MongoDB | `docker-compose.yml` / Kubernetes manifests | Service persistence |
| RabbitMQ | `docker-compose.yml` / Kubernetes manifests | Asynchronous messaging between services |

## Communication

- External clients communicate with the system through the API gateway over HTTP.
- Services expose their own HTTP APIs for local development and direct testing.
- Booking Service uses gRPC to communicate with Event Service when it needs event data.
- RabbitMQ is used for asynchronous cross-service events.

## Deployment Model

Local development is handled by Docker Compose. Production-style deployment resources are kept in `infrastructure/kubernetes`, separated from application code so the repository layout is easy to scan:

- `apps` for user-facing and edge applications.
- `services` for backend domain services.
- `infrastructure` for deployment/runtime configuration.
- `docs` for reviewer-facing project documentation.
