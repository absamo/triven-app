# Inventory Command Center Widget Specification

## Executive Summary

The Inventory Command Center is a comprehensive, AI-powered dashboard widget that provides executives and inventory managers with instant visibility into inventory health, actionable insights, and revenue opportunities. This widget differentiates Triven from competitors by combining real-time data, financial impact analysis, and AI-driven recommendations in a single, glanceable interface.

## Problem Statement

Current inventory management dashboards focus on showing data rather than driving action. Users must:
- Navigate multiple screens to understand inventory health
- Manually calculate financial impact of inventory decisions
- React to problems rather than prevent them
- Spend time analyzing data instead of taking action

## Solution

A unified "Command Center" widget that:
1. **Distills complex inventory data** into a single health score (0-100)
2. **Prioritizes actions** by financial impact and urgency
3. **Surfaces revenue opportunities** that competitors miss
4. **Provides one-click solutions** to common problems
5. **Uses AI** to predict and prevent stockouts

## User Stories

### Primary Personas
1. **Inventory Manager**: Needs to quickly identify and resolve inventory issues
2. **Business Owner**: Wants to understand cash flow impact and revenue opportunities
3. **Operations Manager**: Requires actionable insights to optimize stock levels

### Key User Stories

**As an Inventory Manager:**
- I want to see critical alerts at a glance, so I can prioritize my day
- I want AI-suggested reorder quantities, so I don't have to manually calculate them
- I want to take action directly from the dashboard, so I save time

**As a Business Owner:**
- I want to see revenue at risk from stockouts, so I can make informed decisions
- I want to understand capital tied up in slow-moving inventory, so I can optimize cash flow
- I want to see the financial ROI of inventory actions, so I can prioritize investments

**As an Operations Manager:**
- I want to see stock imbalances across locations, so I can optimize transfers
- I want predictive alerts for upcoming stockouts, so I can prevent issues
- I want to track inventory health trends, so I can measure improvement

## Technical Architecture

### Component Structure

```
InventoryCommandCenter/
├── InventoryCommandCenter.tsx       # Main widget component
├── InventoryCommandCenter.module.css
├── components/
│   ├── HealthScoreGauge.tsx        # Health score visualization
│   ├── CriticalAlerts.tsx          # Top 3 priority alerts
│   ├── RevenueOpportunities.tsx    # Revenue-focused insights
│   ├── MetricSparklines.tsx        # 30-day trend visualizations
│   ├── QuickActions.tsx            # One-click action buttons
│   └── AIInsightBadge.tsx          # AI confidence indicators
└── types.ts                         # TypeScript interfaces
```

### Data Models

#### Inventory Health Score
Calculated from multiple weighted factors:
- **Stock Level Adequacy (30%)**: Percentage of products at healthy stock levels
- **Turnover Rate (25%)**: Inventory turnover vs industry benchmarks
- **Aging Inventory (20%)**: Percentage of stock older than 90 days
- **Backorder Rate (15%)**: Current backorders vs total orders
- **Supplier Reliability (10%)**: On-time delivery percentage

Formula:
```typescript
healthScore = (
  (healthyStockPercentage * 0.30) +
  (turnoverRateScore * 0.25) +
  ((100 - agingInventoryPercentage) * 0.20) +
  ((100 - backorderPercentage) * 0.15) +
  (supplierReliabilityScore * 0.10)
)
```

#### Alert Priority Algorithm
```typescript
interface Alert {
  id: string
  type: AlertType
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  financialImpact: number // Estimated revenue/cost impact
  affectedProducts: string[]
  suggestedAction: string
  quickAction?: {
    label: string
    endpoint: string
    params: Record<string, any>
  }
  daysUntilCritical?: number
  aiConfidence?: number // 0-1 for AI-generated insights
}

// Priority calculation
priority = (
  severityWeight +
  (financialImpact / maxImpact) * 100 +
  urgencyScore
)
```

#### Revenue Opportunity
```typescript
interface RevenueOpportunity {
  id: string
  type: 'stockout_prevention' | 'price_optimization' | 'cross_sell' | 'seasonal_demand'
  title: string
  estimatedRevenue: number
  confidence: number // AI confidence 0-1
  products: Array<{
    id: string
    name: string
    currentStock: number
    suggestedStock: number
    unitPrice: number
  }>
  action: {
    label: string
    endpoint: string
    params: Record<string, any>
  }
  expiresAt?: Date
  reasoning: string // AI explanation
}
```

### API Endpoints

#### 1. GET `/api/inventory/command-center`
Returns comprehensive command center data

**Query Parameters:**
- `agencyId?: string`
- `siteId?: string`
- `dateRange?: string` (ISO date range)

**Response:**
```typescript
{
  healthScore: {
    current: number // 0-100
    change: number // vs previous period
    breakdown: {
      stockLevelAdequacy: number
      turnoverRate: number
      agingInventory: number
      backorderRate: number
      supplierReliability: number
    }
    trend: Array<{ date: string; score: number }> // Last 30 days
  }
  criticalAlerts: Alert[] // Top 3 by priority
  opportunities: RevenueOpportunity[] // Top 3 by revenue potential
  metrics: {
    capitalTiedUp: {
      value: number
      change: number
      sparkline: number[]
    }
    revenueAtRisk: {
      value: number
      change: number
      sparkline: number[]
    }
    turnoverRate: {
      value: number
      change: number
      sparkline: number[]
    }
    deadStock: {
      value: number
      items: number
      sparkline: number[]
    }
  }
  lastUpdated: string // ISO timestamp
}
```

#### 2. POST `/api/inventory/execute-action`
Execute quick actions from alerts/opportunities

**Request:**
```typescript
{
  actionType: 'create_purchase_order' | 'adjust_price' | 'transfer_stock' | 'mark_dead_stock'
  params: Record<string, any>
  alertId?: string
  opportunityId?: string
}
```

**Response:**
```typescript
{
  success: boolean
  message: string
  redirectUrl?: string
  data?: any
}
```

#### 3. GET `/api/inventory/health-score-history`
Get historical health score data for trends

**Query Parameters:**
- `agencyId?: string`
- `days?: number` (default: 30)

**Response:**
```typescript
{
  history: Array<{
    date: string
    score: number
    breakdown: {
      stockLevelAdequacy: number
      turnoverRate: number
      agingInventory: number
      backorderRate: number
      supplierReliability: number
    }
  }>
}
```

### AI Service Integration

#### Demand Forecasting Service
```typescript
// app/services/ai/demand-forecasting.server.ts

interface ForecastRequest {
  productId: string
  historicalDays: number
  forecastDays: number
}

interface ForecastResult {
  productId: string
  predictions: Array<{
    date: string
    predictedDemand: number
    confidence: number
  }>
  factors: {
    seasonality: number
    trend: number
    externalFactors: string[]
  }
  recommendedReorderPoint: number
  recommendedSafetyStock: number
}

async function generateDemandForecast(
  request: ForecastRequest
): Promise<ForecastResult>
```

#### Smart Alert Generation
```typescript
// app/services/ai/smart-alerts.server.ts

async function generateSmartAlerts(
  companyId: string,
  agencyId?: string
): Promise<Alert[]> {
  // 1. Analyze current inventory state
  // 2. Use AI to predict issues in next 7-30 days
  // 3. Calculate financial impact
  // 4. Generate actionable recommendations
  // 5. Provide one-click solutions
}
```

#### Revenue Opportunity Detection
```typescript
// app/services/ai/opportunity-detection.server.ts

async function detectRevenueOpportunities(
  companyId: string,
  agencyId?: string
): Promise<RevenueOpportunity[]> {
  // 1. Analyze sales patterns and demand forecasts
  // 2. Identify stockout risks with revenue impact
  // 3. Detect price optimization opportunities
  // 4. Find cross-sell and seasonal opportunities
  // 5. Rank by estimated revenue and confidence
}
```

### Real-Time Updates

Uses existing WebSocket infrastructure (`/api/dashboard-stream`) to push updates:

```typescript
// Subscribe to updates
const eventSource = new EventSource('/api/inventory/command-center-stream')

eventSource.addEventListener('health-score-update', (event) => {
  const data = JSON.parse(event.data)
  // Update health score display
})

eventSource.addEventListener('new-alert', (event) => {
  const alert = JSON.parse(event.data)
  // Show notification and update alerts list
})

eventSource.addEventListener('opportunity-detected', (event) => {
  const opportunity = JSON.parse(event.data)
  // Highlight new revenue opportunity
})
```

## UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Inventory Command Center                    Last updated: 2m│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌────────────────────────────────────┐   │
│  │   Health     │  │  Critical Actions                   │   │
│  │    Score     │  │  1. ⚠️ Restock Product X           │   │
│  │      85      │  │     Revenue at risk: $5,200        │   │
│  │   ●●●●○      │  │     [Create PO]                    │   │
│  │   Excellent  │  │                                     │   │
│  │              │  │  2. 💰 Transfer 50 units to Store B │   │
│  │  30d trend:  │  │     Unlock $3,400 in sales         │   │
│  │  ──────────  │  │     [Transfer Stock]               │   │
│  └──────────────┘  │                                     │   │
│                    │  3. 📊 Review 12 aging SKUs         │   │
│                    │     $8,900 capital tied up          │   │
│                    │     [View Details]                  │   │
│                    └────────────────────────────────────┘   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Revenue Opportunities                     💡 AI-Powered│ │
│  │                                                          │ │
│  │  • Restock Top Sellers: +$12,500 potential (94%)       │ │
│  │    5 products predicted to sell out in 7 days          │ │
│  │    [View Products]                                      │ │
│  │                                                          │ │
│  │  • Optimize Pricing: +$3,200 potential (87%)           │ │
│  │    3 products selling faster than forecast             │ │
│  │    [See Recommendations]                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Key Metrics (Last 30 Days)                            │ │
│  │                                                          │ │
│  │  Capital Tied Up    Revenue at Risk   Dead Stock       │ │
│  │  $45,200 ↓12%      $8,900 ↑5%         $4,200 ↓8%       │ │
│  │  ──────────         ──────────         ──────────       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Color Coding

**Health Score Ranges:**
- 90-100: Excellent (Green)
- 75-89: Good (Blue)
- 60-74: Fair (Yellow)
- 40-59: Poor (Orange)
- 0-39: Critical (Red)

**Alert Severity:**
- Critical: Red background, white text
- High: Orange background
- Medium: Yellow background
- Low: Blue background

**Financial Impact:**
- Positive (Revenue opportunity): Green accent
- Negative (Risk/Cost): Red accent
- Neutral (Optimization): Blue accent

### Interactive Elements

1. **Health Score Gauge**: Click to view detailed breakdown
2. **Critical Alerts**: Hover for full details, click action button to execute
3. **Revenue Opportunities**: Expand to see affected products and reasoning
4. **Sparklines**: Hover to see exact values and dates
5. **Quick Actions**: One-click with confirmation modal for high-impact actions

## Database Schema Extensions

Add new tables to support command center features:

```prisma
model InventoryHealthScore {
  id                    String   @id @default(cuid())
  companyId             String
  agencyId              String?
  siteId                String?
  date                  DateTime
  overallScore          Float    // 0-100
  stockLevelAdequacy    Float
  turnoverRate          Float
  agingInventory        Float
  backorderRate         Float
  supplierReliability   Float
  metadata              Json?    // Additional context
  createdAt             DateTime @default(now())
  
  company               Company  @relation(fields: [companyId], references: [id])
  
  @@index([companyId, date])
  @@index([agencyId, date])
}

model SmartAlert {
  id                String     @id @default(cuid())
  companyId         String
  agencyId          String?
  type              AlertType
  severity          AlertSeverity
  title             String
  description       String
  financialImpact   Float
  affectedProducts  String[]   // Product IDs
  suggestedAction   String
  quickAction       Json?      // Action definition
  daysUntilCritical Int?
  aiConfidence      Float?
  status            AlertStatus @default(Active)
  resolvedAt        DateTime?
  resolvedBy        String?
  createdAt         DateTime   @default(now())
  expiresAt         DateTime?
  
  company           Company    @relation(fields: [companyId], references: [id])
  
  @@index([companyId, status, createdAt])
}

model RevenueOpportunity {
  id                String              @id @default(cuid())
  companyId         String
  agencyId          String?
  type              OpportunityType
  title             String
  estimatedRevenue  Float
  confidence        Float               // 0-1
  products          Json                // Array of product details
  action            Json                // Action definition
  reasoning         String
  status            OpportunityStatus   @default(Active)
  acceptedAt        DateTime?
  acceptedBy        String?
  createdAt         DateTime            @default(now())
  expiresAt         DateTime?
  
  company           Company             @relation(fields: [companyId], references: [id])
  
  @@index([companyId, status, estimatedRevenue])
}

enum AlertType {
  StockoutPredicted
  LowStockWarning
  DeadStockAlert
  PriceAnomalyDetected
  SupplierDelayRisk
  DemandSpikeExpected
  StockImbalance
  HighValueBackorder
  TurnoverRateDrop
  ExcessInventory
}

enum AlertSeverity {
  Critical
  High
  Medium
  Low
}

enum AlertStatus {
  Active
  Acknowledged
  InProgress
  Resolved
  Dismissed
  Expired
}

enum OpportunityType {
  StockoutPrevention
  PriceOptimization
  CrossSell
  SeasonalDemand
  LocationTransfer
  BulkPurchaseDiscount
}

enum OpportunityStatus {
  Active
  Accepted
  Declined
  Expired
  Completed
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
- [ ] Database schema updates
- [ ] Health score calculation service
- [ ] Base API endpoints
- [ ] Basic UI component structure

### Phase 2: AI Integration (Week 2)
- [ ] Ollama demand forecasting integration
- [ ] Smart alert generation
- [ ] Revenue opportunity detection
- [ ] AI confidence scoring

### Phase 3: UI/UX Polish (Week 3)
- [ ] Health score gauge visualization
- [ ] Alert card components
- [ ] Opportunity cards
- [ ] Sparkline charts
- [ ] Quick action modals

### Phase 4: Real-Time Updates (Week 4)
- [ ] WebSocket stream implementation
- [ ] Live health score updates
- [ ] Real-time alert notifications
- [ ] Opportunity detection streaming

### Phase 5: Testing & Optimization (Week 5)
- [ ] Unit tests for all services
- [ ] Integration tests for APIs
- [ ] E2E tests for user flows
- [ ] Performance optimization
- [ ] Load testing

## Success Metrics

### User Engagement
- Time to first action: < 5 seconds
- Daily active users of widget: > 80% of total users
- Action completion rate: > 60%
- User satisfaction score: > 4.5/5

### Business Impact
- Stockout reduction: 40%
- Cash flow improvement: 25%
- Inventory turnover increase: 15%
- Time saved per user per day: 30 minutes

### Technical Performance
- Widget load time: < 500ms
- Health score calculation: < 2s
- AI insight generation: < 5s
- Real-time update latency: < 1s

## Competitive Differentiation

### vs Traditional Inventory Software
- **Traditional**: Shows data, requires analysis
- **Triven**: Shows insights, provides actions

### vs Modern SaaS Competitors
- **Competitors**: Basic alerts and reports
- **Triven**: AI-powered predictions with financial impact

### vs Enterprise Solutions
- **Enterprise**: Complex, requires training
- **Triven**: Intuitive, actionable in seconds

## Risk Mitigation

### Technical Risks
1. **AI Accuracy**: Start with confidence thresholds, allow user feedback
2. **Performance**: Cache calculations, use background jobs
3. **Data Quality**: Validate inputs, handle missing data gracefully

### Business Risks
1. **User Adoption**: Provide onboarding tour and video tutorials
2. **Over-Reliance on AI**: Always show confidence scores and reasoning
3. **Feature Creep**: Stick to core metrics, iterate based on usage

## Future Enhancements

### Short-term (3-6 months)
- Mobile app widget
- Slack/Teams integration for alerts
- Custom alert rules builder
- Export health score reports

### Long-term (6-12 months)
- Industry benchmark comparisons
- Multi-currency financial impact
- Supplier negotiation recommendations
- Predictive maintenance for equipment

## Compliance & Security

- All financial calculations audited and logged
- User actions tracked for compliance
- AI decisions explainable and documented
- Data privacy for multi-tenant isolation
- GDPR/CCPA compliant data handling

## Documentation Requirements

1. **User Guide**: How to interpret health score and take actions
2. **API Documentation**: OpenAPI spec for all endpoints
3. **AI Model Documentation**: How predictions are generated
4. **Admin Guide**: Configuration and customization options
5. **Troubleshooting Guide**: Common issues and solutions

---

**Specification Version**: 1.0  
**Last Updated**: October 17, 2025  
**Owner**: Product Team  
**Status**: Ready for Implementation
