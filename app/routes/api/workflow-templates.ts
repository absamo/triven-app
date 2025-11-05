import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { z } from 'zod'
import { workflowTemplateSchema } from '~/app/common/validations/workflowTemplateSchema'
import { prisma } from '~/app/db.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

// Helper function to convert entityType to default triggerType
function getTriggerTypeFromEntity(entityType: string): string {
  const mapping: Record<string, string> = {
    purchase_order: 'purchase_order_create',
    sales_order: 'sales_order_create',
    stock_adjustment: 'stock_adjustment_create',
    transfer_order: 'transfer_order_create',
    invoice: 'invoice_create',
    bill: 'bill_create',
    customer: 'customer_create',
    supplier: 'supplier_create',
    product: 'product_create',
    custom: 'manual',
  }

  return mapping[entityType] || 'manual'
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireBetterAuthUser(request, ['read:workflows'])

  try {
    const templates = await prisma.workflowTemplate.findMany({
      where: {
        companyId: user.companyId,
      },
      include: {
        createdBy: {
          include: {
            profile: true,
          },
        },
        steps: {
          orderBy: {
            stepNumber: 'asc',
          },
          include: {
            assigneeUser: {
              include: {
                profile: true,
              },
            },
            assigneeRole: true,
          },
        },
        _count: {
          select: {
            instances: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return new Response(JSON.stringify({ templates }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error loading workflow templates:', error)
    throw new Response('Failed to load workflow templates', { status: 500 })
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent') as string

  // Check permissions based on intent
  const permissionMap: Record<string, string> = {
    create: 'create:workflows',
    update: 'update:workflows',
    delete: 'delete:workflows',
    'toggle-status': 'update:workflows',
    duplicate: 'create:workflows',
  }

  const requiredPermission = permissionMap[intent]
  if (!requiredPermission) {
    throw new Response('Invalid intent', { status: 400 })
  }

  const user = await requireBetterAuthUser(request, [requiredPermission])

  try {
    switch (intent) {
      case 'create': {
        const data = JSON.parse(formData.get('data') as string)
        const validatedData = workflowTemplateSchema.parse(data)

        // Convert entityType to triggerType if not explicitly set
        const triggerType =
          validatedData.triggerType || getTriggerTypeFromEntity(validatedData.entityType)

        const template = await prisma.workflowTemplate.create({
          data: {
            name: validatedData.name,
            description: validatedData.description || '',
            triggerType: triggerType as any,
            triggerConditions: validatedData.triggerConditions || {
              entityType: validatedData.entityType,
              priority: validatedData.priority,
            },
            isActive: validatedData.isActive,
            companyId: user.companyId,
            createdById: user.id,
            steps: {
              create: validatedData.steps.map((step, index) => ({
                stepNumber: index + 1,
                name: step.name,
                description: step.description || '',
                stepType: step.type,
                assigneeType: step.assigneeType === 'user' ? 'user' : 'role',
                assigneeUserId: step.assigneeType === 'user' ? step.assigneeId : null,
                assigneeRoleId: step.assigneeType === 'role' ? step.assigneeId : null,
                isRequired: step.isRequired,
                timeoutHours: step.timeoutDays ? step.timeoutDays * 24 : null,
              })),
            },
          },
          include: {
            steps: true,
          },
        })

        return new Response(JSON.stringify({ success: true, template }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      case 'update': {
        const templateId = formData.get('templateId') as string
        const data = JSON.parse(formData.get('data') as string)
        const validatedData = workflowTemplateSchema.parse(data)

        // Convert entityType to triggerType if not explicitly set
        const triggerType =
          validatedData.triggerType || getTriggerTypeFromEntity(validatedData.entityType)

        // Delete existing steps and recreate them
        await prisma.workflowStep.deleteMany({
          where: { workflowTemplateId: templateId },
        })

        const template = await prisma.workflowTemplate.update({
          where: {
            id: templateId,
            companyId: session.user.companyId,
          },
          data: {
            name: validatedData.name,
            description: validatedData.description || '',
            triggerType: triggerType as any,
            triggerConditions: validatedData.triggerConditions || {
              entityType: validatedData.entityType,
              priority: validatedData.priority,
            },
            isActive: validatedData.isActive,
            steps: {
              create: validatedData.steps.map((step, index) => ({
                stepNumber: index + 1,
                name: step.name,
                description: step.description || '',
                stepType: step.type,
                assigneeType: step.assigneeType === 'user' ? 'user' : 'role',
                assigneeUserId: step.assigneeType === 'user' ? step.assigneeId : null,
                assigneeRoleId: step.assigneeType === 'role' ? step.assigneeId : null,
                isRequired: step.isRequired,
                timeoutHours: step.timeoutDays ? step.timeoutDays * 24 : null,
              })),
            },
          },
          include: {
            steps: true,
          },
        })

        return new Response(JSON.stringify({ success: true, template }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      case 'delete': {
        const templateId = formData.get('templateId') as string

        await prisma.workflowTemplate.delete({
          where: {
            id: templateId,
            companyId: user.companyId,
          },
        })

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      case 'toggle-status': {
        const templateId = formData.get('templateId') as string
        const isActive = formData.get('isActive') === 'true'

        const template = await prisma.workflowTemplate.update({
          where: {
            id: templateId,
            companyId: user.companyId,
          },
          data: {
            isActive: !isActive,
          },
        })

        return new Response(JSON.stringify({ success: true, template }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      case 'duplicate': {
        const templateId = formData.get('templateId') as string

        const originalTemplate = await prisma.workflowTemplate.findUnique({
          where: {
            id: templateId,
            companyId: user.companyId,
          },
          include: {
            steps: {
              orderBy: {
                stepNumber: 'asc',
              },
            },
          },
        })

        if (!originalTemplate) {
          throw new Response('Template not found', { status: 404 })
        }

        const duplicatedTemplate = await prisma.workflowTemplate.create({
          data: {
            name: `${originalTemplate.name} (Copy)`,
            description: originalTemplate.description,
            triggerType: originalTemplate.triggerType,
            triggerConditions: originalTemplate.triggerConditions as any,
            isActive: false, // New templates start as inactive
            companyId: user.companyId,
            createdById: user.id,
            steps: {
              create: originalTemplate.steps.map((step: any) => ({
                stepNumber: step.stepNumber,
                name: step.name,
                description: step.description,
                stepType: step.stepType,
                assigneeType: step.assigneeType,
                assigneeUserId: step.assigneeUserId,
                assigneeRoleId: step.assigneeRoleId,
                isRequired: step.isRequired,
                timeoutHours: step.timeoutHours,
                autoApprove: step.autoApprove,
                allowParallel: step.allowParallel,
                conditions: step.conditions,
              })),
            },
          },
          include: {
            steps: true,
          },
        })

        return new Response(JSON.stringify({ success: true, template: duplicatedTemplate }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      default:
        throw new Response('Invalid intent', { status: 400 })
    }
  } catch (error) {
    console.error('Error in workflow template action:', error)
    if (error instanceof z.ZodError) {
      throw new Response(JSON.stringify({ error: 'Validation failed', details: error.issues }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    throw new Response('Internal server error', { status: 500 })
  }
}
