# Optimizio Performance - Database ERD

## Core Entities

```mermaid
erDiagram
  User ||--o{ Project : owns
  User ||--o{ Scan : runs
  User ||--o{ Notification : receives
  User ||--o{ Subscription : has
  Project ||--o{ Scan : contains
  Project ||--o{ CompetitorAnalysis : compares
  Scan ||--o{ Metric : includes
  Scan ||--o{ Issue : contains
  Scan ||--o{ Report : generates
  Report ||--o{ Notification : triggers

  User {
    string id PK
    string email
    string name
    string passwordHash
    string role
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }

  Project {
    string id PK
    string userId FK
    string name
    string domain
    string status
    datetime createdAt
    datetime updatedAt
  }

  Scan {
    string id PK
    string projectId FK
    string userId FK
    string status
    int performanceScore
    int seoScore
    int accessibilityScore
    json metrics
    json aiSummary
    datetime createdAt
    datetime updatedAt
  }

  Metric {
    string id PK
    string scanId FK
    string name
    float value
    datetime createdAt
  }

  Issue {
    string id PK
    string scanId FK
    string title
    string severity
    string explanation
    string solution
    datetime createdAt
  }

  CompetitorAnalysis {
    string id PK
    string projectId FK
    string competitorUrl
    json results
    datetime createdAt
  }

  Report {
    string id PK
    string scanId FK
    string format
    string storageUrl
    datetime createdAt
  }

  Notification {
    string id PK
    string userId FK
    string type
    string title
    string message
    boolean isRead
    datetime createdAt
  }

  Subscription {
    string id PK
    string userId FK
    string plan
    string status
    datetime expiresAt
    datetime createdAt
  }
```

## Notes
- The schema is designed for MVP delivery first, with room for team ownership, permissions, and agency features in later phases.
- Metrics and issues are stored per scan to support historical trends and timeline charts.
