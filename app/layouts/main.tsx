import dayjs from 'dayjs'
import { redirect } from 'react-router'
import { USER_STATUSES } from '~/app/common/constants'
import type { INotification } from '~/app/common/validations/notificationSchema'
import { auth } from '~/app/lib/auth.server'
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
    isInactive?: boolean
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

  // Check if there's a session but user is null (inactive user case)
  if (!user) {
    const session = await auth.api.getSession({ headers: request.headers })
    
    // If there's a session but no user data, user is inactive
    if (session?.user) {
      // Find the account to get basic user info
      const account = await prisma.account.findFirst({
        where: { userId: session.user.id },
        include: {
          user: {
            include: {
              role: true,
              profile: true,
            },
          },
        },
      })
      
      if (account?.user && account.user.active === false) {
        // Return minimal data for inactive user to show modal
        return {
          user: {
            email: account.user.email,
            role: { name: account.user.role?.name || 'User', permissions: [] },
            profile: {
              firstName: account.user.profile?.firstName || '',
              lastName: account.user.profile?.lastName || '',
            },
            currentPlan: 'inactive',
            planStatus: 'inactive',
            trialPeriodDays: 0,
            isInactive: true,
            paymentMethod: null,
            subscription: null,
          },
          notifications: [],
        }
      }
    }
    
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
  // Calculate actual days remaining for trialing subscriptions
  const trialPeriodDays =
    trialing && user.subscriptions?.trialEnd
      ? Math.ceil(dayjs.unix(user.subscriptions.trialEnd).diff(dayjs(), 'day', true))
      : trialing
        ? 1 // If trialing but no trialEnd, assume at least 1 day
        : 0 // Not trialing, return 0

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
      trialEnd: user.subscriptions?.trialEnd || 0, // Pass trialEnd timestamp for expired trial detection
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
