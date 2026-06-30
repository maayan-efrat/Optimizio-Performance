# Optimizio Performance - Complete System Architecture

## 1. High-Level Architecture

```mermaid
flowchart LR
  subgraph Client
    Web[Next.js Web App]
    Admin[Admin Dashboard]
  end

  subgraph Edge
    Gateway[API Gateway / CDN]
  end

  subgraph Backend
    API[NestJS API]
    Auth[Auth Module]
    Projects[Projects Module]
    Scans[Scans Module]
    AI[AI Service Layer]
    Reports[Reports Module]
    Notifications[Notifications Module]
  end

  subgraph Data
    DB[(PostgreSQL)]
    Redis[(Redis)]
    Storage[(Cloudflare R2)]
  end

  subgraph Workers
    Queue[BullMQ Queue]
    Worker[Scan Worker]
    Lighthouse[Lighthouse / Puppeteer]
  end

  subgraph Observability
    Sentry[Sentry]
    OTel[OpenTelemetry]
  end

  Web --> Gateway
  Admin --> Gateway
  Gateway --> API
  API --> Auth
  API --> Projects
  API --> Scans
  API --> AI
  API --> Reports
  API --> Notifications
  API --> DB
  API --> Redis
  API --> Storage
  API --> Queue
  Queue --> Worker
  Worker --> Lighthouse
  Worker --> AI
  Worker --> Storage
  API --> Sentry
  API --> OTel
  Worker --> Sentry
```

## 2. Frontend Architecture
- Next.js 15 App Router
- Server Components for marketing pages and static content
- Client Components for dashboards, auth interactions, scan forms, and charts
- React Query for server-state caching
- Local state for form and UI interactions
- Tailwind + shadcn/ui for a consistent design system
- Framer Motion for premium transitions

## 3. Backend Architecture
- NestJS modules with a clean layered approach
- Controllers for HTTP endpoints
- Services for business logic
- Repositories / Prisma service for persistence
- Queue workers for asynchronous scan execution
- Integrations for Lighthouse, Puppeteer, AI providers, notifications, and storage

## 4. Worker Architecture
- Queue-based processing using BullMQ
- Each scan goes through states: queued, running, completed, failed, timed_out
- Workers support retries with exponential backoff
- Concurrency limits protect external resources and providers

## 5. AI Integration Flow
- AI provider abstraction using an interface layer
- Providers: OpenAI, Anthropic, and future adapters
- AI tasks: analyze scan results, explain issues, generate fixes, create summaries, compare competitors
- Prompt templates and response validation
- Cache AI responses to reduce cost and latency

## 6. Database Communication
- Prisma ORM for schema definition and migrations
- PostgreSQL for transactional data
- Redis for caching and queues
- Cloudflare R2 for uploaded reports and screenshots

## 7. Observability and Reliability
- Health endpoints: /health and /ready
- Sentry for error capture
- OpenTelemetry for tracing and metrics
- Structured logging and request correlation IDs
