import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from 'react-router'

import type { ICategory } from '~/app/common/validations/categorySchema'
import { Notification } from '~/app/components'
import CategoryForm from '~/app/pages/Categories/CategoryForm'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getCategory, updateCategory } from '~/app/services/categories.server'
import type { Route } from './+types/categories.edit'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  await requireBetterAuthUser(request, ['update:categories'])

  const category = await getCategory(params.id)
  return {
    category,
  }
}

export const action: ActionFunction = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const name = formData.get('name') as ICategory['name']
  const description = formData.get('description') as ICategory['description']

  return await updateCategory(request, {
    id: params.id,
    name,
    description,
  })
}

export default function EditCategoriesRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { category } = loaderData as unknown as {
    category: ICategory
  }

  return (
    <>
      <CategoryForm
        category={category}
        errors={(actionData as unknown as { errors: Record<string, string> })?.errors}
      />
      {actionData && (
        <Notification
          notification={
            (
              actionData as unknown as {
                notification: {
                  message: string | null
                  status: 'Success' | 'Warning' | 'Error' | null
                  redirectTo?: string | null
                  autoClose?: boolean
                }
              }
            )?.notification
          }
        />
      )}
    </>
  )
}
