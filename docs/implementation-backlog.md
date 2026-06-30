# Optimizio Performance - Implementation Backlog

## Objective
Build the MVP first: authentication, project creation, website scan flow, scan results storage, dashboard, and AI recommendations.

## Phase 1 - Foundation
### 1. Project setup
- Initialize monorepo with frontend and backend apps
- Add TypeScript, Tailwind, Next.js, NestJS, Prisma, Docker, GitHub Actions
- Create shared environment configuration

### 2. Design system
- Implement reusable UI primitives: Button, Input, Card, Badge, Alert, Modal, Tabs, Table, Skeleton
- Add dark theme, RTL support, accessibility patterns, responsive layout
- Add Hebrew and English copy structure

### 3. Backend architecture
- Create module structure: auth, users, projects, scans, analytics, reports, notifications, subscriptions
- Add health endpoints: GET /health and GET /ready
- Add global validation, error handling, and logging

## Phase 2 - Authentication & Users
### 4. Authentication
- Implement sign up, login, logout, forgot/reset password
- Add OAuth placeholders for Google and Microsoft
- Add protected routes and auth guards

### 5. User profile
- Create user profile and settings view
- Add role-based access scaffolding: user, team owner, admin, viewer

## Phase 3 - Projects & Scans
### 6. Project management
- Create project creation form
- Add project list and project detail views
- Validate website URL input and store projects

### 7. Scan flow
- Build scan intake form for website URL
- Implement premium scanning experience with steps and progress UI
- Create loading states, skeletons, and animated progress indicators
- Trigger scan request to backend

### 8. Scan processing
- Connect scan pipeline to Lighthouse/Puppeteer simulation layer
- Collect metrics: performance, LCP, CLS, INP, FCP, TTFB, resource sizes
- Store scan results and AI summary
- Generate optimization recommendations

## Phase 4 - Dashboard & Insights
### 9. Dashboard
- Display health score, performance score, SEO, accessibility, last scan, key issues
- Show issue cards with severity and recommended fix
- Show optimization roadmap grouped by priority

### 10. History & trends
- Save every scan in the database
- Display previous scores and performance trend charts
- Highlight new issues and resolved issues over time

## Phase 5 - Demo & Polish
### 11. Demo mode
- Add a public demo experience with preloaded scan data
- Show sample reports, recommendations, and competitor comparison

### 12. Monitoring & notifications
- Add Sentry and OpenTelemetry setup
- Create in-app and email notification templates
- Add health checks and observability docs

## Phase 6 - Testing & Deployment
### 13. Testing
- Frontend: Jest + React Testing Library
- Backend: unit and integration tests
- E2E: Playwright for auth, project creation, scan flow, and results display

### 14. Deployment
- Add Dockerfiles and docker-compose
- Add environment examples and GitHub Actions CI/CD
- Prepare Vercel, Railway/Render, Neon, Redis Cloud, and Cloudflare R2 documentation

## Execution Order for Claude
1. Create repository structure and initial config
2. Implement design system and shared UI components
3. Implement backend health endpoints and validation
4. Implement auth module and protected routes
5. Implement projects and scans CRUD
6. Implement scan flow UI and mock processing engine
7. Implement results dashboard and historical trends
8. Add demo mode and monitoring
9. Add tests and deployment configuration

## Definition of Done for MVP
- A visitor can understand the product immediately
- A signed-in user can create a project and start a scan
- A scan produces visible results and recommendations
- The experience is responsive, accessible, RTL-ready, and visually premium
- The backend exposes health endpoints and stores scan data reliably
