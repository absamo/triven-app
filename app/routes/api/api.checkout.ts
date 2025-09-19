import type { ActionFunctionArgs } from "react-router"
import { z } from "zod"
import { CURRENCIES, INTERVALS, PLANS } from "~/app/modules/stripe/plans"
import { createSubscriptionCheckout } from "~/app/modules/stripe/queries.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"

const checkoutSchema = z.object({
    planId: z.enum([PLANS.STANDARD, PLANS.PROFESSIONAL, PLANS.PREMIUM]),
    interval: z.enum([INTERVALS.MONTHLY, INTERVALS.YEARLY]),
    currency: z.enum([CURRENCIES.USD, CURRENCIES.EUR]),
    trialDays: z.number().min(0).max(30).optional().default(14), // 14-day trial by default
})

export async function action({ request }: ActionFunctionArgs) {
    const user = await requireBetterAuthUser(request)

    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        })
    }

    try {
        const formData = await request.formData()
        const data = {
            planId: formData.get("planId"),
            interval: formData.get("interval"),
            currency: formData.get("currency"),
            trialDays: formData.get("trialDays") ? Number(formData.get("trialDays")) : 14,
        }

        const validatedData = checkoutSchema.parse(data)

        const checkoutUrl = await createSubscriptionCheckout({
            userId: user.id,
            planId: validatedData.planId,
            planInterval: validatedData.interval,
            currency: validatedData.currency,
            trialDays: validatedData.trialDays,
        })

        return new Response(JSON.stringify({ checkoutUrl }), {
            headers: { "Content-Type": "application/json" }
        })
    } catch (error) {
        console.error("Checkout error:", error)

        if (error instanceof z.ZodError) {
            return new Response(
                JSON.stringify({ error: "Invalid request data", details: error.issues }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            )
        }

        return new Response(
            JSON.stringify({ error: "Failed to create checkout session" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        )
    }
}