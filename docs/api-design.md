# Optimizio Performance - API Design

## 1. Core REST Endpoints

### Auth
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password
- GET /auth/me

### Projects
- GET /projects
- POST /projects
- GET /projects/:id
- PATCH /projects/:id
- DELETE /projects/:id

### Scans
- GET /projects/:projectId/scans
- POST /projects/:projectId/scans
- GET /scans/:id
- PATCH /scans/:id
- GET /scans/:id/summary

### Reports
- GET /reports
- POST /scans/:id/reports
- GET /reports/:id

### Health
- GET /health
- GET /ready

## 2. DTOs

### Auth Register DTO
```ts
class RegisterDto {
  email: string;
  password: string;
  name: string;
}
```

### Create Project DTO
```ts
class CreateProjectDto {
  name: string;
  domain: string;
}
```

### Create Scan DTO
```ts
class CreateScanDto {
  url: string;
  mode: 'standard' | 'deep';
}
```

## 3. Response DTOs

### Project Response
```ts
class ProjectResponseDto {
  id: string;
  name: string;
  domain: string;
  status: string;
  createdAt: string;
}
```

### Scan Response
```ts
class ScanResponseDto {
  id: string;
  status: string;
  progressPercent: number;
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  startedAt?: string;
  completedAt?: string;
}
```

## 4. Error Responses
- 400 Bad Request for invalid input
- 401 Unauthorized for missing auth
- 403 Forbidden for insufficient permissions
- 404 Not Found
- 409 Conflict for duplicate resources
- 429 Too Many Requests for rate limits
- 500 Internal Server Error

## 5. Authentication Flow
1. User logs in or registers
2. Backend validates credentials and issues JWT
3. Frontend stores token securely
4. Protected routes use auth guard
5. Refresh token strategy can be added in later phases
