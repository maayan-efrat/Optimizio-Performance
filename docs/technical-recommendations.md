# Optimizio Performance - Technical Recommendations

## Monorepo vs Separate Repositories
Recommendation: Use a monorepo.

### Advantages
- Shared design system and types
- Simpler coordination between frontend and backend
- Easier deployment and CI/CD management

### Disadvantages
- Slightly more complex setup initially

## Folder Structure
Use a scalable structure with separate app folders for web and API, plus shared docs and infrastructure files.

## Deployment Strategy
- Frontend: Vercel
- Backend: Render or Railway
- Database: Neon PostgreSQL
- Queue and cache: Redis
- Storage: Cloudflare R2

## Database Approach
- PostgreSQL for relational data
- Prisma ORM for schema and migrations
- Redis for queue and caching

## Queue Architecture
- BullMQ for background scan jobs
- Separate workers for analysis and report generation

## AI Integration Approach
- Provider abstraction layer
- OpenAI and Anthropic support via adapters
- Structured prompts and response validation
