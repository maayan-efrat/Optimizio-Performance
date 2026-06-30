# Optimizio Performance - Folder Structure

```text
optimizio-performance/
  apps/
    web/
      app/
        (marketing)/
        (dashboard)/
        api/
        globals.css
        layout.tsx
        page.tsx
      components/
        ui/
        layout/
        features/
        forms/
        charts/
      lib/
        i18n/
        utils/
        auth/
      public/
      styles/
      tests/
    api/
      src/
        app/
          app.module.ts
          app.controller.ts
          app.service.ts
        auth/
        users/
        projects/
        scans/
        analytics/
        reports/
        notifications/
        subscriptions/
        common/
          decorators/
          filters/
          guards/
          interceptors/
          dto/
          pipes/
        config/
        infrastructure/
          prisma/
          queue/
          monitoring/
        main.ts
      test/
  docs/
  docker/
  .github/
    workflows/
  prisma/
    schema.prisma
  docker-compose.yml
  Dockerfile.web
  Dockerfile.api
  README.md
  .env.example
```

## Intent
- Frontend stays focused on experience, localization, and demo flows.
- Backend is split into domain modules for clean architecture and future growth.
- Shared docs, infra, and Prisma assets live at the repo root for easy deployment.
