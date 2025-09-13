import {
    Badge,
    Button,
    Card,
    Container,
    Group,
    List,
    Paper,
    Stack,
    Switch,
    Text,
    ThemeIcon,
    Title,
    useMantineColorScheme,
    useMantineTheme
} from "@mantine/core"
import {
    IconArrowRight,
    IconBuilding,
    IconChartBar,
    IconCheck,
    IconCrown,
    IconMapPin,
    IconPackage,
    IconShoppingCart,
    IconStar,
    IconTrendingUp,
    IconTruck,
    IconUsers
} from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import classes from "./Pricing.module.css"

interface PricingPlan {
    id: string
    name: string
    description: string
    monthlyPrice: number
    yearlyPrice: number
    recommended?: boolean
    popular?: boolean
    features: string[]
    limits: {
        salesOrders: string
        purchaseOrders: string
        users: number
        agencies: number
        sites: number
        reporting: string
    }
    mainFeatures: string[]
    icon: React.FC<any>
    color: string
}

export default function PricingPage() {
    const { t } = useTranslation(["pricing", "common"])
    const [isYearly, setIsYearly] = useState(false)
    const [isClient, setIsClient] = useState(false)
    const [showStickyPlans, setShowStickyPlans] = useState(false)
    const [planPositions, setPlanPositions] = useState<Array<{ left: number, width: number }>>([])
    const theme = useMantineTheme()
    const { colorScheme } = useMantineColorScheme()

    // Use a default theme for SSR, actual theme for client
    const isDark = isClient ? colorScheme === 'dark' : false // Default to light for SSR

    // Set client flag after hydration
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Handle scroll for sticky plans header and calculate positions
    useEffect(() => {
        let rafId: number | null = null
        let lastScrollY = 0
        let positionsCalculated = false

        const handleScroll = () => {
            if (rafId) return // Throttle using requestAnimationFrame

            rafId = requestAnimationFrame(() => {
                const plansSection = document.querySelector('[data-plans-section]')
                if (plansSection) {
                    const rect = plansSection.getBoundingClientRect()
                    const currentScrollY = window.scrollY

                    // Add hysteresis to prevent flickering at the boundary
                    const isScrollingDown = currentScrollY > lastScrollY
                    const threshold = isScrollingDown ? 200 : 60 // Much larger hysteresis gap
                    const shouldShowSticky = rect.top < threshold && rect.bottom > 250

                    setShowStickyPlans((prevState) => {
                        // Only update if state actually needs to change
                        if (prevState !== shouldShowSticky) {
                            // Reset positions calculation when hiding sticky
                            if (!shouldShowSticky) {
                                positionsCalculated = false
                            }
                            return shouldShowSticky
                        }
                        return prevState
                    })

                    // Calculate plan card positions only once when sticky first appears
                    if (shouldShowSticky && !positionsCalculated) {
                        const planCards = document.querySelectorAll('[data-plan]')
                        const positions: Array<{ left: number, width: number }> = []

                        planCards.forEach((card) => {
                            const cardRect = card.getBoundingClientRect()
                            positions.push({
                                left: cardRect.left,
                                width: cardRect.width
                            })
                        })

                        setPlanPositions(positions)
                        positionsCalculated = true
                    }

                    lastScrollY = currentScrollY
                }
                rafId = null
            })
        }

        const handleResize = () => {
            // Recalculate positions on window resize
            handleScroll()
        }

        if (isClient) {
            window.addEventListener('scroll', handleScroll, { passive: true })
            window.addEventListener('resize', handleResize, { passive: true })
            // Call once on mount to set initial state
            handleScroll()
            return () => {
                if (rafId) {
                    cancelAnimationFrame(rafId)
                }
                window.removeEventListener('scroll', handleScroll)
                window.removeEventListener('resize', handleResize)
            }
        }
    }, [isClient])

    const pricingPlans: PricingPlan[] = [
        {
            id: "standard",
            name: t("pricing:standard"),
            description: t("pricing:standardDescription"),
            monthlyPrice: 29,
            yearlyPrice: 19,
            features: [
                t("pricing:features.customCategories"),
                t("pricing:features.purchaseOrderManagement")
            ],
            mainFeatures: [
                t("pricing:features.companyManagement"),
                t("pricing:features.userManagement"),
                t("pricing:features.productManagement"),
                t("pricing:features.stockManagement"),
                t("pricing:features.salesOrders"),
                t("pricing:features.invoicing"),
                t("pricing:features.billsPayments"),
                t("pricing:features.multiCurrency"),
                t("pricing:features.notifications"),
                t("pricing:features.internationalization")
            ],
            limits: {
                salesOrders: "500",
                purchaseOrders: "500",
                users: 3,
                agencies: 1,
                sites: 2,
                reporting: t("pricing:basicReporting"),
            },
            icon: IconPackage,
            color: "gray",
        },
        {
            id: "professional",
            name: t("pricing:professional"),
            description: t("pricing:professionalDescription"),
            monthlyPrice: 39,
            yearlyPrice: 29,
            recommended: true,
            popular: true,
            features: [
                t("pricing:features.advancedInventory"),
                t("pricing:features.stockTransfer"),
                t("pricing:features.barcodeScanning"),
                t("pricing:features.advancedAnalytics"),
                t("pricing:features.auditTrails"),
            ],
            mainFeatures: [
                t("pricing:features.integrations")
            ],
            limits: {
                salesOrders: "1,000",
                purchaseOrders: "1,000",
                users: 10,
                agencies: 2,
                sites: 4,
                reporting: t("pricing:advancedReporting"),
            },
            icon: IconTrendingUp,
            color: "neon",
        },
        {
            id: "premium",
            name: t("pricing:premium"),
            description: t("pricing:premiumDescription"),
            monthlyPrice: 99,
            yearlyPrice: 79,
            features: [
                t("pricing:features.multiLocation"),
                t("pricing:features.stockAdjustments"),
                t("pricing:features.customWorkflows"),
                t("pricing:features.apiIntegrations"),
                t("pricing:features.phoneSupport"),
            ],
            mainFeatures: [
                t("pricing:features.aiInsights"),
                t("pricing:features.forecasting"),
                t("pricing:features.autoReordering")
            ],
            limits: {
                salesOrders: t("pricing:unlimited"),
                purchaseOrders: t("pricing:unlimited"),
                users: 20,
                agencies: 4,
                sites: 8,
                reporting: t("pricing:advancedReporting"),
            },
            icon: IconCrown,
            color: "gold",
        },
    ]

    const formatPrice = (monthly: number, yearly: number) => {
        const price = isYearly ? yearly : monthly
        return price === 0 ? "Free" : `$${price}`
    }

    const calculateSavings = (monthly: number, yearly: number) => {
        if (monthly === 0) return 0
        const yearlyTotal = yearly * 12
        const monthlyTotal = monthly * 12
        const savings = monthlyTotal - yearlyTotal
        const percentage = Math.round((savings / monthlyTotal) * 100)
        return percentage
    }

    return (
        <div
            className={isDark ? classes.root : `${classes.root} ${classes.rootLight}`}
            data-theme={isDark ? 'dark' : 'light'}
        >
            {/* Animated background elements */}
            <div className={classes.backgroundElements}>
                {/* Always render background elements but control opacity */}
                <div
                    className={classes.neonOrb}
                    style={{ opacity: isDark ? 1 : 0 }}
                ></div>
                <div
                    className={classes.neonOrb2}
                    style={{ opacity: isDark ? 1 : 0 }}
                ></div>

                {/* Light mode background elements */}
                <div
                    className={classes.lightModeOrb1}
                    style={{ opacity: isDark ? 0 : 1 }}
                ></div>
                <div
                    className={classes.lightModeOrb2}
                    style={{ opacity: isDark ? 0 : 1 }}
                ></div>
            </div>            <Container size="xl" py={80} className={classes.container}>
                {/* Header Section */}
                <Stack align="center" mb={80} className={classes.headerSection}>
                    <Title
                        order={1}
                        ta="center"
                        className={classes.mainTitle}
                        style={{
                            backgroundImage: isDark
                                ? `linear-gradient(135deg, ${theme.white} 0%, ${theme.colors.neon[6]} 100%)`
                                : `linear-gradient(135deg, ${theme.colors.dark[8]} 0%, ${theme.colors.neon[6]} 100%)`,
                        }}
                    >
                        {t("pricing:title")}
                    </Title>
                    <Text
                        size="xl"
                        ta="center"
                        maw={600}
                        c="dimmed"
                        styles={{
                            root: {
                                fontSize: '1.25rem',
                                lineHeight: 1.6
                            }
                        }}
                    >
                        {t("pricing:subtitle")}
                    </Text>
                </Stack>

                {/* Billing Toggle */}
                <Group
                    justify="center"
                    mb={60}
                    p="lg"
                    className={isDark ? classes.billingToggle : `${classes.billingToggle} ${classes.billingToggleLight}`}
                >
                    <Text size="md" fw={500} className={isDark ? classes.billingLabel : `${classes.billingLabel} ${classes.billingLabelDark}`}>
                        {t("pricing:monthly")}
                    </Text>
                    <Switch
                        size="lg"
                        checked={isYearly}
                        onChange={(event) => setIsYearly(event.currentTarget.checked)}
                        color="neon"
                        className={classes.customSwitch}
                    />
                    <Group gap={8}>
                        <Text size="md" fw={500} className={isDark ? classes.billingLabel : `${classes.billingLabel} ${classes.billingLabelDark}`}>
                            {t("pricing:yearly")}
                        </Text>
                        <Badge
                            variant="filled"
                            color="neon"
                            styles={{
                                root: {
                                    background: `linear-gradient(135deg, ${theme.colors.neon[6]} 0%, ${theme.colors.neon[7]} 100%)`,
                                    color: theme.black,
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    boxShadow: `0 0 15px ${theme.colors.neon[6]}40`
                                }
                            }}
                        >
                            {t("pricing:saveUpTo")}
                        </Badge>
                    </Group>
                </Group>

                {/* All Plans Sticky Header */}
                {showStickyPlans && (
                    <div className={`${classes.stickyPlansHeader} ${classes.stickyPlansVisible}`}>
                        <div className={classes.stickyPlansContainer}>
                            {pricingPlans.map((plan, index) => {
                                const Icon = plan.icon
                                const isPopular = plan.popular
                                const position = planPositions[index]

                                if (!position) return null

                                return (
                                    <div
                                        key={plan.id}
                                        className={classes.stickyPlanItem}
                                        style={{
                                            position: 'absolute',
                                            left: `${position.left}px`,
                                            width: `${position.width}px`,
                                        }}
                                    >
                                        <Group gap="sm" align="flex-start">
                                            <ThemeIcon
                                                size={20}
                                                radius="md"
                                                variant="light"
                                                color={isPopular ? "neon" : "gray"}
                                                className={classes.stickyPlanIcon}
                                            >
                                                <Icon size={12} />
                                            </ThemeIcon>
                                            <div style={{ flex: 1 }}>
                                                <Text size="sm" fw={600} c={isDark ? "white" : "dark"} className={classes.stickyPlanName}>
                                                    {plan.name}
                                                </Text>
                                                <Text size="xs" c="dimmed" className={classes.stickyPlanDescription} lineClamp={2}>
                                                    {plan.description}
                                                </Text>
                                                <Text size="lg" fw={800} c={isPopular ? "neon" : (isDark ? "white" : "dark")} className={classes.stickyPlanPrice}>
                                                    {formatPrice(plan.monthlyPrice, plan.yearlyPrice)}
                                                    <Text component="span" size="xs" c="dimmed" fw={400}>
                                                        /{t("pricing:month")}
                                                    </Text>
                                                </Text>
                                            </div>
                                        </Group>
                                        {isPopular && (
                                            <div className={classes.stickyPopularBadge}>
                                                Popular
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Pricing Cards */}
                <div className={classes.plansGrid} data-plans-section>
                    {pricingPlans.map((plan, index) => {
                        const Icon = plan.icon
                        const savings = calculateSavings(plan.monthlyPrice, plan.yearlyPrice)
                        const isPopular = plan.popular

                        return (
                            <Card
                                key={plan.id}
                                shadow="lg"
                                radius="xl"
                                padding="xl"
                                style={{
                                    background: isDark ? 'rgba(15, 15, 15, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                                    border: `1px solid ${isPopular
                                        ? theme.colors.neon[6]
                                        : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
                                        }`,
                                    backdropFilter: 'blur(20px)',
                                    transform: isPopular ? 'scale(1.05)' : 'scale(1)',
                                    boxShadow: isPopular
                                        ? `0 25px 50px ${theme.colors.neon[6]}25, 0 0 0 1px ${theme.colors.neon[6]}30, 0 0 60px ${theme.colors.neon[6]}20`
                                        : (isDark ? theme.shadows.lg : '0 4px 20px rgba(0, 0, 0, 0.08)')
                                }}
                                data-plan={plan.id}
                            >
                                {/* {isPopular && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: -1,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: `linear-gradient(135deg, ${theme.colors.neon[6]} 0%, ${theme.colors.neon[7]} 100%)`,
                                            color: theme.black,
                                            padding: '6px 20px',
                                            borderRadius: '0 0 12px 12px',
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            letterSpacing: '0.1em',
                                            boxShadow: `0 4px 15px ${theme.colors.neon[6]}40`
                                        }}
                                    >
                                        <Text size="xs" fw={600}>{plan.name.toUpperCase()}</Text>
                                    </div>
                                )} */}

                                <Stack
                                    gap="lg"
                                    className={classes.cardContent}
                                >
                                    {/* Plan Header */}
                                    <Stack gap="sm">
                                        <Group gap="xs" align="center">
                                            <ThemeIcon
                                                size={24}
                                                radius="md"
                                                variant="light"
                                                color={isPopular ? "neon" : "gray"}
                                                style={{
                                                    background: isPopular ? `rgba(${theme.colors.neon[6]}, 0.1)` : 'rgba(255, 255, 255, 0.05)',
                                                    border: `1px solid ${isPopular ? `rgba(${theme.colors.neon[6]}, 0.3)` : 'rgba(255, 255, 255, 0.1)'}`,
                                                    color: isPopular ? theme.colors.neon[6] : theme.white,
                                                    boxShadow: isPopular ? `0 0 20px rgba(${theme.colors.neon[6]}, 0.2)` : 'none'
                                                }}
                                            >
                                                <Icon size={16} />
                                            </ThemeIcon>
                                            <Text size="xl" fw={700} c={isDark ? "white" : "dark"}>
                                                {plan.name}
                                            </Text>
                                        </Group>
                                        <Text
                                            size="sm"
                                            c="dimmed"
                                            style={{
                                                opacity: showStickyPlans ? 0 : 1,
                                                transform: showStickyPlans ? 'translateY(-10px)' : 'translateY(0)',
                                                transition: 'all 0.3s ease',
                                                pointerEvents: showStickyPlans ? 'none' : 'auto'
                                            }}
                                        >
                                            {plan.description}
                                        </Text>
                                    </Stack>

                                    {/* Pricing */}
                                    <div
                                        style={{
                                            padding: '1.5rem 0',
                                            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                            opacity: showStickyPlans ? 0 : 1,
                                            transform: showStickyPlans ? 'translateY(-15px) scale(0.95)' : 'translateY(0) scale(1)',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            pointerEvents: showStickyPlans ? 'none' : 'auto',
                                            visibility: showStickyPlans ? 'hidden' : 'visible'
                                        }}
                                    >
                                        <Group align="baseline" gap={4}>
                                            <Text
                                                size="3rem"
                                                fw={800}
                                                c={isDark ? "white" : "dark"}
                                                style={{
                                                    lineHeight: 1,
                                                    letterSpacing: '-0.02em'
                                                }}
                                            >
                                                {formatPrice(plan.monthlyPrice, plan.yearlyPrice)}
                                            </Text>
                                            <Text size="md" c="dimmed" fw={500}>
                                                /{t("pricing:month")}
                                            </Text>
                                        </Group>
                                        <Text size="sm" c="dimmed" mt={4}>
                                            {isYearly ? t("pricing:billedAnnually") : t("pricing:noSetupFees")}
                                        </Text>
                                        {/* {isYearly && savings > 0 && (
                                            <Text size="sm" c="neon" fw={600} mt={8}>
                                                {t("pricing:savePercent", { percent: savings })}
                                            </Text>
                                        )} */}
                                    </div>

                                    {/* Plan Stats */}
                                    <Paper
                                        p="lg"
                                        radius="md"
                                        style={{
                                            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                                            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`
                                        }}
                                    >
                                        <Stack gap="md">
                                            <Group justify="space-between">
                                                <Group gap={8}>
                                                    <IconShoppingCart size={16} color={theme.colors.gray[6]} />
                                                    <Text size="sm" c="dimmed">{t("pricing:salesOrders")}</Text>
                                                </Group>
                                                <Text size="sm" fw={600} c={isDark ? "white" : "dark"}>
                                                    {plan.limits.salesOrders}
                                                </Text>
                                            </Group>

                                            <Group justify="space-between">
                                                <Group gap={8}>
                                                    <IconTruck size={16} color={theme.colors.gray[6]} />
                                                    <Text size="sm" c="dimmed">{t("pricing:purchaseOrders")}</Text>
                                                </Group>
                                                <Text size="sm" fw={600} c={isDark ? "white" : "dark"}>
                                                    {plan.limits.purchaseOrders}
                                                </Text>
                                            </Group>

                                            <Group justify="space-between">
                                                <Group gap={8}>
                                                    <IconUsers size={16} color={theme.colors.gray[6]} />
                                                    <Text size="sm" c="dimmed">{t("pricing:teamMembers")}</Text>
                                                </Group>
                                                <Text size="sm" fw={600} c={isDark ? "white" : "dark"}>
                                                    {plan.limits.users} {plan.limits.users === 1 ? t("pricing:user") : t("pricing:users")}
                                                </Text>
                                            </Group>

                                            <Group justify="space-between">
                                                <Group gap={8}>
                                                    <IconChartBar size={16} color={theme.colors.gray[6]} />
                                                    <Text size="sm" c="dimmed">{t("pricing:reporting")}</Text>
                                                </Group>
                                                <Text size="sm" fw={600} c={isDark ? "white" : "dark"}>
                                                    {plan.limits.reporting}
                                                </Text>
                                            </Group>

                                            <Group justify="space-between">
                                                <Group gap={8}>
                                                    <IconBuilding size={16} color={theme.colors.gray[6]} />
                                                    <Text size="sm" c="dimmed">{t("pricing:agencies")}</Text>
                                                </Group>
                                                <Text size="sm" fw={600} c={isDark ? "white" : "dark"}>
                                                    {plan.limits.agencies} {plan.limits.agencies === 1 ? t("pricing:agency") : t("pricing:agencies")}
                                                </Text>
                                            </Group>

                                            <Group justify="space-between">
                                                <Group gap={8}>
                                                    <IconMapPin size={16} color={theme.colors.gray[6]} />
                                                    <Text size="sm" c="dimmed">{t("pricing:sites")}</Text>
                                                </Group>
                                                <Text size="sm" fw={600} c={isDark ? "white" : "dark"}>
                                                    {plan.limits.sites} {plan.limits.sites === 1 ? t("pricing:site") : t("pricing:sites")}
                                                </Text>
                                            </Group>
                                        </Stack>
                                    </Paper>

                                    {/* Features */}
                                    <div>
                                        <Text size="sm" fw={600} c={isDark ? "white" : "dark"} mb="md">
                                            {plan.id === "standard" ? t("pricing:whatsIncluded") : plan.id === "professional" ? t("pricing:everythingInStandard") : t("pricing:everythingInProfessional")}
                                        </Text>
                                        <List
                                            spacing="sm"
                                            size="sm"
                                            icon={
                                                <ThemeIcon
                                                    color={isPopular ? "neon" : "gray"}
                                                    size={20}
                                                    radius="xl"
                                                    variant="light"
                                                    style={{
                                                        background: isPopular ? `rgba(${theme.colors.neon[6]}, 0.1)` : 'rgba(255, 255, 255, 0.05)',
                                                        border: `1px solid ${isPopular ? `rgba(${theme.colors.neon[6]}, 0.3)` : 'rgba(255, 255, 255, 0.1)'}`,
                                                        color: isPopular ? theme.colors.neon[6] : theme.colors.gray[6]
                                                    }}
                                                >
                                                    <IconCheck size={12} />
                                                </ThemeIcon>
                                            }
                                            styles={{
                                                itemWrapper: {
                                                    alignItems: 'center'
                                                },
                                                itemIcon: {
                                                    alignSelf: 'flex-start',
                                                    marginTop: '2px'
                                                }
                                            }}
                                        >
                                            {/* Main Features */}
                                            {plan.mainFeatures.map((feature, index) => (
                                                <List.Item key={`main-${index}`}>
                                                    <Text size="sm" c={isDark ? "gray.3" : "gray.7"} style={{ lineHeight: 1.5 }}>
                                                        {feature}
                                                    </Text>
                                                </List.Item>
                                            ))}
                                            {/* Additional Features */}
                                            {plan.features.slice(0, 6).map((feature, index) => (
                                                <List.Item key={`additional-${index}`}>
                                                    <Text size="sm" c={isDark ? "gray.3" : "gray.7"} style={{ lineHeight: 1.5 }}>
                                                        {feature}
                                                    </Text>
                                                </List.Item>
                                            ))}
                                        </List>
                                    </div>

                                    {/* CTA Button */}
                                    <Button
                                        size="lg"
                                        variant={isPopular ? "filled" : "outline"}
                                        color={isPopular ? "neon" : "gray"}
                                        rightSection={<IconArrowRight size={16} />}
                                        fullWidth
                                        radius="md"
                                        className={
                                            isPopular
                                                ? classes.popularButton
                                                : isDark
                                                    ? classes.ctaButton
                                                    : classes.ctaButtonLight
                                        }
                                    >
                                        {t("pricing:startFreeTrial")}
                                    </Button>
                                </Stack>
                            </Card>
                        )
                    })}
                </div>

                {/* Enterprise Contact */}
                <Paper
                    p="xl"
                    radius="xl"
                    mt={80}
                    style={{
                        background: isDark ? 'rgba(15, 15, 15, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        backdropFilter: 'blur(20px)',
                        textAlign: 'center'
                    }}
                >
                    <Stack align="center" gap="lg">
                        <ThemeIcon
                            size={60}
                            radius="xl"
                            variant="light"
                            color="yellow"
                            style={{
                                background: 'rgba(255, 215, 0, 0.1)',
                                border: '1px solid rgba(255, 215, 0, 0.3)',
                                color: '#ffd700',
                                boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)'
                            }}
                        >
                            <IconStar size={30} />
                        </ThemeIcon>
                        <Title order={2} c={isDark ? "white" : "dark"} fw={700}>
                            {t("pricing:customSolution")}
                        </Title>
                        <Text
                            c="dimmed"
                            maw={500}
                            mx="auto"
                            style={{ lineHeight: 1.6 }}
                        >
                            {t("pricing:customSolutionDescription")}
                        </Text>
                        <Button
                            size="lg"
                            variant="outline"
                            color="gray"
                            className={isDark ? classes.contactButton : classes.contactButtonLight}
                        >
                            {t("pricing:contactSales")}
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </div>
    )
}
