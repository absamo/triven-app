import type { LoaderFunctionArgs } from 'react-router'
import { prisma } from '~/app/db.server'
import { auth } from '~/app/lib/auth.server'
import WorkflowStepExecutionPage from '~/app/pages/WorkflowStepExecution/WorkflowStepExecution'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const instanceId = params.instanceId
  if (!instanceId) {
    throw new Response('Instance ID required', { status: 400 })
  }

  // Load workflow instance with current step
  const workflowInstance = await prisma.workflowInstance.findUnique({
    where: {
      id: instanceId,
    },
    include: {
      workflowTemplate: {
        include: {
          company: true,
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
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!workflowInstance) {
    throw new Response('Workflow instance not found', { status: 404 })
  }

  // Check if user belongs to same company
  if (workflowInstance.workflowTemplate.company.id !== session.user.companyId) {
    throw new Response('Unauthorized', { status: 403 })
  }

  // Find current step execution
  const currentStepExecution = workflowInstance.stepExecutions.find(
    (exec) =>
      exec.workflowStep.stepNumber === workflowInstance.currentStepNumber &&
      exec.status === 'assigned'
  )

  if (!currentStepExecution) {
    throw new Response('No current step execution found', { status: 404 })
  }

  // Check if user can approve this step
  const currentStep = workflowInstance.workflowTemplate.steps.find(
    (step) => step.stepNumber === workflowInstance.currentStepNumber
  )

  let canApprove = false
  if (currentStep) {
    if (currentStep.assigneeType === 'user' && currentStep.assigneeUserId === session.user.id) {
      canApprove = true
    } else if (
      currentStep.assigneeType === 'role' &&
      session.user.roleId === currentStep.assigneeRoleId
    ) {
      canApprove = true
    }
  }

  return new Response(
    JSON.stringify({
      workflowInstance: {
        ...workflowInstance,
        stepExecutions: workflowInstance.stepExecutions.map((exec) => ({
          ...exec,
          workflowStep: {
            stepNumber: exec.workflowStep.stepNumber,
            name: exec.workflowStep.name,
            description: exec.workflowStep.description,
            stepType: exec.workflowStep.stepType,
          },
        })),
      },
      currentStepExecution: {
        ...currentStepExecution,
        workflowStep: {
          name: currentStepExecution.workflowStep.name,
          description: currentStepExecution.workflowStep.description,
          stepType: currentStepExecution.workflowStep.stepType,
          stepNumber: currentStepExecution.workflowStep.stepNumber,
        },
      },
      canApprove,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

export default function WorkflowStepExecutionRoute() {
  return <WorkflowStepExecutionPage />
}
