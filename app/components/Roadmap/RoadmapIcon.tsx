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
    <Tooltip label="Product Roadmap" position="bottom">
      <ActionIcon
        component={NavLink}
        to="/roadmap"
        variant="subtle"
        size="lg"
        radius="xl"
        aria-label="Product Roadmap"
      >
        <IconRoadSign size={20} stroke={1.5} />
      </ActionIcon>
    </Tooltip>
  )
}
