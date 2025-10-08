import { countriesCodes } from '~/app/common/helpers/isoCountryCurrency'

// Define the type for country data from isoCountryCurrency
interface CountryData {
  isoCode: string
  currencyCode: string
  currencyName: string
  countryName: string
  currencyFlag: React.ComponentType
  countryFlag: React.ComponentType
  symbol?: string
}

// European countries that are commented out in countriesCodes but should be available for country selection
const europeanCountries: CountryData[] = [
  {
    isoCode: 'AD',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Andorra',
    currencyFlag: {} as React.ComponentType, // Will use EUR flag
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'AT',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Austria',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'BE',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Belgium',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'CY',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Cyprus',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'DE',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Germany',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'EE',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Estonia',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'ES',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Spain',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'FI',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Finland',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'FR',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'France',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'GR',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Greece',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'IE',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Ireland',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'IT',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Italy',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'LT',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Lithuania',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'LU',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Luxembourg',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'LV',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Latvia',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'MC',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Monaco',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'ME',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Montenegro',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'MT',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Malta',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'NL',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Netherlands',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'PT',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Portugal',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'SI',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Slovenia',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'SK',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Slovakia',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'SM',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'San Marino',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'VA',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Vatican City',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
  {
    isoCode: 'XK',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    countryName: 'Kosovo',
    currencyFlag: {} as React.ComponentType,
    countryFlag: {} as React.ComponentType,
    symbol: '€',
  },
]

// Combined countries list for country selection (includes European countries)
const allCountriesForSelection = [...(countriesCodes as CountryData[]), ...europeanCountries]

/**
 * Country selection option interface
 */
export interface CountryOption {
  value: string // ISO country code
  label: string // Country name
  currencyCode?: string
  currencyName?: string
  symbol?: string
}

/**
 * Currency option interface for form select components
 */
export interface CurrencyOption {
  value: string // Currency code (e.g., "USD", "EUR")
  label: string // Display label with symbol
  code: string // Currency code
  name: string // Currency name
  symbol: string // Currency symbol
}

/**
 * Get all countries formatted for form select components (includes all European countries)
 * @returns Array of country options with ISO codes as values
 */
export function getAllCountries(): CountryOption[] {
  return allCountriesForSelection
    .map((country: CountryData) => ({
      value: country.isoCode,
      label: country.countryName,
      currencyCode: country.currencyCode,
      currencyName: country.currencyName,
      symbol: country.symbol,
    }))
    .sort((a: CountryOption, b: CountryOption) => a.label.localeCompare(b.label)) // Sort alphabetically by country name
}

/**
 * Get a specific country by ISO code
 * @param isoCode - The ISO country code (e.g., "US", "FR", "GB")
 * @returns Country option or undefined if not found
 */
export function getCountryByCode(isoCode: string): CountryOption | undefined {
  const country = allCountriesForSelection.find((c: CountryData) => c.isoCode === isoCode)
  if (!country) return undefined

  return {
    value: country.isoCode,
    label: country.countryName,
    currencyCode: country.currencyCode,
    currencyName: country.currencyName,
    symbol: country.symbol,
  }
}

/**
 * Get country by name (case insensitive)
 * @param countryName - The country name to search for
 * @returns Country option or undefined if not found
 */
export function getCountryByName(countryName: string): CountryOption | undefined {
  const country = allCountriesForSelection.find(
    (c: CountryData) => c.countryName.toLowerCase() === countryName.toLowerCase()
  )
  if (!country) return undefined

  return {
    value: country.isoCode,
    label: country.countryName,
    currencyCode: country.currencyCode,
    currencyName: country.currencyName,
    symbol: country.symbol,
  }
}

/**
 * Get default currency for a country
 * @param isoCode - The ISO country code
 * @returns Currency code or undefined if country not found
 */
export function getCountryCurrency(isoCode: string): string | undefined {
  const country = allCountriesForSelection.find((c: CountryData) => c.isoCode === isoCode)
  return country?.currencyCode
}

/**
 * Search countries by name (partial match, case insensitive)
 * @param searchTerm - The search term
 * @returns Array of matching country options
 */
export function searchCountries(searchTerm: string): CountryOption[] {
  const lowerSearchTerm = searchTerm.toLowerCase()

  return allCountriesForSelection
    .filter(
      (country: CountryData) =>
        country.countryName.toLowerCase().includes(lowerSearchTerm) ||
        country.isoCode.toLowerCase().includes(lowerSearchTerm)
    )
    .map((country: CountryData) => ({
      value: country.isoCode,
      label: country.countryName,
      currencyCode: country.currencyCode,
      currencyName: country.currencyName,
      symbol: country.symbol,
    }))
    .sort((a: CountryOption, b: CountryOption) => a.label.localeCompare(b.label))
}

/**
 * Get popular/commonly used countries (predefined list) - includes major European countries
 * @returns Array of popular country options
 */
export function getPopularCountries(): CountryOption[] {
  const popularCodes = [
    'US',
    'GB',
    'CA',
    'AU',
    'FR',
    'DE',
    'ES',
    'IT',
    'NL',
    'BE',
    'AT',
    'CH',
    'JP',
    'CN',
    'IN',
    'BR',
    'MX',
    'SE',
    'NO',
    'DK',
    'FI',
    'SG',
    'MY',
  ]

  return popularCodes.map((code) => getCountryByCode(code)).filter(Boolean) as CountryOption[]
}

/**
 * Get all available currencies from countries data
 * @returns Array of unique currency options sorted alphabetically
 */
export function getAllCurrencies(): CurrencyOption[] {
  // Get unique currencies from all countries
  const uniqueCurrencies = new Map<string, CurrencyOption>()

  ;(countriesCodes as CountryData[]).forEach((country: CountryData) => {
    if (
      country.currencyCode &&
      country.currencyName &&
      !uniqueCurrencies.has(country.currencyCode)
    ) {
      uniqueCurrencies.set(country.currencyCode, {
        value: country.currencyCode,
        label: `${country.currencyName} (${country.symbol || ''})`,
        code: country.currencyCode,
        name: country.currencyName,
        symbol: country.symbol || '',
      })
    }
  })

  return Array.from(uniqueCurrencies.values()).sort((a, b) =>
    (a.name || '').localeCompare(b.name || '')
  )
}

/**
 * Get popular/commonly used currencies
 * @returns Array of popular currency options
 */
export function getPopularCurrencies(): CurrencyOption[] {
  const popularCodes = [
    'USD',
    'EUR',
    'GBP',
    'CAD',
    'AUD',
    'JPY',
    'CHF',
    'CNY',
    'INR',
    'SGD',
    'MYR',
    'THB',
    'PHP',
    'IDR',
    'VND',
    'KRW',
    'BRL',
    'MXN',
    'ARS',
    'CLP',
  ]

  const allCurrencies = getAllCurrencies()
  return popularCodes
    .map((code) => allCurrencies.find((currency) => currency.code === code))
    .filter(Boolean) as CurrencyOption[]
}

/**
 * Get currency by code
 * @param currencyCode - The currency code (e.g., "USD", "EUR")
 * @returns Currency option or undefined if not found
 */
export function getCurrencyByCode(currencyCode: string): CurrencyOption | undefined {
  const country = (countriesCodes as CountryData[]).find(
    (c: CountryData) => c.currencyCode === currencyCode
  )
  if (!country) return undefined

  return {
    value: country.currencyCode,
    label: `${country.currencyName} (${country.symbol || ''})`,
    code: country.currencyCode,
    name: country.currencyName,
    symbol: country.symbol || '',
  }
}

/**
 * Helper function specifically for geolocation mapping
 * Maps common country name variations to ISO codes
 */
export function mapCountryNameToCode(countryName: string): string {
  // Handle common variations and special cases
  const countryMappings: Record<string, string> = {
    'United States': 'US',
    'United States of America': 'US',
    USA: 'US',
    'United Kingdom': 'GB',
    UK: 'GB',
    'Great Britain': 'GB',
    England: 'GB',
    Scotland: 'GB',
    Wales: 'GB',
    'Northern Ireland': 'GB',
    'Korea, Republic of': 'KR',
    'South Korea': 'KR',
    "Korea, Democratic People's Republic of": 'KP',
    'North Korea': 'KP',
    'Russian Federation': 'RU',
    Russia: 'RU',
    China: 'CN',
    "People's Republic of China": 'CN',
    'Hong Kong': 'HK',
    'Hong Kong SAR': 'HK',
    Macao: 'MO',
    Macau: 'MO',
    Taiwan: 'TW',
    'Taiwan, Province of China': 'TW',
    'Czech Republic': 'CZ',
    Czechia: 'CZ',
    Iran: 'IR',
    'Iran, Islamic Republic of': 'IR',
    Syria: 'SY',
    'Syrian Arab Republic': 'SY',
    Venezuela: 'VE',
    'Venezuela, Bolivarian Republic of': 'VE',
    Bolivia: 'BO',
    'Bolivia, Plurinational State of': 'BO',
    Tanzania: 'TZ',
    'Tanzania, United Republic of': 'TZ',
    Moldova: 'MD',
    'Moldova, Republic of': 'MD',
    Macedonia: 'MK',
    'North Macedonia': 'MK',
    'The former Yugoslav Republic of Macedonia': 'MK',
  }

  // First check direct mapping
  if (countryMappings[countryName]) {
    return countryMappings[countryName]
  }

  // Then try to find by exact name match
  const exactMatch = getCountryByName(countryName)
  if (exactMatch) {
    return exactMatch.value
  }

  // Return the original name if no mapping found
  return countryName
}

/**
 * Get European countries specifically
 * @returns Array of European country options
 */
export function getEuropeanCountries(): CountryOption[] {
  return europeanCountries
    .map((country: CountryData) => ({
      value: country.isoCode,
      label: country.countryName,
      currencyCode: country.currencyCode,
      currencyName: country.currencyName,
      symbol: country.symbol,
    }))
    .sort((a: CountryOption, b: CountryOption) => a.label.localeCompare(b.label))
}
