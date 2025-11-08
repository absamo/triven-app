import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title as MantineTitle,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBrandMastercard,
  IconBrandVisa,
  IconCreditCard,
  IconCrown,
  IconDownload,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { LoaderFunctionArgs } from 'react-router'
import { data, useLoaderData, useNavigate, useRevalidator, useSearchParams } from 'react-router'
import { formatCurrency } from '~/app/common/helpers/money'
import BackButton from '~/app/components/BackButton'
import UpgradePayment from '~/app/components/UpgradePayment'
import { prisma } from '~/app/db.server'
import { getAllInvoices, getUpcomingInvoice } from '~/app/modules/stripe/queries.server'
import { Title } from '~/app/partials/Title'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

export const ROUTE_PATH = '/billing' as const

interface BillingData {
  subscription: {
    id: string
    planId: string
    status: string
    interval: string
    currentPeriodStart: number
    currentPeriodEnd: number
    trialStart: number
    trialEnd: number
    cancelAtPeriodEnd: boolean
    amount: number
    currency: string
    paymentMethod?: {
      last4: string
      brand: string
      expMonth: number
      expYear: number
    } | null
    cancelledAt: string | null
    cancelledBy: string | null
    cancellationReason: string | null
    scheduledCancelAt: string | null
  } | null
  invoices: Array<{
    id: string
    number: string | null
    status: string
    amount_paid: number
    amount_due: number
    currency: string
    created: number
    hosted_invoice_url: string | null
    invoice_pdf: string | null
  }>
  upcomingInvoice: {
    amount_due: number
    currency: string
    period_start: number
    period_end: number
  } | null
  config: {
    stripePublicKey: string
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireBetterAuthUser(request, ['read:plans'])

  // Get user's subscription
  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
    include: {
      price: true,
      plan: true,
    },
  })

  let invoices: any[] = []
  let upcomingInvoice = null

  if (subscription && subscription.id.startsWith('sub_')) {
    // Real Stripe subscription
    try {
      const stripeInvoices = await getAllInvoices(subscription.id)
      invoices = stripeInvoices.map((invoice: any) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount_paid: invoice.amount_paid,
        amount_due: invoice.amount_due,
        currency: invoice.currency,
        created: invoice.created,
        hosted_invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf,
      }))

      upcomingInvoice = await getUpcomingInvoice(subscription.id)
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    }
  }

  const billingData: BillingData = {
    subscription: subscription
      ? {
          id: subscription.id,
          planId: subscription.planId,
          status: subscription.status,
          interval: subscription.interval,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          trialStart: subscription.trialStart,
          trialEnd: subscription.trialEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          amount: subscription.price?.amount || 0,
          currency: subscription.price?.currency || 'USD',
          paymentMethod: subscription.last4
            ? {
                last4: subscription.last4,
                brand: subscription.brand || 'card',
                expMonth: subscription.expMonth || 0,
                expYear: subscription.expYear || 0,
              }
            : null,
          cancelledAt: subscription.cancelledAt?.toISOString() || null,
          cancelledBy: subscription.cancelledBy,
          cancellationReason: subscription.cancellationReason,
          scheduledCancelAt: subscription.scheduledCancelAt?.toISOString() || null,
        }
      : null,
    invoices,
    upcomingInvoice,
    config: {
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY || '',
    },
  }

  return data(billingData)
}

export default function BillingPage() {
  const { t } = useTranslation(['payment', 'pricing', 'common'])
  const loaderData = useLoaderData<BillingData>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const revalidator = useRevalidator()
  const paymentProcessingRef = useRef(false)

  const { subscription, config } = loaderData
  // If user is trialing, use their current plan as the target plan (to complete the trial)
  const targetPlan =
    searchParams.get('plan') ||
    (subscription?.status === 'trialing' ? subscription.planId : undefined)
  const returnTo = searchParams.get('returnTo')

  // Set up SSE connection to listen for subscription updates
  useEffect(() => {
    const eventSource = new EventSource('/api/subscription-stream')
    let hasRedirected = false

    console.log('[Billing] SSE connection established')

    eventSource.addEventListener('connected', () => {
      console.log('[Billing] SSE connected')
    })

    eventSource.addEventListener('subscription', (event) => {
      try {
        const update = JSON.parse(event.data)
        console.log('[Billing] Received SSE update:', update)
        console.log('[Billing] Payment processing:', paymentProcessingRef.current)

        // Revalidate to update the UI
        revalidator.revalidate()

        // If we're processing payment and get confirmed active status, redirect to settings
        if (
          !hasRedirected &&
          paymentProcessingRef.current &&
          update.status === 'active' &&
          update.confirmed
        ) {
          console.log('[Billing] Redirecting to settings...')
          hasRedirected = true
          paymentProcessingRef.current = false
          navigate('/settings')
        }
      } catch (error) {
        console.error('[Billing] Failed to parse SSE message:', error)
      }
    })

    eventSource.onerror = (error) => {
      console.error('[Billing] SSE error:', error)
      eventSource.close()
    }

    return () => {
      console.log('[Billing] SSE connection closed')
      eventSource.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  const handlePaymentStart = useCallback(() => {
    console.log('[Billing] Payment started')
    paymentProcessingRef.current = true
  }, [])

  const handlePaymentSuccess = useCallback(() => {
    console.log('[Billing] Payment success - waiting for SSE confirmation')
  }, [])

  if (!subscription || !targetPlan) {
    return (
      <Container size="lg" py="xl">
        <BackButton onClick={() => navigate(-1)}>{t('common:back')}</BackButton>
        <Center mt="xl">
          <Stack align="center" gap="lg">
            <ThemeIcon size={60} radius="xl" variant="light" color="gray">
              <IconCreditCard size={30} />
            </ThemeIcon>
            <div style={{ textAlign: 'center' }}>
              <MantineTitle order={2} mb="sm">
                {t('payment:noActiveSubscription')}
              </MantineTitle>
              <Text c="dimmed" mb="xl">
                {t('payment:noSubscriptionMessage')}
              </Text>
              <Button component="a" href="/pricing" size="lg" leftSection={<IconCrown size={20} />}>
                {t('payment:viewPlans')}
              </Button>
            </div>
          </Stack>
        </Center>
      </Container>
    )
  }

  const getPlanLabel = (planId: string) => {
    return t(`pricing:${planId}`, planId)
  }

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--mantine-spacing-xl)' }}>
      <Stack gap="xl" maw="1200px" mx="auto">
        {/* Header with Back Button */}
        <Title backTo="/settings" description={t('payment:upgradeDescription')}>
          {t('payment:billing', 'Billing')}
        </Title>

        {/* Upgrade payment form */}
        <UpgradePayment
          userPlanStatus={subscription.status}
          planId={targetPlan}
          interval={subscription.interval}
          currency={subscription.currency}
          config={config}
          billing={{
            currentPlan: subscription.planId,
            planStatus: subscription.status,
            interval: subscription.interval,
            currency: subscription.currency,
            amount: subscription.amount,
            paymentMethod: subscription.paymentMethod,
          }}
          onPaymentStart={handlePaymentStart}
          onSuccess={handlePaymentSuccess}
        />
      </Stack>
    </div>
  )
}
