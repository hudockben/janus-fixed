# Janus - Feature Roadmap

## Current Status
✅ Dual-storage system (localStorage + Postgres)
✅ Recent files and Google Sheets tracking
✅ Interactive chart visualizations (Bar, Line, Pie, Area)
✅ KPI monitoring and automations
🚧 User authentication (IN PROGRESS)

---

## Phase 1: Foundation (1-2 weeks)

### 1. User Authentication & Authorization ✅ IN PROGRESS
**Priority:** HIGH
**Impact:** Enables personalized experiences, data security

**Features:**
- Login/signup UI with email/password
- JWT-based authentication
- User table in Postgres
- Protected routes
- User-specific data isolation

**What it enables:**
- Personal automations, charts, saved analyses
- Team workspaces (future)
- Audit logs
- Secure data access

---

### 2. Scheduled Automations (Backend Implementation)
**Priority:** HIGH
**Impact:** Transforms app from manual tool → automated monitoring

**Features:**
- Vercel Cron jobs for scheduled runs
- Actually execute automations on schedule (hourly/daily/weekly)
- Real email notifications via Resend API
- Slack webhook integration
- SMS alerts (optional, via Twilio)
- Automation execution logs

**Technical:**
- `/api/cron/run-automations.js` - Cron endpoint
- Check user automations against latest data
- Send notifications when conditions met
- Store execution history

**UI Updates:**
- Automation execution history
- Last run timestamp
- Success/failure indicators

---

### 3. Analysis History & Saved Results
**Priority:** HIGH
**Impact:** Users can track changes over time, compare trends

**Features:**
- Save analysis results with timestamps
- Browse history by date
- Compare two analyses side-by-side
- Replay previous analysis with one click
- Export history as timeline chart

**Database Schema:**
```sql
CREATE TABLE analysis_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT,
  rules JSONB,
  data_sources JSONB,
  result TEXT,
  charts JSONB,
  created_at TIMESTAMP DEFAULT NOW
)
```

---

## Phase 2: Polish & Productivity (1-2 weeks)

### 4. Enhanced Export & Sharing
**Priority:** MEDIUM-HIGH
**Impact:** Professional outputs, better collaboration

**Features:**
- Export charts as PNG/SVG images
- Generate PDF reports with charts + analysis
- Share results via unique URL (public links)
- Email reports to stakeholders
- Scheduled report delivery

**Technical:**
- Use `html2canvas` or `recharts.downloadChart()`
- PDF generation with `jsPDF` or server-side
- Public share links with UUID tokens
- S3/Vercel Blob storage for shared files

---

### 5. Template Library & Workflow Builder
**Priority:** MEDIUM
**Impact:** Faster onboarding, consistent analyses

**Features:**
- Save analysis workflows as templates
- Pre-built templates:
  - Sales Dashboard
  - Financial Summary
  - Construction KPIs
  - Inventory Analysis
  - Marketing Performance
- Share templates with team
- Template marketplace (future)
- One-click template application

**Database Schema:**
```sql
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT,
  description TEXT,
  category TEXT,
  rules JSONB,
  kpis JSONB,
  chart_config JSONB,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW
)
```

---

### 6. Dashboard Builder
**Priority:** MEDIUM
**Impact:** At-a-glance insights, executive reporting

**Features:**
- Drag-and-drop dashboard layout
- Pin favorite charts and KPIs
- Auto-refresh dashboards
- Full-screen presentation mode
- Multi-page dashboards
- Widget library (charts, metrics, tables)

---

## Phase 3: Power Features (2-3 weeks)

### 7. AI Chat Interface
**Priority:** HIGH
**Impact:** More intuitive, conversational data analysis

**Features:**
- Chat sidebar with Claude AI
- Natural language queries: "Show me sales trends for Q4"
- AI suggests relevant analyses
- Follow-up questions about results
- Auto-generate charts from chat
- Export chat conversations

**Example Interactions:**
```
User: "What were our top selling products last month?"
AI: [Analyzes data] "Here are your top 5 products..."
    [Shows bar chart]
User: "Show me the trend over the last 6 months"
AI: [Generates line chart]
```

**Technical:**
- Chat component with streaming responses
- Context-aware prompts (include data schema)
- Function calling to generate charts/analyses

---

### 8. Real-time Collaboration
**Priority:** MEDIUM
**Impact:** Team productivity, live updates

**Features:**
- Multiple users viewing same analysis
- Live cursor positions
- Real-time comments/annotations
- Presence indicators ("John is viewing this")
- Activity feed
- @mentions in comments

**Technical:**
- WebSocket or Server-Sent Events
- Shared state synchronization
- Conflict resolution for concurrent edits
- Use Ably, Pusher, or native WebSockets

---

### 9. Advanced Data Source Management
**Priority:** MEDIUM-HIGH
**Impact:** Reduce manual uploads, more data types

**Features:**
- **Direct database connections:**
  - PostgreSQL, MySQL, MongoDB
  - Connection string management
  - Query builder UI
  - Scheduled data syncs

- **API integrations:**
  - Stripe (payment data)
  - Salesforce (CRM data)
  - Google Analytics
  - Shopify
  - QuickBooks
  - Custom REST APIs

- **File uploads enhancements:**
  - Excel (.xlsx) support
  - Multiple sheets support
  - Drag-and-drop folder uploads
  - Cloud storage (Google Drive, Dropbox)

**Database Schema:**
```sql
CREATE TABLE data_sources (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT,
  type TEXT, -- 'database', 'api', 'file', 'cloud'
  config JSONB, -- connection details, encrypted
  schedule TEXT, -- cron expression
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW
)
```

---

### 10. Advanced Visualizations
**Priority:** MEDIUM
**Impact:** Richer insights, professional dashboards

**Features:**
- **New chart types:**
  - Heatmaps (time-series intensity)
  - Scatter plots (correlation analysis)
  - Gauge charts (KPI targets)
  - Funnel charts (conversion rates)
  - Waterfall charts (cumulative changes)
  - Candlestick (financial data)

- **Chart enhancements:**
  - Multi-series charts (compare multiple metrics)
  - Drill-down capabilities (click → see details)
  - Zoom and pan
  - Annotations and markers
  - Trend lines and forecasting
  - Statistical overlays (mean, median)

- **Interactive features:**
  - Brush selection
  - Data filtering by chart selection
  - Cross-chart filtering (select on one chart → filters others)

---

## Phase 4: Enterprise Features (Future)

### 11. Team Workspaces
- Invite team members
- Role-based access control (admin, editor, viewer)
- Shared automations and templates
- Team activity logs
- Billing and subscription management

### 12. Audit Logs & Compliance
- Complete audit trail of all actions
- Data access logs
- Export compliance reports
- GDPR/CCPA compliance tools
- Data retention policies

### 13. Mobile App
- React Native app
- View dashboards on mobile
- Push notifications for automations
- Offline mode
- Mobile-optimized charts

### 14. Embedded Analytics
- Embed dashboards in external apps
- iFrame/SDK support
- Whitelabel options
- Public API for data access

### 15. AI-Powered Insights
- Anomaly detection
- Predictive analytics
- Automated insights generation
- Smart alerts (AI decides when to notify)
- Natural language report generation

---

## Quick Wins (Can implement anytime)

### UX Improvements
- [ ] Keyboard shortcuts modal (press '?')
- [ ] Undo/redo for edits
- [ ] Bulk actions (delete multiple files)
- [ ] Search/filter for automations, KPIs
- [ ] Drag-and-drop file reordering

### Performance
- [ ] Lazy loading for large datasets
- [ ] Virtualized lists for 100+ items
- [ ] Chart rendering optimization
- [ ] Debounced search inputs
- [ ] Service worker for offline support

### Polish
- [ ] Loading skeletons instead of spinners
- [ ] Smooth page transitions
- [ ] Success/error toast notifications
- [ ] Empty state illustrations
- [ ] Onboarding tour for new users
- [ ] Tooltips for all features
- [ ] Inline help documentation

---

## Technical Debt & Maintenance

### Code Quality
- [ ] Add TypeScript
- [ ] Unit tests for core functions
- [ ] E2E tests with Playwright
- [ ] Component documentation
- [ ] Error boundary improvements

### Security
- [ ] Rate limiting on API endpoints
- [ ] Input validation/sanitization
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Encrypted environment variables

### Infrastructure
- [ ] Monitoring and alerting (Sentry)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Database backups
- [ ] CI/CD pipeline
- [ ] Staging environment

---

## Metrics to Track

### User Engagement
- Daily/weekly/monthly active users
- Average session duration
- Feature usage (which tabs most used?)
- Retention rate

### Product Performance
- Analysis completion rate
- Average time to first analysis
- Chart generation success rate
- Automation execution success rate

### Technical
- API response times
- Error rates
- Database query performance
- Frontend bundle size

---

## Next Steps

1. ✅ Complete user authentication (IN PROGRESS)
2. Implement scheduled automations
3. Add analysis history
4. Gather user feedback
5. Prioritize Phase 2 features based on usage data

---

**Last Updated:** 2026-01-23
**Version:** 2.1.0
