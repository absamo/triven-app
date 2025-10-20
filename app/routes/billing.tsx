import type { LoaderFunctionArgs } from 'react-router'
import { data, useLoaderData, useSearchParams, useNavigate } from 'react-router'
import { 
  Badge, 
  Button, 
  Card, 
  Container, 
  Divider, 
  Group, 
  Paper, 
  Stack, 
  Text, 
  Title,
  Alert,
  Table,
  ActionIcon,
  ThemeIcon,
  Center
} from '@mantine/core'
import { 
  IconCreditCard, 
  IconDownload, 
  IconCrown,
  IconBrandVisa,
  IconBrandMastercard,
  IconAlertTriangle,
  IconArrowLeft
} from '@tabler/icons-react'
import dayjs from 'dayjs'

import { prisma } from '~/app/db.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getAllInvoices, getUpcomingInvoice } from '~/app/modules/stripe/queries.server'
import { formatCurrency } from '~/app/common/helpers/money'
import BackButton from '~/app/components/BackButton'
import UpgradePayment from '~/app/components/UpgradePayment'

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
  const user = await requireBetterAuthUser(request)

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
    subscription: subscription ? {
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
      paymentMethod: subscription.last4 ? {
        last4: subscription.last4,
        brand: subscription.brand || 'card',
        expMonth: subscription.expMonth || 0,
        expYear: subscription.expYear || 0,
      } : null,
      cancelledAt: subscription.cancelledAt?.toISOString() || null,
      cancelledBy: subscription.cancelledBy,
      cancellationReason: subscription.cancellationReason,
      scheduledCancelAt: subscription.scheduledCancelAt?.toISOString() || null,
    } : null,
    invoices,
    upcomingInvoice,
    config: {
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY || '',
    },
  }

  return data(billingData)
}

export default function BillingPage() {
  const loaderData = useLoaderData<BillingData>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const { subscription, config } = loaderData
  // If user is trialing, use their current plan as the target plan (to complete the trial)
  const targetPlan = searchParams.get('plan') || (subscription?.status === 'trialing' ? subscription.planId : undefined)
  const returnTo = searchParams.get('returnTo')

  if (!subscription || !targetPlan) {
    return (
      <Container size="lg" py="xl">
        <BackButton onClick={() => navigate(-1)}>Back</BackButton>
        <Center mt="xl">
          <Stack align="center" gap="lg">
            <ThemeIcon size={60} radius="xl" variant="light" color="gray">
              <IconCreditCard size={30} />
            </ThemeIcon>
            <div style={{ textAlign: 'center' }}>
              <Title order={2} mb="sm">
                No Active Subscription
              </Title>
              <Text c="dimmed" mb="xl">
                Start a subscription to access premium features
              </Text>
              <Button 
                component="a" 
                href="/pricing" 
                size="lg"
                leftSection={<IconCrown size={20} />}
              >
                View Plans
              </Button>
            </div>
          </Stack>
        </Center>
      </Container>
    )
  }

  const getPlanLabel = (planId: string) => {
    const planMap: Record<string, string> = {
      standard: 'Standard',
      professional: 'Professional',
      premium: 'Premium',
    }
    return planMap[planId] || planId
  }

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--mantine-spacing-xl)' }}>
      <Stack gap="xl" maw="1200px" mx="auto">
        {/* Header with Back Button */}
        <Group justify="space-between" align="flex-start">
          <div>
            <BackButton onClick={() => navigate(-1)}>Back</BackButton>
            <Title order={1} mt="md" mb="sm">
              {subscription.status === 'trialing' ? 'Upgrade' : `Upgrade to ${getPlanLabel(targetPlan)}`}
            </Title>
            <Text c="dimmed">
              Upgrade your subscription to unlock premium features
            </Text>
          </div>
        </Group>

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
          onSuccess={() => {
            if (returnTo) {
              navigate(returnTo)
            } else {
              navigate(-1)
            }
          }}
        />
      </Stack>
    </div>
  )
}