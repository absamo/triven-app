/**
 * Authorization Service
 *
 * Implements role-based access control for Mastra tools
 * Based on research.md Section 3: Role-Based Authorization Patterns
 */

import { prisma } from '../db.server'

/**
 * Mastra Tool Permissions
 * Maps tool operations to database permission strings (action:resource format)
 * Aligns with seed data permissions: 'read:products', 'update:products', etc.
 */
export enum Permission {
  // Inventory viewing and management
  VIEW_INVENTORY = 'read:products',
  MANAGE_PRODUCTS = 'update:products',
  CREATE_PRODUCTS = 'create:products',

  // Category management
  VIEW_CATEGORIES = 'read:categories',
  MANAGE_CATEGORIES = 'update:categories',
  CREATE_CATEGORIES = 'create:categories',

  // Order operations
  VIEW_ORDERS = 'read:salesOrders',
  MANAGE_ORDERS = 'update:salesOrders',

  // Supplier operations
  VIEW_SUPPLIERS = 'read:suppliers',
  MANAGE_SUPPLIERS = 'update:suppliers',
  MANAGE_PURCHASE_ORDERS = 'update:purchaseOrders',

  // Analytics and reports
  VIEW_REPORTS = 'read:analytics',
}

/**
 * Get user permissions from database
 * Returns the user's role permissions as strings in 'action:resource' format
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            name: true,
            permissions: true,
          },
        },
      },
    })

    if (user?.role?.permissions && user.role.permissions.length > 0) {
      return user.role.permissions
    }

    // Return empty array if no permissions found (user should not be able to perform any tool operations)
    console.warn(`[Authorization] User ${userId} has no permissions assigned`)
    return []
  } catch (error) {
    console.error('[Authorization] Failed to fetch user permissions:', error)
    return []
  }
}

/**
 * Check if a user has a specific permission
 * Implements permission hierarchy: delete > update > create > read
 */
export function userHasPermission(
  userPermissions: string[],
  requiredPermission: Permission
): boolean {
  const permissionString = requiredPermission.toString()

  // Check for exact permission match
  if (userPermissions.includes(permissionString)) {
    return true
  }

  // Extract action and resource from permission (format: 'action:resource')
  const [action, resource] = permissionString.split(':')
  if (!resource) {
    return false
  }

  // Permission hierarchy logic:
  // - delete permission implies all other permissions
  // - update permission implies create and read
  // - create permission implies read
  switch (action) {
    case 'read':
      // Read requires at least read permission (already checked above)
      return false

    case 'create':
      // Create can also be done with update or delete permissions
      return (
        userPermissions.includes(`update:${resource}`) ||
        userPermissions.includes(`delete:${resource}`)
      )

    case 'update':
      // Update can also be done with delete permission
      return userPermissions.includes(`delete:${resource}`)

    case 'delete':
      // Delete requires exact delete permission (already checked above)
      return false

    default:
      return false
  }
}

/**
 * Check permission and return authorization result
 * Returns detailed error message if unauthorized
 */
export async function checkPermission(
  userId: string,
  requiredPermission: Permission
): Promise<{ authorized: boolean; error?: string }> {
  const userPermissions = await getUserPermissions(userId)

  if (!userHasPermission(userPermissions, requiredPermission)) {
    return {
      authorized: false,
      error: `Insufficient permissions. Required: ${requiredPermission}.`,
    }
  }
  return { authorized: true }
}

/**
 * T020: Check if user has a specific permission by permission string
 * Used for workflow approvals where permissions are stored as strings
 * @param userId - The user ID to check
 * @param permissionString - The permission string to check (e.g., 'create_workflow', 'approve_workflows')
 * @returns True if user has the permission, false otherwise
 */
export async function hasPermission(
  userId: string,
  permissionString: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            permissions: true,
          },
        },
      },
    })

    if (!user?.role?.permissions) {
      return false
    }

    return user.role.permissions.includes(permissionString)
  } catch (error) {
    console.error('[Authorization] Failed to check permission:', error)
    return false
  }
}
