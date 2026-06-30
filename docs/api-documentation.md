# API Documentation

## Base URL
```
http://localhost:4000/api
```

## Health Endpoints

### GET /health
Returns the health status of the API.

Response:
```json
{
  "status": "ok",
  "service": "optimizio-api",
  "timestamp": "2024-06-30T10:00:00Z"
}
```

### GET /ready
Returns readiness status including dependency checks.

Response:
```json
{
  "status": "ready",
  "checks": {
    "database": "not-configured",
    "queue": "not-configured"
  }
}
```

## Authentication Endpoints

### POST /auth/register
Register a new user account.

Request:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "User Name"
}
```

Response:
```json
{
  "user": {
    "id": "user_1",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  },
  "token": "jwt_token_here"
}
```

### POST /auth/login
Login to existing account.

Request:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "user": {
    "id": "user_1",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  },
  "token": "jwt_token_here"
}
```

### GET /auth/me
Get current user profile.

Headers: `Authorization: Bearer token`

Response:
```json
{
  "user": {
    "id": "user_1",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  }
}
```

## Projects Endpoints

### POST /projects
Create a new project.

Request:
```json
{
  "name": "My Website",
  "domain": "https://example.com"
}
```

### GET /projects
List all projects.

Response:
```json
[
  {
    "id": "project_1",
    "name": "My Website",
    "domain": "https://example.com",
    "status": "active",
    "createdAt": "2024-06-30T10:00:00Z"
  }
]
```

### GET /projects/:id
Get project details.

## Scans Endpoints

### POST /scans
Create a new scan.

Request:
```json
{
  "projectId": "project_1",
  "url": "https://example.com"
}
```

Response:
```json
{
  "id": "scan_1",
  "projectId": "project_1",
  "url": "https://example.com",
  "status": "completed",
  "progressPercent": 100,
  "overallScore": 88,
  "performanceScore": 92,
  "seoScore": 78,
  "accessibilityScore": 95,
  "securityScore": 88,
  "createdAt": "2024-06-30T10:00:00Z",
  "aiSummary": "Your website performs well overall...",
  "priorityRoadmap": [
    {
      "rank": 1,
      "issue": "Large unoptimized images",
      "impact": "HIGH",
      "expectedImprovement": "+12 points"
    }
  ]
}
```

### GET /scans/:id
Get scan results.

### GET /scans/project/:projectId
List scans for a project.

## Error Responses

All endpoints return standardized error responses:

```json
{
  "statusCode": 400,
  "message": "Invalid request",
  "error": "Bad Request"
}
```

Common Status Codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
