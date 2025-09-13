import type { IAgency } from "~/app/common/validations/agencySchema"
import { prisma } from "~/app/db.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import type { ILocation } from "../common/validations/locationSchema"
import type { ISite } from "../common/validations/siteSchema"

export async function getSites(request: Request) {
  const user = await requireBetterAuthUser(request, ["read:sites"])

  const sites = await prisma.site.findMany({
    where: { companyId: user.companyId },
    include: { location: true, agency: true },
    orderBy: { type: "asc" },
  })

  return sites || []
}

export async function getSitesByAgency(
  request: Request,
  agencyId: IAgency["id"]
) {
  const user = await requireBetterAuthUser(request, ["read:sites"])

  const agency = await prisma.agency.findFirst({
    where: { companyId: user.companyId, id: agencyId },
    include: { sites: true },
  })

  return agency?.sites || []
}

export async function getSite(siteId: ISite["id"]) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { location: true },
  })

  return site
}

export async function createSite(
  request: Request,
  site: Omit<ISite, "agency">
) {
  const user = await requireBetterAuthUser(request, ["create:sites"])

  const foundStore = await prisma.site.findFirst({
    where: {
      id: site.id,
      name: site.name,
    },
  })

  if (foundStore) {
    return {
      errors: {
        name: "A site already exists with this name",
      },
    }
  }

  await prisma.site.create({
    data: {
      name: site.name,
      type: site.type,
      company: {
        connect: { id: user.companyId },
      },
      location: {
        create: { ...site.location } as ILocation,
      },
    } as any,
  })

  return {
    notification: {
      message: "Site created successfully",
      status: "Success",
      redirectTo: "/sites",
    },
  }
}

export async function updateSite(request: Request, site: ISite) {
  const user = await requireBetterAuthUser(request, ["update:sites"])

  const foundStore = await prisma.site.findFirst({
    where: { name: site.name, id: { not: site.id } },
    include: { location: true },
  })

  if (foundStore) {
    return {
      errors: {
        name: "A site already exists with this name",
      },
    }
  }

  const currentSite = (await prisma.site.findFirst({
    where: { id: site.id },
    include: {
      users: true,
      company: true,
      location: true,
    },
  })) as ISite

  let agencyError = null
  if (currentSite?.products && currentSite.products.length > 0) {
    agencyError = "Cannot update a site that is already in use by products"
  } else if (currentSite?.users && currentSite.users.length > 0) {
    agencyError = "Cannot update a site that is already assigned to users"
  }

  if (
    agencyError &&
    (site.name !== currentSite.name ||
      site.location?.address !== currentSite.location?.address ||
      site.location?.city !== currentSite.location?.city ||
      site.location?.country !== currentSite.location?.country ||
      site.location?.postalCode !== currentSite.location?.postalCode)
  ) {
    const url = new URL(request.url)
    return {
      notification: {
        message: agencyError,
        status: "Error",
        redirectTo: url,
      },
    }
  }

  await prisma.site.update({
    where: { id: site.id },
    data: {
      name: site.name,
      type: site.type,
      location: {
        update: site.location as ILocation,
      } as any,
    },
  })

  return {
    notification: {
      message: "Site updated successfully",
      status: "Success",
      redirectTo: "/sites",
    },
  }
}
