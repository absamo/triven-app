import { Box } from '@mantine/core'
import type { FeatureStatus, FeatureWithVotes } from '~/app/lib/roadmap/types'
import Title from '~/app/partials/Title/Title'
import { KanbanColumn } from './KanbanColumn'
import classes from './Roadmap.module.css'

interface KanbanBoardProps {
  features: FeatureWithVotes[]
  isAdmin?: boolean
  currentUserId: string
}

type ColumnConfig = {
  status: FeatureStatus
  title: string
  color: string
}

const COLUMNS: ColumnConfig[] = [
  { status: 'TODO', title: '📋 Requested', color: 'gray' },
  { status: 'PLANNED', title: '🎯 Planned', color: 'blue' },
  { status: 'IN_PROGRESS', title: '⚡ In Progress', color: 'yellow' },
  { status: 'SHIPPED', title: '🚀 Shipped', color: 'green' },
]

export function KanbanBoard({ features, isAdmin = false, currentUserId }: KanbanBoardProps) {
  // Group features by status
  const featuresByStatus = features.reduce(
    (acc, feature) => {
      if (!acc[feature.status]) {
        acc[feature.status] = []
      }
      acc[feature.status].push(feature)
      return acc
    },
    {} as Record<FeatureStatus, FeatureWithVotes[]>
  )

  return (
    <Box
      p="md"
      style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <Box mb="md" style={{ flexShrink: 0 }}>
        <Title
          order={1}
          to="/roadmap/request-new-feature"
          canCreate={isAdmin}
          createLabel="Request Feature"
        >
          Product Roadmap
        </Title>
      </Box>

      <div className={classes.kanbanBoard} style={{ flex: 1, minHeight: 0 }}>
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            status={column.status}
            color={column.color}
            features={featuresByStatus[column.status] || []}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </Box>
  )
}
