import { ActionIcon, Group, Paper, ScrollArea, Stack, Text, Title, Tooltip } from '@mantine/core'
import { IconBell, IconBellOff, IconCheck } from '@tabler/icons-react'
import cx from 'clsx'
import dayjs from 'dayjs'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, useLocation, useSubmit } from 'react-router'
import { NOTIFICATION_STATUSES } from '~/app/common/constants'
import { type INotification } from '~/app/common/validations/notificationSchema'
import classes from './Notification.module.css'

const getNotificationTypes = (t: any) => [
  {
    label: t('notifications:types.criticalStock'),
    color: 'orange',
    type: NOTIFICATION_STATUSES.CRITICAL,
  },
  {
    type: NOTIFICATION_STATUSES.LOWSTOCK,
    label: t('notifications:types.lowStock'),
    color: 'yellow',
  },
  {
    type: NOTIFICATION_STATUSES.OUTOFSTOCK,
    label: t('notifications:types.outOfStock'),
    color: 'red',
  },
  {
    type: NOTIFICATION_STATUSES.RESTOCKREMINDER,
    label: t('notifications:types.restockReminder'),
  },
  {
    type: NOTIFICATION_STATUSES.EXPIREDPRODUCT,
    label: t('notifications:types.expiredProduct'),
  },
  {
    type: NOTIFICATION_STATUSES.EXPIRINGPRODUCT,
    label: t('notifications:types.expiringProduct'),
  },
]

interface NotificationsProps {
  notifications: INotification[]
  hasUnread?: boolean
}

export default function Notification({
  notifications: notificationsProp,
  hasUnread,
}: NotificationsProps) {
  const { t } = useTranslation(['notifications', 'common'])
  const [notifications, setNotifications] = useState<INotification[]>(notificationsProp)
  const [allNotifications, setAllNotifications] = useState<INotification[]>(notificationsProp)

  // Start with showing all notifications by default for consistent behavior
  const [onlyShowUnread, setOnlyShowUnread] = useState(true)

  // Update notifications when props change (real-time updates from Header)
  useEffect(() => {
    setAllNotifications(notificationsProp)
    // Apply current filter
    const filteredNotifications = onlyShowUnread
      ? notificationsProp.filter((n) => !n.read)
      : notificationsProp
    setNotifications(filteredNotifications)
  }, [notificationsProp, onlyShowUnread])

  const notificationsByDate = notifications.reduce(
    (acc: { [key: string]: INotification[] }, notification: INotification) => {
      const date = dayjs(notification.createdAt).format('ddd, D MMM YYYY')
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(notification)
      return acc
    },
    {}
  )

  const submit = useSubmit()
  const location = useLocation()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    let $form: HTMLFormElement = event.currentTarget
    const formData = new FormData($form)

    const notificationsMarkedAsAllRead = notifications.map((notification: INotification) => {
      return { ...notification, read: true }
    })

    setNotifications(notificationsMarkedAsAllRead)

    formData.append('notifications', JSON.stringify(notificationsMarkedAsAllRead))

    formData.append('redirectTo', location.pathname)

    submit(formData, { method: 'post', action: '/api/notifications' })
  }

  return (
    <div className={classes.root}>
      <div className={classes.heading}>
        <Group justify="space-between" w="100%" align="center">
          <Title order={4}>{t('notifications:title')}</Title>
          <Group gap="xs">
            <Tooltip
              label={
                onlyShowUnread ? t('notifications:showAll') : t('notifications:showUnreadOnly')
              }
              position="bottom"
            >
              <ActionIcon
                variant={onlyShowUnread ? 'filled' : 'light'}
                color={onlyShowUnread ? 'blue' : 'gray'}
                size="sm"
                onClick={() => {
                  const checked = !onlyShowUnread
                  setOnlyShowUnread(checked)

                  // Always filter locally since we always use props
                  const filteredNotifications = checked
                    ? allNotifications.filter((n) => !n.read)
                    : allNotifications
                  setNotifications(filteredNotifications)
                }}
              >
                {onlyShowUnread ? <IconBellOff size={14} /> : <IconBell size={14} />}
              </ActionIcon>
            </Tooltip>
            {hasUnread && (
              <Form onSubmit={handleSubmit}>
                <Tooltip label={t('notifications:markAllAsRead')} position="bottom">
                  <ActionIcon type="submit" variant="light" color="green" size="sm">
                    <IconCheck size={14} />
                  </ActionIcon>
                </Tooltip>
              </Form>
            )}
          </Group>
        </Group>
      </div>
      {notifications.length > 0 ? (
        <ScrollArea h={510} px="0">
          {Object.entries(notificationsByDate).map(([date, notifications]) => (
            <Fragment key={date}>
              <Text size="xs" c="dimmed" className={classes.dates}>
                {date}
              </Text>
              <Stack gap="xs" pb="sm">
                {((notifications || []) as INotification[]).map((notification: INotification) => {
                  const date = dayjs(notification.createdAt).format('D MMM YYYY HH:mm')
                  const notificationTypes = getNotificationTypes(t)
                  const notificationType = notificationTypes.find(
                    (notificationType) => notificationType.type === notification.status
                  )
                  return (
                    <Fragment key={notification.id}>
                      <Paper
                        withBorder
                        className={cx(classes.card, {
                          [classes.unreadCard]: !notification.read,
                        })}
                        radius="md"
                      >
                        <Text size="sm" fw={500} mb="xs">
                          {notification.message}
                        </Text>
                        <Group justify="space-between" align="center">
                          <Text size="xs" c={notificationType?.color} fw={500}>
                            {notificationType?.label}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {`${notification.createdBy?.profile?.firstName} ${notification.createdBy?.profile?.lastName}`}{' '}
                            &#x2022; {`${date}`}
                          </Text>
                        </Group>
                      </Paper>
                    </Fragment>
                  )
                })}
              </Stack>
            </Fragment>
          ))}
        </ScrollArea>
      ) : (
        <Group justify="center" py="xl">
          <Stack align="center" gap="sm">
            <Text size="lg" c="dimmed" fw={500}>
              {t('notifications:noNotifications')}
            </Text>
            <Text size="sm" c="dimmed">
              {onlyShowUnread
                ? t('notifications:noUnreadNotifications')
                : t('notifications:allCaughtUp')}
            </Text>
          </Stack>
        </Group>
      )}
    </div>
  )
}
