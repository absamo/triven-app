import { ActionIcon, Tooltip } from '@mantine/core'
import { IconRoadSign } from '@tabler/icons-react'
import { NavLink } from 'react-router'

interface RoadmapIconProps {
  /** Show only for admin users */
  isAdmin: boolean
}

/**
 * Roadmap navigation icon component
 * Displays in header navigation only for admin users
 */
export default function RoadmapIcon({ isAdmin }: RoadmapIconProps) {
  if (!isAdmin) {
    return null
  }

  return (
    <Tooltip label="Product Roadmap" position="bottom" withArrow>
      <ActionIcon
        component={NavLink}
        to="/roadmap"
        variant="subtle"
        size="lg"
        radius="xl"
        aria-label="Product Roadmap"
        style={{
          transition: 'all 0.2s ease',
          color: 'light-dark(var(--mantine-color-dark-9), var(--mantine-color-gray-3))',
        }}
      >
        <IconRoadSign size={22} stroke={1.5} />
      </ActionIcon>
    </Tooltip>
  )
}
