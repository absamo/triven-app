import type { IRole } from '~/app/common/validations/roleSchema'
import { prisma } from '~/app/db.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

export async function getRoles(request: Request) {
  const user = await requireBetterAuthUser(request, ['read:roles'])

  const roles = await prisma.role.findMany({
    where: { companyId: user.companyId },
  })

  return roles || []
}

export async function getRole(roleId: IRole['id']) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  })

  return role
}

export async function createRole(request: Request, role: IRole) {
  const user = await requireBetterAuthUser(request, ['create:roles'])

  const foundRole: IRole | null = await prisma.role.findFirst({
    where: { name: role.name, companyId: user.companyId },
  })

  if (foundRole) {
    return {
      errors: {
        name: 'A role already exists with this name',
      },
    }
  }
  try {
    await prisma.role.create({
      data: {
        name: role.name,
        description: role.description,
        company: { connect: { id: user.companyId } },
        editable: true,
        permissions: role.permissions,
      },
    })

    return {
      notification: {
        message: 'Role created successfully',
        status: 'Success',
        redirectTo: '/roles',
      },
    }
  } catch {
    return {
      notification: {
        message: 'Role could not be created',
        status: 'Error',
      },
    }
  }
}

export async function updateRole(request: Request, role: IRole) {
  const user = await requireBetterAuthUser(request, ['update:roles'])

  const foundRole: IRole | null = await prisma.role.findFirst({
    where: { name: role.name, id: { not: role.id }, companyId: user.companyId },
  })

  if (foundRole) {
    return {
      errors: {
        name: 'A role already exists with this name',
      },
    }
  }

  try {
    await prisma.role.update({
      where: { id: role.id },
      data: {
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      },
    })

    return {
      notification: {
        message: 'Role updated successfully',
        status: 'Success',
        redirectTo: '/roles',
      },
    }
  } catch (error) {
    return {
      notification: {
        message: 'Role could not be updated',
        status: 'Error',
        autoClose: false,
      },
    }
  }
}
