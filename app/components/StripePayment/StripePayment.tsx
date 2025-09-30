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
import { useTranslation } from "react-i18next"
import classes from "./StripePayment.module.css"

// We'll pass the publishable key as a prop instead of accessing env directly
const getStripePromise = (publishableKey: string) => loadStripe(publishableKey)

interface StripePaymentProps {
    // When present, render in attached-intent mode
    clientSecret?: string
    // Always required for display and for deferred mode
    amount: number
    currency: string
    planName: string
    publishableKey: string
    onSuccess: () => void
    onError: (error: string) => void
    // Deferred-mode fields (optional). If clientSecret is not provided, we will create it on submit.
    planId?: string
    interval?: string // 'month' | 'year'
    createPaymentPath?: string // endpoint to post to; defaults to '/api/subscription-create'
}

function PaymentForm({
    amount,
    currency,
    planName,
    onSuccess,
    onError,
    clientSecret,
    planId,
    interval,
    createPaymentPath,
}: {
    amount: number
    currency: string
    planName: string
    onSuccess: () => void
    onError: (error: string) => void
    clientSecret?: string
    planId?: string
    interval?: string
    createPaymentPath?: string
}) {
    const stripe = useStripe()
    const elements = useElements()
    const { t } = useTranslation(['payment', 'common'])
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setIsLoading(true)

        // First, validate the PaymentElement fields. Required for deferred flows
        const { error: submitError } = await elements.submit()
        if (submitError) {
            console.error('Payment form validation error:', submitError)
            const message = submitError.message || t('payment:paymentError')
            onError(message)
            notifications.show({
                title: t('payment:paymentFailed'),
                message,
                color: 'red',
            })
            setIsLoading(false)
            return
        }

        let secret = clientSecret

        // Deferred mode: create PaymentIntent only when user clicks Pay
        if (!secret) {
            try {
                const endpoint = createPaymentPath || '/api/subscription-create'
                // Prefer JSON to match API signature used elsewhere in the app
                const payload = {
                    planId,
                    interval,
                    currency,
                }
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                const data = await res.json()
                if (!res.ok || !data?.clientSecret) {
                    throw new Error(data?.error || 'Failed to create payment')
                }
                secret = data.clientSecret as string
            } catch (err: any) {
                const message = err?.message || t('payment:paymentError')
                onError(message)
                notifications.show({
                    title: t('payment:paymentFailed'),
                    message,
                    color: 'red',
                })
                setIsLoading(false)
                return
            }
        }

        const { error } = await stripe.confirmPayment({
            elements,
            clientSecret: secret,
            confirmParams: {
                return_url: `${window.location.origin}/dashboard`,
            },
            redirect: 'if_required',
        })

        setIsLoading(false)

        if (error) {
            console.error('Payment error:', error)
            onError(error.message || t('payment:paymentError'))
            notifications.show({
                title: t('payment:paymentFailed'),
                message: error.message || t('payment:paymentError'),
                color: 'red',
            })
        } else {
            onSuccess()
            notifications.show({
                title: t('payment:paymentSuccessful'),
                message: t('payment:welcomeMessage', { planName }),
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
                        {t('payment:upgrade')}
                    </Title>

                    <Text ta="center" c="dimmed" size="sm">
                        {t('payment:upgradeTo', { planName })}
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
                        {t('payment:securePayment')}
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
                    {isLoading ? t('payment:processing') : t('payment:pay', { amount: formatAmount(amount, currency) })}
                </Button>

                {/* Additional Info */}
                <Text ta="center" size="xs" c="dimmed">
                    {t('payment:cancelAnytime')}
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
    onError,
    planId,
    interval,
    createPaymentPath = '/api/subscription-create',
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

    const options = clientSecret
        ? { clientSecret, appearance }
        : ({ mode: 'payment', amount, currency: currency.toLowerCase(), appearance } as any)

    return (
        <Elements stripe={stripePromise} options={options}>
            <PaymentForm
                amount={amount}
                currency={currency}
                planName={planName}
                onSuccess={onSuccess}
                onError={onError}
                clientSecret={clientSecret}
                planId={planId}
                interval={interval}
                createPaymentPath={createPaymentPath}
            />
        </Elements>
    )
}