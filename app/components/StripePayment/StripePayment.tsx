import {
    Button,
    Center,
    Group,
    Loader,
    Paper,
    Stack,
    Text,
    ThemeIcon,
    Title,
    useMantineColorScheme
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
    Elements,
    PaymentElement,
    useElements,
    useStripe
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { IconCreditCard, IconLock, IconShieldCheck } from "@tabler/icons-react"
import { useState } from "react"
import classes from "./StripePayment.module.css"

// We'll pass the publishable key as a prop instead of accessing env directly
const getStripePromise = (publishableKey: string) => loadStripe(publishableKey)

interface StripePaymentProps {
    clientSecret: string
    amount: number
    currency: string
    planName: string
    publishableKey: string
    onSuccess: () => void
    onError: (error: string) => void
}

function PaymentForm({
    amount,
    currency,
    planName,
    onSuccess,
    onError
}: {
    amount: number
    currency: string
    planName: string
    onSuccess: () => void
    onError: (error: string) => void
}) {
    const stripe = useStripe()
    const elements = useElements()
    const { colorScheme } = useMantineColorScheme()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setIsLoading(true)

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/dashboard`,
            },
            redirect: 'if_required',
        })

        setIsLoading(false)

        if (error) {
            console.error('Payment error:', error)
            onError(error.message || 'Payment failed')
            notifications.show({
                title: 'Payment Failed',
                message: error.message || 'Something went wrong with your payment',
                color: 'red',
            })
        } else {
            onSuccess()
            notifications.show({
                title: 'Payment Successful!',
                message: `Welcome to ${planName}! Your account has been upgraded.`,
                color: 'green',
            })
        }
    }

    const formatAmount = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount / 100)
    }

    return (
        <form onSubmit={handleSubmit} className={classes.paymentForm}>
            <Stack gap="lg">
                {/* Header */}
                <div className={classes.header}>
                    <Center mb="md">
                        <ThemeIcon
                            size={60}
                            radius="xl"
                            variant="gradient"
                            gradient={{ from: 'teal', to: 'blue' }}
                            className={classes.cardIcon}
                        >
                            <IconCreditCard size={30} />
                        </ThemeIcon>
                    </Center>

                    <Title order={3} ta="center" mb="md" className={classes.paymentTitle}>
                        Complete Your Upgrade
                    </Title>

                    <Text ta="center" c="dimmed" size="sm">
                        Upgrade to <Text span fw={500} tt="capitalize">{planName}</Text>
                    </Text>
                </div>

                {/* Payment Element */}
                <Paper p="md" radius="md" className={classes.paymentElement}>
                    <PaymentElement
                        options={{
                            layout: 'tabs',
                            paymentMethodOrder: ['card', 'google_pay', 'apple_pay'],
                            terms: {
                                card: 'never',
                            },
                            wallets: {
                                applePay: 'auto',
                                googlePay: 'auto',
                                link: 'never', // This properly disables Link promotional text
                            },
                        }}
                    />
                </Paper>

                {/* Security Notice */}
                <Group justify="center" gap="xs" className={classes.securityNotice}>
                    <ThemeIcon size="sm" color="gray" variant="light">
                        <IconShieldCheck size={14} />
                    </ThemeIcon>
                    <Text size="xs" c="dimmed">
                        Your payment information is secure and encrypted
                    </Text>
                </Group>

                {/* Submit Button */}
                <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    disabled={!stripe || isLoading}
                    loading={isLoading}
                    gradient={{ from: 'teal', to: 'blue' }}
                    variant="gradient"
                    className={classes.payButton}
                    leftSection={isLoading ? <Loader size="sm" /> : <IconLock size={20} />}
                >
                    {isLoading ? 'Processing...' : `Pay ${formatAmount(amount, currency)}`}
                </Button>

                {/* Additional Info */}
                <Text ta="center" size="xs" c="dimmed">
                    You can cancel your subscription at any time from your account settings
                </Text>
            </Stack>
        </form>
    )
}

export default function StripePayment({
    clientSecret,
    amount,
    currency,
    planName,
    publishableKey,
    onSuccess,
    onError
}: StripePaymentProps) {
    const { colorScheme } = useMantineColorScheme()
    const stripePromise = getStripePromise(publishableKey)

    const appearance = {
        theme: (colorScheme === 'dark' ? 'night' : 'stripe') as 'night' | 'stripe',
        variables: {
            colorPrimary: '#20C5A2',
            colorBackground: colorScheme === 'dark' ? '#2e2e2e' : '#ffffff',
            colorText: colorScheme === 'dark' ? '#ffffff' : '#1a1a1a',
            colorDanger: '#df1b41',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
        },
        rules: {
            '.Input': {
                backgroundColor: colorScheme === 'dark' ? '#404040' : '#f8f9fa',
                border: `1px solid ${colorScheme === 'dark' ? '#565656' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
            },
            '.Input:focus': {
                border: '2px solid #20C5A2',
                boxShadow: '0 0 0 1px #20C5A2',
            },
            '.Label': {
                color: colorScheme === 'dark' ? '#c1c2c5' : '#495057',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '4px',
            },
        },
    }

    const options = {
        clientSecret,
        appearance,
    }

    if (!clientSecret) {
        return (
            <Center p="xl">
                <Stack gap="md" align="center">
                    <Loader size="lg" />
                    <Text c="dimmed">Setting up payment...</Text>
                </Stack>
            </Center>
        )
    }

    return (
        <Elements stripe={stripePromise} options={options}>
            <PaymentForm
                amount={amount}
                currency={currency}
                planName={planName}
                onSuccess={onSuccess}
                onError={onError}
            />
        </Elements>
    )
}