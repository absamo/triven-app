import {
    ActionIcon,
    Avatar,
    Box,
    Group,
    Paper,
    Stack,
    Text,
    Textarea,
    Title
} from '@mantine/core';
import { IconRobot, IconSend, IconUser } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useFetcher } from 'react-router';
import { ChatMessageSkeleton } from "~/app/components";
import { prisma } from "~/app/db.server";
import type { Route } from "./+types/simple-chat";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Simple Chat - Triven App" },
        { name: "description", content: "Simple chat interface with Ollama integration" },
    ];
}

// Define simple tools for database access
const simpleTools = [
    {
        type: 'function' as const,
        function: {
            name: 'get_products',
            description: 'Get a list of products from the inventory database. Use a high limit (like 1000) when user asks for "all products" or "show me all products". Supports both English and French language.',
            parameters: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'number',
                        description: 'Maximum number of products to return. Use 1000 for "all products" requests, default: 10 for general requests'
                    },
                    language: {
                        type: 'string',
                        description: 'Language for response - "en" for English, "fr" for French. Detect from user message.',
                        enum: ['en', 'fr']
                    }
                },
                required: []
            }
        }
    },
    {
        type: 'function' as const,
        function: {
            name: 'search_products',
            description: 'Search for products by name or SKU',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search query to find products by name or SKU'
                    }
                },
                required: ['query']
            }
        }
    }
];

// Function to execute tools
async function executeTool(name: string, args: any) {
    switch (name) {
        case 'get_products':
            const limit = parseInt(args.limit) || 10;
            const language = args.language || 'en'; // Default to English

            // Get total count and products
            const [totalCount, products] = await Promise.all([
                prisma.product.count(),
                prisma.product.findMany({
                    take: limit,
                    include: {
                        category: true
                    },
                    orderBy: {
                        name: 'asc'
                    }
                })
            ]);

            return {
                products: products.map(p => ({
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
                language: language
            };

        case 'search_products':
            const query = args.query?.toLowerCase() || '';
            const searchResults = await prisma.product.findMany({
                where: {
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

            return {
                query: args.query,
                products: searchResults.map(p => ({
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    category: p.category?.name || 'No category',
                    stock: p.availableQuantity,
                    price: `$${Number(p.sellingPrice).toFixed(2)}`
                })),
                found: searchResults.length
            };

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}

// Check if message needs tools and which tools to provide
function shouldUseTools(message: string): { useTools: boolean; suggestedTools?: string[] } {
    const lowerMessage = message.toLowerCase();

    // Keywords for listing products (get_products)
    const listKeywords = [
        'list', 'show me all', 'display all', 'get all', 'all products', 'all items',
        'inventory list', 'product list', 'everything', 'voir tout', 'liste',
        'tous les produits', 'tous les articles', 'inventaire complet'
    ];

    // Keywords for searching specific products (search_products)
    const searchKeywords = [
        'find', 'search', 'look for', 'details', 'info', 'information',
        'tell me about', 'what is', 'describe', 'spec', 'specifications',
        'price of', 'cost of', 'available', 'stock of', 'how much',
        'cherche', 'trouve', 'détails', 'informations', 'prix de',
        'parle moi de', 'qu\'est-ce que', 'décris', 'disponible'
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
    const hasGeneralKeywords = generalKeywords.some(keyword => lowerMessage.includes(keyword));

    if (hasListKeywords || hasSearchKeywords || hasGeneralKeywords) {
        const suggestedTools = [];

        // Suggest specific tools based on keywords
        if (hasListKeywords) {
            suggestedTools.push('get_products');
        }
        if (hasSearchKeywords || (hasGeneralKeywords && !hasListKeywords)) {
            suggestedTools.push('search_products');
        }

        // If no specific tool suggested, provide both
        if (suggestedTools.length === 0) {
            suggestedTools.push('get_products', 'search_products');
        }

        return { useTools: true, suggestedTools };
    }

    return { useTools: false };
}

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const message = formData.get('message') as string;

    if (!message?.trim()) {
        return { error: 'Message is required' };
    }

    try {
        // Import ollama dynamically to avoid SSR issues
        const { Ollama } = await import('ollama');
        const ollama = new Ollama({ host: 'http://localhost:11434' });

        const toolDecision = shouldUseTools(message);

        const chatConfig: any = {
            model: 'llama3.1:8b',
            messages: [
                {
                    role: 'system',
                    content: `You are a friendly and helpful assistant for Triven, an inventory management platform. 

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

IMPORTANT RULES:
1. Speak naturally and conversationally - avoid technical jargon
2. NEVER make up product information, prices, or stock numbers
3. Only share real information from the inventory system when available
4. If you can't find something, politely ask the user to clarify or provide more details
5. Be helpful and personable - treat users like valued customers
6. For questions about Triven features, explain them clearly and helpfully
7. For general questions not about inventory or Triven, respond warmly and helpfully
8. NEVER mention tools, functions, or technical implementation details to users
9. Act as if you naturally have access to the inventory information - don't explain how you retrieve it

When discussing inventory, always use real data from the database. Present information naturally without mentioning that you're using search functions or database queries.`
                },
                {
                    role: 'user',
                    content: message
                }
            ],
        };

        // Add tools if message seems to need them
        if (toolDecision.useTools) {
            // Optionally filter tools based on suggestions (for now, provide all tools)
            chatConfig.tools = simpleTools;
        }

        const response = await ollama.chat(chatConfig);
        let finalResponse = (response as any).message?.content || '';

        // Handle tool calls if present
        if ((response as any).message?.tool_calls && (response as any).message.tool_calls.length > 0) {
            const toolCalls = (response as any).message.tool_calls;

            // Execute tools and get results
            for (const toolCall of toolCalls) {
                try {
                    let args = toolCall.function.arguments;
                    if (typeof args === 'string') {
                        args = JSON.parse(args);
                    }

                    const result = await executeTool(toolCall.function.name, args);

                    // Format the result based on tool type
                    if (toolCall.function.name === 'get_products') {
                        const isFrench = result.language === 'fr';

                        if (isFrench) {
                            finalResponse = `Voici les produits de l'inventaire :\n\n`;
                            finalResponse += `**Total des produits trouvés : ${result.total}**\n\n`;
                        } else {
                            finalResponse = `Here are the products from the inventory:\n\n`;
                            finalResponse += `**Total Products Found: ${result.total}**\n\n`;
                        }

                        result.products.forEach((product: any, index: number) => {
                            finalResponse += `${index + 1}. **${product.name}** (${product.sku})\n`;
                            if (isFrench) {
                                finalResponse += `   - Catégorie : ${product.category}\n`;
                                finalResponse += `   - Stock : ${product.stock} unités\n`;
                                finalResponse += `   - Prix : ${product.price}\n\n`;
                            } else {
                                finalResponse += `   - Category: ${product.category}\n`;
                                finalResponse += `   - Stock: ${product.stock} units\n`;
                                finalResponse += `   - Price: ${product.price}\n\n`;
                            }
                        });

                    } else if (toolCall.function.name === 'search_products') {
                        finalResponse = `Search results for "${result.query}":\n\n`;
                        finalResponse += `**Found ${result.found || 0} products**\n\n`;

                        if (result.found && result.found > 0) {
                            result.products.forEach((product: any, index: number) => {
                                finalResponse += `${index + 1}. **${product.name}** (${product.sku})\n`;
                                finalResponse += `   - Category: ${product.category}\n`;
                                finalResponse += `   - Stock: ${product.stock} units\n`;
                                finalResponse += `   - Price: ${product.price}\n\n`;
                            });
                        } else {
                            finalResponse += `No products found matching "${result.query}". Try a different search term.`;
                        }
                    }

                } catch (error) {
                    finalResponse += `\n\nError executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`;
                }
            }
        }

        return {
            success: true,
            response: finalResponse || 'Sorry, I could not generate a response.',
            userMessage: message
        };
    } catch (error) {
        console.error('Ollama error:', error);
        return {
            error: 'Failed to connect to Ollama. Make sure Ollama is running with: ollama serve',
            userMessage: message
        };
    }
}

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
}

export default function SimpleChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const fetcher = useFetcher<typeof action>();
    const isLoading = fetcher.state === 'submitting';

    // Handle form response
    useEffect(() => {
        if (fetcher.data && fetcher.state === 'idle') {
            if (fetcher.data.success) {
                // Add assistant response
                const assistantMessage: Message = {
                    id: Date.now().toString() + '-assistant',
                    content: fetcher.data.response,
                    role: 'assistant',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else if (fetcher.data.error) {
                // Add error message
                const errorMessage: Message = {
                    id: Date.now().toString() + '-error',
                    content: `❌ ${fetcher.data.error}`,
                    role: 'assistant',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        }
    }, [fetcher.data, fetcher.state]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        // Add user message immediately
        const userMessage: Message = {
            id: Date.now().toString() + '-user',
            content: inputValue,
            role: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        // Submit to server
        const formData = new FormData();
        formData.append('message', inputValue);
        fetcher.submit(formData, { method: 'post' });

        setInputValue('');
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box w="100%" p="md">
            <Paper shadow="sm" radius="md" withBorder style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
                    <Group justify="space-between" align="center">
                        <Title order={3}>Simple Chat</Title>
                        <Group gap="xs">
                            <Box
                                w={8}
                                h={8}
                                bg="green.5"
                                style={{ borderRadius: '50%' }}
                            />
                            <Text size="sm" c="dimmed">Ollama Connected</Text>
                        </Group>
                    </Group>
                </Box>

                {/* Messages Area */}
                <Box p="md">
                    {messages.length === 0 ? (
                        <Box style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <IconRobot size={48} color="#228be6" style={{ marginBottom: '1rem' }} />
                            <Text size="lg" fw={500} mb="xs">Welcome to Simple Chat!</Text>
                            <Text c="dimmed">Start a conversation with the AI assistant</Text>
                        </Box>
                    ) : (
                        <Stack gap="md">{messages.map((message) => (
                            <Group
                                key={message.id}
                                align="flex-start"
                                gap="sm"
                                style={{
                                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                                }}
                            >
                                {message.role === 'assistant' && (
                                    <Avatar
                                        size="sm"
                                        radius="xl"
                                        color="blue"
                                    >
                                        <IconRobot size={16} />
                                    </Avatar>
                                )}

                                <Paper
                                    p="sm"
                                    radius="lg"
                                    style={{
                                        maxWidth: '70%',
                                        backgroundColor: message.role === 'user' ? '#228be6' : '#f8f9fa',
                                        color: message.role === 'user' ? 'white' : 'black'
                                    }}
                                >
                                    <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                                        {message.content}
                                    </Text>
                                    <Text
                                        size="xs"
                                        mt={4}
                                        style={{
                                            opacity: 0.7,
                                            textAlign: message.role === 'user' ? 'right' : 'left'
                                        }}
                                    >
                                        {formatTime(message.timestamp)}
                                    </Text>
                                </Paper>

                                {message.role === 'user' && (
                                    <Avatar
                                        size="sm"
                                        radius="xl"
                                        color="gray"
                                    >
                                        <IconUser size={16} />
                                    </Avatar>
                                )}
                            </Group>
                        ))}

                            {/* Loading indicator */}
                            {isLoading && (
                                <Group align="flex-start" gap="sm">
                                    <Avatar size="sm" radius="xl" color="blue">
                                        <IconRobot size={16} />
                                    </Avatar>
                                    <Paper p="sm" radius="lg" bg="#f8f9fa" style={{ flex: 1, maxWidth: '70%' }}>
                                        <ChatMessageSkeleton />
                                    </Paper>
                                </Group>
                            )}
                        </Stack>
                    )}
                </Box>

                {/* Input Area */}
                <Box p="md" style={{ borderTop: '1px solid #e9ecef' }}>
                    <fetcher.Form onSubmit={handleSubmit}>
                        <Group gap="sm" align="flex-end">
                            <Textarea
                                name="message"
                                placeholder={isLoading ? "Please wait..." : "Type your message here..."}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                disabled={isLoading}
                                autosize
                                minRows={1}
                                maxRows={4}
                                style={{ flex: 1 }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                            />
                            <ActionIcon
                                type="submit"
                                disabled={!inputValue.trim() || isLoading}
                                variant="filled"
                                color="blue"
                                size="lg"
                                loading={isLoading}
                            >
                                {!isLoading && <IconSend size={18} />}
                            </ActionIcon>
                        </Group>
                    </fetcher.Form>
                    <Text size="xs" c="dimmed" mt="xs" ta="center">
                        Press Enter to send, Shift+Enter for new line
                    </Text>
                </Box>
            </Paper>
        </Box>
    );
}
