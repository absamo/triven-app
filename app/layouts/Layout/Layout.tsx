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
  useMantineTheme
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
  IconChevronLeft,
  IconChevronRight,
  IconCrown
} from "@tabler/icons-react"
import clsx from "clsx"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useNavigate, useNavigation } from "react-router"
import { canUpgrade, shouldShowUpgrade } from "~/app/common/helpers/payment"
import type { INotification } from "~/app/common/validations/notificationSchema"
import type { IProfile } from "~/app/common/validations/profileSchema"
import type { IRole } from "~/app/common/validations/roleSchema"
import { TrialExpirationModal } from "~/app/components"
import ScrollToTop from "~/app/components/ScrollToTop"
import { FormProvider, useFormContext } from "~/app/contexts/FormContext"
import { useSessionBasedOnlineStatus } from "~/app/lib/hooks/useSessionBasedOnlineStatus"
import { useRootLoaderData } from "~/app/utils/useDetectedLanguage"
import Footer from "../Footer/Footer"
import Header from "../Header/Header"
import Navbar from "../Navbar"
import classes from "./Layout.module.css"

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

  // Import the IMenu type from Navbar
  type IMenu = {
    label: string
    icon: React.FC<any>
    link?: string
    active?: boolean
    sublinks?: { label: string; link: string; active: boolean }[]
  }

  const [isOverlayOpened, setIsOverlayOpened] = useState<boolean>(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Track online status using Better Auth sessions
  useSessionBasedOnlineStatus({
    updateInterval: 60000, // Update every minute
    enabled: true
  })  // Get initial navbar state from root loader (cookies)
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
    if (currentState === "loading") {
      loadingStartTime = dayjs().millisecond()
    } else if (currentState === "idle") {
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

  const theme = useMantineTheme()
  const navigate = useNavigate()
  const { t } = useTranslation(["navigation"])

  const trialing = user.planStatus === "trialing"
  const trialExpired = trialing && user.trialPeriodDays <= 0
  const incompleteSubscription = user.planStatus === "incomplete"
  const hasActiveTrialBanner = trialing && user.trialPeriodDays > 0
  const showUpgradeCta = shouldShowUpgrade(user.planStatus) && canUpgrade(user.currentPlan, user.planStatus)

  const HEADER_BASE_HEIGHT = 70
  const TRIAL_BANNER_HEIGHT = 60
  const headerHeight = hasActiveTrialBanner ? HEADER_BASE_HEIGHT + TRIAL_BANNER_HEIGHT : HEADER_BASE_HEIGHT

  const handleUpgradeClick = () => {
    navigate("/pricing")
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
          breakpoint: "sm",
          collapsed: { mobile: !opened },
        }}
        className={classes.appShell}
        styles={{
          main: {
            transition: "padding-left 300ms ease",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
        //layout="alt"
        suppressHydrationWarning
      >
        <AppShell.Header className={classes.header}>
          {hasActiveTrialBanner && (
            <Alert
              className={classes.trialAlert}
              variant="light"
              color="orange"
            >
              <Group justify="center" w="100%" >
                <Text size="sm" fw={500}>
                  {user.trialPeriodDays === 1
                    ? t('navigation:trialExpiresIn1Day')
                    : t('navigation:trialExpiresInDays', { days: user.trialPeriodDays })
                  }
                </Text>
                {showUpgradeCta && (
                  <Button
                    variant="filled"
                    color="orange"
                    size="xs"
                    leftSection={<IconCrown size={14} />}
                    onClick={handleUpgradeClick}
                  >
                    {t('navigation:upgradeNow')}
                  </Button>
                )}
              </Group>
            </Alert>
          )}

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
                  avatar: user.profile.avatar ?? undefined
                }
              }}
              notifications={notifications}
            />
          </Flex>
        </AppShell.Header>
        <AppShell.Navbar
          className={clsx(classes.navbar, {
            [classes.mini]: showMiniNavbar
          })}
          suppressHydrationWarning
        >
          <AppShell.Section component={ScrollArea} type="scroll" h={"100%"}>
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
              <IconChevronRight
                size={20}
                stroke={2.5}
                className={classes.toggleIcon}
              />
            ) : (
              <IconChevronLeft
                size={20}
                stroke={2.5}
                className={classes.toggleIcon}
              />
            )}
          </ActionIcon>
        </AppShell.Navbar>
        <AppShell.Main className={classes.main}>
          {loadingTime > 1000 && currentState === "loading" ? (
            <Center>
              <LoadingOverlay
                visible
                zIndex={2}
                overlayProps={{ radius: "sm", blur: 2 }}
                ml={260}
              />
            </Center>
          ) : (
            <>
              <Container
                fluid
                className={classes.container}
                style={{ flex: 1 }}
              >
                <Outlet />
              </Container>
            </>
          )}
        </AppShell.Main>
        <FooterWrapper />
      </AppShell>

      {/* Always visible scroll to top button */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        ...(isFormActive
          ? { left: '50%', transform: 'translateX(-50%)' } // Centered when form is active
          : { right: '20px' } // Right side when no form is active
        ),
        zIndex: 1000
      }}>
        <ScrollToTop />
      </div>

      {isOverlayOpened && <Overlay backgroundOpacity={0.2} fixed />}

      {/* Trial Expiration Modal - blocks access when trial has expired */}
      <TrialExpirationModal
        opened={trialExpired}
        currentPlan={user.currentPlan}
        mode="trial-expired"
      />

      {/* Incomplete Subscription Modal - blocks access when subscription is incomplete */}
      <TrialExpirationModal
        opened={incompleteSubscription}
        currentPlan={user.currentPlan}
        mode="incomplete-subscription"
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
  }
  notifications: INotification[]
}

export default function LayoutPage({ user, notifications }: LayoutPageProps) {
  // Form state management
  const [isFormActive, setIsFormActive] = useState(false)
  const [formOnSubmit, setFormOnSubmit] = useState<React.FormEventHandler<HTMLFormElement> | undefined>(undefined)

  const { state } = useNavigation()

  return (
    <FormProvider
      isFormActive={isFormActive}
      setIsFormActive={setIsFormActive}
      onSubmit={formOnSubmit}
      isSubmitting={state === "submitting"}
    >
      <LayoutContent user={user} notifications={notifications} />
    </FormProvider>
  )
}
