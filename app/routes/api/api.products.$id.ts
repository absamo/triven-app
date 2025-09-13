import { type LoaderFunctionArgs, type LoaderFunction } from "react-router"

import { getProduct } from "~/app/services/products.server"

export const loader: LoaderFunction = async ({
  params,
  request,
}: LoaderFunctionArgs) => {
  const product = await getProduct(request, params.id)

  return { product }
}
