import {
  type LoaderFunction,
  type ActionFunction,
  type ActionFunctionArgs,
} from "react-router"

import { Notification } from "~/app/components"
import RolesForm from "~/app/pages/Roles/RolesForm"
import { createRole } from "~/app/services/roles.server"
import type { IRole } from "~/app/common/validations/roleSchema"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import type { Route } from "./+types/roles.create"

export const loader: LoaderFunction = async ({ request }) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  await requireBetterAuthUser(request, ["create:roles"])

  return {
    role: {
      name: "",
      description: "",
      permissions: [],
    },
  }
}

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData()
  const name = formData.get("name") as IRole["name"]
  const description = formData.get("description") as IRole["description"]
  const permissions = JSON.parse(
    formData.get("permissions") as string
  ) as IRole["permissions"]

  return await createRole(request, {
    name,
    description,
    permissions,
  })
}

export default function CreateRoleRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { role } = loaderData as unknown as {
    role: IRole
  }

  return (
    <>
      <RolesForm
        role={role}
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
