import { Anchor, Button, Center, Paper, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconMail } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { AuthIconBadge, BackButton, Logo } from '~/app/components'
import { authClient } from '~/app/lib/auth.client'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email').min(1, 'Email is required'),
})

export default function ForgotPasswordPage() {
  const { t } = useTranslation(['auth', 'common'])
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const form = useForm({
    validate: zodResolver(forgotPasswordSchema),
    initialValues: {
      email: '',
    },
  })

  const handleSubmit = async (values: { email: string }) => {
    setIsLoading(true)
    try {
      const result = await authClient.forgetPassword({
        email: values.email,
        redirectTo: '/reset-password',
      })

      if (result.error) {
        notifications.show({
          title: 'Error',
          message: result.error.message || 'Failed to send reset email',
          color: 'red',
        })
        return
      }

      setEmailSent(true)
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred',
        color: 'red',
      })
    } finally {
      setIsLoading(false)
    }
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
      <BackButton to="/login" position="top-left" color="#000000" style={{ fontSize: '14px' }}>
        Back to Login
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
          }}
        >
          {!emailSent ? (
            <>
              <AuthIconBadge icon={IconMail} theme="blue" />

              <Center mb={8}>
                <Title order={2} size="h2" fw={600} c="#374151">
                  Forgot Password?
                </Title>
              </Center>

              <Center mb={32}>
                <Text size="sm" c="#6B7280" ta="center" lh={1.5}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>
              </Center>

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="lg">
                  <div>
                    <Text size="sm" fw={500} c="#374151" mb={8}>
                      Email Address
                    </Text>
                    <TextInput
                      leftSection={<IconMail size={18} color="#6B7280" />}
                      placeholder={t('auth:emailPlaceholder')}
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
                      {...form.getInputProps('email')}
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
                    {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
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
            </>
          ) : (
            <>
              <AuthIconBadge icon={IconCheck} theme="green" />

              <Center mb={8}>
                <Title order={2} size="h3" fw={600} c="#374151" ta="center">
                  Check Your Email
                </Title>
              </Center>

              <Center mb={24}>
                <Text size="sm" c="#6B7280" ta="center" lh={1.5}>
                  We've sent a password reset link to <strong>{form.values.email}</strong>
                  <Text>Click the link in the email to reset your password.</Text>
                </Text>
              </Center>

              <Center mb={24}>
                <Text size="xs" c="#9CA3AF" ta="center">
                  Didn't receive the email? Check your spam folder or{' '}
                  <Anchor
                    href="#"
                    size="xs"
                    c="#4C8CFF"
                    fw={500}
                    onClick={() => {
                      setEmailSent(false)
                      form.reset()
                    }}
                  >
                    try again
                  </Anchor>
                </Text>
              </Center>

              <Center>
                <Button
                  component="a"
                  href="/login"
                  size="md"
                  radius="md"
                  fullWidth
                  styles={{
                    root: {
                      height: 48,
                      backgroundColor: '#4C8CFF',
                      fontSize: 16,
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#3B7EFF',
                      },
                    },
                  }}
                >
                  Back to Login
                </Button>
              </Center>
            </>
          )}
        </Paper>
      </div>
    </div>
  )
}
