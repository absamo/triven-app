import { type ActionFunctionArgs } from "react-router"
import { auth } from "~/app/lib/auth"
import { triggerWorkflow } from "~/app/services/workflow.server"

export async function action({ request }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.companyId) {
        throw new Response("Unauthorized", { status: 401 })
    }

    const formData = await request.formData()
    const action = formData.get("action") as string

    try {
        switch (action) {
            case "trigger": {
                const entityType = formData.get("entityType") as string
                const entityId = formData.get("entityId") as string
                const entityData = JSON.parse(formData.get("entityData") as string)
                const metadata = formData.get("metadata") ? JSON.parse(formData.get("metadata") as string) : {}

                if (!entityType || !entityId || !entityData) {
                    throw new Response("Missing required fields", { status: 400 })
                }

                const instances = await triggerWorkflow({
                    entityType,
                    entityId,
                    entityData,
                    triggeredBy: session.user.id,
                    companyId: session.user.companyId,
                    metadata,
                })

                return new Response(JSON.stringify({
                    success: true,
                    instances: instances.length,
                    workflowInstances: instances
                }), {
                    headers: { "Content-Type": "application/json" },
                })
            }

            default:
                throw new Response("Invalid action", { status: 400 })
        }
    } catch (error) {
        console.error("Error in workflow trigger action:", error)
        return new Response(JSON.stringify({
            success: false,
            error: "Failed to trigger workflow"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}