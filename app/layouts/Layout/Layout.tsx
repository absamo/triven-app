import {
  ActionIcon,
  Alert,
  AppShell,
  Burger,
  Button,
  Center,
  Container,
  Flex,
  Group,
  LoadingOverlay,
  Overlay,
  ScrollArea,
  Text,
  useMantineTheme,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconChevronLeft, IconChevronRight, IconCrown } from '@tabler/icons-react'
import clsx from 'clsx'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useNavigation, useRevalidator } from 'react-router'
import { STRIPE_SUBSCRIPTION_STATUSES, SUBSCRIPTION_MODAL_MODES } from '~/app/common/constants'
import { canUpgrade, shouldShowUpgrade } from '~/app/common/helpers/payment'
import type { INotification } from '~/app/common/validations/notificationSchema'
import type { IProfile } from '~/app/common/validations/profileSchema'
import type { IRole } from '~/app/common/validations/roleSchema'
import { SubscriptionStatusModal, UpgradePaymentModal } from '~/app/components'
import ScrollToTop from '~/app/components/ScrollToTop'
import { FormProvider, useFormContext } from '~/app/contexts/FormContext'
import { useSessionBasedOnlineStatus } from '~/app/lib/hooks/useSessionBasedOnlineStatus'
import { useStripeHealth } from '~/app/lib/hooks/useStripeHealth'
import { useRootLoaderData } from '~/app/utils/useDetectedLanguage'
import Footer from '../Footer/Footer'
import Header from '../Header/Header'
import Navbar from '../Navbar'
import classes from './Layout.module.css'

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
  const { t } = useTranslation(['navigation'])
  const { checkStripeHealth, isChecking } = useStripeHealth()

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
  const eventSourceRef = useRef<EventSource | null>(null)
  const revalidator = useRevalidator()
  const pendingUpgradeRef = useRef<boolean>(false)

  // Initialize subscription status from user prop, then update via SSE
  const [subscriptionStatus, setSubscriptionStatus] = useState(() => {
    const trialEnd =
      user.planStatus === STRIPE_SUBSCRIPTION_STATUSES.TRIALING && user.trialPeriodDays > 0
        ? Math.floor(dayjs().add(user.trialPeriodDays, 'days').valueOf() / 1000)
        : 0
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

    const trialEnd =
      user.planStatus === STRIPE_SUBSCRIPTION_STATUSES.TRIALING && user.trialPeriodDays > 0
        ? Math.floor(dayjs().add(user.trialPeriodDays, 'days').valueOf() / 1000)
        : 0
    setSubscriptionStatus({
      status: user.planStatus,
      trialEnd,
    })
  }, [user.planStatus, user.trialPeriodDays])

  useEffect(() => {
    // Prevent duplicate connections
    if (eventSourceRef.current) {
      return
    }

    // Connect to subscription SSE stream
    const eventSource = new EventSource('/api/subscription-stream')
    eventSourceRef.current = eventSource

    eventSource.addEventListener('connected', () => {
      // Connected to subscription stream
    })

    eventSource.addEventListener('subscription', (event) => {
      try {
        const data = JSON.parse(event.data)

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
            setShowUpgradeModal(false)
            pendingUpgradeRef.current = false
          }

          // Revalidate to fetch fresh data from server
          revalidator.revalidate()
        }
      } catch (error) {
        console.error('[Layout] Error parsing subscription update:', error)
      }
    })

    eventSource.onerror = (error) => {
      console.error('[Layout] EventSource error:', error)
    }

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only create connection once on mount

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

  const trialing = subscriptionStatus.status === STRIPE_SUBSCRIPTION_STATUSES.TRIALING
  const trialExpired = trialing && user.trialPeriodDays <= 0
  const incompleteSubscription =
    subscriptionStatus.status === STRIPE_SUBSCRIPTION_STATUSES.INCOMPLETE
  const cancelledSubscription = subscriptionStatus.status === STRIPE_SUBSCRIPTION_STATUSES.CANCELED
  const pastDueSubscription = subscriptionStatus.status === STRIPE_SUBSCRIPTION_STATUSES.PAST_DUE
  const unpaidSubscription = subscriptionStatus.status === STRIPE_SUBSCRIPTION_STATUSES.UNPAID
  const incompleteExpiredSubscription =
    subscriptionStatus.status === STRIPE_SUBSCRIPTION_STATUSES.INCOMPLETE_EXPIRED
  const pausedSubscription = subscriptionStatus.status === STRIPE_SUBSCRIPTION_STATUSES.PAUSED

  // Handle users with no active subscription (inactive, null, undefined, etc.)
  const noActiveSubscription =
    !subscriptionStatus.status ||
    subscriptionStatus.status === 'inactive' ||
    subscriptionStatus.status === 'null' ||
    subscriptionStatus.status === 'undefined'

  // Calculate trial days from trialEnd timestamp
  const trialPeriodDays =
    trialing && subscriptionStatus.trialEnd > 0
      ? Math.max(0, dayjs(subscriptionStatus.trialEnd * 1000).diff(dayjs(), 'days'))
      : 0

  const hasActiveTrialBanner = trialing && trialPeriodDays > 0

  const showUpgradeCta =
    shouldShowUpgrade(subscriptionStatus.status) &&
    canUpgrade(user.currentPlan, subscriptionStatus.status)

  const HEADER_BASE_HEIGHT = 70
  const TRIAL_BANNER_HEIGHT = 60
  const headerHeight = hasActiveTrialBanner
    ? HEADER_BASE_HEIGHT + TRIAL_BANNER_HEIGHT
    : HEADER_BASE_HEIGHT

  const handleUpgradeClick = async () => {
    const isHealthy = await checkStripeHealth()
    if (isHealthy) {
      setShowUpgradeModal(true)
    }
    // If unhealthy, the hook will show an error notification
  }

  // Handle upgrade success - set flag and wait for SSE event to close modal
  const handleUpgradeSuccess = () => {
    // Set flag to indicate we're waiting for the upgrade to complete
    pendingUpgradeRef.current = true

    // The modal will stay open until the SSE event arrives with status: 'active', trialEnd: 0
    // Then the subscription event handler will close the modal automatically
  }

  // Handle modal close - prevent closing during pending upgrade
  const handleModalClose = () => {
    if (pendingUpgradeRef.current) {
      return
    }
    setShowUpgradeModal(false)
  }

  return (
    <>
      <AppShell
        transitionDuration={300}
        transitionTimingFunction="ease"
        padding="lg"
        header={{ height: headerHeight }}
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
            <Flex align="center" gap="md">
              <Burger
                opened={!opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
                pl={20}
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
          {hasActiveTrialBanner && (
            <Alert className={classes.trialAlert} variant="light" color="orange">
              <Group justify="center" w="100%">
                <Text size="sm" fw={500}>
                  {trialPeriodDays === 1
                    ? t('navigation:trialExpiresIn1Day')
                    : t('navigation:trialExpiresInDays', { days: trialPeriodDays })}
                </Text>
                {showUpgradeCta && (
                  <Button
                    variant="filled"
                    color="orange"
                    size="xs"
                    leftSection={<IconCrown size={14} />}
                    onClick={handleUpgradeClick}
                    loading={isChecking}
                  >
                    {t('navigation:upgradeNow')}
                  </Button>
                )}
              </Group>
            </Alert>
          )}
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
        <AppShell.Main className={classes.main}>
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
        opened={noActiveSubscription}
        currentPlan={user.currentPlan}
        mode={SUBSCRIPTION_MODAL_MODES.NO_SUBSCRIPTION}
      />

      {/* Trial Expiration Modal - blocks access when trial has expired */}
      <SubscriptionStatusModal
        opened={trialExpired}
        currentPlan={user.currentPlan}
        mode={SUBSCRIPTION_MODAL_MODES.TRIAL_EXPIRED}
      />

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
