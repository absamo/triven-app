import {
  type ActionFunction,
  type ActionFunctionArgs,
  type LoaderFunction,
} from "react-router"

import type { ICategory } from "~/app/common/validations/categorySchema"
import { Notification } from "~/app/components"
import CategoryForm from "~/app/pages/Categories/CategoryForm"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import { createCategory } from "~/app/services/categories.server"
import type { Route } from "./+types/categories.create"

export const loader: LoaderFunction = async ({ request }) => {
  await requireBetterAuthUser(request, ["create:categories"])

  const category = { id: "", name: "" }
  return { category }
}

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData()
  const name = formData.get("name") as ICategory["name"]
  const description = formData.get("description") as ICategory["description"]

  return await createCategory(request, {
    name,
    description,
  })
}

export default function CreateCategoriesRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { category } = loaderData as unknown as {
    category: ICategory
  }

  return (
    <>
      <CategoryForm
        category={category}
        errors={(actionData as unknown as { errors: Record<string, string> })?.errors}
      />
      <Notification
        notification={
          (
            actionData as unknown as {
              notification: {
                message: string | null
                status: "Success" | "Warning" | "Error" | null
                redirectTo?: string | null
                autoClose?: boolean
              }
            }
          )?.notification
        }
      />
    </>
  )
}
