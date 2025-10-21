import { Grid, Loader } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher } from 'react-router'
import type { IAgency } from '../common/validations/agencySchema'
import type { ISite } from '../common/validations/siteSchema'
import { SearchableSelect } from './SearchableSelect'

interface AgencySitesProps {
  disabled?: boolean
  agencyId: string
  siteId: string
  agencies: IAgency[]
  sites: ISite[]
  onChange: ({ agencyId, siteId }: { agencyId: string; siteId: string }) => void
  error: { siteId: string; agencyId: string }
  extraProps: { colSpan: number; hideLabels?: boolean }
}

export function AgencySites({
  agencyId,
  siteId,
  agencies = [],
  sites = [],
  onChange,
  error,
  extraProps = { colSpan: 6, hideLabels: false },
  disabled,
}: AgencySitesProps) {
  const { t } = useTranslation(['forms', 'teams'])
  const [siteFetched, setSiteFetched] = useState(false)

  const fetcher = useFetcher()

  type FetcherData = {
    sites: []
  }

  const data = fetcher.data as FetcherData

  // Fetch sites on mount if agency is already selected
  useEffect(() => {
    if (agencyId && !siteFetched && fetcher.state === 'idle') {
      setSiteFetched(true)
      fetcher.load(`/api/sites/${agencyId}`)
    }
  }, [agencyId, siteFetched, fetcher])

  // Use fetched sites if available, otherwise fall back to props sites
  const availableSites = data?.sites || sites

  const groupedData = availableSites
    .sort((a: { type: string }, b: { type: string }) => a.type.localeCompare(b.type))
    .reverse()
    .reduce(
      (
        acc: { group: string; items: { value: string; label: string }[] }[],
        item: { id: string; name: string; type: string }
      ) => {
        const group = acc.find((g) => g.group === item.type)
        if (group) {
          group.items.push({ value: item.id, label: item.name })
        } else {
          acc.push({
            group: item.type,
            items: [{ value: item.id, label: item.name }],
          })
        }
        return acc
      },
      []
    )

  return (
    <>
      <Grid.Col span={extraProps.colSpan}>
        <SearchableSelect
          withAsterisk
          label={extraProps.hideLabels ? undefined : t('forms:agency')}
          placeholder={t('forms:selectAgency')}
          name="agencyId"
          clearable
          disabled={disabled}
          size="sm"
          data={agencies.map((agency) => {
            return {
              value: agency.id as string,
              label: agency.name,
            }
          })}
          onChange={(currentAgencyId: string) => {
            onChange({ agencyId: currentAgencyId || '', siteId: '' })
            setSiteFetched(true)
            fetcher.load(`/api/sites/${currentAgencyId}`)
          }}
          value={agencyId}
          error={error?.agencyId}
        />
      </Grid.Col>
      <Grid.Col span={extraProps.colSpan}>
        <SearchableSelect
          key={`site-${agencyId}`}
          withAsterisk
          label={extraProps.hideLabels ? undefined : t('forms:site')}
          placeholder={t('forms:selectSite')}
          name="siteId"
          clearable
          size="sm"
          data={groupedData}
          disabled={disabled || !agencyId}
          onChange={(currentSiteId: string) => {
            onChange({ agencyId, siteId: currentSiteId || '' })
          }}
          value={siteId}
          rightSection={fetcher.state === 'loading' ? <Loader size={16} /> : null}
          error={error?.siteId}
        />
      </Grid.Col>
    </>
  )
}
