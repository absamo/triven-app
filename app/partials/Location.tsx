import {
  Fieldset,
  type FieldsetProps,
  Grid,
  Input,
  TextInput,
} from "@mantine/core"
import dot from "dot-object"
import { useTranslation } from 'react-i18next'

import { type ILocation } from "~/app/common/validations/locationSchema"

interface LocationProps {
  value: ILocation
  onChange: (formValues: ILocation) => void
  errors?: ILocation
  fieldsetProps?: FieldsetProps & React.ComponentPropsWithoutRef<any>
  children?: React.ReactNode
  name: string
  label?: string
}

export function Location({
  value,
  onChange,
  errors,
  fieldsetProps,
  children,
  name,
  label,
}: LocationProps) {
  const { t } = useTranslation('common')
  const locationErrors = (errors &&
    (dot.object(errors) as Record<string, any>))?.[name]

  return (
    <Grid.Col>
      <Input.Label>{label || t('common:location')}</Input.Label>
      <Fieldset variant={fieldsetProps?.variant || "default"}>
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label={t('common:address')}
              value={value?.address || ""}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                onChange({ ...value, address: event.target.value } as ILocation)
              }}
              error={locationErrors?.address}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label={t('common:postalCode')}
              value={value?.postalCode || ""}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                onChange({
                  ...value,
                  postalCode: event.target.value,
                } as ILocation)
              }}
              error={locationErrors?.postalCode}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              withAsterisk
              label={t('common:city')}
              value={value?.city || ""}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                onChange({ ...value, city: event.target.value } as ILocation)
              }}
              error={locationErrors?.city}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              withAsterisk
              label={t('common:country')}
              value={value?.country || ""}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                onChange({ ...value, country: event.target.value } as ILocation)
              }}
              error={locationErrors?.country}
            />
          </Grid.Col>
          {children}
        </Grid>
      </Fieldset>
    </Grid.Col>
  )
}
