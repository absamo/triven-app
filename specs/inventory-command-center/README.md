# Inventory Command Center - Implementation Guide

## Overview

The Inventory Command Center is a killer dashboard widget that differentiates Triven from competitors by providing:

1. **Single Health Score (0-100)**: Instant understanding of inventory health
2. **AI-Powered Alerts**: Predictive warnings with financial impact
3. **Revenue Opportunities**: Money-focused insights competitors miss
4. **One-Click Actions**: Direct resolution from the dashboard
5. **Real-Time Updates**: Live metrics via WebSockets

## What Makes It a Killer Feature

### vs Competitors

| Feature | Traditional Tools | Modern SaaS | **Triven Command Center** |
|---------|------------------|-------------|--------------------------|
| **Insight Type** | Data tables | Basic charts | **AI predictions + Financial impact** |
| **Actionability** | View only | Notifications | **One-click resolution** |
| **Focus** | Units & quantities | Inventory levels | **Revenue & cash flow impact** |
| **Intelligence** | Reactive alerts | Rule-based | **AI-powered forecasting** |
| **User Experience** | Multiple screens | Dashboard widgets | **Single command center** |

### Key Differentiators

1. **Financial-First Approach**
   - Shows revenue at risk, not just "low stock"
   - Displays capital tied up in dead inventory
   - Calculates opportunity cost of stockouts

2. **AI-Enhanced Decision Making**
   - Predicts stockouts 7-30 days in advance
   - Recommends optimal reorder quantities
   - Detects revenue opportunities from demand spikes

3. **Executive-Friendly**
   - Single health score (like a credit score for inventory)
   - Glanceable metrics with 30-day trends
   - Prioritized actions by financial impact

4. **Action-Oriented**
   - Create purchase orders with one click
   - Transfer stock between locations instantly
   - Mark dead stock for clearance directly

## Implementation Status

### ✅ Completed

1. **Database Schema**
   - `InventoryHealthScore` model
   - `SmartAlert` model  
   - `RevenueOpportunity` model
   - Enums for alert types and severities

2. **Backend Services**
   - Health score calculation engine
   - Smart alert generation
   - Revenue opportunity detection
   - Metrics calculation

3. **React Component**
   - Main Command Center widget
   - Health score gauge
   - Critical alerts cards
   - Revenue opportunities cards
   - Metric sparklines

4. **Documentation**
   - Complete specification (SPEC.md)
   - API documentation (API.md)
   - Implementation guide (this file)

### 🚧 Remaining Work

1. **API Routes** (2-3 hours)
   - Create `/api/inventory/command-center` endpoint
   - Implement execute-action endpoint
   - Add real-time SSE stream

2. **AI Integration** (4-6 hours)
   - Integrate with Ollama for demand forecasting
   - Implement confidence scoring
   - Add reasoning generation

3. **Dashboard Integration** (1-2 hours)
   - Add widget to main dashboard
   - Wire up data fetching
   - Connect action handlers

4. **Testing** (3-4 hours)
   - Unit tests for services
   - Integration tests for APIs
   - E2E tests for user flows

5. **Performance Optimization** (2-3 hours)
   - Cache health score calculations
   - Background job for alert generation
   - Database query optimization

## File Structure

```
app/
├── services/
│   └── inventory/
│       ├── health-score.server.ts        # Health score calculation
│       ├── smart-alerts.server.ts        # Alert generation
│       └── opportunity-detection.server.ts # Revenue opportunities
├── routes/
│   └── api/
│       └── inventory/
│           ├── command-center.ts         # Main data endpoint
│           ├── execute-action.ts         # Action execution
│           └── command-center-stream.ts  # Real-time updates
└── pages/
    └── Dashboard/
        └── InventoryCommandCenter/
            ├── InventoryCommandCenter.tsx
            ├── InventoryCommandCenter.module.css
            └── index.ts

prisma/
└── schema.prisma                         # Database models

specs/
└── inventory-command-center/
    ├── SPEC.md                           # Full specification
    ├── API.md                            # API documentation
    └── README.md                         # This file
```

## Quick Start

### 1. Run Database Migration

```bash
cd /Users/mas/MAS/triven-app
bunx prisma generate
bunx prisma db push  # Or create a migration
```

### 2. Add to Dashboard

In `app/routes/dashboard.tsx`:

```typescript
import InventoryCommandCenter from '~/app/pages/Dashboard/InventoryCommandCenter'

// In your loader function
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // ... existing code ...
  
  // Fetch command center data
  const commandCenterData = await getCommandCenterData({
    companyId: user.companyId!,
    agencyId: user.agencyId,
    siteId: user.siteId,
  })
  
  return data({
    // ... existing data ...
    commandCenter: commandCenterData,
  })
}

// In your component
export default function DashboardRoute({ loaderData }: Route.ComponentProps) {
  return (
    <Dashboard>
      {/* ... existing widgets ... */}
      
      <InventoryCommandCenter
        healthScore={loaderData.commandCenter.healthScore}
        criticalAlerts={loaderData.commandCenter.criticalAlerts}
        opportunities={loaderData.commandCenter.opportunities}
        metrics={loaderData.commandCenter.metrics}
        lastUpdated={loaderData.commandCenter.lastUpdated}
        onExecuteAction={handleExecuteAction}
        onAcceptOpportunity={handleAcceptOpportunity}
      />
    </Dashboard>
  )
}
```

### 3. Create API Route

Create `app/routes/api/inventory/command-center.ts`:

```typescript
import { json } from 'react-router'
import { calculateHealthScore } from '~/app/services/inventory/health-score.server'
import { generateSmartAlerts } from '~/app/services/inventory/smart-alerts.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireBetterAuthUser(request)
  
  const url = new URL(request.url)
  const agencyId = url.searchParams.get('agency') || undefined
  const siteId = url.searchParams.get('site') || undefined
  
  const [healthScore, alerts, opportunities, metrics] = await Promise.all([
    calculateHealthScore({ 
      companyId: user.companyId!, 
      agencyId, 
      siteId 
    }),
    generateSmartAlerts({ 
      companyId: user.companyId!, 
      agencyId, 
      siteId 
    }),
    // TODO: Add opportunity detection
    Promise.resolve([]),
    // TODO: Add metrics calculation
    Promise.resolve({}),
  ])
  
  return json({
    healthScore,
    criticalAlerts: alerts.slice(0, 3),
    opportunities,
    metrics,
    lastUpdated: new Date().toISOString(),
  })
}
```

## Usage Examples

### Basic Usage

```tsx
<InventoryCommandCenter
  healthScore={{
    current: 85,
    change: 5.2,
    previousScore: 79.8,
    breakdown: {
      stockLevelAdequacy: 88,
      turnoverRate: 82,
      agingInventory: 90,
      backorderRate: 85,
      supplierReliability: 80,
    },
    trend: [
      { date: '2025-09-17', score: 79 },
      { date: '2025-10-17', score: 85 },
    ],
    rating: 'excellent',
  }}
  criticalAlerts={[
    {
      id: 'alert_001',
      type: 'StockoutPredicted',
      severity: 'Critical',
      title: 'Product X - Stockout in 3 days',
      description: 'Based on current sales velocity...',
      financialImpact: 5200,
      affectedProducts: ['prod_123'],
      suggestedAction: 'Create purchase order for 150 units',
      quickAction: {
        label: 'Create PO',
        endpoint: '/api/purchase-orders',
        method: 'POST',
        params: { productId: 'prod_123', quantity: 150 },
      },
      daysUntilCritical: 3,
      aiConfidence: 0.94,
      createdAt: new Date(),
    },
  ]}
  opportunities={[]}
  metrics={{
    capitalTiedUp: {
      value: 45200,
      change: -12,
      previousValue: 51364,
      sparkline: [48000, 47500, 46800, 46200, 45800, 45200],
    },
    // ... other metrics
  }}
  lastUpdated={new Date().toISOString()}
  onExecuteAction={async (alert) => {
    // Handle quick action execution
    console.log('Executing action for alert:', alert.id)
  }}
/>
```

### With Real-Time Updates

```tsx
function DashboardWithCommandCenter() {
  const [commandCenterData, setCommandCenterData] = useState(initialData)
  
  // Subscribe to real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/inventory/command-center-stream')
    
    eventSource.addEventListener('health-score-update', (event) => {
      const data = JSON.parse(event.data)
      setCommandCenterData(prev => ({
        ...prev,
        healthScore: {
          ...prev.healthScore,
          current: data.current,
        },
      }))
    })
    
    return () => eventSource.close()
  }, [])
  
  return <InventoryCommandCenter {...commandCenterData} />
}
```

## Configuration

### Health Score Weights

Customize the health score calculation weights in `health-score.server.ts`:

```typescript
const healthScore = Math.round(
  breakdown.stockLevelAdequacy * 0.30 +    // Stock levels
  breakdown.turnoverRate * 0.25 +          // Turnover
  breakdown.agingInventory * 0.20 +        // Freshness
  breakdown.backorderRate * 0.15 +         // Fulfillment
  breakdown.supplierReliability * 0.10     // Suppliers
)
```

### Alert Thresholds

Configure when alerts are triggered in `smart-alerts.server.ts`:

```typescript
// Stockout prediction threshold (days)
if (daysUntilStockout <= 7 && daysUntilStockout > 0) {
  // Create alert
}

// Dead stock threshold (days)
const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

// High-value backorder threshold (currency)
if (totalValue > 1000) {
  // Create alert
}
```

## Performance Considerations

### Caching Strategy

1. **Health Score**: Cache for 60 seconds
   ```typescript
   const cacheKey = `health-score:${companyId}:${agencyId}:${siteId}`
   const cached = await redis.get(cacheKey)
   if (cached) return JSON.parse(cached)
   ```

2. **Alerts**: Regenerate daily via cron job
   ```typescript
   // Run at 6 AM daily
   cron.schedule('0 6 * * *', async () => {
     await generateSmartAlertsForAllCompanies()
   })
   ```

3. **Metrics**: Update every 5 minutes via background job

### Database Indexing

Key indexes added for performance:

```sql
-- Health score lookups
CREATE INDEX idx_health_score_company_date 
ON "InventoryHealthScore" (companyId, date);

-- Alert queries
CREATE INDEX idx_smart_alert_company_status 
ON "SmartAlert" (companyId, status, createdAt);

-- Opportunity queries  
CREATE INDEX idx_revenue_opp_company_revenue 
ON "RevenueOpportunity" (companyId, status, estimatedRevenue);
```

## Testing

### Unit Tests

```typescript
describe('HealthScore Calculation', () => {
  it('should calculate stock level adequacy correctly', () => {
    // Test implementation
  })
  
  it('should handle zero products gracefully', () => {
    // Test implementation  
  })
})
```

### Integration Tests

```typescript
describe('Command Center API', () => {
  it('should return complete command center data', async () => {
    const response = await fetch('/api/inventory/command-center')
    const data = await response.json()
    
    expect(data).toHaveProperty('healthScore')
    expect(data).toHaveProperty('criticalAlerts')
    expect(data.healthScore.current).toBeGreaterThanOrEqual(0)
    expect(data.healthScore.current).toBeLessThanOrEqual(100)
  })
})
```

## Troubleshooting

### Health Score Always 50

**Problem**: Default/neutral score being returned

**Solution**: Check if products exist and have required fields:
- `reorderPoint` or `safetyStockLevel`
- Recent sales order data
- Stock adjustment history

### No Alerts Generated

**Problem**: Alert array is empty

**Solution**: Verify:
1. Products have sufficient data (sales history, stock levels)
2. Thresholds are not too aggressive
3. Database has recent order data

### Sparklines Not Rendering

**Problem**: Charts not displaying

**Solution**: Ensure Mantine Charts is installed:
```bash
bun add @mantine/charts recharts
```

## Next Steps

1. **Deploy to Production**
   - Run database migrations
   - Configure caching layer
   - Set up monitoring

2. **Add More Alert Types**
   - Supplier delay risks
   - Price anomaly detection
   - Seasonal demand spikes

3. **Enhance AI Capabilities**
   - Train custom forecasting models
   - Add multi-variate analysis
   - Implement A/B testing for recommendations

4. **Mobile Support**
   - Create responsive layouts
   - Add push notifications
   - Build mobile app widget

## Support

For questions or issues:
- Check the full specification: `specs/inventory-command-center/SPEC.md`
- Review API docs: `specs/inventory-command-center/API.md`
- Contact the development team

---

**Version**: 1.0  
**Last Updated**: October 17, 2025  
**Status**: Ready for Integration
