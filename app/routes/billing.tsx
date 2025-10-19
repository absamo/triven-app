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
  
  const { subscription, invoices, upcomingInvoice, config } = loaderData
  const action = searchParams.get('action')
  const targetPlan = searchParams.get('plan') || 'professional' // Default to professional if not specified

  const getPlanLabel = (planId: string) => {
    const planMap: Record<string, string> = {
      hobby: 'Hobby',
      professional: 'Professional',
      enterprise: 'Enterprise',
    }
    return planMap[planId] || planId
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      active: 'Active',
      canceled: 'Canceled',
      incomplete: 'Incomplete',
      incomplete_expired: 'Incomplete Expired',
      past_due: 'Past Due',
      paused: 'Paused',
      trialing: 'Trial',
      unpaid: 'Unpaid',
    }
    return statusMap[status] || status
  }

  const getPaymentMethodIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return <IconBrandVisa size={20} />
      case 'mastercard':
        return <IconBrandMastercard size={20} />
      default:
        return <IconCreditCard size={20} />
    }
  }

  if (!subscription) {
    return (
      <Container size="lg" py="xl">
        <BackButton to="/settings">Back to Settings</BackButton>
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

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--mantine-spacing-xl)' }}>
      <Stack gap="xl" maw="1200px" mx="auto">
        {/* Header with Back Button */}
        <Group justify="space-between" align="flex-start">
          <div>
            <BackButton to="/settings">Back to Settings</BackButton>
            <Title order={1} mt="md" mb="sm">
              {action === 'upgrade' ? `Upgrade to ${getPlanLabel(targetPlan)}` : 'Billing & Subscription'}
            </Title>
            <Text c="dimmed">
              {action === 'upgrade' 
                ? 'Upgrade your subscription to unlock premium features'
                : 'View your subscription details, payment methods, and billing history'
              }
            </Text>
          </div>
        </Group>

        {/* Show upgrade payment form if action is upgrade */}
        {action === 'upgrade' ? (
          subscription && (
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
                navigate('/settings')
              }}
            />
          )
        ) : (
          <>
            {/* Subscription Status Alert */}
            {subscription.cancelAtPeriodEnd && (
              <Alert 
                icon={<IconAlertTriangle size={16} />} 
                title="Subscription Cancelled" 
                color="orange"
                variant="light"
              >
                <Text size="sm">
                  Your subscription will end on {dayjs.unix(subscription.currentPeriodEnd).format('MMMM D, YYYY')}.
                  Go to Settings to reactivate your subscription.
                </Text>
              </Alert>
            )}

        {/* Current Subscription */}
        <Card padding="xl" radius="md" withBorder>
          <Group justify="space-between" mb="lg">
            <Group>
              <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                <IconCrown size={20} />
              </ThemeIcon>
              <div>
                <Text size="lg" fw={600}>
                  Current Subscription
                </Text>
                <Text size="sm" c="dimmed">
                  {getPlanLabel(subscription.planId)}
                </Text>
              </div>
            </Group>
          </Group>

          <Stack gap="md">
            {/* Plan */}
            <Group justify="space-between">
              <Text size="sm" c="dimmed" fw={500}>
                Plan
              </Text>
              <Text size="sm" fw={600}>
                {getPlanLabel(subscription.planId)}
              </Text>
            </Group>

            <Divider />

            {/* Status */}
            <Group justify="space-between">
              <Text size="sm" c="dimmed" fw={500}>
                Status
              </Text>
              <Badge
                size="sm"
                color={subscription.status === 'active' ? 'teal' : 'red'}
                variant="outline"
              >
                {getStatusLabel(subscription.status)}
              </Badge>
            </Group>

            <Divider />

            {/* Price */}
            <Group justify="space-between">
              <Text size="sm" c="dimmed" fw={500}>
                Price
              </Text>
              <Group gap={4} align="baseline">
                <Text size="sm" fw={600}>
                  ${(subscription.amount / 100).toFixed(2)}
                </Text>
                <Text size="xs" c="dimmed">
                  {subscription.currency.toUpperCase()} / {subscription.interval === 'month' ? 'monthly' : 'yearly'}
                </Text>
              </Group>
            </Group>

            <Divider />

            {/* Next Billing */}
            <Group justify="space-between">
              <Text size="sm" c="dimmed" fw={500}>
                {subscription.status === 'trialing' ? 'Trial Ends' : 'Next Billing'}
              </Text>
              <Text size="sm" fw={600}>
                {dayjs.unix(
                  subscription.status === 'trialing' 
                    ? subscription.trialEnd 
                    : subscription.currentPeriodEnd
                ).format('MMMM D, YYYY')}
              </Text>
            </Group>
          </Stack>
        </Card>

        {/* Payment Method */}
        {subscription.paymentMethod && (
          <Card padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={600}>
                Payment Method
              </Text>
            </Group>
            
            <Paper p="md" withBorder>
              <Group justify="space-between">
                <Group>
                  {getPaymentMethodIcon(subscription.paymentMethod.brand)}
                  <div>
                    <Text size="sm" fw={500} tt="capitalize">
                      {subscription.paymentMethod.brand}
                    </Text>
                    <Text size="xs" c="dimmed">
                      •••• •••• •••• {subscription.paymentMethod.last4}
                    </Text>
                  </div>
                </Group>
                <Badge variant="outline" color="gray">
                  {String(subscription.paymentMethod.expMonth).padStart(2, '0')}/
                  {subscription.paymentMethod.expYear}
                </Badge>
              </Group>
            </Paper>
          </Card>
        )}

        {/* Invoice History */}
        {invoices.length > 0 && (
          <Card padding="lg" radius="md" withBorder>
            <Text size="lg" fw={600} mb="md">
              Invoice History
            </Text>
            
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Invoice</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {invoices.map((invoice) => (
                  <Table.Tr key={invoice.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {invoice.number || invoice.id.slice(-8)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {dayjs.unix(invoice.created).format('MMM D, YYYY')}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} align="baseline">
                        <Text size="sm" fw={500}>
                          ${((invoice.amount_paid || invoice.amount_due) / 100).toFixed(2)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {invoice.currency.toUpperCase()}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        color={invoice.status === 'paid' ? 'teal' : 'red'}
                        variant="outline"
                      >
                        {invoice.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {(invoice.hosted_invoice_url || invoice.invoice_pdf) && (
                        <ActionIcon
                          component="a"
                          href={invoice.invoice_pdf || invoice.hosted_invoice_url || ''}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                          variant="subtle"
                        >
                          <IconDownload size={16} />
                        </ActionIcon>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        )}
          </>
        )}
      </Stack>
    </div>
  )
}