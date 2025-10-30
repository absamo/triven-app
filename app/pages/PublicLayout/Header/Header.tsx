import {
  ActionIcon,
  Box,
  Burger,
  Button,
  Divider,
  Drawer,
  Group,
  HoverCard,
  Menu,
  rem,
  SimpleGrid,
  Text,
  ThemeIcon,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconBuilding,
  IconChartPie3,
  IconChevronDown,
  IconCurrencyDollar,
  IconFileInvoice,
  IconMoon,
  IconPackage,
  IconShoppingCart,
  IconSun,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Logo } from '~/app/components'
import ClientOnly from '~/app/components/ClientOnly'
import FrIcon from '~/app/components/SvgIcons/FrIcon'
import UsIcon from '~/app/components/SvgIcons/UsIcon'
import { changeLanguageWithPersistence } from '~/app/utils/i18n.client'
import classes from './Header.module.css'

const featureIcons = [
  { icon: IconPackage, key: 'inventoryManagement' },
  { icon: IconShoppingCart, key: 'salesOrders' },
  { icon: IconFileInvoice, key: 'purchasing' },
  { icon: IconCurrencyDollar, key: 'financialOperations' },
  { icon: IconChartPie3, key: 'analyticsReports' },
  { icon: IconBuilding, key: 'multiLocation' },
]

export default function HeaderMegaMenu() {
  const { t, i18n } = useTranslation(['home', 'navigation'])
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false)

  const isDark = colorScheme === 'dark'

  // Smooth scroll to pricing section
  const scrollToPricing = (e: React.MouseEvent) => {
    e.preventDefault()
    const pricingSection = document.getElementById('pricing')
    if (pricingSection) {
      pricingSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
    closeDrawer() // Close mobile drawer if open
  }

  const links = featureIcons.map((item) => (
    <UnstyledButton className={classes.subLink} key={item.key}>
      <Group wrap="nowrap" align="flex-start">
        <ThemeIcon size={34} variant="default" radius="md" className={classes.featureIcon}>
          <item.icon style={{ width: rem(22), height: rem(22) }} />
        </ThemeIcon>
        <div>
          <Text size="sm" fw={500}>
            {t(
              `home:featureMenu.${item.key}.title` as 'home:featureMenu.inventoryManagement.title'
            )}
          </Text>
          <Text size="xs" c="dimmed" className={classes.featureDescription}>
            {t(
              `home:featureMenu.${item.key}.description` as 'home:featureMenu.inventoryManagement.description'
            )}
          </Text>
        </div>
      </Group>
    </UnstyledButton>
  ))

  return (
    <Box>
      <header className={classes.header}>
        <div className={classes.container}>
          <Group justify="space-between" align="center" w="100%">
            {/* Logo */}
            <Link to="/" className={classes.logo}>
              <Logo width={130} variant="auto" />
            </Link>

            {/* Centered Navigation - Puzzle Style */}
            <Group gap="xl" align="center" visibleFrom="md">
              <HoverCard width={600} position="bottom" radius="md" shadow="md" withinPortal>
                <HoverCard.Target>
                  <UnstyledButton className={classes.navLink}>
                    <Group gap={2}>
                      <span>{t('home:nav.features')}</span>
                      <IconChevronDown style={{ width: rem(16), height: rem(16) }} />
                    </Group>
                  </UnstyledButton>
                </HoverCard.Target>
                <HoverCard.Dropdown style={{ overflow: 'hidden' }}>
                  <SimpleGrid cols={2} spacing={0}>
                    {links}
                  </SimpleGrid>
                </HoverCard.Dropdown>
              </HoverCard>
              <button
                type="button"
                onClick={scrollToPricing}
                className={classes.navLink}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {t('home:nav.pricing')}
              </button>
            </Group>

            {/* CTA Buttons */}
            <Group visibleFrom="md" gap="lg" align="center">
              {/* Theme Selector */}
              <ClientOnly
                fallback={
                  <ActionIcon
                    variant="subtle"
                    size="md"
                    aria-label={t('home:footer.toggleTheme')}
                    style={{
                      background: 'rgba(0, 0, 0, 0.1)',
                      cursor: 'pointer',
                    }}
                  >
                    <IconMoon style={{ width: rem(16), height: rem(16) }} />
                  </ActionIcon>
                }
              >
                <ActionIcon
                  variant="subtle"
                  size="md"
                  onClick={toggleColorScheme}
                  aria-label={t('home:footer.toggleTheme')}
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                  }}
                >
                  {isDark ? (
                    <IconSun style={{ width: rem(16), height: rem(16) }} />
                  ) : (
                    <IconMoon style={{ width: rem(16), height: rem(16) }} />
                  )}
                </ActionIcon>
              </ClientOnly>

              {/* Language Selector */}
              <ClientOnly
                fallback={
                  <Menu shadow="md" width={150} position="bottom-end">
                    <Menu.Target>
                      <Button
                        variant="subtle"
                        size="sm"
                        aria-label={t('home:footer.selectLanguage')}
                        leftSection={<UsIcon size={16} />}
                        style={{
                          background: 'rgba(0, 0, 0, 0.1)',
                          cursor: 'pointer',
                          border: 'none',
                          color: 'inherit',
                        }}
                      >
                        EN
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<UsIcon size={16} />}>English</Menu.Item>
                      <Menu.Item leftSection={<FrIcon size={16} />}>Français</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                }
              >
                <Menu shadow="md" width={150} position="bottom-end">
                  <Menu.Target>
                    <Button
                      variant="subtle"
                      size="sm"
                      aria-label={t('home:footer.selectLanguage')}
                      leftSection={
                        i18n.language === 'en' ? <UsIcon size={16} /> : <FrIcon size={16} />
                      }
                      style={{
                        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer',
                        border: 'none',
                        color: 'inherit',
                      }}
                    >
                      {i18n.language === 'en' ? 'EN' : 'FR'}
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      onClick={() => changeLanguageWithPersistence(i18n, 'en')}
                      leftSection={<UsIcon size={16} />}
                      rightSection={
                        i18n.language === 'en' ? (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <title>Selected</title>
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : null
                      }
                    >
                      English
                    </Menu.Item>
                    <Menu.Item
                      onClick={() => changeLanguageWithPersistence(i18n, 'fr')}
                      leftSection={<FrIcon size={16} />}
                      rightSection={
                        i18n.language === 'fr' ? (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <title>Selected</title>
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : null
                      }
                    >
                      Français
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </ClientOnly>

              {/* Vertical Separator */}
              <Divider orientation="vertical" size="xs" />

              <Button
                component={Link}
                to="/login"
                variant="outline"
                className={classes.loginButton}
                size="md"
              >
                {t('home:nav.login')}
              </Button>
            </Group>
            <Burger
              opened={drawerOpened}
              onClick={toggleDrawer}
              hiddenFrom="md"
              className={classes.burger}
            />
          </Group>
        </div>
      </header>

      {/* Mobile Menu */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="xl"
        title={<Logo width={120} variant="auto" />}
        hiddenFrom="md"
        zIndex={1000000}
      >
        <div className={classes.mobileNav}>
          <div className={classes.mobileNavLink}>{t('home:nav.features')}</div>
          <button
            type="button"
            onClick={scrollToPricing}
            className={classes.mobileNavLink}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            {t('home:nav.pricing')}
          </button>
        </div>

        <div className={classes.mobileActions}>
          {/* Mobile Language and Theme Selectors */}
          <Group justify="center" mb="md" gap="lg">
            {/* Theme Selector */}
            <ClientOnly
              fallback={
                <ActionIcon variant="subtle" size="lg" aria-label={t('home:footer.toggleTheme')}>
                  <IconMoon style={{ width: rem(20), height: rem(20) }} />
                </ActionIcon>
              }
            >
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={toggleColorScheme}
                aria-label={t('home:footer.toggleTheme')}
              >
                {isDark ? (
                  <IconSun style={{ width: rem(20), height: rem(20) }} />
                ) : (
                  <IconMoon style={{ width: rem(20), height: rem(20) }} />
                )}
              </ActionIcon>
            </ClientOnly>

            {/* Language Selector */}
            <ClientOnly
              fallback={
                <Menu shadow="md" width={150} position="bottom">
                  <Menu.Target>
                    <Button
                      variant="subtle"
                      size="md"
                      aria-label={t('home:footer.selectLanguage')}
                      leftSection={<UsIcon size={18} />}
                      style={{
                        border: 'none',
                        color: 'inherit',
                      }}
                    >
                      EN
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<UsIcon size={16} />}>English</Menu.Item>
                    <Menu.Item leftSection={<FrIcon size={16} />}>Français</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              }
            >
              <Menu shadow="md" width={150} position="bottom">
                <Menu.Target>
                  <Button
                    variant="subtle"
                    size="md"
                    aria-label={t('home:footer.selectLanguage')}
                    leftSection={
                      i18n.language === 'en' ? <UsIcon size={18} /> : <FrIcon size={18} />
                    }
                    style={{
                      border: 'none',
                      color: 'inherit',
                    }}
                  >
                    {i18n.language === 'en' ? 'EN' : 'FR'}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    onClick={() => changeLanguageWithPersistence(i18n, 'en')}
                    leftSection={<UsIcon size={16} />}
                  >
                    English
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => changeLanguageWithPersistence(i18n, 'fr')}
                    leftSection={<FrIcon size={16} />}
                  >
                    Français
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </ClientOnly>
          </Group>

          {/* Mobile Divider */}
          <Divider mb="md" size="xs" />

          <Button
            component={Link}
            to="/login"
            size="lg"
            fullWidth
            variant="outline"
            className={classes.mobileLoginBtn}
          >
            {t('home:nav.login')}
          </Button>
        </div>
      </Drawer>
    </Box>
  )
}
