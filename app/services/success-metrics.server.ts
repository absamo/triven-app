// Success Metrics Service
// Service-Oriented Architecture (Constitutional Principle I)
// Standalone functions for success metric operations

import { prisma } from '~/app/db.server'
import type { SuccessMetric } from '~/app/lib/landing/types'

/**
 * Get all active success metrics ordered by display order
 * @returns Array of active success metrics
 */
export async function getActiveSuccessMetrics(): Promise<SuccessMetric[]> {
  const metrics = await prisma.successMetric.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  })

  return metrics
}

/**
 * Get success metric by ID
 * @param id - Success metric ID
 * @returns Success metric or null
 */
export async function getSuccessMetricById(id: string): Promise<SuccessMetric | null> {
  const metric = await prisma.successMetric.findUnique({
    where: { id },
  })

  return metric
}

/**
 * Create a new success metric
 * @param data - Success metric data
 * @returns Created success metric
 */
export async function createSuccessMetric(data: {
  label: string
  value: string
  icon: string
  displayOrder: number
  isActive?: boolean
}): Promise<SuccessMetric> {
  const metric = await prisma.successMetric.create({
    data: {
      label: data.label,
      value: data.value,
      icon: data.icon,
      displayOrder: data.displayOrder,
      isActive: data.isActive ?? true,
    },
  })

  return metric
}

/**
 * Update success metric
 * @param id - Success metric ID
 * @param data - Partial success metric data to update
 * @returns Updated success metric
 */
export async function updateSuccessMetric(
  id: string,
  data: Partial<{
    label: string
    value: string
    icon: string
    displayOrder: number
    isActive: boolean
  }>
): Promise<SuccessMetric> {
  const metric = await prisma.successMetric.update({
    where: { id },
    data,
  })

  return metric
}

/**
 * Delete success metric
 * @param id - Success metric ID
 * @returns Deleted success metric
 */
export async function deleteSuccessMetric(id: string): Promise<SuccessMetric> {
  const metric = await prisma.successMetric.delete({
    where: { id },
  })

  return metric
}

/**
 * Toggle success metric active status
 * @param id - Success metric ID
 * @param active - New active status
 * @returns Updated success metric
 */
export async function toggleSuccessMetricActive(
  id: string,
  active: boolean
): Promise<SuccessMetric> {
  const metric = await prisma.successMetric.update({
    where: { id },
    data: { isActive: active },
  })

  return metric
}
