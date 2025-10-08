import { type LoaderFunctionArgs } from 'react-router'
import { prisma } from '~/app/db.server'
import { auth } from '~/app/lib/auth'
import WorkflowInstancesPage from '~/app/pages/WorkflowInstances/WorkflowInstances'

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    throw new Response('Unauthorized', { status: 401 })
  }

  if (!session.user.companyId) {
    throw new Response('No company found', { status: 400 })
  }

  // Load workflow instances for the user's company
  const workflowInstances = await prisma.workflowInstance.findMany({
    where: {
      workflowTemplate: {
        companyId: session.user.companyId,
      },
    },
    include: {
      workflowTemplate: {
        include: {
          steps: {
            orderBy: {
              stepNumber: 'asc',
            },
          },
        },
      },
      stepExecutions: {
        include: {
          workflowStep: true,
          assignedToUser: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      triggeredByUser: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: [
      { status: 'desc' }, // Active workflows first
      { createdAt: 'desc' }, // Most recent first
    ],
  })

  // Transform the data
  const transformedInstances = workflowInstances.map((instance) => ({
    ...instance,
    stepExecutions: instance.stepExecutions.map((execution) => ({
      ...execution,
      assigneeName: execution.assignedToUser?.profile?.firstName
        ? `${execution.assignedToUser.profile.firstName} ${execution.assignedToUser.profile.lastName || ''}`.trim()
        : execution.assignedToUser?.email || 'Unassigned',
    })),
    triggeredBy: {
      email: instance.triggeredByUser?.email || '',
      profile: instance.triggeredByUser?.profile || null,
    },
  }))

  return new Response(
    JSON.stringify({
      workflowInstances: transformedInstances,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

export default function WorkflowInstancesRoute() {
  return <WorkflowInstancesPage />
}
