import { type LoaderFunction, type LoaderFunctionArgs } from "react-router"

import Sites from "~/app/pages/Sites"
import { getSites } from "~/app/services/sites.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import type { Route } from "./+types/sites"
import type { ISite } from "~/app/common/validations/siteSchema"

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ["read:sites"])

  const sites = await getSites(request)
  return {
    sites,
    permissions: user?.role.permissions.filter(
      (permission) =>
        permission === "create:sites" ||
        permission === "update:sites" ||
        permission === "delete:sites"
    ),
  }
}

export default function SitesRoute({ loaderData }: Route.ComponentProps) {
  const { sites, permissions } = loaderData as unknown as {
    sites: ISite[]
    permissions: string[]
  }

  return <Sites sites={sites} permissions={permissions} />
}
