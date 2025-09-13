import {
  Badge,
  Button,
  Flex,
  Group,
  Menu,
  Stack,
  Text,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import { IconDotsVertical, IconStar, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Form, useSubmit } from "react-router";

import { getCurrencyFlag } from "~/app/common/helpers/isoCountryCurrency";
import { type ICurrency } from "~/app/common/validations/currencySchema";
import classes from "./CurrencySettings.module.css";
// import SettingsTitle from "./SettingsTitle"
import { useDisclosure } from "@mantine/hooks";
import CurrencyForm from "./CurrencyForm";

interface CurrencySettingsProps {
  currencies: ICurrency[]
}

export default function CurrencySettings({
  currencies,
}: CurrencySettingsProps) {
  const { t } = useTranslation(['settings', 'common']);
  const [opened, { open, close }] = useDisclosure(false)

  const handleClick = () => {
    open()
  }

  const submit = useSubmit()

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    curency: ICurrency,
    action: string
  ) => {
    event.preventDefault()

    if (curency.base) {
      return
    }

    const formData = new FormData()

    formData.append("id", curency.id as string)
    formData.append("action", action)

    submit(formData, { method: "post", action: "/api/currencies" })
  }

  const theme = useMantineTheme()

  return (
    <>
      <Stack mt={10} gap="xs">
        {currencies.map((curency: ICurrency) => {
          const Flag = getCurrencyFlag(curency.isoCode as string) as React.FC

          return (
            <Flex
              align="center"
              className={classes.row}
              justify="space-between"
              p={5}
              key={curency.isoCode}
            >
              <Group gap={10}>
                <Flag />
                <Stack gap={0}>
                  <Text fz="sm">{curency.currencyCode}</Text>
                  <Text fz="xs" opacity={0.6}>
                    {curency.countryName}
                  </Text>
                </Stack>
                {curency.base && (
                  <Badge size="xs" variant="outline" color="green" ml={50}>
                    {t('settings:base', 'Base')}
                  </Badge>
                )}
              </Group>

              {!curency.base && (
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
                          {t('settings:setAsBaseCurrency', 'Set as base currency')}
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
                          {t('settings:removeCurrency', 'Remove currency')}
                        </Menu.Item>
                      </Form>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              )}
            </Flex>
          )
        })}
      </Stack>

      <Group justify="end" mt="md">
        <Button
          onClick={handleClick}
          className={classes.editButton}
          size="compact-md"
        >
          {t('settings:addCurrency', 'Add currency')}
        </Button>
      </Group>
      <CurrencyForm
        opened={opened}
        onClose={close}
        order={currencies.length + 1}
      />
    </>
  )
}
