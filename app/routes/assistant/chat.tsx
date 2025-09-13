import { generateText } from "ai";
import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { prisma } from "~/app/db.server";
import { ollama } from "~/app/lib/ai-sdk-ollama";
import { detectInventoryAnomalies, getRecentAnomalies } from "~/app/services/ai-anomaly-detection.server";
import { BusinessIntelligenceService } from "~/app/services/ai-business-intelligence.server";
import { DemandForecastingService } from "~/app/services/ai-forecasting.server";
import { getBetterAuthUser } from "~/app/services/better-auth.server";


const debugTimer = (label: string) => {
    const start = Date.now();
    return {
        end: () => {
            const duration = Date.now() - start;
            return duration;
        }
    };
};


// Time parsing utility for natural language time expressions
function parseTimeExpression(timeStr?: string): { startDate: Date; endDate: Date; description: string } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!timeStr) {
        // Default to last 30 days
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
            startDate: thirtyDaysAgo,
            endDate: now,
            description: 'last 30 days'
        };
    }

    const lowerTimeStr = timeStr.toLowerCase().trim();

    // Parse various time expressions
    if (lowerTimeStr.includes('today')) {
        return {
            startDate: today,
            endDate: now,
            description: 'today'
        };
    }

    if (lowerTimeStr.includes('yesterday')) {
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayEnd = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000);
        return {
            startDate: yesterday,
            endDate: yesterdayEnd,
            description: 'yesterday'
        };
    }

    if (lowerTimeStr.includes('last week') || lowerTimeStr.includes('past week')) {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
            startDate: lastWeek,
            endDate: now,
            description: 'last week (7 days)'
        };
    }

    if (lowerTimeStr.includes('last month') || lowerTimeStr.includes('past month')) {
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
            startDate: lastMonth,
            endDate: now,
            description: 'last month (30 days)'
        };
    }

    if (lowerTimeStr.includes('last quarter') || lowerTimeStr.includes('past quarter')) {
        const lastQuarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return {
            startDate: lastQuarter,
            endDate: now,
            description: 'last quarter (90 days)'
        };
    }

    if (lowerTimeStr.includes('last year') || lowerTimeStr.includes('past year')) {
        const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return {
            startDate: lastYear,
            endDate: now,
            description: 'last year (365 days)'
        };
    }

    // Parse number + time unit (e.g., "7 days", "3 weeks", "2 months")
    const numberMatch = lowerTimeStr.match(/(\d+)\s*(day|week|month|year)s?/);
    if (numberMatch) {
        const [, numStr, unit] = numberMatch;
        const num = parseInt(numStr, 10);
        let multiplier = 1;

        switch (unit) {
            case 'day': multiplier = 1; break;
            case 'week': multiplier = 7; break;
            case 'month': multiplier = 30; break;
            case 'year': multiplier = 365; break;
        }

        const startDate = new Date(now.getTime() - num * multiplier * 24 * 60 * 60 * 1000);
        return {
            startDate,
            endDate: now,
            description: `last ${num} ${unit}${num > 1 ? 's' : ''}`
        };
    }

    // Default fallback
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
        startDate: thirtyDaysAgo,
        endDate: now,
        description: 'last 30 days (default)'
    };
}



// Function to execute tools
async function executeToolFunction(name: string, args: any, companyId: string) {
    const toolTimer = debugTimer(`Tool Execution: ${name}`);

    const forecastingService = new DemandForecastingService();
    const biService = new BusinessIntelligenceService();

    try {
        switch (name) {
            case 'get_products':
                const limit = parseInt(args.limit) || 1000; // Default to 1000 to show all products by default
                const language = args.language || 'en';
                const timeRange = parseTimeExpression(args.time_period);

                const [totalCount, products] = await Promise.all([
                    prisma.product.count({ where: { companyId } }),
                    prisma.product.findMany({
                        where: { companyId },
                        take: limit,
                        include: {
                            category: true
                        },
                        orderBy: {
                            name: 'asc'
                        }
                    })
                ]);

                toolTimer.end();
                return {
                    products: products.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        sku: p.sku,
                        category: p.category?.name || (language === 'fr' ? 'Aucune catégorie' : 'No category'),
                        stock: p.availableQuantity,
                        price: `$${Number(p.sellingPrice).toFixed(2)}`
                    })),
                    total: products.length,
                    totalInDatabase: totalCount,
                    showingAll: products.length === totalCount,
                    language: language,
                    timeDescription: timeRange.description
                };

            case 'search_products':
                const query = args.query?.toLowerCase() || '';
                const searchTimeRange = parseTimeExpression(args.time_period);

                const searchResults = await prisma.product.findMany({
                    where: {
                        companyId,
                        OR: [
                            {
                                name: {
                                    contains: query,
                                    mode: 'insensitive'
                                }
                            },
                            {
                                sku: {
                                    contains: query,
                                    mode: 'insensitive'
                                }
                            }
                        ]
                    },
                    include: {
                        category: true
                    },
                    take: 20,
                    orderBy: {
                        name: 'asc'
                    }
                });

                toolTimer.end();
                return {
                    query: args.query,
                    products: searchResults.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        sku: p.sku,
                        category: p.category?.name || 'No category',
                        stock: p.availableQuantity,
                        price: `$${Number(p.sellingPrice).toFixed(2)}`
                    })),
                    found: searchResults.length,
                    timeDescription: searchTimeRange.description
                };

            case 'generate_demand_forecast':
                const forecastTimeRange = parseTimeExpression(args.time_period);
                let productIdForForecast = args.product_id;

                if (!productIdForForecast && args.product_name) {
                    const product = await prisma.product.findFirst({
                        where: {
                            companyId,
                            name: {
                                contains: args.product_name,
                                mode: 'insensitive'
                            }
                        }
                    });
                    productIdForForecast = product?.id;
                }

                if (!productIdForForecast) {
                    toolTimer.end();
                    return { error: 'Product not found. Please provide a valid product name or ID.' };
                }

                try {
                    const forecast = await forecastingService.generateDemandForecast(
                        productIdForForecast,
                        args.forecast_days || 30
                    );
                    toolTimer.end();
                    return forecast;
                } catch (error) {
                    toolTimer.end();
                    return { error: `Failed to generate forecast: ${error instanceof Error ? error.message : 'Unknown error'}` };
                }

            case 'get_reorder_recommendations':
                const reorderTimeRange = parseTimeExpression(args.time_period);
                try {
                    const recommendations = await forecastingService.generateAutoReorderRecommendations(companyId);
                    const filteredRecs = args.urgency_filter ?
                        recommendations.filter(r => r.urgencyLevel === args.urgency_filter) :
                        recommendations;

                    toolTimer.end();
                    return {
                        recommendations: filteredRecs.map(r => ({
                            productId: r.productId,
                            supplierId: r.supplierId,
                            recommendedQty: r.recommendedQty,
                            urgency: r.urgencyLevel,
                            reasoning: r.reasoning,
                            estimatedCost: r.estimatedCost
                        })),
                        total: filteredRecs.length,
                        timeDescription: reorderTimeRange.description
                    };
                } catch (error) {
                    toolTimer.end();
                    return { error: `Failed to get recommendations: ${error instanceof Error ? error.message : 'Unknown error'}` };
                }

            case 'run_anomaly_scan':
                const anomalyTimeRange = parseTimeExpression(args.time_period);
                try {
                    const anomalies = await detectInventoryAnomalies(companyId);
                    toolTimer.end();
                    return {
                        anomalies: anomalies.map((a: any) => ({
                            id: a.id,
                            type: a.type,
                            severity: a.severity,
                            description: a.description,
                            affectedProducts: a.affectedProducts,
                            confidence: a.confidence,
                            recommendedActions: a.recommendedActions
                        })),
                        total: anomalies.length,
                        scanScope: args.scope || 'all',
                        timeDescription: anomalyTimeRange.description
                    };
                } catch (error) {
                    toolTimer.end();
                    return { error: `Failed to run anomaly scan: ${error instanceof Error ? error.message : 'Unknown error'}` };
                }

            case 'get_recent_anomalies':
                const recentAnomaliesTimeRange = parseTimeExpression(args.time_period);
                try {
                    const anomalies = await getRecentAnomalies(companyId, args.limit || 10);
                    toolTimer.end();
                    return {
                        anomalies: anomalies.map((a: any) => ({
                            id: a.id,
                            type: a.type,
                            severity: a.severity,
                            description: a.description,
                            isResolved: a.isResolved,
                            createdAt: a.createdAt
                        })),
                        total: anomalies.length,
                        timeDescription: recentAnomaliesTimeRange.description
                    };
                } catch (error) {
                    toolTimer.end();
                    return { error: `Failed to get anomalies: ${error instanceof Error ? error.message : 'Unknown error'}` };
                }

            case 'generate_business_insights':
                const insightsTimeRange = parseTimeExpression(args.time_period);
                try {
                    const insights = await biService.generateBusinessInsights(companyId, args.focus_area, insightsTimeRange);
                    toolTimer.end();
                    return {
                        insights: insights.content,
                        focusArea: args.focus_area || 'general',
                        dataContext: insights.context,
                        timeDescription: insightsTimeRange.description
                    };
                } catch (error) {
                    toolTimer.end();
                    return { error: `Failed to generate insights: ${error instanceof Error ? error.message : 'Unknown error'}` };
                }

            case 'analyze_product_performance':
                const analysisTimeRange = parseTimeExpression(args.time_period);
                let productIdForAnalysis = args.product_id;

                if (!productIdForAnalysis && args.product_name) {
                    const product = await prisma.product.findFirst({
                        where: {
                            companyId,
                            name: {
                                contains: args.product_name,
                                mode: 'insensitive'
                            }
                        }
                    });
                    productIdForAnalysis = product?.id;
                }

                if (!productIdForAnalysis) {
                    // If no specific product is provided, get top products to suggest
                    const recentProducts = await prisma.product.findMany({
                        where: { companyId, active: true },
                        include: {
                            salesOrderItems: {
                                where: {
                                    salesOrder: {
                                        orderDate: {
                                            gte: analysisTimeRange.startDate,
                                            lte: analysisTimeRange.endDate
                                        }
                                    }
                                },
                                select: { quantity: true, amount: true }
                            }
                        },
                        take: 5,
                        orderBy: { updatedAt: 'desc' }
                    });

                    // Calculate sales data for each product to suggest top performers
                    const productsWithSales = recentProducts.map(product => ({
                        id: product.id,
                        name: product.name,
                        sku: product.sku,
                        totalSales: product.salesOrderItems.reduce((sum, item) => sum + item.quantity, 0),
                        totalRevenue: product.salesOrderItems.reduce((sum, item) => sum + item.amount, 0)
                    })).sort((a, b) => b.totalSales - a.totalSales);

                    toolTimer.end();
                    return {
                        error: 'Please specify which product you\'d like me to analyze. Here are some suggestions:',
                        suggestions: productsWithSales.slice(0, 3).map(p => ({
                            name: p.name,
                            sku: p.sku,
                            recentSales: p.totalSales,
                            revenue: p.totalRevenue
                        })),
                        message: 'Try asking: "Analyze product performance for [product name]" or specify a product ID.'
                    };
                }

                try {
                    const analysis = await biService.analyzeProductPerformance(
                        productIdForAnalysis,
                        args.analysis_type || 'comprehensive',
                        analysisTimeRange
                    );
                    toolTimer.end();
                    return analysis;
                } catch (error) {
                    toolTimer.end();
                    return { error: `Failed to analyze product: ${error instanceof Error ? error.message : 'Unknown error'}` };
                }

            case 'analyze_overall_product_performance':
                const overallAnalysisTimeRange = parseTimeExpression(args.time_period);
                try {
                    const analysis = await biService.analyzeOverallProductPerformance(
                        companyId,
                        overallAnalysisTimeRange
                    );
                    toolTimer.end();
                    return analysis;
                } catch (error) {
                    toolTimer.end();
                    return { error: `Failed to analyze overall product performance: ${error instanceof Error ? error.message : 'Unknown error'}` };
                }

            case 'get_optimization_recommendations':
                const optimizationTimeRange = parseTimeExpression(args.time_period);
                try {
                    const recommendations = await biService.getOptimizationRecommendations(
                        companyId,
                        args.optimization_goal || 'improve_efficiency',
                        optimizationTimeRange
                    );
                    toolTimer.end();
                    return {
                        goal: args.optimization_goal || 'improve_efficiency',
                        recommendations,
                        timeDescription: optimizationTimeRange.description
                    };
                } catch (error) {
                    toolTimer.end();
                    return { error: `Failed to get optimization recommendations: ${error instanceof Error ? error.message : 'Unknown error'}` };
                }

            case 'explain_kpi_trends':
                const kpiTimeRange = parseTimeExpression(args.time_period);
                try {
                    const analysis = await biService.explainKPITrends(
                        companyId,
                        args.kpi_name,
                        kpiTimeRange
                    );
                    toolTimer.end();
                    return analysis;
                } catch (error) {
                    toolTimer.end();
                    return { error: `Failed to explain KPI trends: ${error instanceof Error ? error.message : 'Unknown error'}` };
                }

            case 'natural_language_query':
                const queryTimeRange = parseTimeExpression(args.time_period);
                try {
                    const response = await biService.processNaturalLanguageQuery(args.query, companyId, queryTimeRange);
                    toolTimer.end();
                    return {
                        query: args.query,
                        answer: response,
                        timeDescription: queryTimeRange.description
                    };
                } catch (error) {
                    toolTimer.end();
                    return { error: `Failed to process query: ${error instanceof Error ? error.message : 'Unknown error'}` };
                }

            case 'show_low_stock_items':
                const lowStockTimeRange = parseTimeExpression(args.time_period);
                try {
                    const response = await biService.getLowStockItemsOnly(companyId, lowStockTimeRange);
                    toolTimer.end();
                    return JSON.parse(response);
                } catch (error) {
                    toolTimer.end();
                    return { error: `Failed to get low stock items: ${error instanceof Error ? error.message : 'Unknown error'}` };
                }

            default:
                toolTimer.end();
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        toolTimer.end();
        throw error;
    }
}

// Check if message needs tools and which tools to provide
function shouldUseTools(message: string): boolean {
    const lowerMessage = message.toLowerCase();

    // Keywords for listing products (get_products)
    const listKeywords = [
        'list', 'show me all', 'display all', 'get all', 'all products', 'all items',
        'inventory list', 'product list', 'everything', 'voir tout', 'liste',
        'tous les produits', 'tous les articles', 'inventaire complet', 'catalog',
        'catalogue', 'browse', 'overview', 'what do we have'
    ];

    // Keywords for searching specific products (search_products)
    const searchKeywords = [
        'find', 'search', 'look for', 'details', 'info', 'information',
        'tell me about', 'what is', 'describe', 'spec', 'specifications',
        'price of', 'cost of', 'available', 'stock of', 'how much',
        'cherche', 'trouve', 'détails', 'informations', 'prix de',
        'parle moi de', 'qu\'est-ce que', 'décris', 'disponible',
        'show me', 'lookup', 'query', 'where is', 'locate'
    ];

    // AI Forecasting keywords
    const forecastKeywords = [
        'forecast', 'predict', 'prediction', 'demand', 'future sales',
        'how much will sell', 'sales forecast', 'demand forecast',
        'reorder', 'when to order', 'auto order', 'recommendations',
        'suggest order', 'purchase recommendations', 'reorder point',
        'order recommendations', 'what to buy', 'purchase suggestions',
        'inventory planning'
    ];

    // AI Anomaly detection keywords
    const anomalyKeywords = [
        'anomaly', 'anomalies', 'unusual', 'strange', 'weird', 'unexpected',
        'patterns', 'detect', 'scan', 'check issues', 'problems',
        'irregular', 'outliers', 'suspicious', 'alert', 'warning',
        'discrepancy', 'discrepancies', 'investigation', 'audit',
        'check for problems', 'find issues', 'errors', 'inconsistencies'
    ];

    // Business Intelligence keywords
    const biKeywords = [
        'insights', 'analysis', 'analyze', 'performance', 'trends',
        'kpi', 'metrics', 'business intelligence', 'dashboard',
        'optimization', 'optimize', 'improve', 'revenue', 'profit',
        'margin', 'turnover', 'coverage', 'explain', 'report',
        'summary', 'statistics', 'stats', 'how is business',
        'performing', 'growth', 'decline', 'improvement opportunities',
        'low stock', 'out of stock', 'stock level', 'show low stock',
        'list low stock', 'low inventory', 'critical stock'
    ];

    // General product-related keywords
    const generalKeywords = [
        'product', 'products', 'inventory', 'stock', 'item', 'items',
        'category', 'categories', 'type', 'types', 'brand', 'brands',
        'model', 'models', 'feature', 'features',
        'produit', 'produits', 'inventaire', 'article', 'articles'
    ];

    const hasListKeywords = listKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasSearchKeywords = searchKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasForecastKeywords = forecastKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasAnomalyKeywords = anomalyKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasBIKeywords = biKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasGeneralKeywords = generalKeywords.some(keyword => lowerMessage.includes(keyword));

    return hasListKeywords || hasSearchKeywords || hasForecastKeywords ||
        hasAnomalyKeywords || hasBIKeywords || hasGeneralKeywords;
}

// Function to format AI tool results for display
function formatAIToolResult(toolName: string, result: any): string {
    // Handle error cases first - check both direct error property and nested error
    const errorMessage = result?.error || (result?.result && result.result.error);
    if (errorMessage) {
        const errorEmoji = {
            'generate_demand_forecast': '🔮',
            'get_reorder_recommendations': '📦',
            'run_anomaly_scan': '🔍',
            'get_recent_anomalies': '📊',
            'generate_business_insights': '💡',
            'analyze_product_performance': '📈',
            'analyze_overall_product_performance': '📊',
            'get_optimization_recommendations': '🎯',
            'explain_kpi_trends': '📊',
            'natural_language_query': '💬',
            'show_low_stock_items': '📦'
        }[toolName] || '⚠️';

        return `${errorEmoji} **Error**\n\n${errorMessage}`;
    }

    // If result is nested, unwrap it
    const actualResult = result?.result || result;

    switch (toolName) {
        case 'generate_demand_forecast':
            return `🔮 **Demand Forecast Generated**

**Predicted Demand:** ${actualResult.predictedDemand} units (next ${actualResult.forecastDays || 30} days)
**Daily Average:** ${actualResult.dailyAverageDemand?.toFixed(1) || 'N/A'} units/day
**Confidence Level:** ${(actualResult.confidence * 100).toFixed(1)}%

**Key Factors:**
${actualResult.factors ? Object.entries(actualResult.factors).map(([key, value]) => `- **${key}:** ${value}`).join('\n') : 'No factors provided'}

**Recommended Actions:**
${actualResult.recommendedActions?.length ? actualResult.recommendedActions.map((action: string) => `- ${action}`).join('\n') : 'No recommendations available'}

**Risk Factors:**
${actualResult.riskFactors?.length ? actualResult.riskFactors.map((risk: string) => `- ${risk}`).join('\n') : 'No risks identified'}`;

        case 'get_reorder_recommendations':
            return `📦 **Reorder Recommendations**

**Total Recommendations:** ${actualResult.total || 0}

${actualResult.recommendations?.length ? actualResult.recommendations.map((rec: any, index: number) =>
                `${index + 1}. **Product ID:** ${rec.productId}
   Quantity: ${rec.recommendedQty} units | Urgency: ${rec.urgency} | Cost: $${rec.estimatedCost?.toFixed(2) || '0.00'}
   Reason: ${rec.reasoning}`
            ).join('\n\n') : 'No recommendations available'}`;

        case 'run_anomaly_scan':
            return `🔍 **Anomaly Detection Results**

**Anomalies Found:** ${actualResult.total || 0}
**Scan Scope:** ${actualResult.scanScope || 'all'}

${actualResult.anomalies?.length ? actualResult.anomalies.map((anomaly: any, index: number) =>
                `${index + 1}. **${anomaly.type}** (${anomaly.severity})
   - **Description:** ${anomaly.description}
   - **Confidence:** ${(anomaly.confidence * 100).toFixed(1)}%
   - **Affected Products:** ${anomaly.affectedProducts?.length || 0} products
   - **Actions:** ${anomaly.recommendedActions?.slice(0, 2).join('; ')}`
            ).join('\n\n') : 'No anomalies detected'}`;

        case 'get_recent_anomalies':
            return `📊 **Recent Anomalies**

**Total:** ${actualResult.total || 0}

${actualResult.anomalies?.length ? actualResult.anomalies.map((anomaly: any, index: number) =>
                `${index + 1}. **${anomaly.type}** (${anomaly.severity})
   - **Status:** ${anomaly.isResolved ? '✅ Resolved' : '⚠️ Open'}
   - **Description:** ${anomaly.description}
   - **Date:** ${new Date(anomaly.createdAt).toLocaleDateString()}`
            ).join('\n\n') : 'No recent anomalies'}`;

        case 'generate_business_insights':
            return `💡 **Business Insights**

**Focus Area:** ${actualResult.focusArea || 'General'}

${actualResult.insights || 'No insights generated'}`;

        case 'analyze_product_performance':
            return `📈 **Product Performance Analysis**

**Product:** ${actualResult.product?.name} (${actualResult.product?.sku})
**Current Stock:** ${actualResult.product?.currentStock} units
**Recent Sales:** ${actualResult.product?.totalQuantitySold} units
**Revenue:** $${actualResult.product?.totalRevenue?.toFixed(2)}
**Margin:** ${actualResult.product?.margin}%

**Analysis:**
${actualResult.analysis || 'No analysis available'}`;

        case 'analyze_overall_product_performance':
            return `📊 **Overall Product Performance Analysis**

**Time Period:** ${actualResult.timeRange?.description}
**Total Products:** ${actualResult.summary?.totalProducts}
**Total Revenue:** $${actualResult.summary?.totalRevenue?.toFixed(2)}
**Total Quantity Sold:** ${actualResult.summary?.totalQuantitySold} units
**Average Margin:** ${actualResult.summary?.averageMargin?.toFixed(1)}%
**Low Stock Count:** ${actualResult.summary?.lowStockCount}

**Analysis:**
${actualResult.analysis || 'No analysis available'}`;

        case 'get_optimization_recommendations':
            return `🎯 **Optimization Recommendations**

**Goal:** ${actualResult.goal}

${actualResult.recommendations || 'No recommendations available'}`;

        case 'explain_kpi_trends':
            return `📊 **KPI Trend Analysis: ${actualResult.kpi}**

**Time Range:** ${actualResult.timeRange}

${actualResult.analysis || 'No analysis available'}`;

        case 'natural_language_query':
            return `💬 **Query Response**

**Question:** "${actualResult.query}"

**Answer:**
${actualResult.answer || 'No answer available'}`;

        case 'show_low_stock_items':
            return `📦 **Low Stock Items**

**Found ${actualResult.found || 0} items** that need attention (${actualResult.timeDescription || 'current data'})

${actualResult.products && actualResult.products.length > 0
                    ? actualResult.products.map((product: any, index: number) =>
                        `${index + 1}. **${product.name}** (${product.sku})
   Stock: ${product.stock} units | ${product.category} | ${product.price}`
                    ).join('\n\n')
                    : 'No low stock items found.'}

${actualResult.found > 0 ? '\n*These items may need restocking soon.*' : ''}`;

        default:
            // Generic formatting for unknown tools
            if (typeof actualResult === 'object') {
                return JSON.stringify(actualResult, null, 2);
            }
            return String(actualResult);
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const overallTimer = debugTimer('Complete AI Assistant Request');
    try {
        // Get the authenticated user
        const user = await getBetterAuthUser(request);
        if (!user?.companyId) {
            throw new Response(JSON.stringify({
                error: 'Unauthorized',
                details: !user ? 'No authenticated user found' : 'User missing company information',
                timestamp: new Date().toISOString()
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const formData = await request.formData();
        const message = formData.get('message') as string;

        if (!message) {
            throw new Response(JSON.stringify({
                error: 'Missing message',
                timestamp: new Date().toISOString()
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Handle help requests first
        const lowerMessage = message.toLowerCase().trim();
        if (lowerMessage.includes('help') ||
            lowerMessage.includes('what can you do') ||
            lowerMessage.includes('how to use') ||
            lowerMessage.includes('commands') ||
            lowerMessage.includes('examples') ||
            lowerMessage === 'help') {

            const helpContent = `# 🤖 AI Assistant Help

I can help you manage your inventory with powerful AI tools! Here are some things you can ask me:

## 📦 **Product Management**
- "List all products" - See your complete inventory
- "Find [product name]" - Search for specific products  
- "Show me [category/brand] products" - Find products by brand/category

## 🔮 **Smart Forecasting**
- "What products need reordering?" - Get AI purchase recommendations
- "Generate demand forecast for [product]" - Predict future sales
- "Show me low stock alerts" - See items below reorder point

## 🔍 **Anomaly Detection** 
- "Run anomaly detection scan" - Find inventory issues automatically
- "Check for unusual patterns" - Detect suspicious activity
- "Show me recent alerts" - View detected problems

## 💡 **Business Intelligence**
- "How is my business performing?" - Get AI-powered insights
- "Analyze [product] performance" - Deep product analysis
- "Give me optimization recommendations" - Improve operations
- "Explain inventory turnover trends" - Understand your KPIs

## 🎯 **Natural Questions**
- "Which products have the best margins?"
- "How much revenue did we make last month?"
- "What's my best-selling category?"
- "Compare product performance"

## 💡 **Tips**
- Use specific product names for better results
- Ask follow-up questions for deeper analysis  
- I understand both English and French
- Search is case-insensitive

## 🛠️ **Commands**
- Type "help" - Show this help guide
- Type "clear" - Clear chat history

**Try asking me anything about your inventory!** 🚀`;

            return new Response(JSON.stringify({
                success: true,
                content: helpContent,
                type: 'help'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Handle clear command
        if (lowerMessage === 'clear' || lowerMessage === 'cls') {
            return new Response(JSON.stringify({
                success: true,
                content: '✨ Chat cleared!',
                type: 'clear'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const useTools = shouldUseTools(message);

        const result = await generateText({
            model: ollama('llama3.1:8b'),
            messages: [
                {
                    role: 'system',
                    content: `You are a specialized AI assistant for Triven, an inventory management platform. You ONLY help with inventory and business management topics.

ABOUT TRIVEN FEATURES:
- Product Management: Add, edit, and organize products with categories, SKUs, and pricing
- Inventory Tracking: Monitor stock levels, set reorder points, and track availability
- Purchase Orders: Create and manage orders from suppliers
- Sales Orders: Process customer orders and track fulfillment
- Bills & Invoicing: Handle supplier bills and customer invoices
- Payments: Track payments made and received
- Stock Adjustments: Manage inventory changes and corrections
- Transfer Orders: Move inventory between locations/sites
- Analytics: View inventory reports and business insights
- Multi-site Management: Handle multiple locations and warehouses
- Team Management: User roles and permissions
- Integrations: Connect with other business tools

AI-POWERED FEATURES:
- Demand Forecasting: Predict future product demand using historical data
- Auto-Reorder Recommendations: AI suggests when and how much to reorder
- Anomaly Detection: Identify unusual patterns in inventory or sales
- Business Intelligence: Generate insights and analyze performance
- Natural Language Queries: Ask questions about your business data

STRICT GUIDELINES:
1. ONLY discuss inventory management, business operations, and Triven platform features
2. If users ask about topics unrelated to inventory/business (personal questions, general knowledge, entertainment, etc.), politely redirect them back to inventory topics
3. Respond in English by default unless the user clearly communicates in French
4. NEVER make up product information, prices, or stock numbers
5. Only share real information from the inventory system when available
6. Be helpful and professional for inventory-related questions
7. NEVER mention tools, functions, or technical implementation details
8. Act as if you naturally have access to the inventory information
9. When tool data is available, format it clearly and professionally
10. Always provide meaningful, actionable responses based on the data

RESPONSE RULES:
- For inventory questions: Provide helpful, detailed responses using real data
- For non-inventory questions: "I'm specialized in helping with inventory management and business operations. How can I assist you with your inventory, products, orders, or other business management needs?"

FORMATTING RULES:
- Use markdown formatting for better readability
- Create tables when displaying multiple products
- Use bullet points for lists
- Bold important information
- Include relevant totals and summaries

Language Detection: Only respond in French if the user message contains clear French words like "bonjour", "comment", "aidez", "produits", "liste", "inventaire", etc.

When discussing inventory, always use real data from the database. Present information naturally and format it for easy reading.`
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            tools: useTools ? {
                // Basic inventory tools
                get_products: {
                    description: 'Get a list of products from the inventory database. Use a high limit (like 1000) when user asks for "all products" or "show me all products". Supports both English and French language.',
                    inputSchema: z.object({
                        limit: z.number().optional().describe('Maximum number of products to return. Use 1000 for "all products" requests, default: 10 for general requests'),
                        language: z.enum(['en', 'fr']).optional().describe('Language for response - "en" for English, "fr" for French. Detect from user message.'),
                        time_period: z.string().optional().describe('Time period for filtering data (e.g., "today", "last week", "last month", "last quarter", "7 days", "30 days")')
                    }),
                    execute: async (args) => {
                        return await executeToolFunction('get_products', args, user.companyId!);
                    }
                },
                search_products: {
                    description: 'Search for products by name or SKU',
                    inputSchema: z.object({
                        query: z.string().describe('Search query to find products by name or SKU'),
                        time_period: z.string().optional().describe('Time period for filtering data (e.g., "today", "last week", "last month", "last quarter", "7 days", "30 days")')
                    }),
                    execute: async (args) => {
                        return await executeToolFunction('search_products', args, user.companyId!);
                    }
                },
                // AI Forecasting Tools
                generate_demand_forecast: {
                    description: 'Generate AI-powered demand forecast for a product using historical sales data',
                    inputSchema: z.object({
                        product_name: z.string().optional().describe('Name of the product to forecast'),
                        product_id: z.string().optional().describe('ID of the product to forecast (if known)'),
                        forecast_days: z.number().optional().describe('Number of days to forecast (default: 30)'),
                        time_period: z.string().optional().describe('Time period for historical data analysis (e.g., "today", "last week", "last month", "last quarter", "7 days", "30 days")')
                    }),
                    execute: async (args) => {
                        try {
                            const result = await executeToolFunction('generate_demand_forecast', args, user.companyId!);
                            return result;
                        } catch (error) {
                            return { error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
                        }
                    }
                },
                get_reorder_recommendations: {
                    description: 'Get AI-generated purchase order recommendations for products that need restocking',
                    inputSchema: z.object({
                        urgency_filter: z.enum(['Low', 'Medium', 'High', 'Critical']).optional().describe('Filter by urgency level'),
                        time_period: z.string().optional().describe('Time period for historical data analysis (e.g., "today", "last week", "last month", "last quarter", "7 days", "30 days")')
                    }),
                    execute: async (args) => {
                        try {
                            const result = await executeToolFunction('get_reorder_recommendations', args, user.companyId!);
                            return result;
                        } catch (error) {
                            return { error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
                        }
                    }
                },
                // AI Anomaly Detection Tools
                run_anomaly_scan: {
                    description: 'Run AI-powered anomaly detection on current inventory data to identify unusual patterns or issues',
                    inputSchema: z.object({
                        scope: z.enum(['inventory', 'sales', 'suppliers', 'all']).optional().describe('Scope of anomaly detection'),
                        time_period: z.string().optional().describe('Time period for anomaly detection (e.g., "today", "last week", "last month", "last quarter", "7 days", "30 days")')
                    }),
                    execute: async (args) => {
                        try {
                            const result = await executeToolFunction('run_anomaly_scan', args, user.companyId!);
                            return result;
                        } catch (error) {
                            return { error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
                        }
                    }
                },
                get_recent_anomalies: {
                    description: 'Get recently detected inventory anomalies and their status',
                    inputSchema: z.object({
                        limit: z.number().optional().describe('Number of anomalies to return (default: 10)'),
                        time_period: z.string().optional().describe('Time period for fetching anomalies (e.g., "today", "last week", "last month", "last quarter", "7 days", "30 days")')
                    }),
                    execute: async (args) => {
                        return await executeToolFunction('get_recent_anomalies', args, user.companyId!);
                    }
                },
                // Business Intelligence Tools
                generate_business_insights: {
                    description: 'Generate AI-powered business insights and recommendations based on current data',
                    inputSchema: z.object({
                        focus_area: z.enum(['inventory', 'sales', 'profitability', 'efficiency', 'growth']).optional().describe('Area to focus insights on'),
                        time_period: z.string().optional().describe('Time period for data analysis (e.g., "today", "last week", "last month", "last quarter", "7 days", "30 days")')
                    }),
                    execute: async (args) => {
                        return await executeToolFunction('generate_business_insights', args, user.companyId!);
                    }
                },
                analyze_product_performance: {
                    description: 'Analyze a SPECIFIC product by name or ID with detailed insights including sales, profitability, and inventory turnover. Use this when the user mentions a specific product name.',
                    inputSchema: z.object({
                        product_name: z.string().optional().describe('Product name to analyze'),
                        product_id: z.string().optional().describe('Product ID to analyze (if known)'),
                        analysis_type: z.enum(['sales_performance', 'profitability', 'inventory_turnover', 'comprehensive']).optional().describe('Type of analysis to perform'),
                        time_period: z.string().optional().describe('Time period for performance analysis (e.g., "today", "last week", "last month", "last quarter", "7 days", "30 days")')
                    }),
                    execute: async (args) => {
                        return await executeToolFunction('analyze_product_performance', args, user.companyId!);
                    }
                },
                analyze_overall_product_performance: {
                    description: 'Analyze overall product performance across ALL products when no specific product is mentioned. Use this for general product performance queries like "analyze product performance", "how are products performing", "product performance overview".',
                    inputSchema: z.object({
                        time_period: z.string().optional().describe('Time period for performance analysis (e.g., "today", "last week", "last month", "last quarter", "7 days", "30 days")')
                    }),
                    execute: async (args) => {
                        return await executeToolFunction('analyze_overall_product_performance', args, user.companyId!);
                    }
                },
                get_optimization_recommendations: {
                    description: 'Get AI-powered optimization recommendations for inventory management based on specific goals',
                    inputSchema: z.object({
                        optimization_goal: z.enum(['reduce_costs', 'increase_sales', 'improve_efficiency', 'reduce_waste']).optional().describe('Primary optimization goal'),
                        time_period: z.string().optional().describe('Time period for optimization analysis (e.g., "today", "last week", "last month", "last quarter", "7 days", "30 days")')
                    }),
                    execute: async (args) => {
                        return await executeToolFunction('get_optimization_recommendations', args, user.companyId!);
                    }
                },
                explain_kpi_trends: {
                    description: 'Explain trends in key performance indicators with AI analysis and recommendations',
                    inputSchema: z.object({
                        kpi_name: z.string().optional().describe('Name of the KPI to analyze (e.g., "inventory turnover", "gross margin")'),
                        time_period: z.string().optional().describe('Time period for trend analysis (e.g., "today", "last week", "last month", "last quarter", "7 days", "30 days", default: "last 30 days")')
                    }),
                    execute: async (args) => {
                        return await executeToolFunction('explain_kpi_trends', args, user.companyId!);
                    }
                },
                natural_language_query: {
                    description: 'Process natural language questions about business data and provide insights',
                    inputSchema: z.object({
                        query: z.string().describe('Natural language question about the business'),
                        time_period: z.string().optional().describe('Time period for data analysis (e.g., "today", "last week", "last month", "last quarter", "7 days", "30 days")')
                    }),
                    execute: async (args) => {
                        return await executeToolFunction('natural_language_query', args, user.companyId!);
                    }
                },
                show_low_stock_items: {
                    description: 'Show items that are low in stock, out of stock, or critically low. Use this specifically when user asks to "show low stock", "list low stock items", "out of stock items", etc.',
                    inputSchema: z.object({
                        time_period: z.string().optional().describe('Time period for stock analysis (e.g., "today", "last week", "last month", "last quarter", "7 days", "30 days")')
                    }),
                    execute: async (args) => {
                        return await executeToolFunction('show_low_stock_items', args, user.companyId!);
                    }
                }
            } : {}
        });
        overallTimer.end();
        // If tools were used but no text response was generated, create a summary response
        let finalContent = result.text || '';

        if (useTools && result.toolResults && result.toolResults.length > 0 && !finalContent.trim()) {
            try {
                // Create a formatted response based on tool results
                const toolSummaries = result.toolResults.map((toolResult: any) => {

                    if (toolResult.toolName === 'get_products') {
                        // Try both result and output for compatibility
                        const data = toolResult.output || toolResult.result;

                        const products = data.products;

                        if (products.length === 0) {
                            return "No products found in your inventory.";
                        }

                        let response = `## 📦 Your Inventory Overview\n\n`;
                        response += `**Total Products:** ${data.totalInDatabase} products in database\n`;

                        // Always show all products that were returned
                        response += `| Product Name | SKU | Category | Stock | Price |\n`;
                        response += `|--------------|-----|----------|-------|-------|\n`;
                        products.forEach((product: any) => {
                            response += `| ${product.name} | ${product.sku} | ${product.category} | ${product.stock} | ${product.price} |\n`;
                        });

                        // Add footer message based on whether all products are shown
                        if (data.showingAll) {
                            response += `\n*This is your complete inventory.*`;
                        } else {
                            response += `\n*Showing ${products.length} of ${data.totalInDatabase} products. Use specific search terms to find particular products.*`;
                        }

                        return response;
                    }

                    // Handle other tool results with existing formatters (also check output first)
                    return formatAIToolResult(toolResult.toolName, toolResult.output || toolResult.result);
                }).join('\n\n');

                finalContent = toolSummaries;

            } catch (error) {
                finalContent = 'Error processing tool results. Please try again.';
            }
        }

        return new Response(JSON.stringify({
            success: true,
            content: finalContent,
            toolCalls: result.toolCalls || [],
            toolResults: result.toolResults || []
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        overallTimer.end();
        console.error('Chat error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });

        return new Response(JSON.stringify({
            success: false,
            error: `Failed to connect to AI service. ${error instanceof Error ? error.message : 'Unknown error'}`,
            errorDetails: {
                message: error instanceof Error ? error.message : 'Unknown error',
                type: error instanceof Error ? error.constructor.name : typeof error,
                timestamp: new Date().toISOString()
            }
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}