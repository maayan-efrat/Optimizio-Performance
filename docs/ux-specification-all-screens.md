# Optimizio Performance - UX Specification for All Screens

## Screen 1: Landing Page

### Purpose
Convert visitors into users and showcase product value.

### Layout Structure
- Hero Section (above fold)
- Features Section
- How It Works Section
- Demo Preview Section
- CTA Section
- Footer

### Hero Section Details
- Headline: "Optimize your website with AI"
- Subheadline: "Analyze performance, SEO, accessibility and receive actionable optimization recommendations."
- Primary CTA: "Analyze My Website" (brand gradient button)
- Secondary CTA: "View Demo" (ghost button)
- Background: Animated gradient or dashboard preview showing live scan progress
- Mobile: Stack vertically, smaller headline

### Features Section
- 4 feature cards with icons:
  1. AI Performance Analysis
  2. Core Web Vitals Monitoring
  3. Competitor Comparison
  4. Optimization Roadmap
- Each card: Icon, title, description
- Mobile: Stack into single column

### How It Works
- 3-step process with visual indicators
- Step 1: Enter website URL
- Step 2: AI analyzes performance
- Step 3: Receive actionable improvements

### Demo Preview
- Static dashboard showing example scan results
- Show health score, category scores, sample issues

### CTA Section
- Headline: "Ready to optimize?"
- Button: "Start Free Audit"

---

## Screen 2: Login

### Purpose
Allow existing users to access their account.

### Layout
- Centered card design (max-width: 420px)
- Dark card on dark background with subtle border

### Components
- Headline: "Welcome back"
- Email input field
  - Label: "Email"
  - Placeholder: "your@email.com"
  - Validation: Email format
- Password input field
  - Label: "Password"
  - Placeholder: "••••••••"
  - Show/hide toggle
- "Forgot password?" link
- OAuth buttons:
  - Google: "Continue with Google"
  - Microsoft: "Continue with Microsoft"
- Sign-up link: "Don't have an account? Register"
- Remember me checkbox

### Responsive
- Mobile: Full width with padding
- Desktop: Centered card

### Empty State
- Show example email for demo purposes

---

## Screen 3: Register

### Purpose
Enable new users to create account.

### Layout
- Same centered card as Login

### Components
- Headline: "Create your account"
- Name input field
  - Label: "Full name"
  - Placeholder: "Your name"
- Email input field
- Password input field
  - Show password strength indicator
  - Minimum 8 characters
- Confirm password field
- OAuth buttons
- Terms checkbox: "I agree to Terms of Service"
- Button: "Create Account"
- Login link: "Already have an account? Sign in"

---

## Screen 4: Main Dashboard Overview

### Purpose
Give users immediate understanding of website health at a glance.

### Layout Sections

#### Top Header Bar
- Left: Optimizio logo and site name
- Middle: Project selector (dropdown)
- Right: 
  - Language toggle (EN/HE)
  - Bell icon (notifications)
  - User avatar (profile menu)

#### Left Sidebar (Desktop)
- Navigation:
  - Dashboard
  - Scans
  - Reports
  - Competitor Analysis
  - Settings
- Collapse/expand toggle
- Mobile: Becomes hamburger menu with drawer

#### Main Content Area

##### Health Score Card (Hero)
- Large circular progress indicator showing score (0-100)
- Example: "Website Health: 82/100"
- Status badge: "Healthy" or "Needs Attention"
- Trend indicator: "↑ +5 from last scan"
- Last scan date: "Last scanned 2 hours ago"
- Button: "Run New Scan"

##### Category Scores Grid (4 cards)
Layout: 2x2 on desktop, stack on mobile
Each card shows:
- Category name (Performance, SEO, Accessibility, Security)
- Score (0-100) with colored badge
- Simple icon
- Link to details

##### AI Priority Roadmap Section
- Headline: "Fix these first (AI prioritized)"
- List of top 3 issues:
  - Issue title
  - Priority badge (High/Medium/Low)
  - Expected improvement (+X points)
  - Button: "View Details"

##### Recent Scans
- Table or card list showing:
  - Date
  - Score
  - URL
  - Status
  - Link to details

### Responsive
- Desktop: Full sidebar + content
- Tablet: Sidebar collapses to icons
- Mobile: Hamburger menu, full-width content

### Empty State
- No projects yet
- Show: "You haven't added a website yet"
- CTA: "Add your first website"

### Loading State
- Skeleton cards for score sections
- Animated shimmer effect

---

## Screen 5: Website Scan Launch

### Purpose
Allow user to start new scan.

### Layout
- Full-width page with centered card

### Components

#### URL Input Section
- Headline: "Analyze your website"
- Input field:
  - Label: "Website URL"
  - Placeholder: "https://example.com"
  - URL validation
- Scan mode selector (radio buttons):
  - Standard scan
  - Deep scan (more thorough)
- Button: "Start AI Audit" (primary gradient button)

#### What You'll Get
- 4 feature cards showing:
  - Performance metrics
  - SEO analysis
  - Accessibility check
  - AI recommendations

#### Estimated Time
- "Typical scan takes 2-3 minutes"

### Responsive
- Mobile: Stack vertically, larger buttons

---

## Screen 6: Scan Progress

### Purpose
Show user scan is running with real progress.

### Layout
- Centered content area

### Components

#### Progress Indicator
- Linear progress bar showing overall completion %
- Example: "45% complete"

#### Steps Timeline
- Vertical list of steps with status:
  - ✓ Connecting to website
  - ✓ Loading page resources
  - ◉ Running performance tests (current)
  - ○ Analyzing Core Web Vitals
  - ○ Detecting optimization opportunities
  - ○ AI generating recommendations

#### Status Card
- Current step name
- Estimated time remaining
- "This is taking a bit longer..." message if delayed

#### Cancel Button
- Option to stop scan

### Animation
- Loading spinner for current step
- Smooth transitions between steps

---

## Screen 7: Scan Results - Overview

### Purpose
Display complete audit results.

### Layout
- Header with website info
- Tabbed interface for different sections

#### Header Section
- Website URL
- Overall Health Score (large, prominent)
- Last scan date
- Button: "Run New Scan"

#### Tabs
1. Overview (default)
2. Performance
3. SEO
4. Accessibility
5. Security

#### Overview Tab Content

##### Score Summary (4 cards in grid)
- Performance: 85 + status icon
- SEO: 78 + status icon
- Accessibility: 92 + status icon
- Security: 88 + status icon

Each card is clickable to go to detailed section.

##### AI Summary Card
- Headline: "AI Insight"
- AI-generated summary explaining main issues
- Example: "Your site's performance is mainly affected by large images and render-blocking JavaScript. Prioritize image optimization first for the biggest impact."

##### Priority Roadmap Section
- Headline: "Recommended Fix Order"
- List of top issues with:
  - Rank number
  - Issue title
  - Impact level (High/Medium/Low)
  - Expected improvement in points
  - "View Fix" button

##### All Issues Section
- Filter buttons: All, Critical, High, Medium, Low
- Issue cards showing:
  - Icon (severity indicator)
  - Title
  - Category badge
  - Description
  - "View Details" link

### Responsive
- Desktop: Full layout
- Tablet: Tabs become collapsible
- Mobile: Single column, smaller cards

### Empty State
- If no issues: "Great news! No critical issues detected."

---

## Screen 8: Performance Details Tab

### Purpose
Deep dive into performance metrics.

### Components

##### Core Web Vitals Cards
- 3 cards showing:
  - LCP (Largest Contentful Paint): 2.1s ✓
  - CLS (Cumulative Layout Shift): 0.05 ✓
  - INP (Interaction to Next Paint): 150ms ⚠

Each card shows:
- Metric name
- Current value
- Status (good/needs improvement)
- Target value

##### Additional Metrics
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)
- Total Page Load Time
- Time to Interactive

##### Performance Chart
- Line chart showing performance trend over time (if multiple scans)
- X-axis: Date
- Y-axis: Performance score

##### Resource Analysis
- Resources table:
  - Images: 2.4MB (40 files)
  - JavaScript: 850KB (12 files)
  - CSS: 120KB (3 files)
  - Total Requests: 127

Each expandable to show individual files.

##### Recommendations
- List of performance-specific fixes
- Each with estimated impact

---

## Screen 9: SEO Details Tab

### Purpose
Display technical SEO audit.

### Components

##### SEO Score Card
- Large score: 78/100
- Status: "Good, some room for improvement"

##### Technical SEO Section
- Checklist of items:
  - ✓ HTTPS enabled
  - ✓ XML Sitemap found
  - ✓ Robots.txt configured
  - ✗ Mobile-friendly test failed
  - ✓ Canonical URLs set

##### On-Page SEO
- Homepage Title: "Sample Page - Company Name" ✓
- Meta Description: "..." ✓
- H1 Tags: "Main heading" ✓
- Issues with H2/H3 hierarchy

##### Structured Data
- Schema.org markup found: ✓
- Rich snippets eligible: ✓

##### Link Analysis
- Internal links: 145
- External links: 23
- Broken links: 3 (with list)

##### Issues
- List of SEO issues with severity
- Each issue has explanation and fix

---

## Screen 10: Accessibility Details Tab

### Purpose
Show WCAG 2.2 AA compliance audit.

### Components

##### Accessibility Score Card
- Score: 92/100
- Status: "Excellent"

##### Issue Categories
- Color Contrast: ✓ 12/12 pass
- ARIA Labels: ⚠ 3 issues found
- Keyboard Navigation: ✓ Pass
- Form Labels: ✓ All labeled
- Headings: ⚠ 2 issues

##### Issue List
Each issue shows:
- Type (e.g., "Missing Alt Text")
- Severity (Critical/High/Medium)
- Location on page (with screenshot preview if available)
- Description: "Images should have alt text describing content"
- Fix: "Add descriptive alt attributes to images"

##### Recommendations
- Specific fixes for accessibility compliance

---

## Screen 11: Competitor Analysis

### Purpose
Compare website against competitors.

### Layout
- Input section at top
- Results section below

### Input Section
- Headline: "Compare with competitors"
- Form:
  - Input 1: "Your website" (pre-filled with current)
  - Input 2: "Competitor 1"
  - Input 2: "Competitor 2"
  - Input 2: "Competitor 3" (max 3)
- Button: "Start Comparison"

### Results Section

#### Comparison Table
Columns: Metric, Your Site, Competitor 1, Competitor 2, Competitor 3

Rows:
- Performance Score
- SEO Score
- Accessibility Score
- Security Score
- UX Score
- Page Load Time
- Page Size

Each cell shows:
- Score/value
- Color coding (green if leading, red if behind)
- Badge: "You're ahead" or "Needs attention"

#### Ranking
- "Performance Ranking"
- 1. Your Site (92/100)
- 2. Competitor A (88/100)
- 3. Competitor B (81/100)

#### AI Summary
- "Your biggest opportunities:"
- List of improvements to beat competitors
- Example: "Your competitor uses WebP images - implement this to gain +3 points in performance"

#### Strengths
- "Where you're ahead"
- List of advantages

#### Weaknesses
- "Where you need to improve"
- List of gaps vs competitors

---

## Screen 12: Reports

### Purpose
Access and manage previous reports.

### Layout
- Left: Report list or timeline
- Right: Report preview (desktop) or full-width (mobile)

### Reports List
- Filter buttons: All, This Month, Last 3 Months
- Each report row shows:
  - Date
  - Website
  - Score
  - Export button
  - Email button

### Report Preview
- Professional PDF-like layout
- Sections:
  - Executive Summary
  - Scores
  - Top Issues
  - Recommendations
  - Comparison (if competitive analysis was done)

### Actions
- Download PDF button
- Email report button (opens modal with email input)
- Print button

---

## Screen 13: Settings

### Purpose
Manage user preferences and subscription.

### Tabs
1. Profile
2. Preferences
3. Subscription
4. Integrations

### Profile Tab
- Avatar upload
- Name field
- Email field (read-only)
- Current plan display

### Preferences Tab
- Language: English / Hebrew (toggle)
- Theme: Dark / Light (toggle)
- Email notifications:
  - Scan completed
  - Critical issues detected
  - Weekly summary

### Subscription Tab
- Current plan: "Pro"
- Features list
- Usage:
  - Scans used: 45 / 100 this month
  - Progress bar
- Upgrade button if on lower tier

### Integrations Tab
- Google Analytics integration (coming soon)
- API keys management
- Webhook configuration

---

## Responsive Design Requirements

### Desktop (1200px+)
- Full sidebar navigation
- Multi-column layouts
- Charts fully visible

### Tablet (768px - 1199px)
- Collapsed sidebar (icons only)
- 2-column layouts become single column when needed
- Smaller font sizes

### Mobile (< 768px)
- Hamburger menu
- Full-width content
- Stack all cards vertically
- Reduce padding/margins
- Single column tables become cards

---

## RTL (Hebrew) Requirements

### Layout Changes
- All layouts mirror horizontally
- Sidebar moves to right
- Navigation items flow right-to-left
- Icons that show direction (arrows, checkmarks) may need adjustment

### Text Direction
- All text is right-aligned
- Form labels appear on right
- Buttons maintain RTL directionality

### Charts and Tables
- Charts maintain data correctness but visual direction reverses
- Tables: headers and rows RTL-aligned

### Font
- Hebrew text uses Heebo or Assistant font
- Maintain same hierarchy and sizing as English

---

## Empty States

### No Projects
- Large icon
- Headline: "No websites added yet"
- Description: "Get started by adding your first website for analysis"
- CTA: "Add Website"

### No Scan Results
- Icon
- Headline: "Run your first scan"
- Description: "Click the button below to analyze this website"
- CTA: "Start Scan"

### No Reports
- Icon
- Headline: "No reports yet"
- Description: "Reports will appear here as you run scans"

---

## Loading States

### Dashboard Loading
- Skeleton score cards
- Skeleton charts
- Animated shimmer effect

### Scan Progress
- Linear progress bar
- Step indicator with animation
- "X of 6 steps completed"

### Results Loading
- Skeleton cards for each section
- Placeholder animations

---

## Visual Style Reference

### Inspiration
- Linear.app (minimal, clear)
- Vercel (modern, premium)
- Stripe (professional, clean)
- Modern AI dashboards

### Key Principles
- Maximalist use of white space
- Minimal color - let important data shine
- Clear visual hierarchy
- Smooth transitions
- Premium dark theme
- Glassmorphism cards where appropriate
- Subtle gradients for CTAs
