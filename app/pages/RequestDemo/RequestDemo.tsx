import { Card, Container, Grid, Group, Text, ThemeIcon, Title } from "@mantine/core"
import {
    IconBuilding,
    IconChartPie3,
    IconCheck,
    IconCurrency,
    IconFileInvoice,
    IconPackage,
    IconScan
} from "@tabler/icons-react"
import { DemoRequestForm } from "~/app/components"
import PublicLayout from "~/app/pages/PublicLayout"
import classes from "./RequestDemo.module.css"

const keyFeatures = [
    {
        icon: IconPackage,
        title: "Smart Inventory Management",
        description: "Real-time stock tracking with AI-powered forecasting, automated reordering, and barcode scanning",
    },
    {
        icon: IconChartPie3,
        title: "AI-Powered Analytics & Insights",
        description: "Business intelligence dashboard with predictive insights, intelligent forecasting, and advanced audit trails",
    },
    {
        icon: IconBuilding,
        title: "Multi-Location Support",
        description: "Seamlessly manage inventory across warehouses, stores, and distribution centers with stock transfers",
    },
    {
        icon: IconFileInvoice,
        title: "Complete Business Operations",
        description: "Sales orders, purchase orders, invoicing, bills & payments with custom workflows and approvals",
    },
    {
        icon: IconScan,
        title: "Modern Technology",
        description: "Barcode scanning, mobile support, API integrations, and import/export capabilities",
    },
    {
        icon: IconCurrency,
        title: "Global Business Ready",
        description: "Multi-currency support, internationalization, and enterprise-grade security features",
    },
]

const benefits = [
    "Reduce stockouts by up to 30% with predictive analytics and AI insights",
    "Save 5+ hours weekly with automated workflows and barcode scanning",
    "Real-time visibility across all locations with advanced inventory management",
    "Streamline operations with sales orders, purchase orders, and invoicing",
    "Multi-currency support and custom workflows for global businesses",
    "24/7 support with API integrations and comprehensive audit trails",
]

export default function RequestDemo() {
    return (
        <PublicLayout>
            <div className={classes.container}>
                <Container size="xl" py={10}>
                    <Grid gutter={80} align="stretch">
                        {/* Left side - Marketing content */}
                        <Grid.Col span={{ base: 12, lg: 6 }}>
                            <div className={classes.contentSection}>
                                <div className={classes.heroContent}>
                                    <Title order={1} className={classes.mainTitle}>
                                        See{" "}
                                        <span className={classes.brandHighlight}>Triven</span>{" "}
                                        in Action
                                    </Title>

                                    <Text className={classes.subtitle}>
                                        Discover how Triven's AI-powered inventory management platform can transform your business operations.
                                        Schedule a demo and see real results.
                                    </Text>
                                </div>

                                <div className={classes.benefits}>
                                    <Text fw={600} mb="lg" className={classes.benefitsTitle}>
                                        What you'll see in your demo:
                                    </Text>
                                    <div className={classes.benefitsList}>
                                        {benefits.map((benefit, index) => (
                                            <div key={index} className={classes.benefit}>
                                                <ThemeIcon size={24} radius="xl" color="teal" variant="light" className={classes.benefitIcon}>
                                                    <IconCheck size={14} />
                                                </ThemeIcon>
                                                <Text size="sm" className={classes.benefitText}>{benefit}</Text>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={classes.features}>
                                    <Text fw={600} mb="lg" className={classes.featuresTitle}>
                                        Key Features:
                                    </Text>
                                    <div className={classes.featuresGrid}>
                                        {keyFeatures.map((feature, index) => {
                                            const Icon = feature.icon
                                            return (
                                                <Card key={index} className={classes.featureCard} padding="lg" radius="xl">
                                                    <Group gap="md" align="flex-start">
                                                        <ThemeIcon size={48} radius="xl" variant="light" color="teal" className={classes.featureIcon}>
                                                            <Icon size={24} />
                                                        </ThemeIcon>
                                                        <div style={{ flex: 1 }}>
                                                            <Text fw={600} size="sm" mb={6} className={classes.featureTitle}>
                                                                {feature.title}
                                                            </Text>
                                                            <Text size="xs" c="dimmed" lh={1.5} className={classes.featureDescription}>
                                                                {feature.description}
                                                            </Text>
                                                        </div>
                                                    </Group>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </Grid.Col>

                        {/* Right side - Demo request form */}
                        <Grid.Col span={{ base: 12, lg: 6 }}>
                            <DemoRequestForm />
                        </Grid.Col>
                    </Grid>
                </Container>
            </div>
        </PublicLayout>
    )
}
