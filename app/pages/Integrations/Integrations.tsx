import {
    Badge,
    Button,
    Card,
    Container,
    Group,
    Progress,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
    Tooltip
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
    IconBuilding,
    IconCalculator,
    IconCheck,
    IconChevronRight,
    IconClock,
    IconExternalLink,
    IconInfoCircle,
    IconMapPin,
    IconPackage,
    IconRocket,
    IconUsers
} from '@tabler/icons-react'
import React, { useState } from 'react'
import { useLoaderData } from 'react-router'
import AgenciesImportModal from '~/app/pages/Integrations/AgenciesImportModal'
import ProductImportModal from '~/app/pages/Integrations/ProductImportModal'
import SitesImportModal from '~/app/pages/Integrations/SitesImportModal'

interface IntegrationsPageProps {
    user?: any
    agencies?: any[]
    sites?: any[]
    roles?: any[]
}

interface IntegrationStep {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    status: 'pending' | 'in-progress' | 'completed' | 'required'
    estimate: string
    dependencies?: string[]
    action?: () => void
}

const Integrations = (): React.ReactElement => {
    const data = useLoaderData() as IntegrationsPageProps
    const [productImportOpened, setProductImportOpened] = useState(false)
    const [sitesImportOpened, setSitesImportOpened] = useState(false)
    const [agenciesImportOpened, setAgenciesImportOpened] = useState(false)

    // Calculate overall progress
    const integrationSteps: IntegrationStep[] = [
        {
            id: 'agencies',
            title: 'Agency Setup',
            description: 'Import and configure your business agencies',
            icon: <IconBuilding size={24} />,
            status: 'required',
            estimate: '5-10 minutes',
            action: () => setAgenciesImportOpened(true)
        },
        {
            id: 'sites',
            title: 'Site Configuration',
            description: 'Set up your business locations and sites',
            icon: <IconMapPin size={24} />,
            status: 'required',
            estimate: '10-15 minutes',
            dependencies: ['agencies'],
            action: () => setSitesImportOpened(true)
        },
        {
            id: 'products',
            title: 'Product Import',
            description: 'Import your product catalog and inventory',
            icon: <IconPackage size={24} />,
            status: 'required',
            estimate: '15-30 minutes',
            dependencies: ['sites'],
            action: () => setProductImportOpened(true)
        },
        {
            id: 'accounting',
            title: 'Accounting Integration',
            description: 'Connect with your accounting software',
            icon: <IconCalculator size={24} />,
            status: 'pending',
            estimate: '20-40 minutes',
            dependencies: ['products']
        },
        {
            id: 'users',
            title: 'User Management',
            description: 'Set up user accounts and permissions',
            icon: <IconUsers size={24} />,
            status: 'pending',
            estimate: '10-20 minutes',
            dependencies: ['agencies']
        }
    ]

    const completedSteps = integrationSteps.filter(step => step.status === 'completed').length
    const totalSteps = integrationSteps.length
    const progressPercentage = (completedSteps / totalSteps) * 100

    const getStatusColor = (status: IntegrationStep['status']) => {
        switch (status) {
            case 'completed': return 'green'
            case 'in-progress': return 'blue'
            case 'required': return 'orange'
            default: return 'gray'
        }
    }

    const getStatusLabel = (status: IntegrationStep['status']) => {
        switch (status) {
            case 'completed': return 'Completed'
            case 'in-progress': return 'In Progress'
            case 'required': return 'Required'
            default: return 'Pending'
        }
    }

    const isStepBlocked = (step: IntegrationStep): boolean => {
        if (!step.dependencies) return false
        return step.dependencies.some(depId => {
            const dependency = integrationSteps.find(s => s.id === depId)
            return dependency && dependency.status !== 'completed'
        })
    }

    const handleQuickStart = () => {
        notifications.show({
            title: 'Quick Start Guide',
            message: 'We recommend starting with Agency Setup, then Sites, followed by Products.',
            color: 'blue',
            icon: <IconRocket size={18} />
        })
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <div>
                    <Title order={1} size="h2" mb="md">
                        Integrations & Setup
                    </Title>
                    <Text size="lg" c="dimmed">
                        Get your business up and running with our step-by-step integration guide.
                        Complete these essential steps to start managing your inventory and operations.
                    </Text>
                </div>

                {/* Progress Overview */}
                <Card shadow="sm" p="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="lg" fw={500}>
                            Setup Progress
                        </Text>
                        <Badge color={progressPercentage === 100 ? 'green' : 'blue'} variant="light">
                            {completedSteps} of {totalSteps} completed
                        </Badge>
                    </Group>

                    <Progress value={progressPercentage} size="lg" radius="xl" mb="md" />

                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                            Complete all steps to unlock full functionality
                        </Text>
                        <Button
                            variant="light"
                            size="sm"
                            leftSection={<IconInfoCircle size={16} />}
                            onClick={handleQuickStart}
                        >
                            Quick Start Guide
                        </Button>
                    </Group>
                </Card>

                {/* Integration Steps */}
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    {integrationSteps.map((step) => {
                        const blocked = isStepBlocked(step)
                        const isActionable = step.action && !blocked

                        return (
                            <Card
                                key={step.id}
                                shadow="sm"
                                p="lg"
                                radius="md"
                                withBorder
                                style={{
                                    cursor: isActionable ? 'pointer' : 'default',
                                    opacity: blocked ? 0.6 : 1,
                                    transition: 'all 0.3s ease',
                                    backgroundColor: step.status === 'completed' ? '#f8fff9' : 'white',
                                    ':hover': isActionable ? {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                                    } : {}
                                }}
                                onClick={isActionable ? step.action : undefined}
                            >
                                <Group justify="space-between" mb="md">
                                    <Group>
                                        <ThemeIcon
                                            size={48}
                                            radius="md"
                                            variant="light"
                                            color={getStatusColor(step.status)}
                                        >
                                            {step.icon}
                                        </ThemeIcon>
                                        <div>
                                            <Text size="md" fw={500}>
                                                {step.title}
                                            </Text>
                                            <Badge
                                                color={getStatusColor(step.status)}
                                                variant="light"
                                                size="sm"
                                            >
                                                {getStatusLabel(step.status)}
                                            </Badge>
                                        </div>
                                    </Group>
                                    {isActionable && (
                                        <IconChevronRight size={20} />
                                    )}
                                </Group>

                                <Text size="sm" c="dimmed" mb="md">
                                    {step.description}
                                </Text>

                                <Group justify="space-between">
                                    <Group>
                                        <IconClock size={16} />
                                        <Text size="sm" c="dimmed">
                                            {step.estimate}
                                        </Text>
                                    </Group>
                                    {step.status === 'completed' && (
                                        <ThemeIcon color="green" size="sm" radius="xl">
                                            <IconCheck size={12} />
                                        </ThemeIcon>
                                    )}
                                </Group>

                                {step.dependencies && step.dependencies.length > 0 && (
                                    <Group mt="sm">
                                        <Text size="xs" c="dimmed">
                                            Requires:
                                        </Text>
                                        {step.dependencies.map((depId) => {
                                            const dependency = integrationSteps.find(s => s.id === depId)
                                            return (
                                                <Badge key={depId} size="xs" variant="outline">
                                                    {dependency?.title}
                                                </Badge>
                                            )
                                        })}
                                    </Group>
                                )}

                                {blocked && (
                                    <Tooltip label="Complete required dependencies first">
                                        <Text size="xs" c="red" mt="sm">
                                            Blocked by dependencies
                                        </Text>
                                    </Tooltip>
                                )}
                            </Card>
                        )
                    })}
                </SimpleGrid>

                {/* Help Section */}
                <Card shadow="sm" p="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="md">
                        <div>
                            <Text size="lg" fw={500}>
                                Need Help?
                            </Text>
                            <Text size="sm" c="dimmed">
                                Our support team is here to help you get started
                            </Text>
                        </div>
                        <Button
                            variant="light"
                            leftSection={<IconExternalLink size={16} />}
                        >
                            Contact Support
                        </Button>
                    </Group>

                    <Text size="sm">
                        If you encounter any issues during setup, please don't hesitate to reach out.
                        We provide comprehensive documentation and personalized support to ensure
                        your success.
                    </Text>
                </Card>
            </Stack>

            {/* Import Modals */}
            <ProductImportModal
                opened={productImportOpened}
                onClose={() => setProductImportOpened(false)}
                onImport={(data: any) => {
                    // Handle product import
                    notifications.show({
                        title: 'Products imported successfully',
                        message: `${data.length} products have been imported`,
                        color: 'green'
                    })
                    // Don't auto-close the modal - let user close it manually after reviewing results
                }}
            />

            <SitesImportModal
                opened={sitesImportOpened}
                onClose={() => setSitesImportOpened(false)}
                onImport={(data: any) => {
                    // Handle sites import
                    notifications.show({
                        title: 'Sites imported successfully',
                        message: `${data.length} sites have been imported`,
                        color: 'green'
                    })
                    setSitesImportOpened(false)
                }}
            />

            <AgenciesImportModal
                opened={agenciesImportOpened}
                onClose={() => setAgenciesImportOpened(false)}
                onImport={(data: any) => {
                    // Handle agencies import
                    notifications.show({
                        title: 'Agencies imported successfully',
                        message: `${data.length} agencies have been imported`,
                        color: 'green'
                    })
                    setAgenciesImportOpened(false)
                }}
            />
        </Container>
    )
}

export default Integrations
