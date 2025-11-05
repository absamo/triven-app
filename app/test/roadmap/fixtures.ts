import { type PrismaClient, UserStatus } from '@prisma/client'
import type { FeatureStatus } from '~/app/lib/roadmap/types'

/**
 * Test fixtures for Feature Voting Roadmap
 */

export interface TestUser {
  id: string
  email: string
  name: string
  roleId: string
}

export interface TestFeature {
  id: string
  title: string
  description: string
  status: FeatureStatus
  voteCount: number
  createdById: string
}

/**
 * Create a test admin user
 */
export async function createTestAdminUser(db: PrismaClient, companyId: string): Promise<TestUser> {
  // Find or create admin role
  const adminRole = await db.role.upsert({
    where: {
      name_companyId: {
        name: 'admin',
        companyId,
      },
    },
    create: {
      name: 'admin',
      description: 'Administrator role',
      companyId,
      permissions: ['*'],
      editable: false,
    },
    update: {},
  })

  const user = await db.user.create({
    data: {
      email: `admin-${Date.now()}@test.com`,
      name: 'Test Admin',
      roleId: adminRole.id,
      companyId,
      status: 'Registered',
      active: true,
    },
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name || 'Test Admin',
    roleId: adminRole.id,
  }
}

/**
 * Create a test regular user
 */
export async function createTestUser(db: PrismaClient, companyId: string): Promise<TestUser> {
  // Find or create user role
  const userRole = await db.role.upsert({
    where: {
      name_companyId: {
        name: 'user',
        companyId,
      },
    },
    create: {
      name: 'user',
      description: 'Regular user role',
      companyId,
      permissions: ['read'],
      editable: false,
    },
    update: {},
  })

  const user = await db.user.create({
    data: {
      email: `user-${Date.now()}@test.com`,
      name: 'Test User',
      roleId: userRole.id,
      companyId,
      status: 'Registered',
      active: true,
    },
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name || 'Test User',
    roleId: userRole.id,
  }
}

/**
 * Create a test feature request
 */
export async function createTestFeature(
  prisma: PrismaClient,
  createdById: string,
  data?: Partial<{
    title: string
    description: string
    status: 'TODO' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED'
    voteCount: number
  }>
): Promise<TestFeature> {
  const feature = await prisma.featureRequest.create({
    data: {
      title: data?.title ?? 'Test Feature',
      description: data?.description ?? 'This is a test feature for development.',
      status: data?.status ?? 'TODO',
      createdById,
      voteCount: data?.voteCount ?? 0,
    },
  })

  return {
    id: feature.id,
    title: feature.title,
    description: feature.description,
    status: feature.status as FeatureStatus,
    voteCount: feature.voteCount,
    createdById: feature.createdById,
  }
}

/**
 * Create a test vote
 */
export async function createTestVote(
  db: PrismaClient,
  featureId: string,
  userId: string
): Promise<void> {
  await db.featureVote.create({
    data: {
      featureId,
      userId,
    },
  })

  // Update vote count
  await db.featureRequest.update({
    where: { id: featureId },
    data: {
      voteCount: {
        increment: 1,
      },
    },
  })
}

/**
 * Clean up test data
 */
export async function cleanupTestData(db: PrismaClient): Promise<void> {
  await db.featureVote.deleteMany({})
  await db.featureAuditLog.deleteMany({})
  await db.featureRequest.deleteMany({})
}

/**
 * Get test company or create one
 */
export async function getOrCreateTestCompany(db: PrismaClient): Promise<string> {
  const company = await db.company.findFirst({
    where: {
      name: 'Test Company',
    },
  })

  if (company) {
    return company.id
  }

  const newCompany = await db.company.create({
    data: {
      name: 'Test Company',
      sandbox: true,
      active: true,
    },
  })

  return newCompany.id
}
