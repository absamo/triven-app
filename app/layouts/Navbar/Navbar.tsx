import {
  IconBuilding,
  IconChartPie3,
  IconChecklist,
  IconGauge,
  IconPackage,
  IconReceipt,
  IconTruckDelivery,
} from '@tabler/icons-react'

import { Box, Menu, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core'
import clsx from 'clsx'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import NavbarLinksGroup from '../NavbarLinksGroup'
import classes from './Navbar.module.css'

type IMenu = {
  icon: React.FC<any>
  label: string
  active?: boolean
  link?: string
  sublinks?: {
    label: string
    link: string
    active: boolean
    badge?: { text: string; color?: string; variant?: string }
  }[]
}

interface INavbarLinkProps {
  menu: IMenu
  onClick: (menu: IMenu) => void
}

function NavbarLink({ menu, onClick }: INavbarLinkProps) {
  const { icon: Icon, label, link, sublinks, active } = menu
  const [activeMenu, setActiveMenu] = useState(false)

  const locationPath = useLocation().pathname.split('/')[1]

  const selected =
    locationPath === link?.split('/')[1] ||
    sublinks?.some((sublink) => sublink.link.split('/')[1] === locationPath)

  return (
    <>
      {sublinks ? (
        <Menu
          width={200}
          shadow="lg"
          trigger="click-hover"
          position="right"
          withArrow
          arrowSize={10}
          onOpen={() => setActiveMenu(true)}
          onClose={() => setActiveMenu(false)}
        >
          <Menu.Target>
            <UnstyledButton
              className={clsx(classes.link, {
                [classes.selected]: selected,
                [classes.active]: activeMenu,
              })}
            >
              <Icon size={24} stroke={1.5} />
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>{label}</Menu.Label>
            {sublinks?.map((sublink) => (
              <Menu.Item
                component={Link}
                to={sublink.link}
                key={sublink.label}
                // onClick={() => onClick(sublink)}
                className={clsx(classes.menuitem, {
                  [classes.selected]: locationPath === sublink.link?.split('/')[1],
                })}
              >
                {sublink.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      ) : (
        <Tooltip label={label} position="right" withArrow>
          <UnstyledButton
            component={Link}
            className={clsx(classes.link, {
              [classes.selected]: selected,
            })}
            data-active={active || undefined}
            to={link || ''}
          >
            <Icon size={20} stroke={1.5} />
          </UnstyledButton>
        </Tooltip>
      )}
    </>
  )
}

export default function Navbar({
  permissions = [],
  showMiniNavbar,
  activeMenuItem,
  onClick,
}: {
  permissions: string[]
  showMiniNavbar: boolean
  activeMenuItem?: IMenu
  onClick: (menuItem: IMenu) => void
  onToggle?: () => void
}) {
  const { t } = useTranslation(['navigation'])
  const [selected, setSelected] = useState<boolean>(false)

  const handleNavbarLinkClick = (menuItem: IMenu, selected: boolean) => {
    onClick(menuItem)
    setSelected(selected)
  }

  // Permission checks - no need to memoize as includes() is very fast
  const canViewProducts = permissions.includes('read:products')
  const canViewStockAdjustments = permissions.includes('read:stockAdjustments')
  const canViewCategories = permissions.includes('read:categories')
  const canViewSuppliers = permissions.includes('read:suppliers')
  const canViewPurchaseOrders = permissions.includes('read:purchaseOrders')
  const canViewPurchaseReceives = permissions.includes('read:purchaseReceives')
  const canViewBills = permissions.includes('read:bills')
  const canViewPaymentsMade = permissions.includes('read:paymentsMade')
  const canViewCustomers = permissions.includes('read:customers')
  const canViewSalesOrders = permissions.includes('read:salesOrders')
  const canViewBackorders = permissions.includes('read:backorders')
  const canViewInvoices = permissions.includes('read:invoices')
  const canViewPaymentsReceived = permissions.includes('read:paymentsReceived')
  const canViewPlans = permissions.includes('read:plans')
  const canViewSettings = permissions.includes('read:settings')
  const canViewTeams = permissions.includes('read:users')
  const canViewRoles = permissions.includes('read:roles')
  const canViewAgencies = permissions.includes('read:agencies')
  const canViewSites = permissions.includes('read:sites')
  const canViewTransferOrders = permissions.includes('read:transferOrders')
  const canViewAnalytics = permissions.includes('read:analytics')
  const canViewApprovals =
    permissions.includes('read:approvals') || permissions.includes('read:workflows')

  // Build menu items - no useMemo needed as this needs to update when language changes
  let menuItems = []

  const dashboardMenu = {
    label: t('navigation:dashboard'),
    icon: IconGauge,
    link: '/dashboard',
    active: true,
  }

  menuItems.push(dashboardMenu)

  if (canViewProducts || canViewStockAdjustments || canViewCategories) {
    let inventorySublinks = []

    if (canViewProducts) {
      inventorySublinks.push({
        label: t('navigation:products'),
        link: '/products',
        active: false,
      })
    }

    if (canViewCategories) {
      inventorySublinks.push({
        label: t('navigation:categories'),
        link: '/categories',
        active: false,
      })
    }

    if (canViewStockAdjustments) {
      inventorySublinks.push({
        label: t('navigation:stockAdjustments'),
        link: '/stock-adjustments',
        active: false,
      })
    }

    if (canViewTransferOrders) {
      inventorySublinks.push({
        label: t('navigation:transferOrders'),
        link: '/transfer-orders',
        active: false,
      })
    }

    menuItems.push({
      label: t('navigation:inventory'),
      icon: IconPackage,
      active: false,
      sublinks: inventorySublinks,
    })
  }

  // Add Workflows section if user has approval permissions
  if (canViewApprovals) {
    let workflowSublinks = []

    workflowSublinks.push({
      label: t('navigation:approvals'),
      link: '/approvals',
      active: false,
    })

    workflowSublinks.push({
      label: t('navigation:workflowTemplates'),
      link: '/workflow-templates',
      active: false,
    })

    workflowSublinks.push({
      label: t('navigation:workflowHistory'),
      link: '/workflow-history',
      active: false,
    })

    menuItems.push({
      label: t('navigation:workflows'),
      icon: IconChecklist,
      active: false,
      sublinks: workflowSublinks,
    })
  }

  if (
    canViewSuppliers ||
    canViewPurchaseOrders ||
    canViewPurchaseReceives ||
    canViewBills ||
    canViewPaymentsMade
  ) {
    let purchasesSublinks = []

    if (canViewSuppliers) {
      purchasesSublinks.push({
        label: t('navigation:suppliers'),
        link: '/suppliers',
        active: false,
      })
    }

    if (canViewPurchaseOrders) {
      purchasesSublinks.push({
        label: t('navigation:purchaseOrders'),
        link: '/purchase-orders',
        active: false,
      })
    }

    if (canViewPurchaseReceives) {
      purchasesSublinks.push({
        label: t('navigation:purchaseReceives'),
        link: '/purchase-receives',
        active: false,
      })
    }

    if (canViewBills) {
      purchasesSublinks.push({
        label: t('navigation:bills'),
        link: '/bills',
        active: false,
      })
    }

    if (canViewPaymentsMade) {
      purchasesSublinks.push({
        label: t('navigation:paymentsMade'),
        link: '/payments-made',
        active: false,
      })
    }

    menuItems.push({
      label: t('navigation:purchases'),
      icon: IconTruckDelivery,
      active: false,
      sublinks: purchasesSublinks,
    })
  }

  if (
    canViewCustomers ||
    canViewSalesOrders ||
    canViewBackorders ||
    canViewInvoices ||
    canViewPaymentsReceived
  ) {
    let salesSublinks = []

    if (canViewCustomers) {
      salesSublinks.push({
        label: t('navigation:customers'),
        link: '/customers',
        active: false,
      })
    }

    if (canViewSalesOrders) {
      salesSublinks.push({
        label: t('navigation:salesOrders'),
        link: '/sales-orders',
        active: false,
      })
    }

    if (canViewBackorders) {
      salesSublinks.push({
        label: t('navigation:backorders'),
        link: '/backorders',
        active: false,
      })
    }

    if (canViewInvoices) {
      salesSublinks.push({
        label: t('navigation:invoices'),
        link: '/invoices',
        active: false,
      })
    }

    if (canViewPaymentsReceived) {
      salesSublinks.push({
        label: t('navigation:paymentsReceived'),
        link: '/payments-received',
        active: false,
      })
    }

    menuItems.push({
      label: t('navigation:sales'),
      icon: IconReceipt,
      active: false,
      sublinks: salesSublinks,
    })
  }

  if (canViewAnalytics) {
    const analyticsSublinks = [
      {
        label: t('navigation:inventoryOverview'),
        link: '/analytics/inventoryOverview',
        active: false,
      },
    ]

    menuItems.push({
      label: t('navigation:analytics'),
      icon: IconChartPie3,
      active: false,
      sublinks: analyticsSublinks,
    })
  }

  if (canViewSettings || canViewTeams || canViewRoles || canViewAgencies || canViewSites) {
    let companySublinks = []

    if (canViewPlans) {
      companySublinks.push({
        label: t('navigation:plans'),
        link: '/plans',
        active: false,
      })
    }

    if (canViewSettings) {
      companySublinks.push({
        label: t('navigation:settings'),
        link: '/settings',
        active: false,
      })
    }

    if (canViewTeams) {
      companySublinks.push({ label: t('navigation:teams'), link: '/teams', active: false })
    }

    if (canViewRoles) {
      companySublinks.push({
        label: t('navigation:roles'),
        link: '/roles',
        active: false,
      })
    }

    if (canViewAgencies) {
      companySublinks.push({
        label: t('navigation:agencies'),
        link: '/agencies',
        active: false,
      })
    }

    if (canViewSites) {
      companySublinks.push({
        label: t('navigation:sites'),
        link: '/sites',
        active: false,
      })
    }

    // AI Assistant menu item - always available
    companySublinks.push({
      label: t('navigation:assistant'),
      link: '/ai-assistant',
      active: false,
      badge: {
        text: 'NEW',
        color: 'green',
        variant: 'outline',
      },
    })

    menuItems.push({
      label: t('navigation:company'),
      icon: IconBuilding,
      active: false,
      sublinks: companySublinks,
    })
  }

  const locationPath = useLocation().pathname.split('/')[1]

  return (
    <nav className={clsx(classes.navbar, { [classes.miniNavbar]: showMiniNavbar })}>
      {showMiniNavbar ? (
        <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box mt={25} style={{ flex: 1 }}>
            <Stack justify="center" gap={0}>
              {menuItems.map((menuItem: IMenu) => (
                <NavbarLink menu={menuItem} key={menuItem.label} onClick={onClick} />
              ))}
            </Stack>
          </Box>
        </Box>
      ) : (
        <>
          <Box>
            {/* Main Navigation Section */}
            <Box mb={12}>
              <Text
                size="xs"
                fw={600}
                mb={12}
                style={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  color: 'light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-4))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  paddingLeft: 16,
                }}
              >
                {t('navigation:main')}
              </Text>
              {menuItems.slice(0, 1).map((menuItem: IMenu) => {
                let active = menuItem.active

                // Check if any sublink is active
                if (!menuItem.link) {
                  active =
                    !selected &&
                    (menuItem.sublinks?.some(
                      (sublink) => sublink.link.split('/')[1] === locationPath
                    ) as boolean)
                }

                // Check if main link is active
                if (menuItem.link?.split('/')[1] === locationPath) {
                  active = true
                }

                return (
                  <NavbarLinksGroup
                    menuItem={
                      menuItem.label === activeMenuItem?.label
                        ? activeMenuItem
                        : {
                            ...menuItem,
                            active,
                            sublinks: menuItem.sublinks?.map((sublink) => ({
                              ...sublink,
                              active: sublink.link.split('/')[1] === locationPath,
                            })),
                          }
                    }
                    key={menuItem.label}
                    onClick={(currentMenu, selected) =>
                      handleNavbarLinkClick(currentMenu, selected)
                    }
                  />
                )
              })}
            </Box>

            {/* Business Operations Section */}
            <Box mb={12}>
              <Text
                size="xs"
                fw={600}
                mb={12}
                style={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  color: 'light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-4))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  paddingLeft: 16,
                }}
              >
                {t('navigation:operations')}
              </Text>
              {menuItems.slice(1, -1).map((menuItem: IMenu) => {
                let active = menuItem.active

                // Check if any sublink is active
                if (!menuItem.link) {
                  active =
                    !selected &&
                    (menuItem.sublinks?.some(
                      (sublink) => sublink.link.split('/')[1] === locationPath
                    ) as boolean)
                }

                // Check if main link is active
                if (menuItem.link?.split('/')[1] === locationPath) {
                  active = true
                }

                return (
                  <Box key={menuItem.label} mb={8}>
                    <NavbarLinksGroup
                      menuItem={
                        menuItem.label === activeMenuItem?.label
                          ? activeMenuItem
                          : {
                              ...menuItem,
                              active,
                              sublinks: menuItem.sublinks?.map((sublink) => ({
                                ...sublink,
                                active: sublink.link.split('/')[1] === locationPath,
                              })),
                            }
                      }
                      onClick={(currentMenu, selected) =>
                        handleNavbarLinkClick(currentMenu, selected)
                      }
                    />
                  </Box>
                )
              })}
            </Box>

            {/* Administration Section */}
            {menuItems.length > 1 && (
              <Box mb={12}>
                <Text
                  size="xs"
                  fw={600}
                  mb={12}
                  style={{
                    fontFamily:
                      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    color: 'light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-4))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    paddingLeft: 16,
                  }}
                >
                  {t('navigation:administration')}
                </Text>
                {menuItems.slice(-1).map((menuItem: IMenu) => {
                  let active = menuItem.active

                  // Check if any sublink is active
                  if (!menuItem.link) {
                    active =
                      !selected &&
                      (menuItem.sublinks?.some(
                        (sublink) => sublink.link.split('/')[1] === locationPath
                      ) as boolean)
                  }

                  // Check if main link is active
                  if (menuItem.link?.split('/')[1] === locationPath) {
                    active = true
                  }

                  return (
                    <NavbarLinksGroup
                      menuItem={
                        menuItem.label === activeMenuItem?.label
                          ? activeMenuItem
                          : {
                              ...menuItem,
                              active,
                              sublinks: menuItem.sublinks?.map((sublink) => ({
                                ...sublink,
                                active: sublink.link.split('/')[1] === locationPath,
                              })),
                            }
                      }
                      key={menuItem.label}
                      onClick={(currentMenu, selected) =>
                        handleNavbarLinkClick(currentMenu, selected)
                      }
                    />
                  )
                })}
              </Box>
            )}
          </Box>
        </>
      )}
    </nav>
  )
}
