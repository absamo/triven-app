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
  useMantineTheme,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle, IconBrandGoogle, IconLock, IconMail } from '@tabler/icons-react'
import classNames from 'classnames'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'

import { BackButton, Logo } from '~/app/components'
import { authClient } from '~/app/lib/auth.client'
import classes from './Login.module.css'

export default function LoginPage() {
  const { t } = useTranslation(['auth', 'common'])
  const theme = useMantineTheme()
  const { colorScheme } = useMantineColorScheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/'
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const loginSchema = z.object({
    email: z.string().email(t('auth:invalidEmail')).min(1, t('auth:emailRequired')),
    password: z.string().min(1, t('auth:passwordRequired')),
  })

  const form = useForm({
    validate: zodResolver(loginSchema),
    initialValues: {
      email: '',
      password: '',
    },
  })

  const handleEmailSignIn = async (values: { email: string; password: string }) => {
    setIsLoading(true)
    setApiError(null) // Clear previous errors

    try {
      // First, check if user is active before attempting to sign in
      const statusResponse = await fetch('/api/check-user-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      })

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        if (statusData.inactive) {
          navigate('/inactive-user')
          return
        }
      }

      // Proceed with normal sign-in if user is active or check failed
      const result = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      })

      if (result.error) {
        // Fallback: if we get a 500 error, it might still be an inactive user
        if (result.error.status === 500) {
          navigate('/inactive-user')
          return
        }
        setApiError(result.error.message || result.error.statusText || t('auth:invalidCredentials'))
        return
      }
      navigate(redirectTo)
    } catch (error) {
      setApiError(t('auth:unexpectedError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setApiError(null)
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirectTo,
      })
      // The redirect is handled automatically by the auth client
    } catch (error) {
      console.error('Google login error:', error)
      setApiError('Google login failed. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  // Use CSS variables to avoid hydration mismatches
  const containerStyle = {
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
  }

  const paperStyle = {
    width: '100%',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }

  return (
    <div style={containerStyle} className="login-container">
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
          p={theme.spacing.xxl}
          radius="lg"
          style={paperStyle}
          className="login-paper"
        >
          {/* Welcome Header */}
          <Center mb={8}>
            <Title
              order={2}
              size="h2"
              fw={600}
              c={`light-dark(${theme.colors.gray[8]}, ${theme.colors.gray[0]})`}
            >
              {t('auth:welcomeBack')}
            </Title>
          </Center>

          <Center mb={30}>
            <Text size="sm" c="dimmed" ta="center">
              {t('auth:signInToAccount')}
            </Text>
          </Center>

          <Stack gap="md">
            {/* API Error Alert */}
            {apiError && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                onClose={() => setApiError(null)}
              >
                {apiError}
              </Alert>
            )}

            {/* Email/Password Form */}
            <form onSubmit={form.onSubmit(handleEmailSignIn)}>
              <Stack gap="md">
                <TextInput
                  label={t('auth:email')}
                  leftSection={
                    <IconMail
                      size={18}
                      color={`light-dark(${theme.colors.gray[6]}, ${theme.colors.gray[4]})`}
                    />
                  }
                  placeholder={t('auth:emailPlaceholder')}
                  size="md"
                  radius={theme.defaultRadius}
                  styles={{
                    input: {
                      paddingLeft: 40,
                      height: 48,
                      fontSize: 16,
                      border: `1px solid light-dark(${theme.colors.gray[3]}, ${theme.colors.dark[4]})`,
                      backgroundColor: `light-dark(${theme.colors.gray[0]}, ${theme.colors.dark[6]})`,
                    },
                  }}
                  {...form.getInputProps('email')}
                />

                <PasswordInput
                  label={t('auth:password')}
                  leftSection={
                    <IconLock
                      size={18}
                      color={`light-dark(${theme.colors.gray[6]}, ${theme.colors.gray[4]})`}
                    />
                  }
                  placeholder={t('auth:passwordPlaceholder')}
                  size="md"
                  radius={theme.defaultRadius}
                  styles={{
                    input: {
                      paddingLeft: 40,
                      height: 48,
                      fontSize: 16,
                      border: `1px solid light-dark(${theme.colors.gray[3]}, ${theme.colors.dark[4]})`,
                      backgroundColor: `light-dark(${theme.colors.gray[0]}, ${theme.colors.dark[6]})`,
                    },
                  }}
                  {...form.getInputProps('password')}
                />

                <Text size="xs" c="dimmed" ta={'end'}>
                  {t('auth:forgotPassword')}{' '}
                  <Anchor href="/forgot-password" size="xs" c={theme.colors.blue[6]}>
                    {t('auth:resetPassword')}
                  </Anchor>
                </Text>

                <Button
                  type="submit"
                  fullWidth
                  mt={theme.spacing.sm}
                  size="md"
                  loading={isLoading}
                  styles={{
                    root: {
                      height: 48,
                      backgroundColor: theme.colors.brand[5],
                      border: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: theme.colors.brand[6],
                        transform: 'translateY(-1px)',
                        boxShadow: theme.shadows.md,
                      },
                    },
                  }}
                >
                  {t('auth:signIn')}
                </Button>
              </Stack>
            </form>

            <Divider
              label={t('auth:or')}
              labelPosition="center"
              className={classNames(classes.divider, classes.dividerLabelDynamic)}
            />

            {/* Google Sign In Button */}
            <Button
              variant="light"
              size="md"
              fullWidth
              leftSection={<IconBrandGoogle size={18} />}
              loading={googleLoading}
              onClick={handleGoogleLogin}
              styles={{
                root: {
                  height: 48,
                  backgroundColor: `light-dark(${theme.colors.gray[1]}, ${theme.colors.dark[5]})`,
                  borderColor: `light-dark(${theme.colors.gray[4]}, ${theme.colors.dark[3]})`,
                  border: '1px solid',
                  color: `light-dark(${theme.colors.gray[9]}, ${theme.colors.gray[0]})`,
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: `light-dark(${theme.colors.gray[2]}, ${theme.colors.dark[4]})`,
                    borderColor: `light-dark(${theme.colors.gray[5]}, ${theme.colors.dark[2]})`,
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows.md,
                  },
                },
              }}
            >
              {t('auth:continueWithGoogle')}
            </Button>

            <Center mt={10}>
              <Text size="xs" c="dimmed">
                <Text component="span" fw={700}>
                  {t('auth:dontHaveAccount')}
                </Text>{' '}
                <Anchor href="/signup" size="xs" c={theme.colors.blue[6]}>
                  {t('auth:startFreeTrial')}
                </Anchor>
              </Text>
            </Center>
          </Stack>
        </Paper>
      </div>
    </div>
  )
}
