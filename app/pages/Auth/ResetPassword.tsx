import { Anchor, Button, Center, Paper, PasswordInput, Stack, Text, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconLock } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'

import { AuthIconBadge, BackButton, Logo } from '~/app/components'
import PasswordStrengthIndicator from '~/app/components/PasswordStrengthIndicator'
import { authClient } from '~/app/lib/auth.client'

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match. Please make sure both passwords are identical.',
    path: ['confirmPassword'],
  })

export default function ResetPasswordPage() {
  const { t } = useTranslation(['auth', 'common'])
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [isLoading, setIsLoading] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)

  const form = useForm({
    validate: zodResolver(resetPasswordSchema),
    initialValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
    if (!token) {
      notifications.show({
        title: 'Reset Link Required',
        message: 'Please use the reset link from your email to access this page.',
        color: 'orange',
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await authClient.resetPassword({
        newPassword: values.password,
        token,
      })

      if (result.error) {
        // Check if it's a token-related error
        if (
          result.error.message?.includes('token') ||
          result.error.message?.includes('expired') ||
          result.error.message?.includes('invalid')
        ) {
          setTokenError(result.error.message)
        } else {
          notifications.show({
            title: 'Error',
            message: result.error.message || 'Failed to reset password',
            color: 'red',
          })
        }
        return
      }

      notifications.show({
        title: 'Success',
        message:
          'Your password has been reset successfully! You can now sign in with your new password.',
        color: 'green',
      })

      navigate('/login')
    } catch (error) {
      notifications.show({
        title: 'Connection Error',
        message:
          "We're having trouble connecting to our servers. Please check your internet connection and try again.",
        color: 'red',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!token || tokenError) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'light-dark(linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, rgb(207, 227, 234) 100%), linear-gradient(135deg, var(--mantine-color-dark-8) 0%, var(--mantine-color-dark-7) 50%, var(--mantine-color-dark-6) 100%))',
          padding: '20px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Back Button */}
        <BackButton
          to="/forgot-password"
          position="top-left"
          color="#000000"
          style={{ fontSize: '14px' }}
        >
          Back to Reset Request
        </BackButton>
        <Paper
          withBorder
          shadow="xl"
          p={40}
          radius="lg"
          style={{ background: 'white', maxWidth: 450, margin: '0 auto' }}
        >
          <AuthIconBadge icon={IconAlertCircle} theme="red" />

          <Center mb={8}>
            <Title order={2} size="h3" fw={600} c="#374151" ta="center">
              Email link invalid or expired
            </Title>
          </Center>

          <Center mb={24}>
            <Text size="sm" c="#6B7280" ta="center" lh={1.5}>
              This reset link is no longer valid. Please request a new one to continue with your
              password reset.
            </Text>
          </Center>
          <Center>
            <Button
              component="a"
              href="/forgot-password"
              size="md"
              radius="md"
              fullWidth
              styles={{
                root: {
                  backgroundColor: 'var(--mantine-color-green-8)',
                  '&:hover': {
                    backgroundColor: 'var(--mantine-color-green-9)',
                  },
                },
              }}
            >
              Get New Reset Link
            </Button>
          </Center>

          <Center mt={20}>
            <Text size="xs" c="#9CA3AF" ta="center">
              Need help? Contact support if you continue to have issues.
            </Text>
          </Center>
        </Paper>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'light-dark(linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, rgb(207, 227, 234) 100%), linear-gradient(135deg, var(--mantine-color-dark-8) 0%, var(--mantine-color-dark-7) 50%, var(--mantine-color-dark-6) 100%))',
        padding: '20px',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Back Button */}
      <BackButton
        to="/forgot-password"
        position="top-left"
        color="#000000"
        style={{ fontSize: '14px' }}
      >
        Back to Reset Request
      </BackButton>

      <div style={{ width: '100%', maxWidth: 600 }}>
        {/* Logo */}
        <Center>
          <Logo alt="TRIVEN" />
        </Center>

        <Paper
          withBorder
          shadow="xl"
          p={40}
          radius="lg"
          style={{
            width: '100%',
            background: 'white',
            maxWidth: 500,
          }}
        >
          <Center mb={8}>
            <Title order={2} size="h2" fw={600} c="#374151">
              Create New Password
            </Title>
          </Center>

          <Center mb={32}>
            <Text size="sm" c="#6B7280" ta="center" lh={1.5}>
              Choose a strong password to secure your account
            </Text>
          </Center>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
              <div>
                <Text size="sm" fw={500} c="#374151" mb={8}>
                  New Password
                </Text>
                <PasswordInput
                  leftSection={<IconLock size={18} color="#6B7280" />}
                  placeholder="Enter your new password"
                  size="md"
                  radius="md"
                  styles={{
                    input: {
                      paddingLeft: 40,
                      height: 48,
                      fontSize: 16,
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#F9FAFB',
                      '&:focus': {
                        borderColor: '#4C8CFF',
                        backgroundColor: '#FFFFFF',
                      },
                    },
                  }}
                  {...form.getInputProps('password')}
                />
              </div>

              <PasswordStrengthIndicator password={form.values.password} />

              <div>
                <Text size="sm" fw={500} c="#374151" mb={8}>
                  Confirm Password
                </Text>
                <PasswordInput
                  leftSection={<IconLock size={18} color="#6B7280" />}
                  placeholder="Re-enter your new password"
                  size="md"
                  radius="md"
                  styles={{
                    input: {
                      paddingLeft: 40,
                      height: 48,
                      fontSize: 16,
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#F9FAFB',
                      '&:focus': {
                        borderColor: '#4C8CFF',
                        backgroundColor: '#FFFFFF',
                      },
                    },
                  }}
                  {...form.getInputProps('confirmPassword')}
                />
              </div>

              <Button
                type="submit"
                fullWidth
                size="md"
                radius="md"
                loading={isLoading}
                mt="lg"
                styles={{
                  root: {
                    height: 48,
                    backgroundColor: 'var(--mantine-color-green-8)',
                    fontSize: 16,
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'var(--mantine-color-green-9)',
                    },
                    '&:disabled': {
                      backgroundColor: '#E5E7EB',
                      color: '#9CA3AF',
                    },
                  },
                }}
              >
                {isLoading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </Stack>
          </form>

          <Center mt={24}>
            <Text size="sm" c="#6B7280">
              Remember your password?{' '}
              <Anchor href="/login" size="sm" c="#4C8CFF" fw={500}>
                Sign in instead
              </Anchor>
            </Text>
          </Center>
        </Paper>
      </div>
    </div>
  )
}
