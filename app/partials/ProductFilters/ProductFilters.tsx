import {
  ActionIcon,
  Grid,
  Input,
  MultiSelect,
  TextInput,
  Tooltip,
  type ComboboxItem,
} from '@mantine/core'
import { IconFilter, IconFilterOff, IconSearch } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import classes from './ProductFilters.module.css'

import { useEffect, useMemo, useState } from 'react'
import { useFetcher, useNavigate, useSearchParams } from 'react-router'

type FiltersProps = {
  searchProps?: {
    description: string
  }
  statusProps?: {
    description: string
    data: ComboboxItem[]
  }
  categoryProps?: {
    description: string
    data: ComboboxItem[]
  }
  agencyProps?: {
    description: string
    data: ComboboxItem[]
  }
  siteProps?: {
    description: string
    data: ComboboxItem[]
  }
  onFilter: (data: any) => void
  route: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export default function ProductFilters({
  searchProps,
  statusProps,
  categoryProps,
  agencyProps,
  siteProps,
  onFilter,
  route,
  sortBy,
  sortOrder,
}: FiltersProps) {
  const { t } = useTranslation('inventory')
  const [searchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState<string | null>(null)
  const [statuses, setStatuses] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [agencies, setAgencies] = useState<string[]>([])
  const [sites, setSites] = useState<string[]>([])
  const [reorderAlert, setReorderAlert] = useState<boolean>(false)
  const [deadStock, setDeadStock] = useState<boolean>(false)
  const [accuracyFilter, setAccuracyFilter] = useState<boolean>(false)

  const fetcher = useFetcher()
  const navigate = useNavigate()

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    const result = !!(
      searchValue ||
      statuses.length > 0 ||
      categories.length > 0 ||
      agencies.length > 0 ||
      sites.length > 0 ||
      reorderAlert ||
      deadStock ||
      accuracyFilter
    )
    return result
  }, [searchValue, statuses, categories, agencies, sites, reorderAlert, deadStock, accuracyFilter])

  // Initialize filters from URL parameters on mount
  useEffect(() => {
    const statusesParam = searchParams.get('statuses')
    const categoriesParam = searchParams.get('categories')
    const agenciesParam = searchParams.get('agencies')
    const sitesParam = searchParams.get('sites')
    const searchParam = searchParams.get('search')
    const reorderAlertParam = searchParams.get('reorderAlert')
    const deadStockParam = searchParams.get('deadStock')
    const accuracyFilterParam = searchParams.get('accuracyFilter')

    // Check for any unexpected parameters that might interfere with filtering
    const allParams = Object.fromEntries(searchParams.entries())
    const expectedParams = [
      'statuses',
      'categories',
      'agencies',
      'sites',
      'search',
      'reorderAlert',
      'deadStock',
      'accuracyFilter',
      'sortBy',
      'sortOrder',
      'limit',
      'offset',
      'agency',
    ]
    const unexpectedParams = Object.keys(allParams).filter((key) => !expectedParams.includes(key))
    if (unexpectedParams.length > 0) {
      // Log unexpected parameters only in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[ProductFilters] Unexpected URL parameters detected:',
          unexpectedParams,
          'Values:',
          unexpectedParams.map((key) => ({ [key]: allParams[key] }))
        )
      }
    }

    if (statusesParam) {
      try {
        const parsedStatuses = JSON.parse(statusesParam)
        setStatuses(parsedStatuses)
      } catch (error) {
        console.error('Error parsing statuses from URL:', error)
      }
    } else {
      setStatuses([])
    }

    if (categoriesParam) {
      try {
        const parsedCategories = JSON.parse(categoriesParam)
        setCategories(parsedCategories)
      } catch (error) {
        console.error('Error parsing categories from URL:', error)
      }
    } else {
      setCategories([])
    }

    if (agenciesParam) {
      try {
        const parsedAgencies = JSON.parse(agenciesParam)
        setAgencies(parsedAgencies)
      } catch (error) {
        console.error('Error parsing agencies from URL:', error)
      }
    } else {
      setAgencies([])
    }

    if (sitesParam) {
      try {
        const parsedSites = JSON.parse(sitesParam)
        setSites(parsedSites)
      } catch (error) {
        console.error('Error parsing sites from URL:', error)
      }
    } else {
      setSites([])
    }

    if (searchParam) {
      try {
        // Handle both JSON-stringified and plain search parameters
        const parsedSearch = searchParam.startsWith('"') ? JSON.parse(searchParam) : searchParam
        setSearchValue(parsedSearch)
      } catch (error) {
        console.error('Error parsing search from URL:', error)
        setSearchValue(searchParam)
      }
    } else {
      setSearchValue(null)
    }

    // Track reorderAlert state - reset to false if not in URL
    if (reorderAlertParam === 'true') {
      setReorderAlert(true)
    } else {
      setReorderAlert(false)
    }

    // Track deadStock state - reset to false if not in URL
    if (deadStockParam === 'true') {
      setDeadStock(true)
    } else {
      setDeadStock(false)
    }

    // Track accuracyFilter state - reset to false if not in URL
    if (accuracyFilterParam === 'true') {
      setAccuracyFilter(true)
    } else {
      setAccuracyFilter(false)
    }

    // Only fetch data if we have UI-manageable filters (not just URL-based ones like reorderAlert)
    // The route loader will handle initial URL-based filters like reorderAlert, deadStock, and accuracyFilter
    if (statusesParam || categoriesParam || agenciesParam || sitesParam || searchParam) {
      const statusesToUse = statusesParam ? JSON.parse(statusesParam) : []
      const categoriesToUse = categoriesParam ? JSON.parse(categoriesParam) : []
      const agenciesToUse = agenciesParam ? JSON.parse(agenciesParam) : []
      const sitesToUse = sitesParam ? JSON.parse(sitesParam) : []
      const searchToUse = searchParam
        ? searchParam.startsWith('"')
          ? JSON.parse(searchParam)
          : searchParam
        : null

      fetchProductData(searchToUse, statusesToUse, categoriesToUse, agenciesToUse, sitesToUse)
    }
    // When no UI filters are present, let the route loader handle showing all products
    // Don't call onFilter here as it conflicts with route loader data
  }, [searchParams]) // Watch for URL parameter changes

  const fetchProductData = (
    search: string | null,
    statuses: string[],
    categories: string[],
    agencies: string[],
    sites: string[]
  ) => {
    let params = ''

    // Only add search param if search has meaningful content
    if (search && search.trim() !== '') {
      params += `search=${JSON.stringify(search)}`
    }
    if (statuses && statuses.length > 0) {
      params += `${params ? '&' : ''}statuses=${JSON.stringify(statuses)}`
    }
    if (categories && categories.length > 0) {
      params += `${params ? '&' : ''}categories=${JSON.stringify(categories)}`
    }
    if (agencies && agencies.length > 0) {
      params += `${params ? '&' : ''}agencies=${JSON.stringify(agencies)}`
    }
    if (sites && sites.length > 0) {
      params += `${params ? '&' : ''}sites=${JSON.stringify(sites)}`
    }
    if (sortBy) {
      params += `${params ? '&' : ''}sortBy=${sortBy}`
    }
    if (sortOrder) {
      params += `${params ? '&' : ''}sortOrder=${sortOrder}`
    }

    // Always preserve reorderAlert state
    if (reorderAlert) {
      params += `${params ? '&' : ''}reorderAlert=true`
    }

    // Always preserve deadStock state
    if (deadStock) {
      params += `${params ? '&' : ''}deadStock=true`
    }

    // Always preserve accuracyFilter state
    if (accuracyFilter) {
      params += `${params ? '&' : ''}accuracyFilter=true`
    }

    const finalUrl = `${route}?${params}`

    // Always make the request with all parameters (including preserved ones)
    fetcher.load(finalUrl)
  }

  const data = fetcher.data

  useEffect(() => {
    if (data) {
      onFilter(data)
    }
  }, [data, onFilter])

  const handleTextInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    setSearchValue(value)
    fetchProductData(value, statuses, categories, agencies, sites)
  }

  const handleTextInputClick = () => {
    setSearchValue('')
    fetchProductData('', statuses, categories, agencies, sites)
  }

  const handleStatusChange = (values: string[]) => {
    setStatuses(values)
    fetchProductData(searchValue, values, categories, agencies, sites)
  }

  const handleCategoryChange = (values: string[]) => {
    setCategories(values)
    fetchProductData(searchValue, statuses, values, agencies, sites)
  }

  const handleAgencyChange = (values: string[]) => {
    setAgencies(values)
    fetchProductData(searchValue, statuses, categories, values, sites)
  }

  const handleSiteChange = (values: string[]) => {
    setSites(values)
    fetchProductData(searchValue, statuses, categories, agencies, values)
  }

  const handleResetFilters = () => {
    // Reset all UI state
    setSearchValue('')
    setStatuses([])
    setCategories([])
    setAgencies([])
    setSites([])
    setReorderAlert(false)
    setDeadStock(false)
    setAccuracyFilter(false)

    // Use React Router navigation to clear ALL filters including URL-based ones
    // This will navigate to clean /products URL without any query parameters
    // The route loader will handle loading the full 30 products
    navigate('/products', { replace: true })

    // Don't call onFilter here - let the route navigation handle the reset
    // The Products component will get the new data via route loader props
  }

  return (
    <Grid mb={20}>
      {searchProps && (
        <Grid.Col span="auto">
          <TextInput
            radius="md"
            size="sm"
            rightSectionWidth={42}
            leftSection={<IconSearch size={18} stroke={1.5} />}
            onChange={handleTextInputChange}
            value={searchValue || ''}
            label={searchProps?.description}
            placeholder={t('searchPlaceholder')}
            classNames={{
              label: classes.label,
            }}
            rightSection={
              searchValue ? <Input.ClearButton onClick={handleTextInputClick} /> : undefined
            }
          />
        </Grid.Col>
      )}

      {statusProps && (
        <Grid.Col span={2}>
          <MultiSelect
            data={statusProps?.data || []}
            value={statuses || []}
            onChange={handleStatusChange}
            label={statusProps?.description}
            placeholder={statuses.length > 0 ? '' : t('selectStatus')}
            hidePickedOptions
            comboboxProps={{
              width: 200,
              position: 'bottom-start',
              shadow: 'md',
            }}
            classNames={{
              label: classes.label,
            }}
            clearable
          />
        </Grid.Col>
      )}

      {categoryProps && (
        <Grid.Col span={2}>
          <MultiSelect
            data={categoryProps?.data || []}
            value={categories || []}
            onChange={handleCategoryChange}
            label={categoryProps?.description}
            placeholder={categories.length > 0 ? '' : t('selectCategories')}
            hidePickedOptions
            comboboxProps={{
              width: 200,
              position: 'bottom-start',
              shadow: 'md',
            }}
            classNames={{
              label: classes.label,
            }}
            clearable
          />
        </Grid.Col>
      )}

      {siteProps && (
        <Grid.Col span={2}>
          <MultiSelect
            data={siteProps?.data || []}
            value={sites || []}
            onChange={handleSiteChange}
            label={siteProps?.description}
            placeholder={sites.length > 0 ? '' : 'Select sites'}
            hidePickedOptions
            comboboxProps={{
              width: 200,
              position: 'bottom-start',
              shadow: 'md',
            }}
            classNames={{
              label: classes.label,
            }}
            clearable
          />
        </Grid.Col>
      )}

      {/* Reset Filters Button */}
      <Grid.Col span="content">
        <Tooltip label={t('resetAllFilters')} position="top" withArrow>
          <ActionIcon
            variant={hasActiveFilters ? 'filled' : 'default'}
            color={hasActiveFilters ? 'blue' : undefined}
            size="lg"
            disabled={!hasActiveFilters}
            onClick={(e) => {
              e.preventDefault()
              if (hasActiveFilters) {
                handleResetFilters()
              }
            }}
            style={{
              marginTop: '27px',
              opacity: hasActiveFilters ? 1 : 0.5,
              cursor: hasActiveFilters ? 'pointer' : 'not-allowed',
            }}
          >
            {hasActiveFilters ? (
              <IconFilterOff size={18} stroke={1.5} color="white" />
            ) : (
              <IconFilter size={18} stroke={1.5} />
            )}
          </ActionIcon>
        </Tooltip>
      </Grid.Col>
    </Grid>
  )
}
