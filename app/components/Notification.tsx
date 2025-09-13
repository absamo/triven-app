import { IconCheck, IconExclamationCircle } from "@tabler/icons-react"

import { notifications, showNotification } from "@mantine/notifications"

import { useEffect } from "react"
import { useNavigate } from "react-router"

interface NotificationProps {
  notification: {
    message: string | null
    status: "Success" | "Warning" | "Error" | null
    redirectTo?: string | null
    autoClose?: boolean
  }
}

export default function Notification({ notification }: NotificationProps) {
  const navigate = useNavigate()

  useEffect(() => {
    notifications.clean()

    if (!notification) return

    let color = ""
    let icon = null
    switch (notification.status) {
      case "Success":
        color = "teal"
        icon = <IconCheck size="1rem" />
        break
      case "Warning":
        color = "yellow"
        icon = <IconExclamationCircle size="1rem" />
        break
      case "Error":
        color = "red"
        icon = <IconExclamationCircle size="1rem" />
        break
    }

    const autoClose = notification.autoClose !== undefined

    showNotification({
      color,
      message: notification.message,
      autoClose:
        autoClose || (notification.status !== "Error" ? 3000 : undefined),
      withCloseButton: true,
      icon,
    })

    if (notification.redirectTo) {
      // Add a small delay to let the notification be seen before redirecting
      setTimeout(() => {
        navigate(notification.redirectTo!)
      }, 1500) // Wait 1.5 seconds for user to see the notification
    }
  }, [notification, navigate])

  return null
}
