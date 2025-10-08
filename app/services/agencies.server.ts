import { USER_ROLES } from '~/app/common/constants'
import type { IAgency } from '~/app/common/validations/agencySchema'
import { prisma } from '~/app/db.server'
import { getBetterAuthUser } from '~/app/services/better-auth.server'
import type { ISite } from '../common/validations/siteSchema'

export async function getAgencies(request: Request) {
  const user = await getBetterAuthUser(request)

  if (!user?.id) {
    return null
  }

  const agencies = await prisma.agency.findMany({
    where: {
      companyId: user.companyId,
      id: user.role?.name === USER_ROLES.ADMIN ? undefined : user.agencyId,
    },
    include: {
      location: true,
      currency: true,
      sites: true,
    },
  })

  return agencies || []
}

export async function getAgency(agencyId: IAgency['id']) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    include: {
      sites: true,
      location: true,
      currency: true,
    },
  })

  return agency
}

export async function createAgency(request: Request, agency: IAgency) {
  const user = await getBetterAuthUser(request)
  if (!user?.id) {
    return null
  }

  const foundAgency = await prisma.site.findFirst({
    where: {
      id: agency.id,
      name: agency.name,
    },
  })

  if (foundAgency) {
    return {
      errors: {
        name: 'An agency already exists with this name',
      },
    }
  }

  await prisma.agency.create({
    data: {
      name: agency.name,
      company: {
        connect: { id: user.companyId },
      },

      location: {
        create: {
          city: agency.location?.city || '',
          country: agency.location?.country || '',
          address: agency.location?.address,
          postalCode: agency.location?.postalCode,
        },
      },
      currency: {
        connect: { id: agency.currency?.id },
      },
    },
  })

  return {
    notification: {
      message: 'Site created successfully',
      status: 'Success',
      redirectTo: '/agencies',
    },
  }
}

export async function updateAgency(request: Request, agency: IAgency) {
  const user = await getBetterAuthUser(request)

  if (!user?.id) {
    return null
  }

  const foundAgency = await prisma.agency.findFirst({
    where: {
      name: agency.name,
      id: { not: agency.id },
      companyId: user.companyId,
    },
  })

  if (foundAgency) {
    return {
      errors: {
        name: 'An agency already exists with this name',
      },
    }
  }

  await prisma.agency.update({
    where: { id: agency.id },
    data: {
      name: agency.name,
      sites: {
        set: [],
        connect: (agency.sites || []).map((site: ISite) => ({
          id: site.id,
        })),
      },
      currency: {
        connect: { id: agency.currency?.id },
      },
      location: {
        update: {
          city: agency.location?.city,
          country: agency.location?.country,
          address: agency.location?.address,
          postalCode: agency.location?.postalCode,
        },
      },
    },
  })

  return {
    notification: {
      message: 'Site updated successfully',
      status: 'Success',
      redirectTo: '/agencies',
    },
  }
}
