import { Box, Progress, Text } from "@mantine/core"
import { IconCheck, IconX } from "@tabler/icons-react"
import { useTranslation } from 'react-i18next'
import { getPasswordStrength, getPasswordStrengthColor, getPasswordStrengthLabel } from "~/app/utils/passwordStrength"

interface PasswordStrengthIndicatorProps {
    password: string
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    const { t } = useTranslation(['auth'])
    const passwordStrength = getPasswordStrength(password)

    return (
        <Box>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text size="xs" c="dimmed">{t('auth:passwordStrength')}</Text>
                <Text size="xs" c={getPasswordStrengthColor(passwordStrength.strength)} fw={500}>
                    {getPasswordStrengthLabel(passwordStrength.strength, t)}
                </Text>
            </div>
            <Progress
                value={passwordStrength.strength}
                color={getPasswordStrengthColor(passwordStrength.strength)}
                size="xs"
                radius="xl"
                style={{ marginBottom: 8 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {passwordStrength.checks.length ?
                        <IconCheck size={12} color="#10B981" /> :
                        <IconX size={12} color="#EF4444" />
                    }
                    <Text size="xs" c={passwordStrength.checks.length ? "green" : "red"}>
                        {t('auth:charactersMin')}
                    </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {passwordStrength.checks.uppercase ?
                        <IconCheck size={12} color="#10B981" /> :
                        <IconX size={12} color="#EF4444" />
                    }
                    <Text size="xs" c={passwordStrength.checks.uppercase ? "green" : "red"}>
                        {t('auth:uppercase')}
                    </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {passwordStrength.checks.lowercase ?
                        <IconCheck size={12} color="#10B981" /> :
                        <IconX size={12} color="#EF4444" />
                    }
                    <Text size="xs" c={passwordStrength.checks.lowercase ? "green" : "red"}>
                        {t('auth:lowercase')}
                    </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {passwordStrength.checks.numbers ?
                        <IconCheck size={12} color="#10B981" /> :
                        <IconX size={12} color="#EF4444" />
                    }
                    <Text size="xs" c={passwordStrength.checks.numbers ? "green" : "red"}>
                        {t('auth:numbers')}
                    </Text>
                </div>
            </div>
        </Box>
    )
}
