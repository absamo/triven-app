import { Badge, Button, Card, Group, Stack, Text } from "@mantine/core"
import { IconCheck } from "@tabler/icons-react"
import { calculateYearlySavings, formatPrice, useSubscription } from "~/app/lib/hooks/useSubscription"
import { CURRENCIES, INTERVALS, PLANS, PRICING_PLANS, type Interval, type Plan } from "~/app/modules/stripe/plans"

interface PricingCardProps {
    planId: Plan
    interval: Interval
    currency: string
    isPopular?: boolean
}

export function PricingCard({ planId, interval, currency, isPopular }: PricingCardProps) {
    const plan = PRICING_PLANS[planId]
    const { createCheckout, isLoading } = useSubscription({
        onSuccess: (checkoutUrl) => {
            console.log("Redirecting to checkout:", checkoutUrl)
        },
        onError: (error) => {
            console.error("Checkout error:", error)
        }
    })

    const monthlyPrice = plan.prices[INTERVALS.MONTHLY][currency as keyof typeof plan.prices.month]
    const yearlyPrice = plan.prices[INTERVALS.YEARLY][currency as keyof typeof plan.prices.year]
    const currentPrice = interval === INTERVALS.YEARLY ? yearlyPrice : monthlyPrice
    const savings = calculateYearlySavings(monthlyPrice, yearlyPrice)

    const handleSubscribe = () => {
        createCheckout(planId, interval, currency as any)
    }

    return (
        <Card
            shadow="md"
            radius="lg"
            p="xl"
            style={{
                border: isPopular ? '2px solid #00ff88' : undefined,
                position: 'relative'
            }}
        >
            {isPopular && (
                <Badge
                    color="green"
                    size="lg"
                    style={{
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)'
                    }}
                >
                    Most Popular
                </Badge>
            )}

            <Stack gap="lg">
                <div>
                    <Text size="xl" fw="bold">{plan.name}</Text>
                    <Text c="dimmed" size="sm">{plan.description}</Text>
                </div>

                <div>
                    <Group align="baseline" gap={4}>
                        <Text size="3rem" fw="800">
                            {formatPrice(currentPrice, currency as any)}
                        </Text>
                        <Text c="dimmed">/{interval === INTERVALS.YEARLY ? 'year' : 'month'}</Text>
                    </Group>

                    {interval === INTERVALS.YEARLY && savings > 0 && (
                        <Text c="green" size="sm" fw="500">
                            Save {savings}% with yearly billing
                        </Text>
                    )}
                </div>

                <Stack gap="xs">
                    <Text fw="500" size="sm">What's included:</Text>
                    <Group gap="xs">
                        <IconCheck size={16} color="#00ff88" />
                        <Text size="sm">
                            {plan.inclusions.orders === -1 ? 'Unlimited' : plan.inclusions.orders} orders/month
                        </Text>
                    </Group>
                    <Group gap="xs">
                        <IconCheck size={16} color="#00ff88" />
                        <Text size="sm">{plan.inclusions.users} team members</Text>
                    </Group>
                    <Group gap="xs">
                        <IconCheck size={16} color="#00ff88" />
                        <Text size="sm">{plan.inclusions.branches} branches</Text>
                    </Group>
                    <Group gap="xs">
                        <IconCheck size={16} color="#00ff88" />
                        <Text size="sm">{plan.inclusions.warehouses} warehouses</Text>
                    </Group>
                </Stack>

                <Button
                    fullWidth
                    size="lg"
                    variant={isPopular ? "filled" : "outline"}
                    color={isPopular ? "green" : "gray"}
                    loading={isLoading}
                    onClick={handleSubscribe}
                >
                    Start {plan.name} Plan
                </Button>
            </Stack>
        </Card>
    )
}

// Example usage component
export function PricingExample() {
    const interval = INTERVALS.MONTHLY // or INTERVALS.YEARLY
    const currency = CURRENCIES.USD // or CURRENCIES.EUR

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <PricingCard
                planId={PLANS.STANDARD}
                interval={interval}
                currency={currency}
            />
            <PricingCard
                planId={PLANS.PROFESSIONAL}
                interval={interval}
                currency={currency}
                isPopular={true}
            />
            <PricingCard
                planId={PLANS.PREMIUM}
                interval={interval}
                currency={currency}
            />
        </div>
    )
}