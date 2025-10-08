import type { LoaderFunction, LoaderFunctionArgs } from 'react-router'
import type { ICategory } from '~/app/common/validations/categorySchema'
import Categories from '~/app/pages/Categories'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getCategories } from '~/app/services/categories.server'
import type { Route } from '../categories/+types/categories'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['read:categories'])

  const categories = await getCategories(request)
  return {
    categories,
    permissions: user.role.permissions.filter(
      (permission) =>
        permission === 'create:categories' ||
        permission === 'update:categories' ||
        permission === 'delete:categories'
    ),
  }
}

export default function CategoriesRoute({ loaderData }: Route.ComponentProps) {
  const { categories, permissions } = loaderData as {
    categories: ICategory[]
    permissions: string[]
  }

  return <Categories categories={categories} permissions={permissions} />
}
