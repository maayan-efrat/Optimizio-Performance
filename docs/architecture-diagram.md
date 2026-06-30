# Optimizio Performance - Architecture Diagram

## Overview
Optimizio Performance is a modular SaaS platform with a Next.js frontend, a NestJS backend, PostgreSQL, Redis, and background job processing for scans and AI analysis.

```mermaid
flowchart LR
  User[User / Visitor] --> Web[Next.js Frontend]
  Web --> API[NestJS API]
  API --> DB[(PostgreSQL)]
  API --> Redis[(Redis)]
  API --> Queue[BullMQ Queue]
  Queue --> Worker[Scan Worker]
  Worker --> Lighthouse[Lighthouse / Puppeteer]
  Worker --> AI[AI Analysis Service]
  Worker --> Storage[Cloudflare R2 Storage]
  API --> Monitor[Monitoring / Sentry / OTel]
  Web --> Auth[Auth.js / OAuth]
```

## Core Layers
- Presentation: Next.js App Router, Tailwind, shadcn/ui, Framer Motion
- Application: NestJS modules for auth, projects, scans, analytics, reports, subscriptions
- Data: Prisma ORM, PostgreSQL, Redis for caching and queues
- Integrations: Lighthouse, Puppeteer, AI analysis, email notifications, monitoring
- Infrastructure: Docker, GitHub Actions, Vercel/Railway/Neon/Redis Cloud
