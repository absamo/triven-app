import { notifications } from '@mantine/notifications'
import { useEffect } from 'react'

interface NotificationProps {
  notification?: {
    message: string | null
    status: 'Success' | 'Warning' | 'Error' | null
    redirectTo?: string | null
    autoClose?: boolean
  } | null
}

export default function Notification({ notification }: NotificationProps) {
  useEffect(() => {
    if (notification?.message && notification?.status) {
      const color =
        notification.status === 'Success'
          ? 'green'
          : notification.status === 'Warning'
            ? 'yellow'
            : notification.status === 'Error'
              ? 'red'
              : 'blue'

      notifications.show({
        title: notification.status,
        message: notification.message,
        color,
        autoClose: notification.autoClose !== false,
      })
    }
  }, [notification])

  return null
}
