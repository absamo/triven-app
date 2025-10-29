// Demo Request Service
// Service-Oriented Architecture (Constitutional Principle I)
// Standalone functions for demo request operations

import { prisma } from '~/app/db.server'
import type { DemoRequest, DemoRequestFormData } from '~/app/lib/landing/types'

// Rate limiting storage (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_MAX_REQUESTS = 5 // Max demo requests per IP
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

/**
 * Check if IP address has exceeded rate limit
 * @param ipAddress - Client IP address
 * @returns true if rate limit exceeded, false otherwise
 */
export function isRateLimited(ipAddress: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ipAddress)

  if (!record) {
    return false
  }

  // Reset if window has passed
  if (now > record.resetTime) {
    rateLimitStore.delete(ipAddress)
    return false
  }

  return record.count >= RATE_LIMIT_MAX_REQUESTS
}

/**
 * Increment rate limit counter for IP address
 * @param ipAddress - Client IP address
 */
export function incrementRateLimit(ipAddress: string): void {
  const now = Date.now()
  const record = rateLimitStore.get(ipAddress)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ipAddress, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    })
  } else {
    record.count++
  }
}

/**
 * Create a new demo request in the database
 * @param data - Demo request form data
 * @returns Created demo request
 */
export async function createDemoRequest(data: DemoRequestFormData): Promise<DemoRequest> {
  const demoRequest = await prisma.demoRequest.create({
    data: {
      name: data.name,
      email: data.email,
      company: data.company || '',
      teamSize: data.teamSize || '',
      preferredDemoTime: data.preferredDemoTime ? new Date(data.preferredDemoTime) : null,
      message: data.message || null,
      status: 'new',
      notificationSent: false,
    },
  })

  return demoRequest
}

/**
 * Update demo request status
 * @param id - Demo request ID
 * @param status - New status
 * @returns Updated demo request
 */
export async function updateDemoRequestStatus(
  id: string,
  status: 'new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled'
): Promise<DemoRequest> {
  const demoRequest = await prisma.demoRequest.update({
    where: { id },
    data: { status },
  })

  return demoRequest
}

/**
 * Mark demo request notification as sent
 * @param id - Demo request ID
 * @returns Updated demo request
 */
export async function markNotificationSent(id: string): Promise<DemoRequest> {
  const demoRequest = await prisma.demoRequest.update({
    where: { id },
    data: { notificationSent: true },
  })

  return demoRequest
}

/**
 * Get demo request by ID
 * @param id - Demo request ID
 * @returns Demo request or null
 */
export async function getDemoRequestById(id: string): Promise<DemoRequest | null> {
  const demoRequest = await prisma.demoRequest.findUnique({
    where: { id },
  })

  return demoRequest
}

/**
 * Get all demo requests with optional filtering
 * @param status - Optional status filter
 * @param limit - Optional result limit
 * @returns Array of demo requests
 */
export async function getDemoRequests(
  status?: 'new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled',
  limit?: number
): Promise<DemoRequest[]> {
  const demoRequests = await prisma.demoRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return demoRequests
}
