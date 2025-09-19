import type { ActionFunctionArgs } from "react-router"
import { z } from "zod"
import { prisma } from "~/app/db.server"
import { CURRENCIES, INTERVALS, PLANS } from "~/app/modules/stripe/plans"
import { createCustomer, createSubscriptionCheckout } from "~/app/modules/stripe/queries.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"

const subscriptionSchema = z.object({
    planId: z.enum([PLANS.STANDARD, PLANS.PROFESSIONAL, PLANS.PREMIUM]),
    interval: z.enum([INTERVALS.MONTHLY, INTERVALS.YEARLY]),
    currency: z.enum([CURRENCIES.USD, CURRENCIES.EUR]),
    trialDays: z.number().min(0).max(30).optional().default(14),
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
        const body = await request.json()
        const validatedData = subscriptionSchema.parse(body)

        // First, ensure the user has a Stripe customer ID
        // Note: You'll need to check the user record in the database for stripeCustomerId
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
        })

        if (!dbUser) {
            return new Response(JSON.stringify({ error: "User not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            })
        }

        if (!dbUser.stripeCustomerId) {
            const profile = {
                firstName: user.email.split('@')[0], // Use email username as firstName fallback
                lastName: '', // Empty lastName as fallback
            }

            await createCustomer({
                userId: user.id,
                profile,
                email: user.email,
            })
        }

        // Create the checkout session with trial
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
        console.error("Subscription creation error:", error)

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
            JSON.stringify({ error: "Failed to create subscription" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        )
    }
}