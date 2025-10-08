import type { IAgency } from '~/app/common/validations/agencySchema'
import type { IBackorder } from '~/app/common/validations/backorderSchema'
import type { ICustomer } from '~/app/common/validations/customerSchema'
import type { IProduct } from '~/app/common/validations/productSchema'
import type { ISite } from '~/app/common/validations/siteSchema'
import BackorderForm from './BackorderForm'

interface BackorderCreateProps {
  backorder?: IBackorder
  customers: ICustomer[]
  agencies: IAgency[]
  products: IProduct[]
  sites: ISite[]
  errors?: Record<string, string>
}

export default function BackorderCreate({
  backorder,
  customers,
  agencies,
  products,
  sites,
  errors = {},
}: BackorderCreateProps) {
  return (
    <BackorderForm
      backorder={backorder}
      customers={customers}
      agencies={agencies}
      products={products}
      sites={sites}
      errors={errors}
      isEdit={false}
    />
  )
}
