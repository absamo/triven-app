import {
    Alert,
    Anchor,
    Button,
    Center,
    Divider,
    Paper,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    Title,
    useMantineColorScheme,
    useMantineTheme
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { IconBrandGoogle, IconExclamationCircle, IconLock, IconMail, IconUser } from "@tabler/icons-react"
import { zodResolver } from "mantine-form-zod-resolver"
import { useState } from "react"
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from "react-router"
import { z } from "zod"

import { BackButton, Logo } from "~/app/components"
import PasswordStrengthIndicator from "~/app/components/PasswordStrengthIndicator"
import { authClient } from "~/app/lib/auth.client"

export default function SignupPage() {
    const { t } = useTranslation(['auth', 'common'])
    const theme = useMantineTheme()
    const { colorScheme } = useMantineColorScheme()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const redirectTo = searchParams.get("redirectTo") ?? "/dashboard"
    const inviteToken = searchParams.get("invite")
    const inviteEmail = searchParams.get("email")
    const [isLoading, setIsLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Show invitation context if present
    const isInvitation = !!inviteToken

    const signupSchema = z.object({
        firstName: z.string().min(1, t('auth:firstNameRequired')),
        lastName: z.string().min(1, t('auth:lastNameRequired')),
        email: z.string().email(t('auth:invalidEmail')).min(1, t('auth:emailRequired')),
        password: z.string().min(8, t('auth:passwordMinLength')),
        confirmPassword: z.string().min(1, t('auth:confirmPasswordRequired')),
    }).refine((data) => data.password === data.confirmPassword, {
        message: t('auth:passwordsDontMatch'),
        path: ["confirmPassword"],
    })

    const form = useForm({
        validate: zodResolver(signupSchema),
        initialValues: {
            firstName: "",
            lastName: "",
            email: inviteEmail || "", // Pre-fill email if invitation
            password: "",
            confirmPassword: "",
        },
    })

    const handleEmailSignUp = async (values: { firstName: string; lastName: string; email: string; password: string; confirmPassword: string }) => {
        setIsLoading(true)
        setErrorMessage(null) // Clear previous errors

        try {
            // First, create the user account with email and password
            const signupResult = await authClient.signUp.email({
                email: values.email,
                password: values.password,
                name: `${values.firstName} ${values.lastName}`,
                // Don't auto-sign in, we want to verify email first
                callbackURL: undefined
            });

            if (signupResult.error) {
                setErrorMessage(signupResult.error.message || t('auth:failedToCreateAccount'))
                return
            }

            // Better Auth automatically sends verification email during signup
            // when requireEmailVerification: true and overrideDefaultEmailVerification: true
            // Navigate to email verification page with invitation context
            const verifyEmailUrl = new URL('/verify-email', window.location.origin)
            verifyEmailUrl.searchParams.set('email', values.email)
            if (inviteToken) {
                verifyEmailUrl.searchParams.set('invite', inviteToken)
            }
            navigate(verifyEmailUrl.pathname + verifyEmailUrl.search)

        } catch (error: any) {
            setErrorMessage(t('auth:unexpectedError'))
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignUp = async () => {
        setGoogleLoading(true)
        setErrorMessage(null) // Clear previous errors
        try {
            // Better Auth already handles session validation, so we don't need to check again
            await authClient.signIn.social({
                provider: "google",
                callbackURL: redirectTo,
            })
        } catch (error: any) {
            // Check if it's a specific auth error we want to handle specially
            if (error?.error === 'unable_to_create_user') {
                navigate('/auth-error?error=unable_to_create_user')
            } else if (error?.error === 'user_already_exists') {
                navigate('/auth-error?error=user_already_exists')
            } else {
                setErrorMessage(t('auth:failedGoogleSignUp'))
            }
            setGoogleLoading(false)
        }
    }

    const backgroundGradient = colorScheme === 'dark'
        ? 'linear-gradient(135deg, #1a1b23 0%, #25262b 50%, #2c2e33 100%)'
        : 'linear-gradient(135deg, #e6fffa 0%, #b3f5ec 50%, #dbeafe 100%)'

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: backgroundGradient,
            padding: theme.spacing.lg,
            boxSizing: 'border-box',
            position: 'relative'
        }}>
            {/* Back Button */}
            <BackButton to="/" position="top-left">
                Back to Home
            </BackButton>

            <div style={{ width: '100%', maxWidth: 600 }}>
                {/* Logo */}
                <Center>
                    <Logo mb={-15} />
                </Center>

                <Paper
                    withBorder
                    shadow="xl"
                    p={40}
                    radius="lg"
                    style={{
                        width: '100%',
                        background: 'white'
                    }}
                >
                    {/* Welcome Header */}
                    <Center mb={8}>
                        <Title order={2} size="h2" fw={600} c="light-dark(var(--mantine-color-gray-8), var(--mantine-color-gray-0))">
                            {isInvitation ? 'Join your team' : t('auth:createAccount')}
                        </Title>
                    </Center>

                    <Center mb={30}>
                        <Text size="sm" c="dimmed" ta="center">
                            {isInvitation ? 'Complete your account setup to join your team' : t('auth:getStarted')}
                        </Text>
                    </Center>

                    {/* Error Alert */}
                    {errorMessage && (
                        <Alert
                            icon={<IconExclamationCircle size={16} />}
                            color="red"
                            radius="md"
                            mb="md"
                            variant="light"
                        >
                            {errorMessage}
                        </Alert>
                    )}

                    <Stack gap="md">
                        {/* Email/Password Form */}
                        <form onSubmit={form.onSubmit(handleEmailSignUp)}>
                            <Stack gap="md">
                                <TextInput
                                    name="firstName"
                                    leftSection={<IconUser size={18} color="light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-4))" />}
                                    placeholder={t('auth:firstNamePlaceholder')}
                                    size="md"
                                    radius="md"
                                    styles={{
                                        input: {
                                            paddingLeft: 40,
                                            height: 48,
                                            fontSize: 16,
                                            border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                                            backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))'
                                        }
                                    }}
                                    {...form.getInputProps("firstName")}
                                />

                                <TextInput
                                    name="lastName"
                                    leftSection={<IconUser size={18} color="light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-4))" />}
                                    placeholder={t('auth:lastNamePlaceholder')}
                                    size="md"
                                    radius="md"
                                    styles={{
                                        input: {
                                            paddingLeft: 40,
                                            height: 48,
                                            fontSize: 16,
                                            border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                                            backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))'
                                        }
                                    }}
                                    {...form.getInputProps("lastName")}
                                />

                                <TextInput
                                    name="email"
                                    leftSection={<IconMail size={18} color="light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-4))" />}
                                    placeholder={t('auth:emailPlaceholder')}
                                    size="md"
                                    radius="md"
                                    readOnly={isInvitation}
                                    styles={{
                                        input: {
                                            paddingLeft: 40,
                                            height: 48,
                                            fontSize: 16,
                                            border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                                            backgroundColor: isInvitation ? 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-7))' : 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))'
                                        }
                                    }}
                                    {...form.getInputProps("email")}
                                />

                                <PasswordInput
                                    name="password"
                                    leftSection={<IconLock size={18} color="light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-4))" />}
                                    placeholder={t('auth:passwordMinPlaceholder')}
                                    size="md"
                                    radius="md"
                                    styles={{
                                        input: {
                                            paddingLeft: 40,
                                            height: 48,
                                            fontSize: 16,
                                            border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                                            backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))'
                                        }
                                    }}
                                    {...form.getInputProps("password")}
                                />

                                <PasswordStrengthIndicator password={form.values.password} />

                                <PasswordInput
                                    name="confirmPassword"
                                    leftSection={<IconLock size={18} color="light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-4))" />}
                                    placeholder={t('auth:confirmPasswordPlaceholder')}
                                    size="md"
                                    radius="md"
                                    styles={{
                                        input: {
                                            paddingLeft: 40,
                                            height: 48,
                                            fontSize: 16,
                                            border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                                            backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))'
                                        }
                                    }}
                                    {...form.getInputProps("confirmPassword")}
                                />

                                <Button
                                    type="submit"
                                    fullWidth
                                    size="md"
                                    radius="md"
                                    loading={isLoading}
                                    styles={{
                                        root: {
                                            height: 48,
                                            backgroundColor: 'var(--mantine-color-green-8)',
                                            '&:hover': {
                                                backgroundColor: 'var(--mantine-color-green-9)'
                                            }
                                        }
                                    }}
                                >
                                    {t('auth:createAccountButton')}
                                </Button>
                            </Stack>
                        </form>

                        <Divider label={t('auth:or')} labelPosition="center" />

                        {/* Google Sign Up Button */}
                        <Button
                            variant="outline"
                            size="md"
                            radius="md"
                            fullWidth
                            leftSection={<IconBrandGoogle size={18} />}
                            loading={googleLoading}
                            onClick={handleGoogleSignUp}
                            styles={{
                                root: {
                                    height: 48,
                                    borderColor: '#E5E7EB',
                                    color: '#374151',
                                    '&:hover': {
                                        backgroundColor: '#F9FAFB'
                                    }
                                }
                            }}
                        >
                            {t('auth:continueWithGoogle')}
                        </Button>

                        <Center mt={20}>
                            <Text size="sm" c="dimmed">
                                {t('auth:alreadyHaveAccount')}{' '}
                                <Anchor href="/login" size="sm" c="#4C8CFF">
                                    {t('auth:signIn')}
                                </Anchor>
                            </Text>
                        </Center>
                    </Stack>
                </Paper>
            </div>
        </div>
    )
}
