import { type LoaderFunction, type LoaderFunctionArgs } from "react-router";

import { getCategory } from "~/app/services/categories.server"

export const loader: LoaderFunction =
  () =>
  async ({ params }: LoaderFunctionArgs) => {
    const category = await getCategory(params.id)
    return { category }
  }
