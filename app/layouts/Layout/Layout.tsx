import {
  ActionIcon,
  Alert,
  AppShell,
  Burger,
  Center,
  Container,
  Flex,
  LoadingOverlay,
  Overlay,
  ScrollArea,
  Text,
  useMantineTheme
} from "@mantine/core"
import { useDisclosure, useMediaQuery } from "@mantine/hooks"
import {
  IconChevronLeft,
  IconChevronRight,
  IconInfoCircle,
} from "@tabler/icons-react"
import clsx from "clsx"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { Outlet, useNavigation } from "react-router"
import type { INotification } from "~/app/common/validations/notificationSchema"
import type { IProfile } from "~/app/common/validations/profileSchema"
import type { IRole } from "~/app/common/validations/roleSchema"
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

  // const theme = useMantineTheme()
  const theme = useMantineTheme()
  const isSmallScreen = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const trialing = user.planStatus === "trialing"

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
          <Flex align="center" justify="space-between">
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
              {trialing && (
                <Alert
                  variant="light"
                  color={user.trialPeriodDays > 0 ? "orange" : "red"}
                  icon={<IconInfoCircle />}
                  mb={20}
                >
                  {user.trialPeriodDays > 0 ? (
                    <Text size="sm">
                      Your trial expires in{" "}
                      <strong>{user.trialPeriodDays} days</strong>. To maintain
                      access to all features, upgrade your plan to
                      <Text tt="capitalize" size="sm" component="span">
                        <strong> {user.currentPlan}</strong>
                      </Text>
                    </Text>
                  ) : (
                    <Text size="sm">
                      Your trial has expired. To maintain access to all
                      features, upgrade your plan to
                      <Text tt="capitalize" size="sm" component="span">
                        <strong> {user.currentPlan}</strong>
                      </Text>
                    </Text>
                  )}
                </Alert>
              )}
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
