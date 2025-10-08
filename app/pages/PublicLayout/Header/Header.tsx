import {
  Box,
  Burger,
  Button,
  Drawer,
  Group,
  HoverCard,
  SimpleGrid,
  Text,
  ThemeIcon,
  UnstyledButton,
  rem,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconBuilding,
  IconChartPie3,
  IconChevronDown,
  IconCurrencyDollar,
  IconFileInvoice,
  IconPackage,
  IconShoppingCart,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Logo } from '~/app/components'
import classes from './Header.module.css'

const featureData = [
  {
    icon: IconPackage,
    title: 'Inventory Management',
    description: 'Real-time stock tracking and intelligent automation',
  },
  {
    icon: IconShoppingCart,
    title: 'Sales & Orders',
    description: 'Complete sales pipeline and order management',
  },
  {
    icon: IconFileInvoice,
    title: 'Purchasing',
    description: 'Streamlined procurement and supplier management',
  },
  {
    icon: IconCurrencyDollar,
    title: 'Financial Operations',
    description: 'Multi-currency support and payment processing',
  },
  {
    icon: IconChartPie3,
    title: 'Analytics & Reports',
    description: 'Business intelligence and predictive insights',
  },
  {
    icon: IconBuilding,
    title: 'Multi-Location',
    description: 'Manage multiple sites and warehouses',
  },
]

export default function HeaderMegaMenu() {
  const { t } = useTranslation(['home', 'navigation'])
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false)
  const [linksOpened, { toggle: toggleLinks }] = useDisclosure(false)

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

  const links = featureData.map((item) => (
    <UnstyledButton className={classes.subLink} key={item.title}>
      <Group wrap="nowrap" align="flex-start">
        <ThemeIcon size={34} variant="default" radius="md" className={classes.featureIcon}>
          <item.icon style={{ width: rem(22), height: rem(22) }} />
        </ThemeIcon>
        <div>
          <Text size="sm" fw={500}>
            {item.title}
          </Text>
          <Text size="xs" c="dimmed" className={classes.featureDescription}>
            {item.description}
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
                onClick={scrollToPricing}
                className={classes.navLink}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {t('home:nav.pricing')}
              </button>
            </Group>

            {/* CTA Buttons */}
            <Group visibleFrom="md" gap="sm" align="center">
              <Button
                component={Link}
                to="/login"
                variant="outline"
                className={classes.loginButton}
                size="md"
              >
                {t('home:nav.login')}
              </Button>
              <Button component={Link} to="/signup" className={classes.signupButton} size="md">
                {t('home:nav.getStarted')}
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
          <Button
            component={Link}
            to="/signup"
            size="lg"
            fullWidth
            className={classes.mobileSignupBtn}
            mb="sm"
          >
            {t('home:nav.getStarted')}
          </Button>
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
