# Inventory Command Center - Visual Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚡ Inventory Command Center                   Last updated: 2 minutes ago │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────┐  ┌─────────────────────────────────────────┐   │
│  │                       │  │  ⚠️  Critical Actions                 3  │   │
│  │       ┌─────┐         │  ├─────────────────────────────────────────┤   │
│  │      │  85  │         │  │                                          │   │
│  │      │ ●●●●○ │         │  │  🔴 Critical                            │   │
│  │      └─────┘         │  │  1. Product X - Stockout in 3 days      │   │
│  │    Excellent          │  │     Revenue at risk: $5,200             │   │
│  │                       │  │     AI predicts 95 units sold           │   │
│  │  30d trend: ──────── │  │     [Create Purchase Order]              │   │
│  │                       │  │                                          │   │
│  │  Score Breakdown:     │  │  🟠 High                                │   │
│  │  Stock Level     88   │  │  2. Transfer 50 units to Store B        │   │
│  │  ████████████████░░   │  │     Unlock $3,400 in sales              │   │
│  │  Turnover Rate   82   │  │     Excess in Store A, shortage in B   │   │
│  │  ████████████████░░   │  │     [Create Transfer Order]             │   │
│  │  Freshness       90   │  │                                          │   │
│  │  █████████████████░   │  │  🟡 Medium                              │   │
│  │  Fulfillment     85   │  │  3. Review 12 aging SKUs                │   │
│  │  ████████████████░░   │  │     $8,900 capital tied up              │   │
│  │  Suppliers       80   │  │     No movement in 90 days              │   │
│  │  ███████████████░░░   │  │     [View Details]                      │   │
│  │                       │  │                                          │   │
│  └───────────────────────┘  └─────────────────────────────────────────┘   │
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌─────────┐ │
│  │ Capital Tied   │  │ Revenue Risk   │  │ Turnover Rate  │  │ Dead    │ │
│  │ $45,200 ↓12%   │  │ $8,900 ↑5%     │  │ 6.5x ↑8%       │  │ $4,200  │ │
│  │ ───────────────│  │ ───────────────│  │ ───────────────│  │ 12 SKUs │ │
│  └────────────────┘  └────────────────┘  └────────────────┘  └─────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  💰 Revenue Opportunities                        💡 AI-Powered      │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  ✨ Restock Top Sellers                         +$12,500 (94%)     │   │
│  │     AI analysis shows these 5 products will sell out in 7 days      │   │
│  │     based on current velocity and seasonal trends                   │   │
│  │     5 products • 94% confidence              [View Products] →      │   │
│  │                                                                      │   │
│  │  📈 Optimize Pricing                            +$3,200 (87%)      │   │
│  │     These 3 products are selling 45% faster than forecast,          │   │
│  │     indicating pricing power                                        │   │
│  │     3 products • 87% confidence      [See Recommendations] →        │   │
│  │                                                                      │   │
│  │  🔄 Location Transfer Opportunity               +$2,800 (91%)      │   │
│  │     Transfer excess stock from Warehouse A to Store C to            │   │
│  │     capture waiting demand                                          │   │
│  │     8 products • 91% confidence        [Create Transfers] →         │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Color Coding

### Health Score
- **90-100**: 🟢 Green - Excellent
- **75-89**: 🔵 Blue - Good  
- **60-74**: 🟡 Yellow - Fair
- **40-59**: 🟠 Orange - Poor
- **0-39**: 🔴 Red - Critical

### Alert Severity
- **🔴 Critical**: Red background, immediate action required
- **🟠 High**: Orange background, action needed soon
- **🟡 Medium**: Yellow background, should address
- **🔵 Low**: Blue background, informational

### Metrics Trends
- **Green ↓**: Improvement (e.g., capital tied up decreased)
- **Red ↑**: Concern (e.g., revenue at risk increased)
- **Green ↑**: Improvement (e.g., turnover rate increased)

## Interactive Elements

### 1. Health Score Gauge
**Click** → Opens detailed breakdown modal showing:
- Historical trend chart (30/60/90 days)
- Contributing factors
- Comparison to industry benchmarks
- Improvement recommendations

### 2. Critical Alerts
**Hover** → Shows:
- Full description
- Affected product details
- Historical context

**Click action button** → 
- Shows confirmation dialog with action details
- Executes action (creates PO, transfer, etc.)
- Updates alert status
- Redirects to created record

### 3. Revenue Opportunities
**Click opportunity card** → Expands to show:
- List of affected products with current/suggested quantities
- Detailed AI reasoning
- Confidence breakdown
- Historical accuracy of similar predictions

**Click action button** →
- Navigates to execution screen
- Pre-fills forms with AI recommendations
- Allows manual adjustment before submission

### 4. Metric Cards
**Hover sparkline** → Shows:
- Exact values for each point
- Dates
- % change from previous period

**Click card** → Opens detailed metric view:
- Full historical chart
- Breakdown by product/category
- Export options

## Responsive Behavior

### Desktop (> 1200px)
```
┌─────────────────────────────────────┐
│  Health Score  │  Alerts & Opps     │
│  + Metrics     │                     │
└─────────────────────────────────────┘
```

### Tablet (768px - 1199px)
```
┌─────────────────────────┐
│  Health Score           │
├─────────────────────────┤
│  Metrics (2x2 grid)     │
├─────────────────────────┤
│  Alerts                 │
├─────────────────────────┤
│  Opportunities          │
└─────────────────────────┘
```

### Mobile (< 768px)
```
┌────────────────┐
│  Health Score  │
│  (simplified)  │
├────────────────┤
│  Top 3 Alerts  │
│  (compact)     │
├────────────────┤
│  Top 2 Opps    │
├────────────────┤
│  Key Metrics   │
│  (carousel)    │
└────────────────┘
```

## Animation & Feedback

### On Load
1. Health score gauge animates from 0 to current value (500ms)
2. Alerts slide in from right (stagger 100ms each)
3. Opportunities fade in from bottom (300ms delay)
4. Metrics sparklines draw from left to right (400ms)

### On Update (Real-time)
1. **Health Score Change**: 
   - Pulse animation on gauge
   - Badge shows +/- change
   - Trend line updates smoothly

2. **New Alert**:
   - Slide in from top with bounce
   - Highlight for 3 seconds
   - Push notifications (if enabled)

3. **Opportunity Detected**:
   - Fade in with glow effect
   - Revenue amount counts up
   - Confetti animation if > $10k

4. **Alert Resolved**:
   - Fade out smoothly
   - Check mark animation
   - Next alert slides up

### Loading States
```
┌─────────────────┐
│  ⏳ Loading...  │
│  [Skeleton UI]  │
│  ░░░░░░░░░░░░░░ │
└─────────────────┘
```

### Empty States
```
┌─────────────────────┐
│  ✅ No Alerts       │
│  Everything looks   │
│  great!             │
└─────────────────────┘

┌─────────────────────┐
│  💡 Analyzing...    │
│  Checking for       │
│  opportunities      │
└─────────────────────┘
```

## Accessibility

### ARIA Labels
- Health score: "Inventory health score: 85 out of 100, Excellent rating"
- Alerts: "Critical alert: Product X stockout in 3 days, $5,200 revenue at risk"
- Actions: "Create purchase order for Product X"

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Esc to close modals
- Arrow keys in metrics carousel

### Screen Reader Support
- Descriptive aria-labels on all elements
- Live regions for real-time updates
- Semantic HTML structure
- Skip links for power users

## Dark Mode

### Light Theme (Default)
- Background: White (#FFFFFF)
- Cards: Light gray (#F8F9FA)
- Text: Dark gray (#212529)
- Accents: Brand colors

### Dark Theme
- Background: Dark (#1A1B1E)
- Cards: Darker gray (#25262B)
- Text: Light gray (#C1C2C5)
- Accents: Brightened brand colors

## Performance

### Initial Load
- Critical CSS inline
- Lazy load charts
- Debounce real-time updates
- Target: < 500ms to interactive

### Updates
- Optimistic UI updates
- Background data sync
- Stale-while-revalidate
- Target: < 100ms response time

---

**Design System**: Mantine UI v7  
**Icons**: Tabler Icons  
**Charts**: Recharts via @mantine/charts  
**Animations**: Framer Motion (optional)
