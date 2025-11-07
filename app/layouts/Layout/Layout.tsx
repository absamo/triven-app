import {
  ActionIcon,
  AppShell,
  Burger,
  Center,
  Container,
  Flex,
  LoadingOverlay,
  Overlay,
  ScrollArea,
  useMantineTheme,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import clsx from 'clsx'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate, useNavigation, useRevalidator } from 'react-router'
import { STRIPE_SUBSCRIPTION_STATUSES, SUBSCRIPTION_MODAL_MODES } from '~/app/common/constants'
import { canUpgrade } from '~/app/common/helpers/payment'
import type { INotification } from '~/app/common/validations/notificationSchema'
import type { IProfile } from '~/app/common/validations/profileSchema'
import type { IRole } from '~/app/common/validations/roleSchema'
import { SubscriptionStatusModal, UpgradePaymentModal } from '~/app/components'
import ScrollToTop from '~/app/components/ScrollToTop'
import TrialAlert from '~/app/components/TrialAlert'
import { FormProvider, useFormContext } from '~/app/contexts/FormContext'
import { useSessionBasedOnlineStatus } from '~/app/lib/hooks/useSessionBasedOnlineStatus'
import { calculateTrialStatus, getTrialAlertConfig } from '~/app/utils/subscription'
import { useRootLoaderData } from '~/app/utils/useDetectedLanguage'
import Footer from '../Footer/Footer'
import Header from '../Header/Header'
import Navbar from '../Navbar'
import classes from './Layout.module.css'

// Singleton EventSource manager to prevent duplicate connections
class SubscriptionStreamManager {
  private static instance: SubscriptionStreamManager | null = null
  private eventSource: EventSource | null = null
  private listeners: Set<(data: any) => void> = new Set()
  private connectionCount = 0

  private constructor() {}

  static getInstance(): SubscriptionStreamManager {
    if (!SubscriptionStreamManager.instance) {
      SubscriptionStreamManager.instance = new SubscriptionStreamManager()
    }
    return SubscriptionStreamManager.instance
  }

  connect(): void {
    this.connectionCount++

    if (this.eventSource) {
      // Connection already exists
      return
    }

    this.eventSource = new EventSource('/api/subscription-stream')

    this.eventSource.addEventListener('connected', () => {
      console.log('[SubscriptionStream] Connected')
    })

    this.eventSource.addEventListener('subscription', (event) => {
      try {
        const data = JSON.parse(event.data)
        this.listeners.forEach((listener) => listener(data))
      } catch (error) {
        console.error('[SubscriptionStream] Error parsing subscription update:', error)
      }
    })

    this.eventSource.onerror = (error) => {
      console.error('[SubscriptionStream] EventSource error:', error)
    }
  }

  disconnect(): void {
    this.connectionCount--

    // Only close if no more listeners
    if (this.connectionCount <= 0 && this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.connectionCount = 0
      console.log('[SubscriptionStream] Disconnected')
    }
  }

  addListener(listener: (data: any) => void): void {
    this.listeners.add(listener)
  }

  removeListener(listener: (data: any) => void): void {
    this.listeners.delete(listener)
  }
}

// Component to handle footer visibility based on form context
function FooterWrapper() {
  const { isFormActive } = useFormContext()

  return isFormActive ? (
    <AppShell.Footer>
      <Footer />
    </AppShell.Footer>
  ) : null
}

// Component to handle the AppShell with dynamic footer configuration
function LayoutContent({ user, notifications }: LayoutPageProps) {
  const { isFormActive } = useFormContext()
  const theme = useMantineTheme()
  useTranslation(['navigation'])

  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Import the IMenu type from Navbar
  type IMenu = {
    label: string
    icon: React.ComponentType<{ size?: number; stroke?: number }>
    link?: string
    active?: boolean
    sublinks?: { label: string; link: string; active: boolean }[]
  }

  const [isOverlayOpened, setIsOverlayOpened] = useState<boolean>(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Track online status using Better Auth sessions
  useSessionBasedOnlineStatus({
    updateInterval: 60000, // Update every minute
    enabled: true,
  })

  // Real-time subscription updates via SSE
  const revalidator = useRevalidator()
  const pendingUpgradeRef = useRef<boolean>(false)

  // Initialize subscription status from user prop, then update via SSE
  const [subscriptionStatus, setSubscriptionStatus] = useState(() => {
    // Use trialEnd from database if available, otherwise calculate from trialPeriodDays
    const trialEnd = user.trialEnd || 
      (user.planStatus === STRIPE_SUBSCRIPTION_STATUSES.TRIALING && user.trialPeriodDays > 0
        ? Math.floor(dayjs().add(user.trialPeriodDays, 'days').valueOf() / 1000)
        : 0)
    return {
      status: user.planStatus,
      trialEnd,
    }
  })

  // Sync subscription status when user prop changes (from revalidation)
  // IMPORTANT: Don't sync during pending upgrade - we need to wait for the confirmed SSE event
  useEffect(() => {
    // Skip sync if we're waiting for upgrade confirmation
    if (pendingUpgradeRef.current) {
      return
    }

    // Use trialEnd from database if available, otherwise calculate from trialPeriodDays
    const trialEnd = user.trialEnd || 
      (user.planStatus === STRIPE_SUBSCRIPTION_STATUSES.TRIALING && user.trialPeriodDays > 0
        ? Math.floor(dayjs().add(user.trialPeriodDays, 'days').valueOf() / 1000)
        : 0)
    setSubscriptionStatus({
      status: user.planStatus,
      trialEnd,
    })
  }, [user.planStatus, user.trialPeriodDays, user.trialEnd])

  useEffect(() => {
    const manager = SubscriptionStreamManager.getInstance()

    // Create listener function
    const handleSubscriptionUpdate = (data: any) => {
      // Update local state immediately for instant UI update
      // Note: We trust all subscription updates from the server since SSE is user-specific
      if (data.type === 'subscription') {
        setSubscriptionStatus({
          status: data.status,
          trialEnd: data.trialEnd,
        })

        // If we're waiting for upgrade completion and this is the CONFIRMED update with active status
        if (
          pendingUpgradeRef.current &&
          data.confirmed === true &&
          data.status === 'active' &&
          data.trialEnd === 0
        ) {
          // Clear pending flag - upgrade is complete
          pendingUpgradeRef.current = false
          // Close the upgrade modal now that subscription is confirmed active
          setShowUpgradeModal(false)
          // Redirect to settings page to show successful upgrade
          navigate('/settings')
        }

        // Revalidate to fetch fresh data from server
        revalidator.revalidate()
      }
    }

    // Connect and add listener
    manager.connect()
    manager.addListener(handleSubscriptionUpdate)

    // Cleanup on unmount
    return () => {
      manager.removeListener(handleSubscriptionUpdate)
      manager.disconnect()
    }
  }, [revalidator])

  // Get initial navbar state from root loader (cookies)
  const { showMiniNavbar: initialShowMiniNavbar } = useRootLoaderData()
  const [showMiniNavbar, setShowMiniNavbar] = useState(initialShowMiniNavbar)

  const [activeMenuItem, setActiveMenuItem] = useState<IMenu | undefined>()

  const { state } = useNavigation()

  const [currentState, setCurrentState] = useState(state)
  const [loadingTime, setLoadingTime] = useState(0)
  const [opened, { toggle }] = useDisclosure()

  useEffect(() => {
    let loadingStartTime = 0
    setCurrentState(state)
    if (currentState === 'loading') {
      loadingStartTime = dayjs().millisecond()
    } else if (currentState === 'idle') {
      const loadingEndTime = dayjs().millisecond()

      setLoadingTime(loadingEndTime - loadingStartTime)
    }
  }, [currentState, state])

  // Handle hydration flag
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleShowNotification = (opened: boolean) => {
    setIsOverlayOpened(opened)
  }

  const handleToggleNavbar = () => {
    const newValue = !showMiniNavbar
    setShowMiniNavbar(newValue)

    // Save to cookie with 1 year expiration
    if (typeof document !== 'undefined') {
      const expires = new Date()
      expires.setFullYear(expires.getFullYear() + 1)
      document.cookie = `showMiniNavbar=${newValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
    }
  }

  // Check if paused subscription is from an expired trial (define first)
  const isPausedFromExpiredTrial =
    subscriptionStatus.status === STRIPE_SUBSCRIPTION_STATUSES.PAUSED &&
    subscriptionStatus.trialEnd > 0 &&
    subscriptionStatus.trialEnd <= Math.floor(Date.now() / 1000)

  const trialing = subscriptionStatus.status === STRIPE_SUBSCRIPTION_STATUSES.TRIALING
  const trialExpired = (trialing && user.trialPeriodDays <= 0) || isPausedFromExpiredTrial

  // Suppress all blocking modals when payment is being processed
  const isPendingPayment = pendingUpgradeRef.current

  // Suppress other modals when trial is expired to prevent modal switching during payment
  const incompleteSubscription =
    subscriptionStatus.status === STRIPE_SUBSCRIPTION_STATUSES.INCOMPLETE && !isPendingPayment && !trialExpired
  const cancelledSubscription = subscriptionStatus.status === STRIPE_SUBSCRIPTION_STATUSES.CANCELED && !isPendingPayment && !trialExpired
  const pastDueSubscription = subscriptionStatus.status === STRIPE_SUBSCRIPTION_STATUSES.PAST_DUE && !isPendingPayment && !trialExpired
  const unpaidSubscription = subscriptionStatus.status === STRIPE_SUBSCRIPTION_STATUSES.UNPAID && !isPendingPayment && !trialExpired
  const incompleteExpiredSubscription =
    subscriptionStatus.status === STRIPE_SUBSCRIPTION_STATUSES.INCOMPLETE_EXPIRED && !isPendingPayment && !trialExpired
  
  // Only show paused modal if it's NOT from an expired trial and NOT pending payment
  const pausedSubscription =
    subscriptionStatus.status === STRIPE_SUBSCRIPTION_STATUSES.PAUSED && !isPausedFromExpiredTrial && !isPendingPayment && !trialExpired

  // Handle users with no active subscription (inactive, null, undefined, etc.)
  const noActiveSubscription =
    !subscriptionStatus.status ||
    subscriptionStatus.status === 'inactive' ||
    subscriptionStatus.status === 'null' ||
    subscriptionStatus.status === 'undefined'

  // Log when Payment Declined modals open/close
  useEffect(() => {
    if (pastDueSubscription) {
      console.log('🚨 [Layout] Payment Declined modal OPENED (past_due)')
    } else {
      console.log('✅ [Layout] Payment Declined modal CLOSED (past_due)')
    }
  }, [pastDueSubscription])

  useEffect(() => {
    if (unpaidSubscription) {
      console.log('🚨 [Layout] Payment Declined modal OPENED (unpaid)')
    } else {
      console.log('✅ [Layout] Payment Declined modal CLOSED (unpaid)')
    }
  }, [unpaidSubscription])

  // Calculate trial status using new utilities
  const trialStatus = calculateTrialStatus({
    status: subscriptionStatus.status,
    trialEnd: subscriptionStatus.trialEnd,
  })

  const trialAlertConfig = getTrialAlertConfig(
    trialStatus,
    canUpgrade(user.currentPlan, subscriptionStatus.status)
  )

  // const HEADER_BASE_HEIGHT = 70
  // const TRIAL_BANNER_HEIGHT = 60
  // const headerHeight = hasActiveTrialBanner
  //   ? HEADER_BASE_HEIGHT + TRIAL_BANNER_HEIGHT
  //   : HEADER_BASE_HEIGHT

  const navigate = useNavigate()
  const location = useLocation()

  const handleUpgradeClick = () => {
    // Pass current location as returnTo parameter
    const returnPath = location.pathname + location.search
    navigate(`/billing?returnTo=${encodeURIComponent(returnPath)}`)
  }

  // Handle upgrade success - set flag for SSE tracking
  const handleUpgradeSuccess = () => {
    // Set flag to indicate payment succeeded, waiting for final confirmation
    pendingUpgradeRef.current = true

    // Keep modal open - it will show loading state while waiting for confirmation
    // Modal will close when SSE confirms active status
    // Don't close modal here - let the pending state handle it
  }

  // Handle payment start - set flag as soon as payment process begins
  const handlePaymentStart = () => {
    pendingUpgradeRef.current = true
  }

  // Handle modal close
  const handleModalClose = () => {
    setShowUpgradeModal(false)
    // Reset pending flag when manually closing
    pendingUpgradeRef.current = false
  }

  return (
    <>
      <AppShell
        transitionDuration={300}
        transitionTimingFunction="ease"
        padding="lg"
        header={{ height: 70 }}
        footer={isFormActive ? { height: 70 } : undefined}
        navbar={{
          width: showMiniNavbar ? 85 : 280,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        className={classes.appShell}
        styles={{
          main: {
            transition: 'padding-left 300ms ease',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        //layout="alt"
        suppressHydrationWarning
      >
        <AppShell.Header className={classes.header}>
          <Flex align="center" justify="space-between" className={classes.headerBar}>
            <Flex align="center" gap="md" style={{ position: 'absolute', left: 20 }}>
              <Burger
                opened={!opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
                color={theme.colors.blue[6]}
              />
            </Flex>
            <Header
              showNotification={handleShowNotification}
              user={{
                ...user,
                profile: {
                  ...user.profile,
                  avatar: user.profile.avatar ?? undefined,
                },
              }}
              notifications={notifications}
            />
          </Flex>
        </AppShell.Header>

        <AppShell.Navbar
          className={clsx(classes.navbar, {
            [classes.mini]: showMiniNavbar,
          })}
          suppressHydrationWarning
        >
          <AppShell.Section component={ScrollArea} type="scroll" h={'100%'}>
            <Navbar
              permissions={user.role?.permissions || []}
              showMiniNavbar={showMiniNavbar}
              activeMenuItem={activeMenuItem}
              onClick={(item) => setActiveMenuItem(item)}
              onToggle={handleToggleNavbar}
            />
          </AppShell.Section>

          {/* Toggle button positioned at the bottom of navbar */}
          <ActionIcon
            size="lg"
            onClick={handleToggleNavbar}
            className={classes.toggleButton}
            disabled={!isHydrated}
          >
            {showMiniNavbar ? (
              <IconChevronRight size={20} stroke={2.5} className={classes.toggleIcon} />
            ) : (
              <IconChevronLeft size={20} stroke={2.5} className={classes.toggleIcon} />
            )}
          </ActionIcon>
        </AppShell.Navbar>
        <AppShell.Main
          className={classes.main}
          data-trial-banner={
            trialAlertConfig.visible && !location.pathname.startsWith('/billing')
              ? 'visible'
              : 'hidden'
          }
        >
          {/* Trial Alert at top of main section */}
          {trialAlertConfig.visible && !location.pathname.startsWith('/billing') && (
            <TrialAlert
              daysRemaining={trialStatus.daysRemaining}
              urgencyLevel={trialStatus.urgencyLevel}
              onUpgradeClick={handleUpgradeClick}
              showUpgradeButton={trialAlertConfig.showUpgradeButton}
              position="banner"
            />
          )}

          {loadingTime > 1000 && currentState === 'loading' ? (
            <Center>
              <LoadingOverlay
                visible
                zIndex={2}
                overlayProps={{ radius: 'sm', blur: 2 }}
                ml={260}
              />
            </Center>
          ) : (
            <>
              <Container fluid className={classes.container} style={{ flex: 1 }}>
                <Outlet />
              </Container>
            </>
          )}
        </AppShell.Main>
        <FooterWrapper />
      </AppShell>

      {/* Always visible scroll to top button */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          ...(isFormActive
            ? { left: '50%', transform: 'translateX(-50%)' } // Centered when form is active
            : { right: '20px' }), // Right side when no form is active
          zIndex: 1000,
        }}
      >
        <ScrollToTop />
      </div>

      {isOverlayOpened && <Overlay backgroundOpacity={0.2} fixed />}

      {/* No Active Subscription Modal - blocks access when no subscription exists */}
      <SubscriptionStatusModal
        opened={noActiveSubscription && !isPendingPayment}
        currentPlan={user.currentPlan}
        mode={SUBSCRIPTION_MODAL_MODES.NO_SUBSCRIPTION}
      />

      {/* Trial Expiration Modal - blocks access when trial has expired */}
      <SubscriptionStatusModal
        opened={trialExpired}
        currentPlan={user.currentPlan}
        mode={SUBSCRIPTION_MODAL_MODES.TRIAL_EXPIRED}
        onPaymentStart={handlePaymentStart}
      />
      {trialExpired && console.log('🚪 [Layout] Trial Expired Modal OPENED')}
      {!trialExpired && console.log('🚪 [Layout] Trial Expired Modal CLOSED')}

      {/* Incomplete Subscription Modal - blocks access when subscription is incomplete */}
      <SubscriptionStatusModal
        opened={incompleteSubscription}
        currentPlan={user.currentPlan}
        mode={SUBSCRIPTION_MODAL_MODES.INCOMPLETE}
      />

      {/* Cancelled Subscription Modal - blocks access when subscription is cancelled */}
      <SubscriptionStatusModal
        opened={cancelledSubscription}
        currentPlan={user.currentPlan}
        mode={SUBSCRIPTION_MODAL_MODES.CANCELED}
      />

      {/* Past Due Subscription Modal - blocks access when payment is past due */}
      <SubscriptionStatusModal
        opened={pastDueSubscription}
        currentPlan={user.currentPlan}
        mode={SUBSCRIPTION_MODAL_MODES.PAST_DUE}
        subscription={user.subscription || undefined}
      />

      {/* Unpaid Subscription Modal - blocks access when subscription is unpaid */}
      <SubscriptionStatusModal
        opened={unpaidSubscription}
        currentPlan={user.currentPlan}
        mode={SUBSCRIPTION_MODAL_MODES.UNPAID}
        subscription={user.subscription || undefined}
      />

      {/* Incomplete Expired Subscription Modal */}
      <SubscriptionStatusModal
        opened={incompleteExpiredSubscription}
        currentPlan={user.currentPlan}
        mode={SUBSCRIPTION_MODAL_MODES.INCOMPLETE_EXPIRED}
      />

      {/* Paused Subscription Modal */}
      <SubscriptionStatusModal
        opened={pausedSubscription}
        currentPlan={user.currentPlan}
        mode={SUBSCRIPTION_MODAL_MODES.PAUSED}
      />

      {/* Upgrade Payment Modal */}
      <UpgradePaymentModal
        opened={showUpgradeModal}
        onClose={handleModalClose}
        onSuccess={handleUpgradeSuccess}
        userPlanStatus={user.planStatus}
        billing={{
          currentPlan: user.currentPlan,
          planStatus: user.planStatus,
          interval: 'month', // Default for layout context
          currency: 'USD', // Default for layout context
          paymentMethod: user.paymentMethod,
        }}
      />
    </>
  )
}

type LayoutPageProps = {
  user: {
    email: string
    role: IRole
    profile: IProfile
    planStatus: string
    trialPeriodDays: number
    trialEnd: number // Add trialEnd timestamp
    currentPlan: string
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

export default function LayoutPage({ user, notifications }: LayoutPageProps) {
  // Form state management
  const [isFormActive, setIsFormActive] = useState(false)
  const [formOnSubmit] = useState<React.FormEventHandler<HTMLFormElement> | undefined>(undefined)

  const { state } = useNavigation()

  return (
    <FormProvider
      isFormActive={isFormActive}
      setIsFormActive={setIsFormActive}
      onSubmit={formOnSubmit}
      isSubmitting={state === 'submitting'}
    >
      <LayoutContent user={user} notifications={notifications} />
    </FormProvider>
  )
}
