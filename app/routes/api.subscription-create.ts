import type { ActionFunctionArgs } from "react-router"
import { z } from "zod"
import { prisma } from "~/app/db.server"
import { CURRENCIES, INTERVALS, PLANS, PRICING_PLANS } from "~/app/modules/stripe/plans"
import { stripe } from "~/app/modules/stripe/stripe.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"

const subscriptionSchema = z.object({
    planId: z.enum([PLANS.STANDARD, PLANS.PROFESSIONAL, PLANS.PREMIUM]),
    interval: z.enum([INTERVALS.MONTHLY, INTERVALS.YEARLY]),
    currency: z.enum([CURRENCIES.USD, CURRENCIES.EUR]),
})

/**
 * Creates a proper Stripe subscription with payment intent
 * This replaces the old payment-intent endpoint for subscription creation
 */
export async function action({ request }: ActionFunctionArgs) {
    try {
        const user = await requireBetterAuthUser(request)
        const body = await request.json()
        const { planId, interval, currency } = subscriptionSchema.parse(body)

        // Get plan details from database (uses actual Stripe price IDs created during seed)
        const dbPrice = await prisma.price.findFirst({
            where: {
                planId,
                interval,
                currency: currency.toUpperCase(), // Database stores currency in uppercase
            },
            include: {
                plan: true
            }
        })

        if (!dbPrice) {
            console.error(`❌ No price found for plan: ${planId}, interval: ${interval}, currency: ${currency}`)
            // List available prices for debugging
            const availablePrices = await prisma.price.findMany({
                where: { planId },
                select: { interval: true, currency: true, id: true }
            })
            console.error(`Available prices for ${planId}:`, availablePrices)
            return Response.json(
                { error: `No price configuration found for ${planId} plan` },
                { status: 400 }
            )
        }

        const amount = dbPrice.amount
        const priceId = dbPrice.id // This is the actual Stripe price ID
        const plan = PRICING_PLANS[planId] // For display name and description

        // Get user with Stripe customer ID
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, email: true, stripeCustomerId: true }
        })

        if (!dbUser) {
            return Response.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        // Create or get Stripe customer with validation
        let stripeCustomerId = dbUser.stripeCustomerId

        // Validate that the customer exists in Stripe if we have a stored ID
        if (stripeCustomerId) {
            try {
                await stripe.customers.retrieve(stripeCustomerId)
                console.log(`✅ Using existing Stripe customer: ${stripeCustomerId}`)
            } catch (error) {
                console.log(`⚠️ Stored customer ${stripeCustomerId} not found in Stripe, creating new one`)
                stripeCustomerId = null // Force creation of new customer
            }
        }

        // Create new customer if needed
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: dbUser.email,
                metadata: {
                    userId: dbUser.id,
                },
            })
            stripeCustomerId = customer.id
            console.log(`✅ Created new Stripe customer: ${stripeCustomerId}`)

            // Update user with new Stripe customer ID
            await prisma.user.update({
                where: { id: dbUser.id },
                data: { stripeCustomerId }
            })
        }

        // Step 1: Create the subscription in Stripe  
        // Use 'default_incomplete' to create subscription with invoice that requires payment
        const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{
                price: priceId,
            }],
            payment_behavior: 'default_incomplete',
            payment_settings: {
                save_default_payment_method: 'on_subscription',
                payment_method_types: ['card'],
            },
            expand: ['latest_invoice.confirmation_secret'],
            metadata: {
                userId: user.id,
                planId,
                interval,
                type: 'subscription_creation'
            },
        })

        const invoice = subscription.latest_invoice as any
        const clientSecret = invoice?.confirmation_secret?.client_secret

        console.log('🔍 Subscription created:', {
            id: subscription.id,
            status: subscription.status,
            invoice: invoice ? {
                id: invoice.id,
                status: invoice.status,
                has_confirmation_secret: !!invoice.confirmation_secret,
                client_secret: clientSecret ? 'Present' : 'Missing'
            } : 'NO_INVOICE'
        })

        if (!clientSecret) {
            console.error('❌ No client secret found for subscription:', subscription.id)
            console.error('❌ Invoice details:', {
                id: invoice?.id || 'NO_ID',
                status: invoice?.status || 'NO_STATUS',
                confirmation_secret: invoice?.confirmation_secret || 'NO_SECRET'
            })
            // Clean up the incomplete subscription
            await stripe.subscriptions.cancel(subscription.id)
            return Response.json(
                { error: "Failed to create payment setup for subscription" },
                { status: 500 }
            )
        }

        console.log(`✅ Created subscription ${subscription.id} with client secret using price ${dbPrice.id}`)

        // Extract subscription period information with proper defaults
        // Cast to any to access Stripe properties since TypeScript definitions might not match exactly
        const stripeSubscription = subscription as any
        const currentPeriodStart = stripeSubscription.current_period_start || Math.floor(Date.now() / 1000)
        const currentPeriodEnd = stripeSubscription.current_period_end || Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000) // 30 days from now
        const trialStart = stripeSubscription.trial_start || 0
        // For paid subscriptions, set trialEnd to 0 to indicate no longer in trial
        const trialEnd = 0 // This removes trial status when upgrading to paid subscription

        console.log('🔍 Subscription periods:', {
            currentPeriodStart,
            currentPeriodEnd,
            trialStart,
            trialEnd: trialEnd,
            note: 'trialEnd set to 0 for paid subscription - user no longer in trial'
        })

        // Step 2: Store the subscription in database as 'incomplete' initially
        // The webhook will update it to 'active' when payment succeeds
        await prisma.subscription.upsert({
            where: { userId: user.id },
            update: {
                id: subscription.id,
                planId,
                priceId: dbPrice.id, // Use actual Stripe price ID from database
                interval,
                status: 'incomplete', // Will be updated by webhook when payment succeeds
                currentPeriodStart,
                currentPeriodEnd,
                cancelAtPeriodEnd: false,
                trialStart,
                trialEnd,
            },
            create: {
                id: subscription.id,
                userId: user.id,
                planId,
                priceId: dbPrice.id, // Use actual Stripe price ID from database
                interval,
                status: 'incomplete', // Will be updated by webhook when payment succeeds
                currentPeriodStart,
                currentPeriodEnd,
                cancelAtPeriodEnd: false,
                trialStart,
                trialEnd,
            },
        })

        return Response.json({
            subscriptionId: subscription.id,
            clientSecret: clientSecret,
            amount,
            currency: dbPrice.currency.toUpperCase(),
            planName: plan.name,
        })

    } catch (error) {
        console.error('❌ Subscription creation error:', error)
        return Response.json(
            { error: "Failed to create subscription" },
            { status: 500 }
        )
    }
}