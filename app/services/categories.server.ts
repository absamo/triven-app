import type { Prisma } from '@prisma/client'
import type { ICategory } from '~/app/common/validations/categorySchema'
import { prisma } from '~/app/db.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

export async function getCategories(request: Request) {
  const user = await requireBetterAuthUser(request, ['read:categories'])

  const categories = await prisma.category.findMany({
    where: { companyId: user.companyId, name: { mode: 'insensitive' } },
    orderBy: [
      {
        name: 'desc',
      },
    ],
  })

  return categories || []
}

export async function getCategory(id?: ICategory['id']) {
  const category = await prisma.category.findUnique({
    where: { id },
  })

  return category
}

export async function createCategory(request: Request, category: ICategory) {
  const user = await requireBetterAuthUser(request, ['create:categories'])

  const foundCategory = await prisma.category.findFirst({
    where: { name: category.name },
  })

  if (foundCategory) {
    return {
      errors: {
        name: 'A category already exists with this name',
      },
    }
  }

  try {
    const categoryToCreate: Prisma.CategoryCreateInput = {
      name: category.name,
      description: category.description,
      company: {
        connect: {
          id: user.companyId,
        },
      },
    }

    await prisma.category.create({ data: categoryToCreate })

    return {
      notification: {
        message: 'Category created successfully',
        status: 'Success',
        redirectTo: '/categories',
      },
    }
  } catch {
    return {
      notification: {
        message: 'An error occured while creating the category',
        status: 'Error',
      },
    }
  }
}

export async function updateCategory(request: Request, category: ICategory) {
  const user = await requireBetterAuthUser(request, ['update:categories'])

  const foundCategory = await prisma.category.findFirst({
    where: { id: category.id, name: category.name },
  })

  if (foundCategory && foundCategory.id !== category.id) {
    return {
      errors: {
        name: 'A category already exists with this name',
      },
    }
  }

  try {
    const categoryToUpdate: Prisma.CategoryUpdateInput = {
      name: category.name,
      description: category.description,
      company: {
        connect: {
          id: user.companyId,
        },
      },
    }

    await prisma.category.update({
      data: categoryToUpdate,
      where: { id: category.id },
    })

    return {
      notification: {
        message: 'Category updated successfully',
        status: 'Success',
        redirectTo: '/categories',
      },
    }
  } catch {
    return {
      notification: {
        message: 'An error occured while updating the category',
        status: 'Error',
      },
    }
  }
}
