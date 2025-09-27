import {
  Badge,
  Divider,
  Grid,
  Tabs,
  Text,
  useMantineTheme
} from "@mantine/core"
import {
  IconCreditCard,
  IconPremiumRights,
} from "@tabler/icons-react"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { type ICurrency } from "~/app/common/validations/currencySchema"
import { CURRENCY_SYMBOLS } from "~/app/modules/stripe/plans"
import CurrencySettings from "./CurrencySettings"
import classes from "./Settings.module.css"

interface SettingsProps {
  currencies: ICurrency[]
  billing: {
    planStatus: string
    currentPlan: string
    interval: string
    currentPeriodStart: number
    currentPeriodEnd: number
    trialStart: number
    trialEnd: number
    cancelAtPeriodEnd: boolean
    amount: number
    currency: string
  }
  permissions: string[]
}

export default function Settings({
  currencies = [],
  billing,
  permissions = [],
}: SettingsProps) {
  const { t } = useTranslation(['settings', 'common']);

  const theme = useMantineTheme()
  const currencySymbol = CURRENCY_SYMBOLS[billing?.currency?.toUpperCase()]

  const settings = [
    {
      id: "billing",
      icon: () => <IconCreditCard color={theme.colors.violet[6]} size={17} />,
      label: t('common:subscriptions', 'Subscriptions'),
      description: t('common:manageSubscriptions', 'Manage your subscription and billing settings'),
      content: () => (
        <Grid align="center" className={classes.row} p={10}>
          <Grid.Col span={2}>
            <Text fz="xs" opacity={0.6}>
              {t('common:yourCurrentPlan', 'Your current plan')}
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Text fz="sm" tt={"capitalize"}>
              {billing?.currentPlan || 'Standard'} {t('common:plan', 'plan')}
            </Text>
            <Text fz="xs" opacity={0.6}>
              {billing?.amount ? (
                <>
                  {currencySymbol}
                  {Number(billing.amount / 100).toFixed(2)} {t('common:billedEveryMonth', 'billed every month')}
                </>
              ) : (
                t('common:noActiveBilling', 'No active billing')
              )}
            </Text>
          </Grid.Col>
          <Grid.Col span={12}>
            <Divider />
          </Grid.Col>
          <Grid.Col span={2}>
            <Text fz="xs" opacity={0.6}>
              {t('common:status', 'Status')}
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Badge size="xs" variant="light" color={billing?.planStatus ? "green" : "gray"}>
              {billing?.planStatus || t('common:noActiveSubscription', 'No Active Subscription')}
            </Badge>
          </Grid.Col>
          <Grid.Col span={12}>
            <Divider />
          </Grid.Col>
          <Grid.Col span={2}>
            <Text fz="xs" opacity={0.6}>
              {t('common:renews', 'Renews')}
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Text fz="xs">
              {billing?.currentPeriodEnd ? (
                <>
                  {t('common:nextInvoiceDue', 'Next invoice due on')}{" "}
                  {dayjs(billing.currentPeriodEnd * 1000).format("MMM DD, YYYY")}
                </>
              ) : billing?.trialEnd ? (
                <>
                  {t('common:trialEndsOn', 'Trial ends on')}{" "}
                  {dayjs(billing.trialEnd * 1000).format("MMM DD, YYYY")}
                </>
              ) : (
                t('common:noRenewalDate', 'No renewal date available')
              )}
            </Text>
          </Grid.Col>
        </Grid>
      ),
    },
    {
      id: "currency",
      icon: () => (
        <IconPremiumRights color={theme.colors.violet[6]} size={17} />
      ),
      label: t('settings:currencies', 'Currencies'),
      description: t('settings:manageCurrencies', 'Manage your currencies'),
      content: () => <CurrencySettings currencies={currencies} />,
    },
  ]

  return (
    <>
      <Text className={classes.title}>{t('settings:title', 'Settings')}</Text>
      <Tabs defaultValue="billing" variant="outline" radius="md">
        <Tabs.List>
          {settings.map(({ id, label, icon: Icon }) => (
            <Tabs.Tab value={id} key={id} leftSection={<Icon />}>
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {settings.map(({ id, content: Content }) => (
          <Tabs.Panel value={id} key={id} pt="md">
            <Content />
          </Tabs.Panel>
        ))}
      </Tabs>
    </>
  )
}
