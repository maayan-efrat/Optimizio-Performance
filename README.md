# Optimizio Performance

Optimizio Performance is an AI-powered website performance optimization platform for modern SaaS teams.

## Product goals
- Analyze website speed and Core Web Vitals
- Detect heavy images, slow APIs, and technical bottlenecks
- Generate AI recommendations and optimization roadmaps
- Support premium SaaS workflows with multilingual, RTL-ready UX

## Tech stack
- Frontend: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- Backend: NestJS, TypeScript, Swagger
- Data: PostgreSQL, Prisma ORM, Redis, BullMQ
- Infrastructure: Docker, GitHub Actions, Vercel, Railway/Render, Neon, Cloudflare R2

## Local development
```bash
npm install
npm run dev:web
npm run dev:api
```

## Project structure
- apps/web for the marketing site, dashboard, and scan experience
- apps/api for the backend services and health endpoints
- docs for architecture, ERD, API design, and roadmap

## Environment variables
- PORT
- NEXT_PUBLIC_API_URL
- API_BASE_URL

## Deployment notes
- Frontend deploys to Vercel
- Backend deploys to Render or Railway
- Database uses Neon PostgreSQL
- Queue and caching use Redis
