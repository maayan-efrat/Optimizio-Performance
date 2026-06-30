# Optimizio Performance - Detailed Database ERD

## Entities and Relationships

```mermaid
erDiagram
  User ||--o{ Project : owns
  User ||--o{ Scan : runs
  User ||--o{ Report : requests
  User ||--o{ Notification : receives
  User ||--o{ Subscription : has
  Project ||--o{ Scan : contains
  Project ||--o{ CompetitorAnalysis : contains
  Scan ||--o{ Metric : has
  Scan ||--o{ Issue : has
  Scan ||--o{ Report : generates
  Scan ||--o{ AuditLog : logs

  User {
    UUID id PK
    STRING email UK
    STRING name
    STRING passwordHash
    STRING role
    BOOLEAN isActive
    BOOLEAN isDeleted
    DATETIME createdAt
    DATETIME updatedAt
  }

  Project {
    UUID id PK
    UUID userId FK
    STRING name
    STRING domain
    STRING status
    BOOLEAN isDeleted
    DATETIME createdAt
    DATETIME updatedAt
  }

  Scan {
    UUID id PK
    UUID projectId FK
    UUID userId FK
    STRING status
    INT progressPercent
    INT performanceScore
    INT seoScore
    INT accessibilityScore
    JSON metrics
    JSON aiSummary
    JSON rawData
    DATETIME startedAt
    DATETIME completedAt
    DATETIME createdAt
    DATETIME updatedAt
  }

  Metric {
    UUID id PK
    UUID scanId FK
    STRING key
    FLOAT value
    STRING unit
    DATETIME createdAt
  }

  Issue {
    UUID id PK
    UUID scanId FK
    STRING title
    STRING severity
    STRING category
    TEXT explanation
    TEXT solution
    BOOLEAN isResolved
    DATETIME createdAt
    DATETIME updatedAt
  }

  CompetitorAnalysis {
    UUID id PK
    UUID projectId FK
    STRING competitorUrl
    JSON results
    DATETIME createdAt
    DATETIME updatedAt
  }

  Report {
    UUID id PK
    UUID scanId FK
    UUID userId FK
    STRING type
    STRING status
    STRING storageUrl
    DATETIME createdAt
    DATETIME updatedAt
  }

  Notification {
    UUID id PK
    UUID userId FK
    STRING type
    STRING title
    STRING message
    BOOLEAN isRead
    DATETIME createdAt
  }

  Subscription {
    UUID id PK
    UUID userId FK
    STRING plan
    STRING status
    DATETIME expiresAt
    DATETIME createdAt
    DATETIME updatedAt
  }

  AuditLog {
    UUID id PK
    UUID scanId FK
    STRING action
    JSON metadata
    DATETIME createdAt
  }
```

## Recommended Indexes
- User: email, role, createdAt
- Project: userId, domain, status, createdAt
- Scan: projectId, status, createdAt, performanceScore
- Report: userId, scanId, status, createdAt

## Constraints
- Email must be unique
- Project domain must be validated
- Scan status must be constrained to an enum-like set
- Soft delete should be supported with isDeleted flags
- createdAt and updatedAt are required across core entities
