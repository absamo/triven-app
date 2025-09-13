import {
  type ActionFunction,
  type ActionFunctionArgs,
  type LoaderFunction,
  type LoaderFunctionArgs,
} from "react-router";

import { getBoolean } from "~/app/common/helpers/validation";
import {
  getNotifications,
  updateNotification,
} from "~/app/services/notifications.server";

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const url = new URL(request.url)

  const limit = Number(url.searchParams.get("limit"))
  const offset = Number(url.searchParams.get("offset"))
  const readParam = url.searchParams.get("read")

  // Only set read filter if explicitly provided
  const read = readParam !== null ? getBoolean(readParam) : undefined

  const notifications = await getNotifications(request, {
    limit,
    offset,
    read,
  })

  return Response.json({ notifications })
}

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData()
  const notifications = JSON.parse(formData.get("notifications") as string)
  const redirectTo = formData.get("redirectTo") as string

  return await updateNotification(notifications, redirectTo)
}
