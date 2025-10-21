import { Button, Flex, Group, Text } from '@mantine/core'
import { IconAlertTriangle, IconClock, IconCrown } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
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

  // Determine icon
  const Icon =
    urgencyLevel === 'high' ? IconAlertTriangle : urgencyLevel === 'medium' ? IconClock : IconCrown

  // Message with interpolation
  const message =
    daysRemaining === 1
      ? t('trial:oneDayRemaining')
      : urgencyLevel === 'medium'
        ? t('trial:trialExpiresIn', { days: daysRemaining })
        : t('trial:daysRemaining', { days: daysRemaining })

  // Unified alert component for all urgency levels
  return (
    <Flex
      className={classes.alert}
      align="center"
      justify="center"
      gap="lg"
      p="sm"
      mb="xl"
      data-urgency={urgencyLevel}
      data-position={position}
      style={{
        border: `1px solid light-dark(var(--mantine-color-${color}-4), var(--mantine-color-${color}-6))`,
        borderLeft: 0,
        borderRight: 0,
        borderRadius: 0,
      }}
    >
      <Group gap="xs">
        {Icon && (
          <Icon
            size={18}
            style={{
              color: `light-dark(var(--mantine-color-${color}-7), var(--mantine-color-${color}-3))`,
            }}
          />
        )}
        <Text
          size="sm"
          fw={700}
          tt="uppercase"
          style={{
            letterSpacing: '0.5px',
            color: `light-dark(var(--mantine-color-${color}-9), var(--mantine-color-${color}-2))`,
          }}
        >
          {message}
        </Text>
      </Group>
      {showUpgradeButton && (
        <Button
          variant="filled"
          color={color}
          size="compact-xs"
          radius="sm"
          leftSection={<IconCrown size={14} />}
          style={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
            fontSize: '0.7rem',
            padding: '4px 10px',
            height: 'auto',
          }}
          onClick={onUpgradeClick}
        >
          {t('trial:upgradeNow')}
        </Button>
      )}
    </Flex>
  )
}
