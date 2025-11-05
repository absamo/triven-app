import { Button, Flex, Text } from '@mantine/core'
import { IconCrown } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import ClientOnly from '~/app/components/ClientOnly'
import type { TrialUrgencyLevel } from '~/app/utils/subscription'
import classes from './TrialAlert.module.css'

interface TrialAlertProps {
  daysRemaining: number
  urgencyLevel: TrialUrgencyLevel
  onUpgradeClick: () => void
  showUpgradeButton: boolean
  position?: 'header' | 'banner'
}

export default function TrialAlert({
  daysRemaining,
  urgencyLevel,
  onUpgradeClick,
  showUpgradeButton,
  position = 'header',
}: TrialAlertProps) {
  const { t } = useTranslation(['trial'])

  // Don't render if expired or not trial
  if (urgencyLevel === 'expired' || daysRemaining === 0) {
    return null
  }

  // Determine color based on urgency
  const color = urgencyLevel === 'low' ? 'blue' : urgencyLevel === 'medium' ? 'orange' : 'red'

  // Message with interpolation
  const message =
    daysRemaining === 1
      ? t('trial:oneDayRemaining')
      : urgencyLevel === 'medium'
        ? t('trial:trialExpiresIn', { days: daysRemaining })
        : t('trial:daysRemaining', { days: daysRemaining })

  // Fallback message for SSR (English)
  const fallbackMessage =
    daysRemaining === 1
      ? '1 day left in trial'
      : urgencyLevel === 'medium'
        ? `Trial expires in ${daysRemaining} days`
        : `${daysRemaining} days remaining`

  // Unified alert component for all urgency levels
  return (
    <Flex
      className={classes.alert}
      align="center"
      justify="center"
      gap="lg"
      p="sm"
      data-urgency={urgencyLevel}
      data-position={position}
      style={{
        borderBottom: `1px solid light-dark(var(--mantine-color-${color}-4), var(--mantine-color-${color}-6))`,
        borderRadius: 0,
        width: '100%',
        position: 'sticky',
        marginTop: '-24px',
        top: 70,
        marginBottom: '30px',
        zIndex: 100,
        backgroundColor: 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))',
      }}
    >
      <Text
        size="sm"
        fw={700}
        tt="uppercase"
        style={{
          letterSpacing: '0.5px',
          color: `light-dark(var(--mantine-color-${color}-9), var(--mantine-color-${color}-2))`,
        }}
      >
        <ClientOnly fallback={fallbackMessage}>{message}</ClientOnly>
      </Text>
      {showUpgradeButton && (
        <Button
          variant="filled"
          color={color}
          size="compact-xs"
          radius="sm"
          leftSection={<IconCrown size={14} />}
          styles={{
            root: {
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              fontSize: '0.7rem',
              padding: '4px 10px',
              height: 'auto',
              cursor: 'pointer',
            },
            inner: {
              pointerEvents: 'none',
            },
          }}
          onClick={onUpgradeClick}
        >
          <ClientOnly fallback="Upgrade Now">{t('trial:upgradeNow')}</ClientOnly>
        </Button>
      )}
    </Flex>
  )
}
