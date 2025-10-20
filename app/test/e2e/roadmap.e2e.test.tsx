import { PrismaClient } from '@prisma/client'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { KanbanBoard } from '~/app/components/Roadmap/KanbanBoard'
import type { FeatureWithVotes } from '~/app/lib/roadmap/types'
import {
  cleanupTestData,
  createTestAdminUser,
  createTestFeature,
  createTestUser,
  createTestVote,
  getOrCreateTestCompany,
} from '../roadmap/fixtures'

const db = new PrismaClient()

describe('Roadmap E2E Tests', () => {
  let companyId: string
  let adminUserId: string
  let regularUserId: string

  beforeEach(async () => {
    companyId = await getOrCreateTestCompany(db)
    const adminUser = await createTestAdminUser(db, companyId)
    const regularUser = await createTestUser(db, companyId)
    adminUserId = adminUser.id
    regularUserId = regularUser.id
  })

  afterEach(async () => {
    await cleanupTestData(db)
  })

  describe('Kanban Board - Component Rendering', () => {
    it('should render all four status columns with features', async () => {
      // Create test features in each status
      const todoFeature = await createTestFeature(db, adminUserId, {
        status: 'TODO',
        title: 'Requested Feature',
        description: 'A feature that has been requested',
      })
      const plannedFeature = await createTestFeature(db, adminUserId, {
        status: 'PLANNED',
        title: 'Planned Feature',
        description: 'A feature that is planned',
      })
      const inProgressFeature = await createTestFeature(db, adminUserId, {
        status: 'IN_PROGRESS',
        title: 'In Progress Feature',
        description: 'A feature being worked on',
      })
      const shippedFeature = await createTestFeature(db, adminUserId, {
        status: 'SHIPPED',
        title: 'Shipped Feature',
        description: 'A feature that shipped',
      })

      // Fetch features from database to get complete data including timestamps
      const dbFeatures = await db.featureRequest.findMany({
        where: {
          id: {
            in: [todoFeature.id, plannedFeature.id, inProgressFeature.id, shippedFeature.id],
          },
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Convert to FeatureWithVotes format
      const features: FeatureWithVotes[] = dbFeatures.map((f) => ({
        id: f.id,
        title: f.title,
        description: f.description,
        status: f.status as 'TODO' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED',
        voteCount: f.voteCount,
        userHasVoted: false,
        createdBy: {
          id: f.createdBy.id,
          name: f.createdBy.name || 'Unknown',
          email: f.createdBy.email,
        },
        createdById: f.createdById,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      }))

      render(<KanbanBoard features={features} isAdmin={true} />)

      // Verify all columns are present
      await waitFor(() => {
        expect(screen.getByText(/Requested/i)).toBeInTheDocument()
        expect(screen.getByText(/Planned/i)).toBeInTheDocument()
        expect(screen.getByText(/In Progress/i)).toBeInTheDocument()
        expect(screen.getByText(/Shipped/i)).toBeInTheDocument()
      })

      // Verify features are rendered
      expect(screen.getByText('Requested Feature')).toBeInTheDocument()
      expect(screen.getByText('Planned Feature')).toBeInTheDocument()
      expect(screen.getByText('In Progress Feature')).toBeInTheDocument()
      expect(screen.getByText('Shipped Feature')).toBeInTheDocument()
    })

    it('should display feature details including vote counts', async () => {
      const feature = await createTestFeature(db, adminUserId, {
        title: 'Popular Feature',
        description: 'Everyone wants this',
        voteCount: 42,
        status: 'TODO',
      })

      // Add a vote
      await createTestVote(db, feature.id, regularUserId)

      // Fetch complete feature data
      const dbFeature = await db.featureRequest.findUnique({
        where: { id: feature.id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (!dbFeature) {
        throw new Error('Feature not found')
      }

      const features: FeatureWithVotes[] = [
        {
          id: dbFeature.id,
          title: dbFeature.title,
          description: dbFeature.description,
          status: dbFeature.status as 'TODO' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED',
          voteCount: dbFeature.voteCount,
          userHasVoted: false,
          createdBy: {
            id: dbFeature.createdBy.id,
            name: dbFeature.createdBy.name || 'Unknown',
            email: dbFeature.createdBy.email,
          },
          createdById: dbFeature.createdById,
          createdAt: dbFeature.createdAt,
          updatedAt: dbFeature.updatedAt,
        },
      ]

      render(<KanbanBoard features={features} isAdmin={false} />)

      await waitFor(() => {
        expect(screen.getByText('Popular Feature')).toBeInTheDocument()
        expect(screen.getByText('Everyone wants this')).toBeInTheDocument()
        // Vote count should be 43 (42 + 1 from createTestVote)
        expect(screen.getByText('43')).toBeInTheDocument()
      })
    })

    it('should handle multiple features in the same column', async () => {
      const feature1 = await createTestFeature(db, adminUserId, {
        title: 'Low Votes',
        status: 'TODO',
        voteCount: 5,
      })
      const feature2 = await createTestFeature(db, adminUserId, {
        title: 'High Votes',
        status: 'TODO',
        voteCount: 15,
      })
      const feature3 = await createTestFeature(db, adminUserId, {
        title: 'Medium Votes',
        status: 'TODO',
        voteCount: 10,
      })

      // Fetch all features
      const dbFeatures = await db.featureRequest.findMany({
        where: {
          id: {
            in: [feature1.id, feature2.id, feature3.id],
          },
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      const features: FeatureWithVotes[] = dbFeatures.map((f) => ({
        id: f.id,
        title: f.title,
        description: f.description,
        status: f.status as 'TODO' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED',
        voteCount: f.voteCount,
        userHasVoted: false,
        createdBy: {
          id: f.createdBy.id,
          name: f.createdBy.name || 'Unknown',
          email: f.createdBy.email,
        },
        createdById: f.createdById,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      }))

      render(<KanbanBoard features={features} isAdmin={false} />)

      await waitFor(() => {
        expect(screen.getByText('Low Votes')).toBeInTheDocument()
        expect(screen.getByText('High Votes')).toBeInTheDocument()
        expect(screen.getByText('Medium Votes')).toBeInTheDocument()

        // All vote counts should be visible
        expect(screen.getByText('5')).toBeInTheDocument()
        expect(screen.getByText('10')).toBeInTheDocument()
        expect(screen.getByText('15')).toBeInTheDocument()
      })
    })

    it('should render empty columns when no features in that status', async () => {
      const feature = await createTestFeature(db, adminUserId, {
        title: 'Only TODO Feature',
        status: 'TODO',
      })

      const dbFeature = await db.featureRequest.findUnique({
        where: { id: feature.id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (!dbFeature) {
        throw new Error('Feature not found')
      }

      const features: FeatureWithVotes[] = [
        {
          id: dbFeature.id,
          title: dbFeature.title,
          description: dbFeature.description,
          status: dbFeature.status as 'TODO' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED',
          voteCount: dbFeature.voteCount,
          userHasVoted: false,
          createdBy: {
            id: dbFeature.createdBy.id,
            name: dbFeature.createdBy.name || 'Unknown',
            email: dbFeature.createdBy.email,
          },
          createdById: dbFeature.createdById,
          createdAt: dbFeature.createdAt,
          updatedAt: dbFeature.updatedAt,
        },
      ]

      render(<KanbanBoard features={features} isAdmin={false} />)

      await waitFor(() => {
        // TODO column should have the feature
        expect(screen.getByText('Only TODO Feature')).toBeInTheDocument()

        // Other columns should still be present (just empty)
        expect(screen.getByText(/Planned/i)).toBeInTheDocument()
        expect(screen.getByText(/In Progress/i)).toBeInTheDocument()
        expect(screen.getByText(/Shipped/i)).toBeInTheDocument()
      })
    })
  })
})
