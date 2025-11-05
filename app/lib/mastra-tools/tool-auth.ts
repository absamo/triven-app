/**
 * Tool Authorization Wrapper
 *
 * Implements HOF (Higher-Order Function) pattern for protecting Mastra tools with authorization
 * Based on research.md Section 3: Role-Based Authorization Patterns
 */

import { checkPermission, type Permission } from '../../services/authorization.server'

/**
 * User context interface
 * Passed to all tool execute functions via runtimeContext
 */
export interface UserContext {
  userId: string
  role: string
  companyId: string
  email: string
}

/**
 * Tool execute function signature
 */
export type ToolExecuteFunction<TParams, TResult> = (
  params: TParams,
  context: { user: UserContext }
) => Promise<TResult>

/**
 * Authorization wrapper for Mastra tools
 * Enforces permission checks before tool execution
 *
 * @param requiredPermission - The permission required to execute the tool
 * @param executeFunction - The actual tool logic to execute
 * @returns Wrapped execute function with authorization check
 *
 * @example
 * const updateProductStock = withAuthorization(
 *   Permission.MANAGE_PRODUCTS,
 *   async (params, { user }) => {
 *     // Tool logic here
 *   }
 * );
 */
export function withAuthorization<TParams, TResult>(
  requiredPermission: Permission,
  executeFunction: ToolExecuteFunction<TParams, TResult>
) {
  return async (
    params: TParams,
    runtimeContext?: { user?: UserContext }
  ): Promise<TResult | { error: string; suggestion?: string }> => {
    // Extract user from runtime context
    const user = runtimeContext?.user

    if (!user) {
      return {
        error: 'Authentication required',
        suggestion: 'Please log in to use this tool',
      }
    }

    // Check permission
    const authCheck = await checkPermission(user.userId, requiredPermission)

    if (!authCheck.authorized) {
      return {
        error: authCheck.error || 'Permission denied',
        suggestion: 'Contact your administrator to request access',
      }
    }

    // Execute tool with user context
    return executeFunction(params, { user })
  }
}
