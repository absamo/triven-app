import { type LoaderFunctionArgs, type LoaderFunction } from 'react-router'

import { getProductByBarcode } from '~/app/services/products.server'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)

  const barcode = url.searchParams.get('barcode') || undefined

  const product = await getProductByBarcode(barcode)

  if (!product) {
    return { error: 'Product not found' }
  }

  return { product }
}
