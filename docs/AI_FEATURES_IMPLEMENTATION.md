# AI Features Implementation Guide for Triven

## Overview

This document outlines the implementation of 3 game-changing AI features for Triven using Ollama as the local AI engine. These features will transform Triven from a reactive inventory management system into a proactive, intelligent business optimization platform.

## Current AI Infrastructure

Triven already has:
- ✅ Ollama integration (`ollama: ^0.5.16`)
- ✅ AI Assistant with tool calling (`/app/routes/assistant/`)
- ✅ Existing inventory tools and analytics
- ✅ Real-time dashboard and notification system
- ✅ Comprehensive database schema with historical data

## Feature 1: Intelligent Demand Forecasting & Auto-Reordering System

### 🎯 Objective
AI analyzes historical data to predict future demand and automatically generate purchase orders when needed.

### 📊 Implementation Plan

#### Phase 1: Data Collection & Analysis Service

```typescript
// app/services/ai-forecasting.server.ts
import { Ollama } from 'ollama';
import { prisma } from '~/app/db.server';

export class DemandForecastingService {
  private ollama: Ollama;
  
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
  }

  async generateDemandForecast(productId: string, forecastDays: number = 30) {
    // Collect historical sales data
    const historicalData = await this.getHistoricalSalesData(productId);
    
    // Prepare data for AI analysis
    const prompt = this.buildForecastingPrompt(historicalData, forecastDays);
    
    // Get AI prediction
    const forecast = await this.ollama.chat({
      model: 'llama3.1:8b', // or mistral:7b
      messages: [{
        role: 'user',
        content: prompt
      }],
      format: 'json'
    });
    
    return this.parseForecastResponse(forecast.message.content);
  }
}
```

#### Phase 2: Database Schema Extensions

```sql
-- Add to prisma/schema.prisma

model DemandForecast {
  id                String    @id @default(cuid())
  productId         String
  forecastDate      DateTime
  predictedDemand   Int
  confidenceLevel   Float     // 0-1 confidence score
  factors           Json      // seasonality, trends, external factors
  actualDemand      Int?      // filled after the date passes
  accuracy          Float?    // calculated after actual vs predicted
  createdAt         DateTime  @default(now())
  updatedAt         DateTime? @updatedAt
  
  product           Product   @relation(fields: [productId], references: [id])
  
  @@index([productId, forecastDate])
}

model AutoReorderRule {
  id                String    @id @default(cuid())
  productId         String
  isActive          Boolean   @default(true)
  minStockLevel     Int       // AI-calculated dynamic reorder point
  maxStockLevel     Int       // AI-calculated max stock
  supplierLeadTime  Int       // days
  safetyStockDays   Int       // AI-calculated safety stock
  lastUpdated       DateTime  @updatedAt
  createdAt         DateTime  @default(now())
  
  product           Product   @relation(fields: [productId], references: [id])
  
  @@unique([productId])
}

model PurchaseOrderRecommendation {
  id                String              @id @default(cuid())
  productId         String
  supplierId        String
  recommendedQty    Int
  urgencyLevel      RecommendationUrgency
  reasoning         String              // AI explanation
  estimatedCost     Float
  isAccepted        Boolean             @default(false)
  isProcessed       Boolean             @default(false)
  createdAt         DateTime            @default(now())
  expiresAt         DateTime
  
  product           Product             @relation(fields: [productId], references: [id])
  supplier          Supplier            @relation(fields: [supplierId], references: [id])
}

enum RecommendationUrgency {
  Low
  Medium
  High
  Critical
}
```

#### Phase 3: AI Assistant Tools Extension

```typescript
// Add to app/routes/assistant/tools.ts

export const forecastingTools = [
  {
    type: 'function',
    function: {
      name: 'generate_demand_forecast',
      description: 'Generate AI-powered demand forecast for a product',
      parameters: {
        type: 'object',
        properties: {
          product_name: {
            type: 'string',
            description: 'Name of the product to forecast'
          },
          forecast_days: {
            type: 'number',
            description: 'Number of days to forecast (default: 30)'
          }
        },
        required: ['product_name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_reorder_recommendations',
      description: 'Get AI-generated purchase order recommendations',
      parameters: {
        type: 'object',
        properties: {
          urgency_filter: {
            type: 'string',
            enum: ['Low', 'Medium', 'High', 'Critical'],
            description: 'Filter by urgency level'
          }
        }
      }
    }
  }
];
```

#### Phase 4: Dashboard Integration

```tsx
// app/pages/Dashboard/ForecastingWidget/ForecastingWidget.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function ForecastingWidget({ forecasts }: { forecasts: DemandForecast[] }) {
  return (
    <Paper p="md">
      <Title order={3}>Demand Forecasting</Title>
      <LineChart width={600} height={300} data={forecasts}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="predicted" stroke="#8884d8" name="Predicted Demand" />
        <Line type="monotone" dataKey="actual" stroke="#82ca9d" name="Actual Demand" />
      </LineChart>
    </Paper>
  );
}
```

### 🚀 Expected Impact
- **40-60% reduction in stockouts**
- **30-50% reduction in overstock**
- **15-20 hours saved per week** on manual planning
- **Improved cash flow** through optimized inventory investment

---

## Feature 2: Smart Anomaly Detection & Predictive Maintenance

### 🎯 Objective
Real-time monitoring and AI-powered detection of unusual patterns in inventory operations.

### 📊 Implementation Plan

#### Phase 1: Anomaly Detection Service

```typescript
// app/services/ai-anomaly-detection.server.ts
import { Ollama } from 'ollama';

export class AnomalyDetectionService {
  private ollama: Ollama;
  
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
  }

  async detectInventoryAnomalies() {
    // Analyze recent stock movements
    const recentMovements = await this.getRecentStockMovements();
    const salesPatterns = await this.getRecentSalesPatterns();
    const supplierPerformance = await this.getSupplierPerformance();
    
    const prompt = `
    Analyze the following inventory data for anomalies:
    
    Stock Movements: ${JSON.stringify(recentMovements)}
    Sales Patterns: ${JSON.stringify(salesPatterns)}
    Supplier Performance: ${JSON.stringify(supplierPerformance)}
    
    Identify any unusual patterns, potential issues, or opportunities.
    Return a JSON response with:
    {
      "anomalies": [
        {
          "type": "stock_discrepancy|demand_spike|supplier_delay|quality_issue",
          "severity": "low|medium|high|critical",
          "description": "Human readable description",
          "affectedProducts": ["product1", "product2"],
          "recommendedActions": ["action1", "action2"],
          "confidence": 0.85
        }
      ]
    }
    `;
    
    const response = await this.ollama.chat({
      model: 'llama3.1:8b',
      messages: [{ role: 'user', content: prompt }],
      format: 'json'
    });
    
    return JSON.parse(response.message.content);
  }
}
```

#### Phase 2: Real-time Monitoring Background Job

```typescript
// app/services/background-monitoring.server.ts
import { AnomalyDetectionService } from './ai-anomaly-detection.server';
import { createAndEmitNotification } from './notificationHelper.server';

export async function runAnomalyDetection() {
  const detector = new AnomalyDetectionService();
  
  try {
    const anomalies = await detector.detectInventoryAnomalies();
    
    for (const anomaly of anomalies.anomalies) {
      if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
        // Create smart notification
        await createAndEmitNotification({
          message: `🤖 AI Alert: ${anomaly.description}`,
          status: anomaly.severity === 'critical' ? 'Critical' : 'Available',
          companyId: 'user-company-id',
          productId: anomaly.affectedProducts[0],
          createdById: 'ai-system',
          metadata: {
            type: 'ai_anomaly',
            severity: anomaly.severity,
            recommendedActions: anomaly.recommendedActions,
            confidence: anomaly.confidence
          }
        });
      }
    }
  } catch (error) {
    console.error('Anomaly detection failed:', error);
  }
}

// Schedule to run every 15 minutes
setInterval(runAnomalyDetection, 15 * 60 * 1000);
```

#### Phase 3: Enhanced Notification System

```typescript
// Extend app/services/notificationHelper.server.ts

export async function createAIAnomalyNotification(anomaly: any, companyId: string) {
  const notification = await prisma.notification.create({
    data: {
      message: `🤖 AI detected ${anomaly.type}: ${anomaly.description}`,
      status: mapSeverityToNotificationStatus(anomaly.severity),
      companyId,
      productId: anomaly.affectedProducts[0],
      createdById: 'ai-system-user-id',
      metadata: {
        type: 'ai_anomaly',
        severity: anomaly.severity,
        confidence: anomaly.confidence,
        recommendedActions: anomaly.recommendedActions,
        timestamp: new Date().toISOString()
      }
    }
  });

  // Emit real-time notification
  await emitNotification(notification);
  
  return notification;
}
```

#### Phase 4: AI Assistant Integration

```typescript
// Add to app/routes/assistant/tools.ts

export const anomalyDetectionTools = [
  {
    type: 'function',
    function: {
      name: 'run_anomaly_scan',
      description: 'Run AI-powered anomaly detection on current inventory data',
      parameters: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['inventory', 'sales', 'suppliers', 'all'],
            description: 'Scope of anomaly detection'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'explain_anomaly',
      description: 'Get detailed explanation of a detected anomaly',
      parameters: {
        type: 'object',
        properties: {
          anomaly_id: {
            type: 'string',
            description: 'ID of the anomaly to explain'
          }
        },
        required: ['anomaly_id']
      }
    }
  }
];
```

### 🚀 Expected Impact
- **20-30% reduction in inventory shrinkage**
- **Early detection** of quality issues and supplier problems
- **Improved supplier relationships** through predictive insights
- **Reduced revenue loss** from preventable stockouts

---

## Feature 3: AI-Powered Business Intelligence Assistant

### 🎯 Objective
Natural language interface for business data with AI-generated insights and recommendations.

### 📊 Implementation Plan

#### Phase 1: Enhanced AI Assistant with Business Context

```typescript
// app/services/ai-business-intelligence.server.ts
import { Ollama } from 'ollama';

export class BusinessIntelligenceService {
  private ollama: Ollama;
  
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
  }

  async generateBusinessInsights(context: any) {
    const prompt = `
    You are a business intelligence expert analyzing inventory management data.
    
    Current Business Context:
    - Total Products: ${context.totalProducts}
    - Inventory Value: $${context.inventoryValue}
    - Low Stock Items: ${context.lowStockItems}
    - Out of Stock: ${context.outOfStockItems}
    - Recent Sales Trend: ${context.salesTrend}
    - Top Selling Products: ${JSON.stringify(context.topProducts)}
    - Underperforming Products: ${JSON.stringify(context.underperformingProducts)}
    
    Provide actionable business insights including:
    1. Key performance indicators analysis
    2. Opportunities for improvement
    3. Risk areas that need attention
    4. Specific actionable recommendations
    5. Predicted outcomes if recommendations are followed
    
    Format as markdown with clear sections and bullet points.
    `;
    
    const response = await this.ollama.chat({
      model: 'llama3.1:8b',
      messages: [{ role: 'user', content: prompt }]
    });
    
    return response.message.content;
  }

  async processNaturalLanguageQuery(query: string, businessData: any) {
    const prompt = `
    You are an AI business analyst. Answer the following question using the provided business data.
    
    Question: "${query}"
    
    Available Data:
    ${JSON.stringify(businessData, null, 2)}
    
    Provide a clear, actionable answer with specific numbers and recommendations where appropriate.
    If you need more data to answer accurately, specify what additional information would be helpful.
    `;
    
    const response = await this.ollama.chat({
      model: 'llama3.1:8b',
      messages: [{ role: 'user', content: prompt }]
    });
    
    return response.message.content;
  }
}
```

#### Phase 2: Advanced Assistant Tools

```typescript
// Add to app/routes/assistant/tools.ts

export const businessIntelligenceTools = [
  {
    type: 'function',
    function: {
      name: 'generate_business_insights',
      description: 'Generate AI-powered business insights and recommendations',
      parameters: {
        type: 'object',
        properties: {
          focus_area: {
            type: 'string',
            enum: ['inventory', 'sales', 'profitability', 'efficiency', 'growth'],
            description: 'Area to focus insights on'
          },
          time_period: {
            type: 'string',
            description: 'Time period for analysis (e.g., "last 30 days", "this quarter")'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analyze_product_performance',
      description: 'Analyze individual product or category performance with AI insights',
      parameters: {
        type: 'object',
        properties: {
          product_name: {
            type: 'string',
            description: 'Product name to analyze'
          },
          analysis_type: {
            type: 'string',
            enum: ['sales_performance', 'profitability', 'inventory_turnover', 'comprehensive'],
            description: 'Type of analysis to perform'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_optimization_recommendations',
      description: 'Get AI-powered optimization recommendations for inventory management',
      parameters: {
        type: 'object',
        properties: {
          optimization_goal: {
            type: 'string',
            enum: ['reduce_costs', 'increase_sales', 'improve_efficiency', 'reduce_waste'],
            description: 'Primary optimization goal'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'explain_kpi_trends',
      description: 'Explain trends in key performance indicators with AI analysis',
      parameters: {
        type: 'object',
        properties: {
          kpi_name: {
            type: 'string',
            description: 'Name of the KPI to analyze (e.g., "inventory turnover", "gross margin")'
          },
          time_range: {
            type: 'string',
            description: 'Time range for trend analysis'
          }
        }
      }
    }
  }
];
```

#### Phase 3: Conversational Analytics UI

```tsx
// app/components/ConversationalAnalytics/ConversationalAnalytics.tsx
import { useState } from 'react';
import { ActionIcon, Paper, Stack, Text, Textarea } from '@mantine/core';
import { IconSend, IconSparkles } from '@tabler/icons-react';

export function ConversationalAnalytics({ businessData }: { businessData: any }) {
  const [query, setQuery] = useState('');
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const suggestedQueries = [
    "What are my best performing products this month?",
    "Which products should I reorder urgently?",
    "How can I improve my inventory turnover?",
    "What's causing my low stock alerts?",
    "Show me profit margins by category",
    "Identify slow-moving inventory",
    "What are the seasonal trends in my business?"
  ];

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/business-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, businessData })
      });
      
      const result = await response.json();
      setInsights(prev => [...prev, `Q: ${query}`, `A: ${result.answer}`]);
      setQuery('');
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper p="md">
      <Stack>
        <Text size="lg" fw={600}>💡 Ask Your Business Data Anything</Text>
        
        {/* Suggested queries */}
        <Text size="sm" c="dimmed">Try asking:</Text>
        <Stack gap="xs">
          {suggestedQueries.map((suggestion, index) => (
            <Text
              key={index}
              size="sm"
              c="blue"
              style={{ cursor: 'pointer' }}
              onClick={() => setQuery(suggestion)}
            >
              • {suggestion}
            </Text>
          ))}
        </Stack>
        
        {/* Query input */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Textarea
            placeholder="Ask about your inventory, sales, trends, or anything business-related..."
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
            autosize
            minRows={2}
          />
          <ActionIcon
            size="lg"
            variant="filled"
            onClick={handleQuery}
            loading={loading}
            disabled={!query.trim()}
          >
            <IconSend size={16} />
          </ActionIcon>
        </div>
        
        {/* Insights display */}
        {insights.length > 0 && (
          <Stack>
            {insights.map((insight, index) => (
              <Paper key={index} p="sm" bg={insight.startsWith('Q:') ? 'blue.0' : 'gray.0'}>
                <Text size="sm">{insight}</Text>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
```

#### Phase 4: Automated Insights Generation

```typescript
// app/services/automated-insights.server.ts
export class AutomatedInsightsService {
  private ollama: Ollama;
  
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
  }

  async generateDailyInsights(companyId: string) {
    const businessData = await this.getBusinessDataSummary(companyId);
    
    const insights = await this.ollama.chat({
      model: 'llama3.1:8b',
      messages: [{
        role: 'user',
        content: `Generate 3 key business insights for today based on this data: ${JSON.stringify(businessData)}`
      }]
    });
    
    // Store insights in database
    await prisma.businessInsight.create({
      data: {
        companyId,
        content: insights.message.content,
        type: 'daily_summary',
        date: new Date(),
        metadata: businessData
      }
    });
    
    return insights.message.content;
  }
}

// Schedule daily insights generation
// Add to your cron jobs or background workers
```

### 🚀 Expected Impact
- **Democratized data access** for non-technical users
- **Seconds instead of hours** to get business insights
- **Proactive decision-making** with AI recommendations
- **Increased platform adoption** and user engagement

---

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Set up enhanced database schema
- [ ] Create base AI service classes
- [ ] Extend existing assistant tools

### Week 3-4: Demand Forecasting
- [ ] Implement forecasting algorithms
- [ ] Create dashboard widgets
- [ ] Add auto-reorder recommendations

### Week 5-6: Anomaly Detection
- [ ] Build anomaly detection service
- [ ] Set up background monitoring
- [ ] Enhance notification system

### Week 7-8: Business Intelligence
- [ ] Create conversational analytics UI
- [ ] Implement natural language query processing
- [ ] Add automated insights generation

### Week 9-10: Testing & Optimization
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] AI model fine-tuning

## Technical Requirements

### Ollama Models Recommended
- **Primary**: `llama3.1:8b` (good balance of capability and speed)
- **Alternative**: `mistral:7b` (faster, good for real-time features)
- **Advanced**: `llama3.1:70b` (for complex analysis, if resources allow)

### System Requirements
```bash
# Install and start Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve

# Pull recommended models
ollama pull llama3.1:8b
ollama pull mistral:7b
```

### Environment Variables
```env
# Add to .env
OLLAMA_HOST=http://localhost:11434
AI_FEATURES_ENABLED=true
ANOMALY_DETECTION_INTERVAL=900000  # 15 minutes
DAILY_INSIGHTS_TIME=08:00  # 8 AM
```

## Monitoring & Analytics

### AI Performance Metrics
- Forecast accuracy percentage
- Anomaly detection precision/recall
- User query satisfaction rates
- Response time metrics
- Model performance benchmarks

### Business Impact Metrics
- Reduction in stockouts
- Inventory turnover improvement
- Cost savings from optimizations
- User engagement with AI features
- Time saved on manual tasks

## Security & Privacy

### Data Protection
- All AI processing happens locally with Ollama
- No sensitive business data sent to external APIs
- Audit logs for all AI-generated recommendations
- User consent for AI-driven automated actions

### Access Control
- Role-based access to AI features
- Approval workflows for high-impact recommendations
- Audit trail for AI decisions

## Future Enhancements

### Phase 2 Features
- Multi-language support for global operations
- Integration with external market data
- Predictive maintenance for equipment
- Advanced supplier relationship optimization
- Customer behavior prediction

### Advanced AI Capabilities
- Computer vision for inventory counting
- Voice interface for warehouse operations
- Automated report generation
- Competitive pricing intelligence
- Supply chain risk assessment

---

## Getting Started

1. **Prerequisites**: Ensure Ollama is installed and running
2. **Database Migration**: Apply the new schema changes
3. **Service Implementation**: Start with the base AI service classes
4. **Gradual Rollout**: Implement features one by one
5. **User Training**: Provide documentation and training for new AI features

## Support & Documentation

- **Technical Documentation**: `/docs/ai-features/`
- **User Guides**: `/docs/user-guides/ai-assistant/`
- **API Documentation**: `/docs/api/ai-endpoints/`
- **Troubleshooting**: `/docs/troubleshooting/ai-issues/`

---

*This implementation guide provides a roadmap for transforming Triven into an AI-powered intelligent business platform using Ollama's local AI capabilities.*
