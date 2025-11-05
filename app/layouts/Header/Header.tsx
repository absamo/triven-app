import {
  ActionIcon,
  Avatar,
  Badge,
  Divider,
  Flex,
  Group,
  Indicator,
  Menu,
  Popover,
  Text,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core'
import {
  IconBell,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconLogout,
  IconMoon,
  IconSparkles,
  IconSun,
  IconUserEdit,
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { INotification } from '~/app/common/validations/notificationSchema'
import type { IProfile } from '~/app/common/validations/profileSchema'
import type { IRole } from '~/app/common/validations/roleSchema'
import { Logo } from '~/app/components'
import ClientOnly from '~/app/components/ClientOnly'
import RoadmapIcon from '~/app/components/Roadmap/RoadmapIcon'
import FrIcon from '~/app/components/SvgIcons/FrIcon'
import UsIcon from '~/app/components/SvgIcons/UsIcon'
import { changeLanguageWithPersistence } from '~/app/utils/i18n.client'
import Notification from '../Notification'
import classes from './Header.module.css'

interface HeaderProps {
  showNotification: (opened: boolean) => void
  user: {
    profile: IProfile & { avatar?: string }
    role: IRole
    planStatus: string
    currentPlan: string
    email: string
    image?: string
    trialPeriodDays: number
  }
  notifications: INotification[]
}

const languages = [
  { code: 'en', name: 'English', flag: UsIcon },
  { code: 'fr', name: 'Français', flag: FrIcon },
]

export default function Header({ showNotification, user, notifications }: HeaderProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const { t, i18n } = useTranslation(['navigation', 'auth', 'common'])
  const [realTimeNotifications, setRealTimeNotifications] = useState<INotification[]>(notifications)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Real-time notification count
  const countNotifications = ((realTimeNotifications as INotification[]) || []).filter(
    (notification: INotification) => !notification.read
  ).length

  // SSE Connection for real-time notification count updates
  useEffect(() => {
    // Initial fetch to get all notifications (both read and unread)
    fetch('/api/notifications?limit=100&offset=0')
      .then((response) => response.json())
      .then((result) => {
        if (result.notifications) {
          setRealTimeNotifications(result.notifications)
        }
      })
      .catch((error) => {
        console.error('Error fetching initial notifications:', error)
      })

    const eventSource = new EventSource('/api/notifications-stream')
    eventSourceRef.current = eventSource

    eventSource.addEventListener('connected', () => {
      // Connection established
    })

    eventSource.addEventListener('notifications', (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'notifications') {
          // Fetch fresh notification count when there's an update - get all notifications
          fetch('/api/notifications?limit=100&offset=0')
            .then((response) => response.json())
            .then((result) => {
              if (result.notifications) {
                setRealTimeNotifications(result.notifications)
              }
            })
            .catch((error) => {
              console.error('Error fetching updated notifications:', error)
            })
        }
      } catch (error) {
        console.error('Error parsing notification SSE data:', error)
      }
    })

    eventSource.addEventListener('error', (event) => {
      console.error('❌ Header: Notification SSE error:', event)
    })

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const trialing = user.planStatus === 'trialing'

  return (
    <div className={classes.header}>
      <Flex align="center" justify="space-between" h="100%" w="100%"></Flex>
      {/* Logo on the left - absolutely positioned */}
      <Flex align="center" h="100%" style={{ position: 'absolute', left: 20 }}>
        <Logo width={140} variant="auto" mb={-10} />

        {/* Plan badge */}
        {user.currentPlan && (
          <Badge variant="outline" c="cyan" mt={-10}>
            <Text size="xs" tt="capitalize" fw={'bold'}>
              <ClientOnly fallback={user.currentPlan}>
                {`${user.currentPlan}${trialing ? ` ${t('navigation:trial')}` : ''}`}
              </ClientOnly>
            </Text>
          </Badge>
        )}
      </Flex>

      {/* Right side content */}
      <Flex align="center" gap="md" h="100%" style={{ marginLeft: 'auto' }}>
        {/* AI Assistant, Roadmap, and Notification Bell */}
        <Flex align="center" justify="center" gap="md">
          <Tooltip label="AI Assistant" position="bottom" withArrow>
            <ActionIcon
              variant="subtle"
              color="teal"
              size="lg"
              radius="xl"
              component={Link}
              to="/ai-assistant"
              style={{
                transition: 'all 0.2s ease',
                color: 'light-dark(var(--mantine-color-dark-9), var(--mantine-color-gray-3))',
              }}
            >
              <IconSparkles size={22} stroke={1.5} />
            </ActionIcon>
          </Tooltip>

          <RoadmapIcon
            isAdmin={
              user.role.name.toLowerCase() === 'admin' ||
              user.role.permissions?.includes('*') === true
            }
          />

          <Tooltip label="Notifications" position="bottom">
            <Popover
              width={800}
              shadow="md"
              position="bottom-end"
              offset={3}
              styles={{ dropdown: { padding: 0 } }}
              onOpen={() => showNotification(true)}
              onClose={() => showNotification(false)}
            >
              <Popover.Target>
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  radius="xl"
                  style={{
                    cursor: 'pointer',
                    overflow: 'visible',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    color: 'light-dark(var(--mantine-color-dark-9), var(--mantine-color-gray-3))',
                  }}
                >
                  <Indicator
                    label={<span style={{ marginTop: 2 }}>{countNotifications}</span>}
                    size={16}
                    color="pink"
                    disabled={countNotifications === 0}
                    style={{ overflow: 'visible' }}
                  >
                    <IconBell size={22} stroke={1.5} />
                  </Indicator>
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown>
                <Notification
                  notifications={realTimeNotifications as INotification[]}
                  hasUnread={countNotifications > 0}
                />
              </Popover.Dropdown>
            </Popover>
          </Tooltip>
        </Flex>

        <Flex align="center" justify="center" mx="lg">
          <Divider orientation="vertical" h={30} />
        </Flex>

        <Flex align="center" justify="center">
          <Menu
            shadow="md"
            width="target"
            position="bottom-end"
            offset={5}
            trigger="hover"
            openDelay={100}
            closeDelay={400}
            onOpen={() => setIsMenuOpen(true)}
            onClose={() => setIsMenuOpen(false)}
          >
            <Menu.Target>
              <Group gap="sm" className={classes.userDropdown} wrap="nowrap">
                <Tooltip label={user.email} offset={{ mainAxis: 5, crossAxis: -11 }}>
                  <Avatar
                    src={user.image || user.profile?.avatar || undefined}
                    name={`${user.profile?.firstName?.charAt(0) || 'U'}${user.profile?.lastName?.charAt(0) || ''}`}
                    radius="xl"
                    size={32}
                    color="initials"
                  />
                </Tooltip>
                <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
                  {user.profile?.firstName || t('navigation:user')} {user.profile?.lastName || ''}
                </Text>
                {isMenuOpen ? (
                  <IconChevronUp
                    size={18}
                    stroke={1.5}
                    style={{
                      color: 'light-dark(var(--mantine-color-dark-9), var(--mantine-color-gray-3))',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                ) : (
                  <IconChevronDown
                    size={18}
                    stroke={1.5}
                    style={{
                      color: 'light-dark(var(--mantine-color-dark-9), var(--mantine-color-gray-3))',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                )}
              </Group>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{t('navigation:preferences')}</Menu.Label>
              <Menu.Item leftSection={<IconUserEdit size={15} />}>
                <Text size="sm">{t('navigation:profile')}</Text>
              </Menu.Item>
              <Menu.Item
                leftSection={
                  colorScheme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />
                }
                onClick={toggleColorScheme}
              >
                <Text size="sm">
                  {colorScheme === 'dark' ? t('navigation:lightMode') : t('navigation:darkMode')}
                </Text>
              </Menu.Item>

              <Menu.Divider />

              <Menu.Label>{t('navigation:languages')}</Menu.Label>
              {languages.map((language) => (
                <Menu.Item
                  key={language.code}
                  onClick={() => changeLanguageWithPersistence(i18n, language.code)}
                  leftSection={
                    <div className={classes.languageFlag}>
                      <language.flag size={20} />
                    </div>
                  }
                  rightSection={i18n.language === language.code ? <IconCheck size={16} /> : null}
                >
                  <Text size="sm">{language.name}</Text>
                </Menu.Item>
              ))}
              <Menu.Divider />
              <form action="/logout" method="post">
                <Menu.Item type="submit" color="red" leftSection={<IconLogout size={15} />}>
                  <Text size="sm" c="red">
                    {t('auth:logout')}
                  </Text>
                </Menu.Item>
              </form>
            </Menu.Dropdown>
          </Menu>
        </Flex>
      </Flex>
    </div>
  )
}
