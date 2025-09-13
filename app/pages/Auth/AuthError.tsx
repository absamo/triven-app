import {
    Alert,
    Button,
    Center,
    Collapse,
    Container,
    Image,
    Paper,
    Stack,
    Text,
    Title,
    UnstyledButton
} from "@mantine/core"
import { IconAlertTriangle, IconChevronDown, IconChevronUp, IconLogin } from "@tabler/icons-react"
import { useState } from "react"
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from "react-router"

interface AuthErrorProps {
    error?: string
    errorDescription?: string
}

// Error message mappings to make them more user-friendly
const ERROR_MESSAGES: Record<string, { title: string; message: string; action?: string }> = {
    'unable_to_create_user': {
        title: 'Account Creation Error',
        message: 'We encountered an issue while creating your account. This might be because an account with this email already exists or there was a temporary server issue.',
        action: 'Try signing in instead, or contact support if the problem persists.'
    },
    'user_already_exists': {
        title: 'Account Already Exists',
        message: 'An account with this email address already exists.',
        action: 'Please try signing in instead.'
    },
    'invalid_credentials': {
        title: 'Invalid Credentials',
        message: 'The email or password you entered is incorrect.',
        action: 'Please check your credentials and try again.'
    },
    'access_denied': {
        title: 'Access Denied',
        message: 'You canceled the authentication process or denied access to your account.',
        action: 'Please try signing in again and allow access to continue.'
    },
    'unauthorized_client': {
        title: 'Client Authorization Error',
        message: 'There was an issue with the authentication service configuration.',
        action: 'Please contact support if this problem persists.'
    },
    'invalid_request': {
        title: 'Invalid Request',
        message: 'The authentication request was invalid.',
        action: 'Please try signing in again.'
    },
    'temporarily_unavailable': {
        title: 'Service Temporarily Unavailable',
        message: 'The authentication service is temporarily unavailable.',
        action: 'Please try again in a few minutes.'
    },
    'server_error': {
        title: 'Server Error',
        message: 'We encountered a temporary server issue.',
        action: 'Please try again in a few moments.'
    },
    'callback_error': {
        title: 'Authentication Error',
        message: 'There was an issue completing the authentication process.',
        action: 'Please try signing in again.'
    },
    'unknown_error': {
        title: 'Unknown Error',
        message: 'An unexpected error occurred during authentication.',
        action: 'Please try again or contact support if the problem persists.'
    },
    'default': {
        title: 'Authentication Error',
        message: 'We encountered an issue while processing your request.',
        action: 'Please try again or contact support if the problem persists.'
    }
}

export default function AuthErrorPage({ error, errorDescription }: AuthErrorProps) {
    const { t } = useTranslation(['auth', 'common'])
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [debugOpened, setDebugOpened] = useState(false)

    // Get error from URL params if not provided as props
    const urlError = searchParams.get('error') || error
    const urlErrorDescription = searchParams.get('error_description') || errorDescription

    // Get the appropriate error message
    const errorInfo = ERROR_MESSAGES[urlError || 'default'] || ERROR_MESSAGES.default

    const handleReturnHome = () => {
        navigate('/login')
    }

    const handleTryAgain = () => {
        // Clear error params and redirect to login
        navigate('/login', { replace: true })
    }

    const handleGoToSignUp = () => {
        // For cases where user might want to sign up instead
        navigate('/signup', { replace: true })
    }

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'light-dark(linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, rgb(207, 227, 234) 100%), linear-gradient(135deg, var(--mantine-color-dark-8) 0%, var(--mantine-color-dark-7) 50%, var(--mantine-color-dark-6) 100%))',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <Container size="sm">
                <div style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
                    {/* Logo */}
                    <Center mb="xl">
                        <Image
                            src="/assets/triven-logo.png"
                            alt="TRIVEN"
                            w={130}
                            fit="contain"
                        />
                    </Center>

                    <Paper
                        withBorder
                        shadow="xl"
                        p={40}
                        radius="lg"
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                    >
                        <Stack gap="md" align="center">
                            {/* Error Icon */}
                            <div style={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                backgroundColor: '#FEF3C7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 16
                            }}>
                                <IconAlertTriangle size={40} color="#F59E0B" />
                            </div>

                            {/* Error Title */}
                            <Title order={2} ta="center" c="light-dark(var(--mantine-color-gray-8), var(--mantine-color-gray-0))" fw={600}>
                                {errorInfo.title}
                            </Title>

                            {/* Error Message */}
                            <Text ta="center" c="#6B7280" size="md" lh={1.5}>
                                {errorInfo.message}
                            </Text>

                            {/* Action Text */}
                            {errorInfo.action && (
                                <Text ta="center" c="#6B7280" size="sm" lh={1.5}>
                                    {errorInfo.action}
                                </Text>
                            )}

                            {/* Debug Info (only in development) - Collapsible */}
                            {(import.meta.env.DEV && (urlError || urlErrorDescription)) && (
                                <div style={{ width: '100%', marginTop: 16 }}>
                                    <UnstyledButton
                                        onClick={() => setDebugOpened(!debugOpened)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            backgroundColor: '#FEF3C7',
                                            border: '1px solid #FDE68A',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Text size="sm" c="#92400E" fw={500}>
                                            Debug Information
                                        </Text>
                                        {debugOpened ? (
                                            <IconChevronUp size={16} color="#92400E" />
                                        ) : (
                                            <IconChevronDown size={16} color="#92400E" />
                                        )}
                                    </UnstyledButton>
                                    <Collapse in={debugOpened}>
                                        <Alert
                                            color="orange"
                                            variant="light"
                                            style={{ marginTop: 8, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
                                        >
                                            <Text size="xs" c="dimmed">
                                                <strong>Error Code:</strong> {urlError}<br />
                                                {urlErrorDescription && (
                                                    <>
                                                        <strong>Description:</strong> {urlErrorDescription}<br />
                                                    </>
                                                )}
                                                <strong>Timestamp:</strong> {new Date().toLocaleString()}
                                            </Text>
                                        </Alert>
                                    </Collapse>
                                </div>
                            )}                            {/* Action Buttons */}
                            <Stack gap="sm" style={{ width: '100%', marginTop: 24 }}>
                                {/* Show "Try Sign Up" button for certain errors */}
                                {urlError === 'invalid_credentials' && (
                                    <Button
                                        fullWidth
                                        size="md"
                                        radius="md"
                                        variant="outline"
                                        onClick={handleGoToSignUp}
                                        style={{
                                            height: 48,
                                            borderColor: '#4C8CFF',
                                            color: '#4C8CFF',
                                            '&:hover': {
                                                backgroundColor: '#F0F7FF'
                                            }
                                        }}
                                    >
                                        Create New Account
                                    </Button>
                                )}

                                <Button
                                    fullWidth
                                    size="md"
                                    radius="md"
                                    variant="subtle"
                                    leftSection={<IconLogin size={18} />}
                                    onClick={handleReturnHome}
                                    style={{
                                        height: 48,
                                        color: '#6B7280',
                                        '&:hover': {
                                            backgroundColor: '#F9FAFB'
                                        }
                                    }}
                                >
                                    Back to Login
                                </Button>
                            </Stack>

                            {/* Support Link */}
                            <Text ta="center" size="sm" c="dimmed" mt="md">
                                Need help?{' '}
                                <Text
                                    component="a"
                                    href="mailto:support@triven.com"
                                    c="#4C8CFF"
                                    style={{ textDecoration: 'none' }}
                                >
                                    Contact Support
                                </Text>
                            </Text>
                        </Stack>
                    </Paper>
                </div>
            </Container>
        </div>
    )
}
