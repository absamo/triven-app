import {
  Alert,
  Anchor,
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle, IconExclamationCircle, IconLock, IconMail } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useActionData, useLoaderData, useNavigation } from 'react-router'
import { z } from 'zod'
import { AuthIconBadge, BackButton, Logo } from '~/app/components'
import PasswordStrengthIndicator from '~/app/components/PasswordStrengthIndicator/PasswordStrengthIndicator'

interface LoaderData {
  invitation: {
    id: string
    email: string
    token: string
    inviterName: string
    companyName: string
  } | null
  error?: string
}

interface ActionData {
  error?: string
  success?: boolean
}

export default function JoinTeam() {
  const { t } = useTranslation(['auth', 'common', 'forms'])
  const { invitation, error: loaderError } = useLoaderData<LoaderData>()
  const actionData = useActionData<ActionData>()
  const navigation = useNavigation()
  const [isLoading, setIsLoading] = useState(false)
  const [clientError, setClientError] = useState<string>('')

  const isSubmitting = navigation.state === 'submitting'
  const error = clientError || actionData?.error || loaderError

  // Schema for join team form - only need password fields
  const joinTeamSchema = z
    .object({
      password: z.string().min(8, t('auth:passwordMinLength')),
      confirmPassword: z.string().min(1, t('auth:confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth:passwordsDontMatch'),
      path: ['confirmPassword'],
    })

  const form = useForm({
    validate: zodResolver(joinTeamSchema),
    initialValues: {
      password: '',
      confirmPassword: '',
    },
  })

  if (!invitation) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%,rgb(207, 227, 234) 100%)',
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        {/* Back Button - Top Left */}
        <BackButton to="/login" position="top-left">
          Back to Login
        </BackButton>

        <div style={{ width: '100%', maxWidth: 500 }}>
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
              background: 'white',
            }}
          >
            <AuthIconBadge icon={IconExclamationCircle} theme="red" mb={20} />

            <Center mb={8}>
              <Title order={2} size="h2" fw={600} c="#374151">
                {t('auth:invalidInvitation')}
              </Title>
            </Center>

            <Center mb={30}>
              <Text size="sm" c="dimmed" ta="center">
                {t('auth:invitationExpiredOrInvalid')}
              </Text>
            </Center>

            <Button
              component="a"
              href="/signup"
              fullWidth
              size="md"
              radius="md"
              styles={{
                root: {
                  height: 48,
                  backgroundColor: '#4C8CFF',
                  '&:hover': {
                    backgroundColor: '#3B7EFF',
                  },
                },
              }}
            >
              {t('auth:signup')}
            </Button>
          </Paper>
        </div>
      </div>
    )
  }

  const handleJoinTeam = (values: { password: string; confirmPassword: string }) => {
    // Let React Router handle the form submission
    // The form will be submitted to the action automatically
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%,rgb(207, 227, 234) 100%)',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Back Button - Top Left */}
      <BackButton to="/login" position="top-left">
        Back to Login
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
            background: 'white',
          }}
        >
          {/* Welcome Header */}
          <Center mb={8}>
            <Title order={2} size="h2" fw={600} c="#374151">
              {t('auth:joinTeam', {
                companyName: invitation.companyName,
              })}
            </Title>
          </Center>

          <Center mb={30}>
            <Text size="sm" c="dimmed" ta="center">
              {t('auth:joinTeamDescription', {
                inviterName: invitation.inviterName,
              })}
            </Text>
          </Center>

          <Stack gap="md">
            {/* Error Alert */}
            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                onClose={clientError ? () => setClientError('') : undefined}
              >
                {error}
              </Alert>
            )}

            {/* Join Team Form */}
            <form method="post">
              <input type="hidden" name="token" value={invitation.token} />
              <Stack gap="md">
                <TextInput
                  label={t('forms:email')}
                  leftSection={<IconMail size={18} color="#6B7280" />}
                  value={invitation.email}
                  disabled
                  size="md"
                  radius="md"
                  styles={{
                    input: {
                      paddingLeft: 40,
                      height: 48,
                      fontSize: 16,
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#F3F4F6',
                      cursor: 'not-allowed',
                      color: '#6B7280',
                    },
                  }}
                />

                <PasswordInput
                  label={t('forms:password')}
                  leftSection={<IconLock size={18} color="#6B7280" />}
                  placeholder={t('auth:passwordPlaceholder')}
                  size="md"
                  radius="md"
                  name="password"
                  required
                  styles={{
                    input: {
                      paddingLeft: 40,
                      height: 48,
                      fontSize: 16,
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#F9FAFB',
                    },
                  }}
                  {...form.getInputProps('password')}
                />

                {/* Password Strength Indicator */}
                <PasswordStrengthIndicator password={form.values.password} />

                <PasswordInput
                  label={t('auth:confirmPassword')}
                  leftSection={<IconLock size={18} color="#6B7280" />}
                  placeholder={t('auth:confirmPasswordPlaceholder')}
                  size="md"
                  radius="md"
                  styles={{
                    input: {
                      paddingLeft: 40,
                      height: 48,
                      fontSize: 16,
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#F9FAFB',
                    },
                  }}
                  {...form.getInputProps('confirmPassword')}
                />

                <Button
                  type="submit"
                  fullWidth
                  mt={10}
                  size="md"
                  radius="md"
                  loading={isLoading || isSubmitting}
                  styles={{
                    root: {
                      height: 48,
                      backgroundColor: '#4C8CFF',
                      '&:hover': {
                        backgroundColor: '#3B7EFF',
                      },
                    },
                  }}
                >
                  {t('common:join')}
                </Button>
              </Stack>
            </form>

            <Center mt={10}>
              <Text size="xs" c="dimmed">
                <Text component="span" fw={700}>
                  {t('auth:alreadyHaveAccount')}
                </Text>{' '}
                <Anchor href="/login" size="xs" c="#4C8CFF">
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
