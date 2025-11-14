import { Box, Center, Paper, Stack, Text, Title } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

import { AuthIconBadge, BackButton, Logo } from '~/app/components'

export default function InactiveUserPage() {
  const { t } = useTranslation(['auth', 'common'])

  const handleBackToLogin = () => {
    // Sign out first by posting to logout, then redirect to login
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/logout'
    document.body.appendChild(form)
    form.submit()
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        position: 'relative',
        background:
          'light-dark(linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, rgb(207, 227, 234) 100%), linear-gradient(135deg, #1a1b1e 0%, #25262b 50%, #2c2e33 100%))',
      }}
    >
      {/* Back Button */}
      <BackButton onClick={handleBackToLogin} position="top-left" style={{ fontSize: '14px' }}>
        Back to Login
      </BackButton>

      <div style={{ width: '100%', maxWidth: 600 }}>
        {/* Logo */}
        <Center>
          <Logo mb={-15} />
        </Center>

        <Paper withBorder shadow="xl" p={40} radius="lg" style={{ width: '100%' }}>
          {/* Header */}
          <Stack align="center" gap="sm" mb={32}>
            <AuthIconBadge icon={IconAlertCircle} theme="orange" />

            <Title order={2} size="h2" fw={600} ta="center">
              {t('auth:accountDeactivated', 'Account Deactivated')}
            </Title>

            <Text size="sm" c="dimmed" ta="center" maw={400}>
              {t('auth:inactiveUser')}
            </Text>
          </Stack>

          <Stack gap="md">
            <Center mt={20}>
              <Text size="xs" c="dimmed" ta="center">
                {t('auth:needHelp', 'Need help?')}{' '}
                <Text
                  component="a"
                  href="mailto:support@triven.com"
                  size="xs"
                  c="blue"
                  td="underline"
                  style={{ cursor: 'pointer' }}
                >
                  {t('auth:contactUs', 'Contact us')}
                </Text>
              </Text>
            </Center>
          </Stack>
        </Paper>
      </div>
    </Box>
  )
}
