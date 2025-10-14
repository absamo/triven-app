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

  const trialing = user.subscriptions?.status === 'trialing'
  const trialPeriodDays =
    trialing && user.subscriptions?.trialEnd
      ? dayjs(user.subscriptions.trialEnd * 1000).diff(dayjs(), 'days')
      : undefined

  // Fetch payment method and subscription details if user has a subscription
  let paymentMethod = null
  let subscriptionData = null
  if (user.id) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
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
        amount: subscription.amount,
        currency: subscription.currency?.toUpperCase() || 'USD',
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
      trialPeriodDays: trialPeriodDays || 0,
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
