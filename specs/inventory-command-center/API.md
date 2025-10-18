# Inventory Command Center - API Specification

## Overview

This document defines the API contracts for the Inventory Command Center widget.

## Base URL

All endpoints are prefixed with `/api/inventory`

## Authentication

All endpoints require authentication via Better Auth session.

## Endpoints

### 1. Get Command Center Data

**Endpoint:** `GET /api/inventory/command-center`

**Description:** Returns comprehensive command center data including health score, alerts, and opportunities.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| agency | string | No | Filter by agency ID |
| site | string | No | Filter by site ID |
| startDate | string (ISO) | No | Start of date range |
| endDate | string (ISO) | No | End of date range |

**Response:**

```json
{
  "healthScore": {
    "current": 85,
    "change": 5.2,
    "previousScore": 79.8,
    "breakdown": {
      "stockLevelAdequacy": 88,
      "turnoverRate": 82,
      "agingInventory": 90,
      "backorderRate": 85,
      "supplierReliability": 80
    },
    "trend": [
      { "date": "2025-09-17", "score": 79 },
      { "date": "2025-09-24", "score": 81 },
      { "date": "2025-10-01", "score": 83 },
      { "date": "2025-10-08", "score": 84 },
      { "date": "2025-10-15", "score": 85 }
    ],
    "rating": "excellent"
  },
  "criticalAlerts": [
    {
      "id": "alert_001",
      "type": "StockoutPredicted",
      "severity": "critical",
      "title": "Restock Product X - Stockout in 3 days",
      "description": "Based on current sales velocity, Product X will be out of stock in 3 days",
      "financialImpact": 5200,
      "affectedProducts": ["prod_123"],
      "suggestedAction": "Create purchase order for 150 units",
      "quickAction": {
        "label": "Create Purchase Order",
        "endpoint": "/api/purchase-orders",
        "method": "POST",
        "params": {
          "productId": "prod_123",
          "quantity": 150,
          "supplierId": "sup_456"
        }
      },
      "daysUntilCritical": 3,
      "aiConfidence": 0.94,
      "createdAt": "2025-10-17T10:00:00Z"
    },
    {
      "id": "alert_002",
      "type": "StockImbalance",
      "severity": "high",
      "title": "Stock imbalance across locations",
      "description": "Store A has excess inventory while Store B is running low",
      "financialImpact": 3400,
      "affectedProducts": ["prod_789"],
      "suggestedAction": "Transfer 50 units from Store A to Store B",
      "quickAction": {
        "label": "Create Transfer Order",
        "endpoint": "/api/transfer-orders",
        "method": "POST",
        "params": {
          "productId": "prod_789",
          "quantity": 50,
          "fromSite": "site_A",
          "toSite": "site_B"
        }
      },
      "aiConfidence": 0.87,
      "createdAt": "2025-10-17T09:30:00Z"
    },
    {
      "id": "alert_003",
      "type": "DeadStockAlert",
      "severity": "medium",
      "title": "12 SKUs with no movement in 90 days",
      "description": "Dead stock tying up $8,900 in capital",
      "financialImpact": -8900,
      "affectedProducts": ["prod_111", "prod_222"],
      "suggestedAction": "Review and mark for clearance or write-off",
      "createdAt": "2025-10-17T08:00:00Z"
    }
  ],
  "opportunities": [
    {
      "id": "opp_001",
      "type": "StockoutPrevention",
      "title": "Restock Top Sellers",
      "estimatedRevenue": 12500,
      "confidence": 0.94,
      "products": [
        {
          "id": "prod_301",
          "name": "Widget Pro",
          "currentStock": 25,
          "suggestedStock": 150,
          "unitPrice": 49.99,
          "predictedDemand": 125
        },
        {
          "id": "prod_302",
          "name": "Gadget Plus",
          "currentStock": 15,
          "suggestedStock": 100,
          "unitPrice": 79.99,
          "predictedDemand": 85
        }
      ],
      "action": {
        "label": "View Recommendations",
        "endpoint": "/api/inventory/reorder-recommendations",
        "method": "GET"
      },
      "reasoning": "AI analysis shows these 5 products will sell out within 7 days based on current velocity and seasonal trends",
      "expiresAt": "2025-10-24T23:59:59Z",
      "createdAt": "2025-10-17T10:00:00Z"
    },
    {
      "id": "opp_002",
      "type": "PriceOptimization",
      "title": "Optimize Pricing",
      "estimatedRevenue": 3200,
      "confidence": 0.87,
      "products": [
        {
          "id": "prod_401",
          "name": "Super Widget",
          "currentPrice": 29.99,
          "suggestedPrice": 34.99,
          "currentStock": 200,
          "velocityIncrease": "45%"
        }
      ],
      "action": {
        "label": "See Price Recommendations",
        "endpoint": "/products/bulk-edit",
        "method": "GET"
      },
      "reasoning": "These products are selling 45% faster than forecast, indicating pricing power",
      "createdAt": "2025-10-17T09:00:00Z"
    }
  ],
  "metrics": {
    "capitalTiedUp": {
      "value": 45200,
      "change": -12,
      "previousValue": 51364,
      "sparkline": [48000, 47500, 46800, 46200, 45800, 45200]
    },
    "revenueAtRisk": {
      "value": 8900,
      "change": 5,
      "previousValue": 8476,
      "sparkline": [7500, 7800, 8100, 8400, 8700, 8900]
    },
    "turnoverRate": {
      "value": 6.5,
      "change": 8,
      "previousValue": 6.02,
      "sparkline": [5.8, 6.0, 6.2, 6.3, 6.4, 6.5]
    },
    "deadStock": {
      "value": 4200,
      "items": 12,
      "change": -8,
      "previousValue": 4565,
      "sparkline": [5000, 4800, 4600, 4400, 4300, 4200]
    }
  },
  "lastUpdated": "2025-10-17T10:30:00Z"
}
```

**Status Codes:**

- `200 OK`: Successfully retrieved data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User doesn't have access to requested agency/site
- `500 Internal Server Error`: Server error

---

### 2. Execute Quick Action

**Endpoint:** `POST /api/inventory/execute-action`

**Description:** Execute a quick action from an alert or opportunity.

**Request Body:**

```json
{
  "actionType": "create_purchase_order",
  "params": {
    "productId": "prod_123",
    "quantity": 150,
    "supplierId": "sup_456"
  },
  "alertId": "alert_001",
  "notes": "Executing from command center alert"
}
```

**Action Types:**

- `create_purchase_order`: Create a new purchase order
- `create_transfer_order`: Create a stock transfer
- `adjust_price`: Update product pricing
- `mark_dead_stock`: Mark products as dead stock
- `create_stock_adjustment`: Create stock adjustment

**Response:**

```json
{
  "success": true,
  "message": "Purchase order created successfully",
  "data": {
    "id": "po_789",
    "number": "PO-2025-1234",
    "status": "Pending"
  },
  "redirectUrl": "/purchase-orders/po_789/edit"
}
```

**Status Codes:**

- `200 OK`: Action executed successfully
- `400 Bad Request`: Invalid action type or parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User doesn't have permission for this action
- `422 Unprocessable Entity`: Action cannot be completed (e.g., insufficient permissions)
- `500 Internal Server Error`: Server error

---

### 3. Get Health Score History

**Endpoint:** `GET /api/inventory/health-score-history`

**Description:** Get historical health score data for trend analysis.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| agency | string | No | Filter by agency ID |
| site | string | No | Filter by site ID |
| days | number | No | Number of days of history (default: 30, max: 365) |

**Response:**

```json
{
  "history": [
    {
      "date": "2025-09-17",
      "score": 79,
      "breakdown": {
        "stockLevelAdequacy": 75,
        "turnoverRate": 78,
        "agingInventory": 85,
        "backorderRate": 80,
        "supplierReliability": 77
      }
    },
    {
      "date": "2025-09-24",
      "score": 81,
      "breakdown": {
        "stockLevelAdequacy": 78,
        "turnoverRate": 80,
        "agingInventory": 86,
        "backorderRate": 82,
        "supplierReliability": 79
      }
    }
  ],
  "summary": {
    "averageScore": 82.4,
    "trend": "improving",
    "bestScore": 85,
    "worstScore": 79,
    "volatility": "low"
  }
}
```

**Status Codes:**

- `200 OK`: Successfully retrieved history
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User doesn't have access to requested data

---

### 4. Get Reorder Recommendations

**Endpoint:** `GET /api/inventory/reorder-recommendations`

**Description:** Get AI-powered reorder recommendations with financial impact.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| agency | string | No | Filter by agency ID |
| site | string | No | Filter by site ID |
| urgency | string | No | Filter by urgency: "critical", "high", "medium", "low" |
| minImpact | number | No | Minimum financial impact threshold |

**Response:**

```json
{
  "recommendations": [
    {
      "id": "rec_001",
      "product": {
        "id": "prod_123",
        "name": "Widget Pro",
        "sku": "WID-PRO-001",
        "currentStock": 25,
        "reorderPoint": 50
      },
      "recommendation": {
        "quantity": 150,
        "urgency": "critical",
        "daysUntilStockout": 3,
        "estimatedRevenueLoss": 5200,
        "confidence": 0.94
      },
      "supplier": {
        "id": "sup_456",
        "name": "Acme Widgets Inc",
        "leadTimeDays": 5,
        "unitCost": 24.99,
        "reliability": 0.95
      },
      "forecast": {
        "next7Days": 95,
        "next14Days": 175,
        "next30Days": 320,
        "trend": "increasing"
      },
      "reasoning": "Sales velocity increased 35% in last 7 days. Seasonal demand pattern detected. Current stock will be depleted in 3 days.",
      "aiConfidence": 0.94
    }
  ],
  "totalEstimatedImpact": 15800,
  "totalItems": 8
}
```

---

### 5. Dismiss Alert

**Endpoint:** `POST /api/inventory/alerts/:id/dismiss`

**Description:** Dismiss an alert with optional reason.

**Request Body:**

```json
{
  "reason": "Already handled manually",
  "notes": "Created PO outside the system"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Alert dismissed successfully"
}
```

---

### 6. Accept Opportunity

**Endpoint:** `POST /api/inventory/opportunities/:id/accept`

**Description:** Accept a revenue opportunity and track it.

**Request Body:**

```json
{
  "notes": "Approved by manager"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Opportunity accepted",
  "nextSteps": [
    {
      "action": "Create purchase orders for 5 products",
      "url": "/purchase-orders/bulk-create"
    }
  ]
}
```

---

### 7. Real-Time Stream

**Endpoint:** `GET /api/inventory/command-center-stream`

**Description:** Server-Sent Events stream for real-time updates.

**Event Types:**

#### `health-score-update`
```json
{
  "type": "health-score-update",
  "data": {
    "current": 86,
    "change": 1,
    "timestamp": "2025-10-17T10:35:00Z"
  }
}
```

#### `new-alert`
```json
{
  "type": "new-alert",
  "data": {
    "id": "alert_004",
    "severity": "high",
    "title": "Low stock alert",
    "message": "Product Y is running low"
  }
}
```

#### `opportunity-detected`
```json
{
  "type": "opportunity-detected",
  "data": {
    "id": "opp_003",
    "type": "StockoutPrevention",
    "estimatedRevenue": 4500,
    "title": "Restock opportunity detected"
  }
}
```

#### `alert-resolved`
```json
{
  "type": "alert-resolved",
  "data": {
    "id": "alert_001",
    "resolvedBy": "user_123",
    "resolvedAt": "2025-10-17T10:40:00Z"
  }
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "The 'agency' parameter must be a valid agency ID",
    "details": {
      "parameter": "agency",
      "value": "invalid_id"
    }
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication |
| `FORBIDDEN` | Insufficient permissions |
| `INVALID_PARAMETER` | Invalid query or body parameter |
| `NOT_FOUND` | Requested resource not found |
| `CONFLICT` | Action conflicts with current state |
| `AI_SERVICE_ERROR` | AI service unavailable |
| `DATABASE_ERROR` | Database operation failed |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Rate Limiting

- Standard endpoints: 100 requests per minute per user
- Stream endpoint: 1 connection per user
- Burst allowance: 20 requests

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1697539200
```

---

## Caching

- Command center data: Cached for 60 seconds
- Health score history: Cached for 5 minutes
- Recommendations: Cached for 2 minutes
- Use `Cache-Control: no-cache` header to bypass cache

---

## Versioning

API version is included in Accept header:
```
Accept: application/vnd.triven.v1+json
```

Current version: `v1`

---

**Document Version**: 1.0  
**Last Updated**: October 17, 2025
