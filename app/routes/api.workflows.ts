import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router"
import {
    APPROVAL_ASSIGNEE_TYPES,
    WORKFLOW_STEP_TYPES,
    WORKFLOW_TRIGGER_TYPES
} from "~/app/common/constants"
import { auth } from "~/app/lib/auth"
import {
    createWorkflowTemplate,
    getWorkflowInstances,
    getWorkflowTemplates,
    updateWorkflowTemplate
} from "~/app/services/workflow.server"

export async function loader({ request }: LoaderFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.companyId) {
        throw new Response("Unauthorized", { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get("action")

    if (action === "instances") {
        const status = url.searchParams.get("status")
        const entityType = url.searchParams.get("entityType")
        const entityId = url.searchParams.get("entityId")

        const filters = {
            ...(status && { status }),
            ...(entityType && { entityType }),
            ...(entityId && { entityId }),
        }

        const workflowInstances = await getWorkflowInstances(session.user.companyId, filters)

        return new Response(JSON.stringify({ workflowInstances }), {
            headers: { "Content-Type": "application/json" }
        })
    }

    // Default: get workflow templates
    const isActive = url.searchParams.get("isActive") !== "false"
    const workflowTemplates = await getWorkflowTemplates(session.user.companyId, isActive)

    return new Response(JSON.stringify({ workflowTemplates }), {
        headers: { "Content-Type": "application/json" }
    })
}

export async function action({ request }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id || !session?.user?.companyId) {
        throw new Response("Unauthorized", { status: 401 })
    }

    const formData = await request.formData()
    const action = formData.get("action")

    switch (action) {
        case "create": {
            const name = formData.get("name") as string
            const description = formData.get("description") as string
            const triggerType = formData.get("triggerType") as string
            const triggerConditionsStr = formData.get("triggerConditions") as string
            const stepsStr = formData.get("steps") as string

            if (!name || !triggerType || !stepsStr) {
                throw new Response("Missing required fields", { status: 400 })
            }

            if (!Object.values(WORKFLOW_TRIGGER_TYPES).includes(triggerType as any)) {
                throw new Response("Invalid trigger type", { status: 400 })
            }

            let triggerConditions: Record<string, any> | undefined
            let steps: any[]

            try {
                if (triggerConditionsStr) {
                    triggerConditions = JSON.parse(triggerConditionsStr)
                }
                steps = JSON.parse(stepsStr)
            } catch (error) {
                throw new Response("Invalid JSON in conditions or steps", { status: 400 })
            }

            // Validate steps
            for (const step of steps) {
                if (!step.stepNumber || !step.name || !step.stepType || !step.assigneeType) {
                    throw new Response("Invalid step configuration", { status: 400 })
                }

                if (!Object.values(WORKFLOW_STEP_TYPES).includes(step.stepType)) {
                    throw new Response("Invalid step type", { status: 400 })
                }

                if (!Object.values(APPROVAL_ASSIGNEE_TYPES).includes(step.assigneeType)) {
                    throw new Response("Invalid assignee type", { status: 400 })
                }
            }

            const workflowTemplate = await createWorkflowTemplate({
                name,
                description: description || undefined,
                triggerType,
                triggerConditions,
                companyId: session.user.companyId,
                createdById: session.user.id,
                steps,
            })

            return new Response(JSON.stringify({ success: true, workflowTemplate }), {
                headers: { "Content-Type": "application/json" }
            })
        }

        case "update": {
            const id = formData.get("id") as string
            const name = formData.get("name") as string
            const description = formData.get("description") as string
            const triggerConditionsStr = formData.get("triggerConditions") as string
            const isActive = formData.get("isActive") === "true"

            if (!id) {
                throw new Response("Missing workflow template ID", { status: 400 })
            }

            let triggerConditions: Record<string, any> | undefined

            try {
                if (triggerConditionsStr) {
                    triggerConditions = JSON.parse(triggerConditionsStr)
                }
            } catch (error) {
                throw new Response("Invalid JSON in trigger conditions", { status: 400 })
            }

            const updateData: any = {}
            if (name) updateData.name = name
            if (description !== undefined) updateData.description = description
            if (triggerConditions !== undefined) updateData.triggerConditions = triggerConditions
            if (isActive !== undefined) updateData.isActive = isActive

            const workflowTemplate = await updateWorkflowTemplate(id, updateData)

            return new Response(JSON.stringify({ success: true, workflowTemplate }), {
                headers: { "Content-Type": "application/json" }
            })
        }

        default:
            throw new Response("Invalid action", { status: 400 })
    }
}