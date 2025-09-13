import {
  Accordion,
  Badge,
  Divider,
  Grid,
  Group,
  Text,
  useMantineTheme,
} from "@mantine/core"
import {
  IconCreditCard,
  // IconBuildingBank,
  // IconRepeat,
  // IconReceiptRefund,
  // IconReceipt,
  // IconReceiptTax,
  // IconReport,
  // IconCashBanknote,
  // IconCoin,
  // IconEdit,
  // IconPencil,
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
  const canCreate = permissions.includes("create:settings")
  const canUpdate = permissions.includes("update:settings")

  const theme = useMantineTheme()
  const currencySymbol = CURRENCY_SYMBOLS[billing?.currency?.toUpperCase()]

  const settings = [
    {
      id: "currency",
      icon: () => (
        <IconPremiumRights color={theme.colors.violet[6]} size={17} />
      ),
      label: t('settings:currencies', 'Currencies'),
      description: t('settings:manageCurrencies', 'Manage your currencies'),
      content: () => <CurrencySettings currencies={currencies} />,
    },
    {
      id: "billing",
      icon: () => <IconCreditCard color={theme.colors.violet[6]} size={17} />,
      label: t('settings:subscriptions', 'Subscriptions'),
      description: t('settings:manageSubscriptions', 'Manage your subscription and billing settings'),
      content: () => (
        <Grid align="center" className={classes.row} p={10}>
          <Grid.Col span={2}>
            <Text fz="xs" opacity={0.6}>
              {t('settings:yourCurrentPlan', 'Your current plan')}
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Text fz="sm" tt={"capitalize"}>
              {billing?.currentPlan} {t('settings:plan', 'plan')}
            </Text>
            <Text fz="xs" opacity={0.6}>
              {currencySymbol}
              {Number(billing?.amount / 100).toFixed(2)} {t('settings:billedEveryMonth', 'billed every month')}
            </Text>
          </Grid.Col>
          <Grid.Col span={12}>
            <Divider />
          </Grid.Col>
          <Grid.Col span={2}>
            <Text fz="xs" opacity={0.6}>
              {t('settings:status', 'Status')}
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Badge size="xs" variant="light">
              {billing?.planStatus}
            </Badge>
          </Grid.Col>
          <Grid.Col span={12}>
            <Divider />
          </Grid.Col>
          <Grid.Col span={2}>
            <Text fz="xs" opacity={0.6}>
              {t('settings:renews', 'Renews')}
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Text fz="xs">
              {t('settings:nextInvoiceDue', 'Next invoice due on')}{" "}
              {dayjs(billing.trialEnd).format("MMM DD, YYYY")}
            </Text>
          </Grid.Col>

          {/* <Stack gap={0}>
            <Text fz="xs" opacity={0.6}>
              {billing.interval} billing cycle
            </Text>
            <Badge size="xs" variant="light">
              {billing.cancelAtPeriodEnd
                ? "Cancel at period end"
                : "Auto renew"}
            </Badge>
          </Stack> */}

          {/* {!curency.base && (
        <Group className={classes.currencyIcon}>
          <Menu withArrow position="bottom-end">
            <Menu.Target>
              <UnstyledButton>
                <IconDotsVertical size={16} stroke={1.5} />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Form
                onSubmit={(event) =>
                  handleSubmit(event, curency, "update")
                }
              >
                <Menu.Item
                  type="submit"
                  leftSection={
                    <IconStar
                      size={16}
                      stroke={1.5}
                      color={theme.colors.blue[5]}
                    />
                  }
                >
                  Set as base curency
                </Menu.Item>
              </Form>
              <Form
                onSubmit={(event) =>
                  handleSubmit(event, curency, "delete")
                }
              >
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={16} stroke={1.5} />}
                  type="submit"
                >
                  Remove currency
                </Menu.Item>
              </Form>
            </Menu.Dropdown>
          </Menu>
        </Group>
      )} */}
        </Grid>
      ),
    },
  ]

  const items = settings.map(
    ({ id, label, icon: Icon, description, content: Content }) => (
      <Accordion.Item value={id} key={label}>
        <Accordion.Control>
          <Group wrap="nowrap">
            <Icon />
            <div>
              <Text size="sm">{label}</Text>
              <Text size="xs" c="dimmed">
                {description}
              </Text>
            </div>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Content />
        </Accordion.Panel>
      </Accordion.Item>
    )
  )

  return (
    <>
      <Text className={classes.title}>{t('settings:title', 'Settings')}</Text>
      <Accordion
        chevronPosition="right"
        variant="contained"
        classNames={{ item: classes.root, panel: classes.panel }}
      >
        {items}
      </Accordion>
    </>
  )
}
