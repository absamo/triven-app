import dayjs from 'dayjs'
import { redirect } from 'react-router'
import { USER_STATUSES } from '~/app/common/constants'
import type { INotification } from '~/app/common/validations/notificationSchema'
import { prisma } from '~/app/db.server'
import { getBetterAuthUser } from '~/app/services/better-auth.server'
import { getNotifications } from '~/app/services/notifications.server'
import type { Route } from './+types/main'
import Layout from './Layout'

type LoaderData = {
  user: {
    email: string
    role: { name: string; permissions: string[] }
    image?: string
    profile: { firstName: string; lastName: string; avatar?: string }
    currentPlan: string
    planStatus: string
    trialPeriodDays: number
    paymentMethod?: {
      last4: string
      brand: string
      expMonth: number
      expYear: number
    } | null
    subscription?: {
      id: string
      planId: string
      interval: string
      amount: number
      currency: string
    } | null
  }
  notifications: INotification[]
}

export async function loader({ request }: Route.LoaderArgs) {
  // Get better-auth user with linked business data
  const user = await getBetterAuthUser(request)

  if (!user) {
    return redirect('/')
  }

  // Check if user needs business setup
  if (user.status === USER_STATUSES.PENDING_BUSINESS_SETUP) {
    return redirect('/auth/business-setup')
  }

  // Check if user has the necessary business relationships
  if (!user.role || !user.company || !user.agency) {
    return redirect('/auth/business-setup')
  }

  const notifications = ((await getNotifications(request, { read: false })) ||
    []) as unknown as INotification[]

  // Debug: Log subscription data
  console.log('🔍 [Layout Loader] Subscription Debug:', {
    status: user.subscriptions?.status,
    trialEnd: user.subscriptions?.trialEnd,
    trialEndDate: user.subscriptions?.trialEnd
      ? new Date(user.subscriptions.trialEnd * 1000).toISOString()
      : 'No trialEnd',
    now: new Date().toISOString(),
  })

  const trialing = user.subscriptions?.status === 'trialing'
  // Calculate actual days remaining for trialing subscriptions
  const trialPeriodDays =
    trialing && user.subscriptions?.trialEnd
      ? Math.ceil(dayjs.unix(user.subscriptions.trialEnd).diff(dayjs(), 'day', true))
      : trialing
        ? 1 // If trialing but no trialEnd, assume at least 1 day
        : 0 // Not trialing, return 0

  console.log('🔍 [Layout Loader] Calculated trialPeriodDays:', trialPeriodDays)
  console.log('🔍 [Layout Loader] trialing:', trialing)
  console.log('🔍 [Layout Loader] Should show modal:', trialing && trialPeriodDays <= 0)

  // Fetch payment method and subscription details if user has a subscription
  let paymentMethod = null
  let subscriptionData = null
  if (user.id) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
      },
      include: {
        price: true, // Include price relation to get amount and currency
      },
    })

    if (subscription) {
      // Extract payment method info
      if (subscription.last4) {
        paymentMethod = {
          last4: subscription.last4,
          brand: subscription.brand || 'card',
          expMonth: subscription.expMonth || 0,
          expYear: subscription.expYear || 0,
        }
      }

      // Extract subscription info for payment updates
      subscriptionData = {
        id: subscription.id,
        planId: subscription.planId,
        interval: subscription.interval,
        amount: subscription.price.amount,
        currency: subscription.price.currency.toUpperCase(),
      }
    }
  }

  return {
    user: {
      email: user.email,
      role: { name: user.role.name, permissions: user.role.permissions },
      image: user.image,
      profile: {
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        avatar: user.profile?.avatar,
      },
      currentPlan: user.subscriptions?.planId || 'free',
      planStatus: user.subscriptions?.status || 'inactive',
      trialPeriodDays: trialPeriodDays,
      paymentMethod,
      subscription: subscriptionData,
    },
    notifications,
  }
}

export default function MainLayout({ loaderData }: Route.ComponentProps) {
  const { user, notifications } = loaderData as LoaderData
  return <Layout user={user} notifications={notifications} />
}
