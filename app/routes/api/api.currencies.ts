import { type ActionFunction, type ActionFunctionArgs, type LoaderFunction } from "react-router";

import {
  updateCurrencyBase,
  deleteCurrency,
} from "~/app/services/settings.server"

export const loader: LoaderFunction = async () => {
  return {}
}

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData()

  const currencyId = formData.get("id") as string

  const action = formData.get("action") as string

  if (action === "delete") {
    return await deleteCurrency(currencyId, request)
  }

  return await updateCurrencyBase(currencyId, request)
}
