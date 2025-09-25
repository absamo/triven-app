import {
  Badge,
  Button,
  Flex,
  Group,
  Menu,
  Stack,
  Text,
  UnstyledButton
} from "@mantine/core";
import { IconDotsVertical, IconPlus, IconStar, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Form, useSubmit } from "react-router";

import { useState } from "react";
import { getCurrencyFlag } from "~/app/common/helpers/isoCountryCurrency";
import { type ICurrency } from "~/app/common/validations/currencySchema";
import Currency from "~/app/components/Currency";
import classes from "./CurrencySettings.module.css";

interface CurrencySettingsProps {
  currencies: ICurrency[]
}

export default function CurrencySettings({
  currencies,
}: CurrencySettingsProps) {
  const { t } = useTranslation(['settings', 'common']);
  const [selectedCurrency, setSelectedCurrency] = useState<any>(null);

  const submit = useSubmit();

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

    submit(formData, { method: "post" })
  }

  const handleAddCurrency = () => {
    if (!selectedCurrency) return

    const formData = new FormData()
    formData.append("currencyCode", selectedCurrency.currencyCode)
    formData.append("currencyName", selectedCurrency.currencyName || selectedCurrency.currencyCode)
    formData.append("countryName", selectedCurrency.countryName || "")
    formData.append("isoCode", selectedCurrency.isoCode || "")
    formData.append("order", (currencies.length + 1).toString())

    submit(formData, { method: "post" })

    // Reset form
    setSelectedCurrency(null)
  }

  const handleCurrencyChange = (currency: any) => {
    setSelectedCurrency(currency)
  }



  return (
    <>
      {/* Add Currency Form - Always visible like Backorder items */}
      <Group mt="md" mb="md" align="end">
        <Currency
          onChange={handleCurrencyChange}
          name="currencyCode"
          value={selectedCurrency?.isoCode || null}
          placeholder={t('settings:selectCurrencyToAdd', 'Select a currency to add')}
          inputProps={{ style: { flex: 1 } }}
          hideLabel
        />
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleAddCurrency}
          disabled={!selectedCurrency}
        >
          {t('settings:addCurrency', 'Add currency')}
        </Button>
      </Group>

      <Stack gap="xs">
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
                  <Text fz="xs" c="dimmed">
                    {curency.countryName}
                  </Text>
                </Stack>
              </Group>

              {/* Right side - Badge for base currency or Menu for others */}
              {curency.base ? (
                <Badge size="xs" variant="outline" color="green">
                  {t('settings:base', 'Base')}
                </Badge>
              ) : (
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
                              color="var(--mantine-color-blue-filled)"
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
    </>
  )
}
