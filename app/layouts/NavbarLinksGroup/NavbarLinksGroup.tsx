import {
  Anchor,
  Badge,
  Collapse,
  Group,
  rem,
  Text,
  // ThemeIcon,
  UnstyledButton
} from "@mantine/core"
import { IconChevronDown } from "@tabler/icons-react"
import clsx from "clsx"
import { Link, useLocation } from "react-router"

import classes from "./NavbarLinksGroup.module.css"

type IMenu = {
  icon: React.FC<any>
  label: string
  active?: boolean
  link?: string
  sublinks?: { label: string; link: string; active: boolean; badge?: { text: string; color?: string; variant?: string } }[]
}

interface LinksGroupProps {
  menuItem: IMenu
  onClick?: (menuItem: IMenu, selected: boolean) => void
}

export default function NavbarLinksGroup({
  menuItem,
  onClick = () => { },
}: LinksGroupProps) {
  const locationPath = useLocation().pathname.split("/")[1]

  // Submenu items
  const items = (menuItem.sublinks || []).map((sublink) => (
    <UnstyledButton
      className={clsx(classes.sublink, {
        [classes.selected]: locationPath === sublink.link?.split("/")[1],
      })}
      component={Link}
      to={sublink.link}
      key={sublink.label}
      onClick={() => {
        const currentSublink = { ...sublink, active: true }
        onClick(
          {
            ...menuItem,
            sublinks: (menuItem.sublinks || []).map((sublinkToUpdate) =>
              sublinkToUpdate.label === sublink.label
                ? currentSublink
                : { ...sublinkToUpdate, active: false }
            ),
          },
          true
        )
      }}
    >
      <Group justify="space-between" w="100%">
        <Text>{sublink.label}</Text>
        {sublink.badge && (
          <Badge
            size="xs"
            color={sublink.badge.color || "blue"}
            variant={sublink.badge.variant || "filled"}
          >
            {sublink.badge.text}
          </Badge>
        )}
      </Group>
    </UnstyledButton>
  ))

  const Icon = menuItem.icon

  const selected = menuItem.sublinks?.some(
    (sublink) => sublink.link.split("/")[1] === locationPath
  )

  return (
    <>
      {/* Menu item */}
      <UnstyledButton
        onClick={() => {
          const currentMenuItem = {
            ...menuItem,
            active: menuItem.link ? menuItem.active : !menuItem.active,
          }
          onClick(currentMenuItem, true)
        }}
        className={classes.control}
        name={menuItem.label}
        data-active={menuItem.active && !menuItem.link ? "true" : undefined}
      >
        <Anchor
          className={classes.link}
          component={menuItem.link ? Link : undefined}
          to={menuItem.link || ""}
        >
          <Icon
            className={clsx(classes.icon, {
              [classes.selected]:
                locationPath === menuItem.link?.split("/")[1] || selected,
              [classes.active]: !selected && menuItem.active && !menuItem.link,
            })}
          />

          <Text
            className={clsx(classes.label, {
              [classes.selected]:
                locationPath === menuItem.link?.split("/")[1] || selected,
              [classes.active]: !selected && menuItem.active && !menuItem.link,
            })}
          >
            {menuItem.label}
          </Text>
          {menuItem.sublinks && (
            <IconChevronDown
              className={classes.chevron}
              stroke={1.5}
              style={{
                width: rem(16),
                height: rem(16),
                transform: menuItem.active ? "rotate(180deg)" : "none",
                color: "var(--mantine-color-gray-6)",
              }}
            />
          )}
        </Anchor>
      </UnstyledButton>
      {menuItem.sublinks && (
        <Collapse in={menuItem.active || false}>{items}</Collapse>
      )}
    </>
  )
}
