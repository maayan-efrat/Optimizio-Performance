# Deployment Guide

## Prerequisites
- Node.js 20+
- Docker and Docker Compose
- Git
- Environment variables configured

## Local Development

### 1. Setup
```bash
git clone <repo>
cd optimizio-performance
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your settings
```

### 3. Run with Docker Compose
```bash
docker-compose up
```

This starts:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 4. Without Docker
```bash
# Terminal 1 - Frontend
cd apps/web
npm install
npm run dev

# Terminal 2 - Backend
cd apps/api
npm install
npm run dev

# Terminal 3 - Make sure PostgreSQL and Redis are running
```

## Production Deployment

### Frontend - Vercel

1. Connect GitHub repository to Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: Your API URL
3. Deploy:
   ```bash
   vercel deploy --prod
   ```

### Backend - Railway or Render

#### Railway
1. Create new project on Railway
2. Add PostgreSQL and Redis services
3. Connect GitHub repository
4. Set environment variables
5. Deploy

#### Render
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy

### Database - Neon

1. Create PostgreSQL database on Neon
2. Add connection string to `DATABASE_URL`
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Redis - Redis Cloud

1. Create Redis instance on Redis Cloud
2. Add connection string to `REDIS_URL`

### Storage - Cloudflare R2

1. Create R2 bucket
2. Add credentials to environment variables
3. Configure bucket policy for public access if needed

## Environment Variables

### Required
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `AI_PROVIDER`: openai or anthropic
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

### Optional
- `SENTRY_DSN`: Error tracking
- `SMTP_*`: Email notifications
- `PORT`: API port (default: 4000)

## Monitoring

### Health Checks
```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/ready
```

### Logs
Frontend logs available in Vercel dashboard
Backend logs available in Railway/Render dashboard

### Performance Monitoring
1. Setup Sentry for error tracking
2. Configure OpenTelemetry for distributed tracing
3. Monitor database query performance

## Scaling Considerations

1. **Horizontal Scaling**: Deploy multiple API instances behind load balancer
2. **Caching**: Use Redis for scan results and recommendations
3. **Queue Processing**: Separate workers for long-running scans
4. **Database**: Consider read replicas for analytics queries
5. **CDN**: Use Cloudflare or similar for static assets

## Backup Strategy

1. PostgreSQL: Enable automated backups (daily)
2. Redis: Enable RDB persistence or AOF
3. Configuration: Store in version control or encrypted storage
4. Reports/Data: Archive to S3 or R2 regularly

## Security Checklist

- [ ] HTTPS enabled on all endpoints
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection via ORM
- [ ] Secrets not in version control
- [ ] Database backups encrypted
- [ ] TLS for database connections
- [ ] Regular security audits
