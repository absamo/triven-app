import {
  CheckIcon,
  Combobox,
  Divider,
  Flex,
  Group,
  InputBase,
  ScrollArea,
  Text,
  ThemeIcon,
  useCombobox,
} from '@mantine/core'
import { type ReactElement, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { countriesCodes } from '~/app/common/helpers/isoCountryCurrency'
import { type ICurrency } from '~/app/common/validations/currencySchema'
import classes from './Currency.module.css'

type CurrencyProps = Omit<ICurrency, 'base' | 'symbol'> & {
  flag: ReactElement
}

let currencies = countriesCodes.map((c) => {
  const Flag = c.currencyFlag as React.FC
  return {
    flag: <Flag />,
    currencyCode: c.currencyCode,
    currencyName: c.currencyName,
    countryName: c.countryName,
    isoCode: c.isoCode,
  }
}) as CurrencyProps[]

export default function Currency({
  name,
  error,
  required,
  companyCurrencies = [],
  value: valueProp = null,
  onChange = () => {},
  restrictToCompanyCurrencies = false,
  hideLabel = false,
  placeholder,
  inputProps,
}: {
  name?: string
  error?: string
  value?: string | null
  required?: boolean
  companyCurrencies?: ICurrency[]
  onChange?: (currency: CurrencyProps) => void
  restrictToCompanyCurrencies?: boolean
  hideLabel?: boolean
  placeholder?: string
  inputProps?: { [key: string]: any }
}) {
  const { t } = useTranslation('common')

  const defaultCurrencies = currencies
    .reduce((acc: ICurrency[], currency: ICurrency) => {
      const found = companyCurrencies.find((cc) => cc.isoCode === currency.isoCode) as ICurrency

      if (found) {
        acc.push({ ...currency, ...found })
      }

      return acc
    }, [])
    .sort((a, b) => (a.order || 0) - (b.order || 0)) as CurrencyProps[]

  const otherCurrencies = currencies.filter((c) => {
    return companyCurrencies.every((companycurrency) => companycurrency.isoCode !== c.isoCode)
  })

  const [value, setValue] = useState<string | null>(valueProp)
  const [search, setSearch] = useState('')

  // Sync internal value state with prop value
  useEffect(() => {
    setValue(valueProp)
  }, [valueProp])

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption()
      combobox.focusTarget()
    },

    onDropdownOpen: (eventSource) => {
      combobox.focusSearchInput()

      if (eventSource === 'keyboard') {
        combobox.selectActiveOption()
      } else {
        combobox.updateSelectedOptionIndex('active')
      }
    },
  })

  const selectedOption = restrictToCompanyCurrencies
    ? defaultCurrencies.find((item) => item.isoCode === value)
    : [...defaultCurrencies, ...otherCurrencies].find((item) => item.isoCode === value)

  const SelectOption = ({
    currencyCode,
    countryName,
    flag,
    placeholder: customPlaceholder,
  }: Partial<CurrencyProps> & { placeholder?: string }) => {
    if (!currencyCode) {
      return (
        <Text c="dimmed" size="sm">
          {customPlaceholder || t('searchCurrency')}
        </Text>
      )
    }

    return (
      <Flex align="center" gap="sm">
        <ThemeIcon variant="transparent" size="sm">
          {flag}
        </ThemeIcon>
        <Text fz="sm" fw={500} size="xs">
          {currencyCode}
        </Text>
        {currencyCode && <Divider size="sm" w={5} />}
        <Text c="dimmed" size="sm">
          {countryName}
        </Text>
      </Flex>
    )
  }

  const currencyOptions = (options: CurrencyProps[]) =>
    options
      .filter((item) => {
        return (
          item.currencyCode.toLowerCase().includes(search.toLowerCase().trim()) ||
          item.countryName?.toLowerCase().includes(search.toLowerCase().trim())
        )
      })

      .map((item, index) => (
        <Combobox.Option value={item.isoCode as string} key={index} active={item.isoCode === value}>
          <Group justify="space-between">
            <Flex align="center" gap="sm">
              <ThemeIcon variant="transparent" size="sm">
                {item.flag}
              </ThemeIcon>
              <div>
                <Text fz="sm" fw={500}>
                  {item.currencyCode}
                </Text>
                <Text fz="xs" c="dimmed">
                  {item.countryName}
                </Text>
              </div>
            </Flex>
            {item.isoCode === value && <CheckIcon size={12} />}
          </Group>
        </Combobox.Option>
      ))

  return (
    <>
      {/* {JSON.stringify(currencies, null, 2)} */}
      <Combobox
        classNames={classes}
        store={combobox}
        // withinPortal={false}
        onOptionSubmit={(currency) => {
          let currentCurrency

          if (restrictToCompanyCurrencies) {
            currentCurrency = defaultCurrencies.find((c) => c.isoCode === currency)
          } else {
            currentCurrency = currencies.find((c) => c.isoCode === currency)
          }

          onChange && onChange(currentCurrency as CurrencyProps)
          setValue(currency)
          setSearch('')
          combobox.closeDropdown()
        }}
      >
        <Combobox.Target>
          <InputBase
            label={hideLabel ? undefined : t('currency')}
            required={required}
            error={error}
            component="button"
            type="button"
            pointer
            rightSection={<Combobox.Chevron />}
            onClick={() => {
              combobox.toggleDropdown()
            }}
            rightSectionPointerEvents="none"
            name={name}
            {...inputProps}
          >
            <SelectOption {...selectedOption} placeholder={placeholder} />
          </InputBase>
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Search
            value={search}
            placeholder={t('searchCurrency')}
            onChange={(event) => {
              combobox.updateSelectedOptionIndex()
              setSearch(event.currentTarget.value)
            }}
            onFocus={() => combobox.openDropdown()}
          />
          <Combobox.Options>
            <ScrollArea.Autosize type="scroll" mah={250}>
              <Combobox.Group label={restrictToCompanyCurrencies ? null : t('defaultCurrencies')}>
                {currencyOptions(defaultCurrencies)}
              </Combobox.Group>

              {!restrictToCompanyCurrencies && (
                <Combobox.Group label={defaultCurrencies.length > 0 ? t('otherCurrencies') : null}>
                  {currencyOptions(otherCurrencies).length === 0 ? (
                    <Combobox.Empty>{t('nothingFound')}</Combobox.Empty>
                  ) : (
                    currencyOptions(otherCurrencies)
                  )}
                </Combobox.Group>
              )}
            </ScrollArea.Autosize>
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </>
  )
}
