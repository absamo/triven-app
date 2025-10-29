import type { ActionFunctionArgs } from 'react-router'
import { auth } from '~/app/lib/auth.server'
import { completeWorkflowStep } from '~/app/services/workflow.server'

export async function action({ request }: ActionFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session?.user?.companyId) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const formData = await request.formData()
  const stepExecutionId = formData.get('stepExecutionId') as string
  const decision = formData.get('decision') as string
  const notes = formData.get('notes') as string

  if (!stepExecutionId || !decision) {
    throw new Response('Missing required fields', { status: 400 })
  }

  if (!['approved', 'rejected'].includes(decision)) {
    throw new Response('Invalid decision', { status: 400 })
  }

  try {
    const result = await completeWorkflowStep(stepExecutionId, {
      decision,
      notes: notes || undefined,
      metadata: {
        completedBy: session.user.id,
        completedAt: new Date().toISOString(),
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        stepExecution: result,
        redirect: '/workflow-instances',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error completing workflow step:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to complete workflow step',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
