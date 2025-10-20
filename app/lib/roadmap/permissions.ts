import type { BetterAuthUser } from "~/app/services/better-auth.server";

/**
 * Check if a user has admin permissions
 * Admins are users whose role name is "Admin" or has "*" in permissions array
 */
export function isAdmin(user: BetterAuthUser): boolean {
  if (!user.role) {
    return false;
  }

  // Check if role name is Admin (case-insensitive)
  if (user.role.name.toLowerCase() === "admin") {
    return true;
  }

  // Check if role has wildcard permission (admin)
  return user.role.permissions.includes("*");
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: BetterAuthUser, permission: string): boolean {
  if (!user.role) {
    return false;
  }

  // Admin role has all permissions
  if (user.role.name.toLowerCase() === "admin") {
    return true;
  }

  // Check for wildcard permission
  if (user.role.permissions.includes("*")) {
    return true;
  }

  // Check specific permission
  return user.role.permissions.includes(permission);
}

/**
 * Authorization error for non-admin access
 */
export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized: Admin access required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Require admin access or throw error
 */
export function requireAdmin(user: BetterAuthUser): void {
  if (!isAdmin(user)) {
    throw new UnauthorizedError();
  }
}
