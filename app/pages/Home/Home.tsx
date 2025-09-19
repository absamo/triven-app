import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Container,
    Grid,
    Group,
    List,
    Menu,
    Overlay,
    Paper,
    SimpleGrid,
    Stack,
    Switch,
    Text,
    ThemeIcon,
    Title,
    rem,
    useMantineColorScheme,
    useMantineTheme
} from "@mantine/core"
import {
    IconArrowRight,
    IconBrain,
    IconBuilding,
    IconChartBar,
    IconCheck,
    IconCrown,
    IconEye,
    IconHeart,
    IconMapPin,
    IconMoon,
    IconPackage,
    IconShoppingCart,
    IconStar,
    IconSun,
    IconTrendingUp,
    IconTruck,
    IconUsers
} from "@tabler/icons-react"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { MetaFunction } from "react-router"
import { Link } from "react-router"
import ScrollToTop from '~/app/components/ScrollToTop'
import FrIcon from '~/app/components/SvgIcons/FrIcon'
import UsIcon from '~/app/components/SvgIcons/UsIcon'
import { CURRENCIES, INTERVALS, PLANS } from "~/app/modules/stripe/plans"
import PublicLayout from "~/app/pages/PublicLayout"
import classes from "./Home.module.css"

export const meta: MetaFunction = () => {
    return [
        { title: "Triven - AI-Powered Inventory Management Platform" },
        {
            name: "description",
            content: "Transform inventory chaos into intelligent business growth. AI-powered inventory management with real-time insights, predictive forecasting, and automated workflows.",
        },
        {
            name: "keywords",
            content: "AI inventory management, intelligent forecasting, real-time visibility, stock control, inventory optimization, data-driven decisions, inventory platform, warehouse management",
        },
    ]
}

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

export default function HomePage() {
    const { t, i18n } = useTranslation(["pricing", "common", "home", "navigation"])
    const [isYearly, setIsYearly] = useState(false)
    const [isClient, setIsClient] = useState(false)
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language)

    // Sync currentLanguage state with i18n.language changes
    useEffect(() => {
        setCurrentLanguage(i18n.language)
    }, [i18n.language])
    const theme = useMantineTheme()
    const { colorScheme, toggleColorScheme } = useMantineColorScheme()

    // Use a default theme for SSR, actual theme for client
    const isDark = isClient ? colorScheme === 'dark' : false // Default to light for SSR

    // Set client flag after hydration
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Handle scroll for sticky plans header and calculate positions
    useEffect(() => {
    }, [])

    // Function to handle plan selection and redirect to signup
    const handlePlanSelection = (planId: string) => {
        const interval = isYearly ? INTERVALS.YEARLY : INTERVALS.MONTHLY
        const currency = CURRENCIES.USD // Default to USD, can be changed based on user location

        // Redirect to signup with plan parameters
        const signupUrl = `/signup?plan=${planId}&interval=${interval}&currency=${currency}&trial=14`
        window.location.href = signupUrl
    }

    const pricingPlans: PricingPlan[] = [
        {
            id: PLANS.STANDARD, // Use the actual plan ID from our Stripe configuration
            name: "Standard",
            description: "Perfect for small businesses getting started with inventory management",
            monthlyPrice: 29,
            yearlyPrice: 19,
            features: [
                "Custom categories and tags",
                "Purchase order management"
            ],
            mainFeatures: [
                "Company management",
                "User management",
                "Product management",
                "Stock management",
                "Sales orders",
                "Invoicing",
                "Bills & payments",
                "Multi-currency support",
                "Notifications",
                "Multi-language support"
            ],
            limits: {
                salesOrders: "500",
                purchaseOrders: "500",
                users: 3,
                agencies: 1,
                sites: 2,
                reporting: "Basic reporting",
            },
            icon: IconPackage,
            color: "gray",
        },
        {
            id: PLANS.PROFESSIONAL, // Use the actual plan ID from our Stripe configuration
            name: "Professional",
            description: "Advanced features for growing businesses with complex needs",
            monthlyPrice: 39,
            yearlyPrice: 29,
            recommended: true,
            popular: true,
            features: [
                "Advanced inventory tracking",
                "Stock transfer management",
                "Barcode scanning",
                "Advanced analytics",
                "Audit trails"
            ],
            mainFeatures: [
                "API integrations"
            ],
            limits: {
                salesOrders: "1,000",
                purchaseOrders: "1,000",
                users: 10,
                agencies: 2,
                sites: 4,
                reporting: "Advanced reporting",
            },
            icon: IconTrendingUp,
            color: "neon",
        },
        {
            id: PLANS.PREMIUM, // Use the actual plan ID from our Stripe configuration
            name: "Premium",
            description: "Enterprise-grade solutions for large organizations",
            monthlyPrice: 99,
            yearlyPrice: 79,
            features: [
                "Multi-location inventory",
                "Stock adjustments",
                "Custom workflows",
                "API integrations",
                "Phone support"
            ],
            mainFeatures: [
                "AI-powered insights",
                "Demand forecasting",
                "Automatic reordering"
            ],
            limits: {
                salesOrders: "Unlimited",
                purchaseOrders: "Unlimited",
                users: 20,
                agencies: 4,
                sites: 8,
                reporting: "Advanced reporting",
            },
            icon: IconCrown,
            color: "gold",
        },
    ]

    const formatPrice = (monthly: number, yearly: number) => {
        const price = isYearly ? yearly : monthly
        return price === 0 ? t('pricing:free') : `$${price}`
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
        <PublicLayout>
            <div className={classes.root}>
                {/* Hero Section - Puzzle-inspired Design */}
                <Box className={classes.heroSection}>
                    <Overlay className={classes.heroOverlay} />

                    <Container size="xl" className={classes.heroContainer}>
                        <div className={classes.heroContent}>
                            <Stack gap={30} align="center" ta="center">
                                {/* Main Headline - Puzzle Style */}
                                <Stack gap={20} align="center">
                                    <Title className={classes.heroTitle}>
                                        {t('home:hero.title')}
                                    </Title>

                                    <Text className={classes.heroSubtitle}>
                                        {t('home:hero.subtitle')}
                                    </Text>
                                </Stack>

                                {/* CTA Buttons - Puzzle Style */}
                                <Group gap="md" justify="center">
                                    <Button
                                        component={Link}
                                        to="/signup"
                                        className={classes.primaryCTA}
                                        styles={{
                                            root: {
                                                height: '48px',
                                                minWidth: '180px',
                                                fontSize: '15px',
                                                fontWeight: 600
                                            }
                                        }}
                                    >
                                        {t('home:hero.tryFree')}
                                    </Button>
                                    <Button
                                        component={Link}
                                        to="/contact"
                                        variant="outline"
                                        className={classes.secondaryCTA}
                                        styles={{
                                            root: {
                                                height: '48px',
                                                minWidth: '180px',
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                border: '2px solid #20FE6B',
                                                color: '#20FE6B'
                                            }
                                        }}
                                    >
                                        {t('home:hero.requestDemo')}
                                    </Button>
                                </Group>
                            </Stack>
                        </div>
                    </Container>
                </Box>

                {/* Get Accurate Inventory Section - Puzzle Inspired */}
                <Box
                    style={{
                        background: isDark
                            ? 'linear-gradient(135deg, rgba(4, 3, 8, 0.95) 0%, rgba(63, 78, 87, 0.1) 50%, rgba(4, 3, 8, 0.95) 100%)'
                            : 'linear-gradient(135deg, rgba(249, 249, 253, 0.8) 0%, rgba(249, 249, 253, 1) 50%, rgba(249, 249, 253, 0.8) 100%)',
                        position: 'relative'
                    }}
                >
                    <Container size="xl" py={80}>
                        <Box className={classes.accurateInventorySection}>
                            <Stack gap={60} align="center">
                                <div className={classes.accurateInventoryHeader}>
                                    <Title className={classes.accurateInventoryTitle} ta="center">
                                        {t('home:accurateInventory.title')}
                                    </Title>
                                </div>

                                <SimpleGrid cols={{ base: 1, md: 2 }} spacing={60} w="100%" maw={1000}>
                                    {/* Progress Indicators */}
                                    <Stack gap="xl">
                                        <Box className={classes.progressItem}>
                                            <Group gap="lg" align="center">
                                                <Box className={classes.progressCircle1}>
                                                    <svg width="60" height="60" viewBox="0 0 60 60">
                                                        <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(32, 254, 107, 0.2)" strokeWidth="4" />
                                                        <circle
                                                            cx="30" cy="30" r="25"
                                                            fill="none"
                                                            stroke="#20FE6B"
                                                            strokeWidth="4"
                                                            strokeDasharray="157"
                                                            strokeDashoffset="16"
                                                            strokeLinecap="round"
                                                            className={classes.progressStroke}
                                                        />
                                                    </svg>
                                                    <Text className={classes.progressText}>98%</Text>
                                                </Box>
                                                <Stack gap={4}>
                                                    <Text className={classes.progressLabel}>{t('home:accurateInventory.autoCategory')}</Text>
                                                    <Text className={classes.progressSubLabel}>{t('home:accurateInventory.autoCategorySub')}</Text>
                                                </Stack>
                                            </Group>
                                        </Box>

                                        <Box className={classes.progressItem}>
                                            <Group gap="lg" align="center">
                                                <Box className={classes.progressCircle2}>
                                                    <svg width="60" height="60" viewBox="0 0 60 60">
                                                        <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(76, 94, 175, 0.2)" strokeWidth="4" />
                                                        <circle
                                                            cx="30" cy="30" r="25"
                                                            fill="none"
                                                            stroke="#4C5EAF"
                                                            strokeWidth="4"
                                                            strokeDasharray="157"
                                                            strokeDashoffset="31"
                                                            strokeLinecap="round"
                                                            className={classes.progressStroke}
                                                        />
                                                    </svg>
                                                    <Text className={classes.progressText}>90%</Text>
                                                </Box>
                                                <Stack gap={4}>
                                                    <Text className={classes.progressLabel}>{t('home:accurateInventory.stockMovements')}</Text>
                                                    <Text className={classes.progressSubLabel}>{t('home:accurateInventory.stockMovementsSub')}</Text>
                                                </Stack>
                                            </Group>
                                        </Box>
                                    </Stack>

                                    {/* Live Dashboard Preview */}
                                    <Box className={classes.dashboardPreview}>
                                        <Card className={classes.previewCard}>
                                            <Stack gap="md">
                                                <Group justify="space-between" align="center">
                                                    <Text className={classes.previewTitle}>{t('home:accurateInventory.dashboardTitle')}</Text>
                                                    <Badge variant="light" color="green" size="sm">{t('home:accurateInventory.realTime')}</Badge>
                                                </Group>

                                                <SimpleGrid cols={2} spacing="xs">
                                                    <Box className={classes.metricCard}>
                                                        <Text className={classes.metricValue}>$2.4M</Text>
                                                        <Text className={classes.metricLabel}>{t('home:accurateInventory.totalValue')}</Text>
                                                    </Box>
                                                    <Box className={classes.metricCard}>
                                                        <Text className={classes.metricValue}>15,429</Text>
                                                        <Text className={classes.metricLabel}>{t('home:accurateInventory.items')}</Text>
                                                    </Box>
                                                    <Box className={classes.metricCard}>
                                                        <Text className={classes.metricValue}>94.8%</Text>
                                                        <Text className={classes.metricLabel}>{t('home:accurateInventory.accuracy')}</Text>
                                                    </Box>
                                                    <Box className={classes.metricCard}>
                                                        <Text className={classes.metricValue}>+18%</Text>
                                                        <Text className={classes.metricLabel}>{t('home:accurateInventory.growth')}</Text>
                                                    </Box>
                                                </SimpleGrid>

                                                <Box className={classes.miniChart}>
                                                    <div className={classes.chartBars}>
                                                        {Array.from({ length: 12 }, (_, i) => (
                                                            <div
                                                                key={i}
                                                                className={classes.chartBar}
                                                                style={{
                                                                    height: `${30 + Math.sin(i) * 20 + i * 3}%`,
                                                                    background: i > 8 ? '#20FE6B' : '#28B1DC'
                                                                }}
                                                            ></div>
                                                        ))}
                                                    </div>
                                                    <Text className={classes.chartLabel}>{t('home:accurateInventory.chartLabel')}</Text>
                                                </Box>
                                            </Stack>
                                        </Card>
                                    </Box>
                                </SimpleGrid>
                            </Stack>
                        </Box>
                    </Container>

                    {/* Simple Features Section - Puzzle Style */}
                    <Box
                        style={{
                            background: isDark
                                ? 'radial-gradient(circle at 50% 50%, rgba(40, 177, 220, 0.03) 0%, rgba(4, 3, 8, 0.8) 70%)'
                                : 'radial-gradient(circle at 50% 50%, rgba(40, 177, 220, 0.08) 0%, rgba(255, 255, 255, 0.9) 70%)',
                            position: 'relative'
                        }}
                    >
                        <Container size="xl" py={80}>
                            <Stack gap={60} align="center">
                                <Title className={classes.featuresTitle} ta="center">
                                    {t('home:features.title')}
                                </Title>

                                <SimpleGrid cols={{ base: 1, md: 3 }} spacing={40} w="100%" maw={1000}>
                                    <Box className={classes.simpleFeature}>
                                        <Stack gap="md" ta="center">
                                            <ThemeIcon size={48} className={classes.featureIcon1}>
                                                <IconBrain size={24} />
                                            </ThemeIcon>
                                            <Title order={4} className={classes.simpleFeatureTitle}>
                                                {t('home:features.aiInsights.title')}
                                            </Title>
                                            <Text className={classes.simpleFeatureText}>
                                                {t('home:features.aiInsights.description')}
                                            </Text>
                                        </Stack>
                                    </Box>

                                    <Box className={classes.simpleFeature}>
                                        <Stack gap="md" ta="center">
                                            <ThemeIcon size={48} className={classes.featureIcon2}>
                                                <IconEye size={24} />
                                            </ThemeIcon>
                                            <Title order={4} className={classes.simpleFeatureTitle}>
                                                {t('home:features.realTimeVisibility.title')}
                                            </Title>
                                            <Text className={classes.simpleFeatureText}>
                                                {t('home:features.realTimeVisibility.description')}
                                            </Text>
                                        </Stack>
                                    </Box>

                                    <Box className={classes.simpleFeature}>
                                        <Stack gap="md" ta="center">
                                            <ThemeIcon size={48} className={classes.featureIcon3}>
                                                <IconTrendingUp size={24} />
                                            </ThemeIcon>
                                            <Title order={4} className={classes.simpleFeatureTitle}>
                                                {t('home:features.growthOptimization.title')}
                                            </Title>
                                            <Text className={classes.simpleFeatureText}>
                                                {t('home:features.growthOptimization.description')}
                                            </Text>
                                        </Stack>
                                    </Box>
                                </SimpleGrid>
                            </Stack>
                        </Container>
                    </Box>
                </Box>

                {/* Pricing Section - Comprehensive from Pricing.tsx */}
                <div
                    className={isDark ? classes.root : `${classes.root} ${classes.rootLight}`}
                    data-theme={isDark ? 'dark' : 'light'}
                    id="pricing"
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
                    </div>

                    <Container size="xl" py={80} className={classes.container}>
                        {/* Header Section */}
                        <Stack align="center" mb={80} className={classes.headerSection}>
                            <Title
                                order={1}
                                ta="center"
                                size="4rem"
                                fw={800}
                                styles={{
                                    root: {
                                        backgroundImage: isDark
                                            ? `linear-gradient(135deg, ${theme.white} 0%, ${theme.colors.neon[6]} 100%)`
                                            : `linear-gradient(135deg, ${theme.colors.dark[8]} 0%, ${theme.colors.neon[6]} 100%)`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        letterSpacing: '-0.02em',
                                        lineHeight: 0.9,
                                        margin: '2rem 0 1rem 0'
                                    }
                                }}
                            >
                                {t('pricing:title')}
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
                                {t('pricing:subtitle')}
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
                                {t('pricing:monthly')}
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
                                    {t('pricing:yearly')}
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
                                    {t('pricing:saveUpTo')}
                                </Badge>
                            </Group>
                        </Group>



                        {/* Pricing Cards */}
                        <Grid data-plans-section gutter="xl" align="stretch">
                            {pricingPlans.map((plan, index) => {
                                const Icon = plan.icon
                                const savings = calculateSavings(plan.monthlyPrice, plan.yearlyPrice)
                                const isPopular = plan.popular

                                return (
                                    <Grid.Col key={plan.id} span={{ base: 12, md: 4 }}>
                                        <Card
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
                                                    : (isDark ? theme.shadows.lg : '0 4px 20px rgba(0, 0, 0, 0.08)'),
                                                height: '100%'
                                            }}
                                            data-plan={plan.id}
                                        >
                                            <Stack
                                                gap="lg"
                                                className={classes.cardContent}
                                                h="100%"
                                                justify="space-between"
                                            >
                                                <Stack gap="lg">
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
                                                                {plan.id === 'standard' ? t('pricing:standard') : plan.id === 'professional' ? t('pricing:professional') : t('pricing:premium')}
                                                            </Text>
                                                        </Group>
                                                        <Text
                                                            size="sm"
                                                            c="dimmed"
                                                        >
                                                            {plan.id === 'standard' ? t('pricing:standardDescription') : plan.id === 'professional' ? t('pricing:professionalDescription') : t('pricing:premiumDescription')}
                                                        </Text>
                                                    </Stack>

                                                    {/* Pricing */}
                                                    <div
                                                        style={{
                                                            padding: '1.5rem 0',
                                                            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                                            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
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
                                                                {t('pricing:perMonth')}
                                                            </Text>
                                                        </Group>
                                                        <Text size="sm" c="dimmed" mt={4}>
                                                            {isYearly ? t('pricing:billedAnnually') : t('pricing:noSetupFees')}
                                                        </Text>
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
                                                                    <Text size="sm" c="dimmed">{t('pricing:salesOrders')}</Text>
                                                                </Group>
                                                                <Text size="sm" fw={600} c={isDark ? "white" : "dark"}>
                                                                    {plan.limits.salesOrders === 'Unlimited' ? t('pricing:unlimited') : plan.limits.salesOrders}
                                                                </Text>
                                                            </Group>

                                                            <Group justify="space-between">
                                                                <Group gap={8}>
                                                                    <IconTruck size={16} color={theme.colors.gray[6]} />
                                                                    <Text size="sm" c="dimmed">{t('pricing:purchaseOrders')}</Text>
                                                                </Group>
                                                                <Text size="sm" fw={600} c={isDark ? "white" : "dark"}>
                                                                    {plan.limits.purchaseOrders === 'Unlimited' ? t('pricing:unlimited') : plan.limits.purchaseOrders}
                                                                </Text>
                                                            </Group>

                                                            <Group justify="space-between">
                                                                <Group gap={8}>
                                                                    <IconUsers size={16} color={theme.colors.gray[6]} />
                                                                    <Text size="sm" c="dimmed">{t('pricing:teamMembers')}</Text>
                                                                </Group>
                                                                <Text size="sm" fw={600} c={isDark ? "white" : "dark"}>
                                                                    {plan.limits.users} {plan.limits.users === 1 ? t('pricing:user') : t('pricing:users')}
                                                                </Text>
                                                            </Group>

                                                            <Group justify="space-between">
                                                                <Group gap={8}>
                                                                    <IconChartBar size={16} color={theme.colors.gray[6]} />
                                                                    <Text size="sm" c="dimmed">{t('pricing:reporting')}</Text>
                                                                </Group>
                                                                <Text size="sm" fw={600} c={isDark ? "white" : "dark"}>
                                                                    {plan.limits.reporting === 'Basic reporting' ? t('pricing:basicReporting') : plan.limits.reporting === 'Advanced reporting' ? t('pricing:advancedReporting') : plan.limits.reporting}
                                                                </Text>
                                                            </Group>

                                                            <Group justify="space-between">
                                                                <Group gap={8}>
                                                                    <IconBuilding size={16} color={theme.colors.gray[6]} />
                                                                    <Text size="sm" c="dimmed">{t('pricing:agencies')}</Text>
                                                                </Group>
                                                                <Text size="sm" fw={600} c={isDark ? "white" : "dark"}>
                                                                    {plan.limits.agencies} {plan.limits.agencies === 1 ? t('pricing:agency') : t('pricing:agencies')}
                                                                </Text>
                                                            </Group>

                                                            <Group justify="space-between">
                                                                <Group gap={8}>
                                                                    <IconMapPin size={16} color={theme.colors.gray[6]} />
                                                                    <Text size="sm" c="dimmed">{t('pricing:sites')}</Text>
                                                                </Group>
                                                                <Text size="sm" fw={600} c={isDark ? "white" : "dark"}>
                                                                    {plan.limits.sites} {plan.limits.sites === 1 ? t('pricing:site') : t('pricing:sites')}
                                                                </Text>
                                                            </Group>
                                                        </Stack>
                                                    </Paper>

                                                    {/* Features */}
                                                    <div>
                                                        <Text size="sm" fw={600} c={isDark ? "white" : "dark"} mb="md">
                                                            {plan.id === "standard" ? t('pricing:whatsIncluded') : plan.id === "professional" ? t('pricing:everythingInStandard') : t('pricing:everythingInProfessional')}
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
                                                            {plan.mainFeatures.map((feature, index) => {
                                                                const getFeatureTranslation = (feature: string) => {
                                                                    const featureMap: Record<string, string> = {
                                                                        'Company management': t('pricing:features.companyManagement'),
                                                                        'User management': t('pricing:features.userManagement'),
                                                                        'Product management': t('pricing:features.productManagement'),
                                                                        'Stock management': t('pricing:features.stockManagement'),
                                                                        'Sales orders': t('pricing:features.salesOrders'),
                                                                        'Invoicing': t('pricing:features.invoicing'),
                                                                        'Bills & payments': t('pricing:features.billsPayments'),
                                                                        'Multi-currency support': t('pricing:features.multiCurrency'),
                                                                        'Notifications': t('pricing:features.notifications'),
                                                                        'Multi-language support': t('pricing:features.internationalization'),
                                                                        'API integrations': t('pricing:features.integrations'),
                                                                        'AI-powered insights': t('pricing:features.aiInsights'),
                                                                        'Demand forecasting': t('pricing:features.forecasting'),
                                                                        'Automatic reordering': t('pricing:features.autoReordering')
                                                                    }
                                                                    return featureMap[feature] || feature
                                                                }

                                                                return (
                                                                    <List.Item key={`main-${index}`}>
                                                                        <Text size="sm" c={isDark ? "gray.3" : "gray.7"} style={{ lineHeight: 1.5 }}>
                                                                            {getFeatureTranslation(feature)}
                                                                        </Text>
                                                                    </List.Item>
                                                                )
                                                            })}
                                                            {/* Additional Features */}
                                                            {plan.features.slice(0, 6).map((feature, index) => {
                                                                const getAdditionalFeatureTranslation = (feature: string) => {
                                                                    const featureMap: Record<string, string> = {
                                                                        'Custom categories and tags': t('pricing:features.customCategories'),
                                                                        'Purchase order management': t('pricing:features.purchaseOrderManagement'),
                                                                        'Advanced inventory tracking': t('pricing:features.advancedInventory'),
                                                                        'Stock transfer management': t('pricing:features.stockTransfer'),
                                                                        'Barcode scanning': t('pricing:features.barcodeScanning'),
                                                                        'Advanced analytics': t('pricing:features.advancedAnalytics'),
                                                                        'Audit trails': t('pricing:features.auditTrails'),
                                                                        'Multi-location inventory': t('pricing:features.multiLocation'),
                                                                        'Stock adjustments': t('pricing:features.stockAdjustments'),
                                                                        'Custom workflows': t('pricing:features.customWorkflows'),
                                                                        'API integrations': t('pricing:features.apiIntegrations'),
                                                                        'Phone support': t('pricing:features.phoneSupport')
                                                                    }
                                                                    return featureMap[feature] || feature
                                                                }

                                                                return (
                                                                    <List.Item key={`additional-${index}`}>
                                                                        <Text size="sm" c={isDark ? "gray.3" : "gray.7"} style={{ lineHeight: 1.5 }}>
                                                                            {getAdditionalFeatureTranslation(feature)}
                                                                        </Text>
                                                                    </List.Item>
                                                                )
                                                            })}
                                                        </List>
                                                    </div>
                                                </Stack>

                                                {/* CTA Button */}
                                                <Button
                                                    size="lg"
                                                    variant={isPopular ? "filled" : "outline"}
                                                    color={isPopular ? "neon" : "gray"}
                                                    rightSection={<IconArrowRight size={16} />}
                                                    fullWidth
                                                    radius="md"
                                                    className={isPopular ? classes.primaryCTA : undefined}
                                                    styles={isPopular ? {
                                                        root: {
                                                            height: '48px',
                                                            fontSize: '15px',
                                                            fontWeight: 600
                                                        }
                                                    } : undefined}
                                                    onClick={() => handlePlanSelection(plan.id)}
                                                >
                                                    Start 14-Day Free Trial
                                                </Button>
                                            </Stack>
                                        </Card>
                                    </Grid.Col>
                                )
                            })}
                        </Grid>

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
                                    {t('pricing:customSolution')}
                                </Title>
                                <Text
                                    c="dimmed"
                                    maw={500}
                                    mx="auto"
                                    style={{ lineHeight: 1.6 }}
                                >
                                    {t('pricing:customSolutionDescription')}
                                </Text>
                                <Button
                                    component={Link}
                                    to="/contact"
                                    size="lg"
                                    variant="outline"
                                    color="gray"
                                    className={isDark ? classes.contactButton : classes.contactButtonLight}
                                >
                                    {t('pricing:contactSales')}
                                </Button>
                            </Stack>
                        </Paper>
                    </Container>
                </div>

                {/* Final CTA Section - Puzzle Style */}
                <Box
                    style={{
                        background: isDark
                            ? 'linear-gradient(135deg, rgba(32, 254, 107, 0.02) 0%, rgba(4, 3, 8, 0.95) 30%, rgba(40, 177, 220, 0.02) 100%)'
                            : 'linear-gradient(135deg, rgba(32, 254, 107, 0.05) 0%, rgba(255, 255, 255, 0.95) 30%, rgba(40, 177, 220, 0.05) 100%)',
                        position: 'relative'
                    }}
                >
                    <Container size="xl" py={120}>
                        <Box className={classes.finalCta}>
                            <Stack gap={30} align="center" ta="center">
                                <Title className={classes.finalCtaTitle}>
                                    {t('home:finalCta.title')}
                                    <br />
                                    {t('home:finalCta.subtitle')}
                                </Title>
                                <Button
                                    component={Link}
                                    to="/signup"
                                    size="xl"
                                    className={classes.primaryCTA}
                                >
                                    {t('home:finalCta.button')}
                                </Button>
                            </Stack>
                        </Box>
                    </Container>
                </Box>

                {/* Footer Section */}
                <Box
                    component="footer"
                    style={{
                        background: isDark
                            ? 'linear-gradient(135deg, rgba(4, 3, 8, 0.98) 0%, rgba(15, 15, 15, 0.95) 100%)'
                            : 'linear-gradient(135deg, rgba(249, 249, 253, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)',
                        borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                    }}
                >
                    <Container size="xl" py={40} pos="relative">
                        {/* Footer Content Layout */}
                        <Group justify="space-between" align="center">
                            {/* Copyright - Left side */}
                            <Text
                                size="sm"
                                c="dimmed"
                                style={{
                                    fontWeight: 500,
                                    letterSpacing: '0.5px'
                                }}
                            >
                                {t('home:footer.copyright', { year: dayjs().year() })}
                            </Text>

                            {/* Made with Love - Center */}
                            <Group justify="center" align="center" gap="xs">
                                <Text
                                    size="sm"
                                    c="dimmed"
                                    style={{
                                        fontWeight: 500,
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    {t('home:footer.madeWith')}
                                </Text>
                                <IconHeart
                                    size={16}
                                    style={{
                                        color: '#ff6b6b',
                                        fill: '#ff6b6b'
                                    }}
                                />
                                <Text
                                    size="sm"
                                    c="dimmed"
                                    style={{
                                        fontWeight: 500,
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    {t('home:footer.inLyon')}
                                </Text>
                            </Group>

                            {/* Spacer for balance (empty div to maintain center alignment) */}
                            <div style={{ width: rem(48) }} />
                        </Group>

                        {/* Language and Theme Selectors - Absolute positioned right */}
                        <Group
                            gap="xs"
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: '50%',
                                transform: 'translateY(-50%)'
                            }}
                        >
                            {/* Language Selector */}
                            <Menu shadow="md" width={120} position="top-end">
                                <Menu.Target>
                                    <ActionIcon
                                        variant="subtle"
                                        size="lg"
                                        aria-label={t('home:footer.selectLanguage')}
                                        style={{
                                            background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                            cursor: 'pointer',
                                            padding: '4px'
                                        }}
                                    >
                                        {i18n.language === 'en' ? <UsIcon size={20} /> : <FrIcon size={20} />}
                                    </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown
                                    style={{
                                        background: isDark ? 'rgba(15, 15, 15, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(10px)',
                                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                        borderRadius: '8px'
                                    }}
                                >
                                    <Menu.Item
                                        onClick={() => {
                                            i18n.changeLanguage('en')
                                            setCurrentLanguage('en')
                                        }}
                                        style={{
                                            color: isDark ? 'white' : 'black',
                                            background: i18n.language === 'en'
                                                ? (isDark ? 'rgba(32, 254, 107, 0.1)' : 'rgba(32, 254, 107, 0.05)')
                                                : 'transparent'
                                        }}
                                        leftSection={<UsIcon size={18} />}
                                        rightSection={i18n.language === 'en' ? (
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                        ) : null}
                                    >
                                        English
                                    </Menu.Item>
                                    <Menu.Item
                                        onClick={() => {
                                            i18n.changeLanguage('fr')
                                            setCurrentLanguage('fr')
                                        }}
                                        style={{
                                            color: isDark ? 'white' : 'black',
                                            background: i18n.language === 'fr'
                                                ? (isDark ? 'rgba(32, 254, 107, 0.1)' : 'rgba(32, 254, 107, 0.05)')
                                                : 'transparent'
                                        }}
                                        leftSection={<FrIcon size={18} />}
                                        rightSection={i18n.language === 'fr' ? (
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                        ) : null}
                                    >
                                        Français
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>

                            {/* Theme Selector */}
                            <ActionIcon
                                variant="subtle"
                                size="lg"
                                onClick={toggleColorScheme}
                                aria-label={t('home:footer.toggleTheme')}
                                style={{
                                    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                    color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                                    cursor: 'pointer'
                                }}
                            >
                                {isDark ? (
                                    <IconSun
                                        style={{
                                            width: rem(20),
                                            height: rem(20),
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            const target = e.currentTarget as SVGElement
                                            target.style.transform = 'scale(1.2) rotate(15deg)'
                                            target.style.color = '#20FE6B'
                                            target.style.filter = isDark
                                                ? 'drop-shadow(0 0 8px rgba(32, 254, 107, 0.6))'
                                                : 'drop-shadow(0 0 6px rgba(28, 157, 74, 0.4))'
                                        }}
                                        onMouseLeave={(e) => {
                                            const target = e.currentTarget as SVGElement
                                            target.style.transform = 'scale(1) rotate(0deg)'
                                            target.style.color = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'
                                            target.style.filter = 'none'
                                        }}
                                    />
                                ) : (
                                    <IconMoon
                                        style={{
                                            width: rem(20),
                                            height: rem(20),
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            const target = e.currentTarget as SVGElement
                                            target.style.transform = 'scale(1.2) rotate(-15deg)'
                                            target.style.color = '#1C9D4A'
                                            target.style.filter = 'drop-shadow(0 0 6px rgba(28, 157, 74, 0.4))'
                                        }}
                                        onMouseLeave={(e) => {
                                            const target = e.currentTarget as SVGElement
                                            target.style.transform = 'scale(1) rotate(0deg)'
                                            target.style.color = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'
                                            target.style.filter = 'none'
                                        }}
                                    />
                                )}
                            </ActionIcon>
                        </Group>
                    </Container>
                </Box>
            </div>

            {/* Scroll to Top Button */}
            <Box
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    zIndex: 1000
                }}
            >
                <ScrollToTop />
            </Box>
        </PublicLayout>
    )
}