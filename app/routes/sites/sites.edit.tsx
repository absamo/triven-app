import {
  type LoaderFunction,
  type LoaderFunctionArgs,
  type ActionFunction,
  type ActionFunctionArgs,
} from "react-router"

import SitesForm from "~/app/pages/Sites/SitesForm"
import { getSite, updateSite } from "~/app/services/sites.server"
import { type ISite } from "~/app/common/validations/siteSchema"
import { Notification } from "~/app/components"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import type { Route } from "./+types/sites.edit"

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  await requireBetterAuthUser(request, ["update:sites"])

  const site = await getSite(params.id)

  return {
    site,
  }
}

export const action: ActionFunction = async ({
  request,
  params,
}: ActionFunctionArgs) => {
  const formData = await request.formData()
  const name = formData.get("name") as ISite["name"]
  const location = JSON.parse(formData.get("location") as string)
  const type = JSON.parse(formData.get("type") as string)

  return await updateSite(request, {
    id: params.id,
    name,
    location,
    type,
  })
}

export default function EditSiteRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { site } = loaderData as unknown as {
    site: ISite
  }

  return (
    <>
      <SitesForm
        site={site}
        errors={
          (actionData as unknown as { errors: Record<string, string> })?.errors
        }
      />
      {actionData && (
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
      )}
    </>
  )
}
