import type { ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import { prisma } from '~/app/db.server'
import { CURRENCIES, INTERVALS, PLANS, PRICING_PLANS } from '~/app/modules/stripe/plans'
import { stripe } from '~/app/modules/stripe/stripe.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

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
                plan: true,
            },
        })

        if (!dbPrice) {
            console.error(
                `❌ No price found for plan: ${planId}, interval: ${interval}, currency: ${currency}`
            )
            // List available prices for debugging
            const availablePrices = await prisma.price.findMany({
                where: { planId },
                select: { interval: true, currency: true, id: true },
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
            select: { id: true, email: true, stripeCustomerId: true },
        })

        if (!dbUser) {
            return Response.json({ error: 'User not found' }, { status: 404 })
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
                data: { stripeCustomerId },
            })
        }

        // Check if user has existing subscription for upgrade vs new subscription
        const existingSubscription = await prisma.subscription.findUnique({
            where: { userId: user.id },
        })

        let subscription: any
        let isUpgrade = false

        if (existingSubscription && existingSubscription.status === 'active') {
            // This is an upgrade - modify existing subscription with prorating
            isUpgrade = true
            console.log(`🔄 Upgrading existing subscription ${existingSubscription.id}`)

            // Get existing Stripe subscription
            const stripeSubscription = await stripe.subscriptions.retrieve(existingSubscription.id)
            const subscriptionItemId = stripeSubscription.items.data[0].id

            // Update subscription with prorating
            subscription = await stripe.subscriptions.update(existingSubscription.id, {
                items: [
                    {
                        id: subscriptionItemId,
                        price: priceId,
                    },
                ],
                proration_behavior: 'create_prorations', // Enable prorating
                payment_behavior: 'default_incomplete',
                payment_settings: {
                    save_default_payment_method: 'on_subscription',
                    payment_method_types: ['card'],
                },
                expand: ['latest_invoice.payment_intent'],
                metadata: {
                    userId: user.id,
                    planId,
                    interval,
                    type: 'subscription_upgrade',
                },
            })
        } else {
            // Create new subscription with proper Stripe defaults
            console.log(`🆕 Creating new subscription for user ${user.id}`)

            subscription = await stripe.subscriptions.create({
                customer: stripeCustomerId,
                items: [{ price: priceId }],
                payment_behavior: 'default_incomplete',
                payment_settings: {
                    save_default_payment_method: 'on_subscription',
                },
                collection_method: 'charge_automatically',
                expand: ['latest_invoice.payment_intent'],
                metadata: {
                    userId: user.id,
                    planId,
                    interval,
                },
            })
        }

        const invoice = subscription.latest_invoice as any
        const paymentIntent = invoice?.payment_intent
        let clientSecret = paymentIntent?.client_secret

        console.log('🔍 Subscription created:', {
            id: subscription.id,
            status: subscription.status,
            invoice: invoice
                ? {
                    id: invoice.id,
                    status: invoice.status,
                    amount_due: invoice.amount_due,
                    payment_intent: paymentIntent ? paymentIntent.id : 'NO_PAYMENT_INTENT',
                }
                : 'NO_INVOICE',
        })

        // For charge_automatically subscriptions, if no PaymentIntent is created,
        // create a standalone PaymentIntent for immediate payment collection
        if (!clientSecret && invoice && invoice.amount_due > 0) {
            console.log(`💳 Creating standalone PaymentIntent for immediate payment`)

            const paymentIntent = await stripe.paymentIntents.create({
                amount: invoice.amount_due,
                currency: invoice.currency || currency.toLowerCase(),
                customer: stripeCustomerId,
                automatic_payment_methods: { enabled: true },
                metadata: {
                    subscriptionId: subscription.id,
                    userId: user.id,
                    invoiceId: invoice.id,
                    type: 'subscription_payment',
                },
            })

            clientSecret = paymentIntent.client_secret
            console.log(`✅ Created standalone PaymentIntent ${paymentIntent.id} for subscription`)
        }
        if (!clientSecret) {
            console.error('❌ No client secret available for payment')
            await stripe.subscriptions.cancel(subscription.id)
            return Response.json({ error: 'Unable to set up payment for subscription' }, { status: 500 })
        }
        console.log(
            `✅ Created subscription ${subscription.id} with PaymentIntent using price ${dbPrice.id}`
        )

        // Extract subscription period information with proper defaults
        const stripeSubscription = subscription as any
        const currentPeriodStart =
            stripeSubscription.current_period_start || Math.floor(Date.now() / 1000)
        const currentPeriodEnd =
            stripeSubscription.current_period_end ||
            Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
        const trialStart = stripeSubscription.trial_start || 0
        const trialEnd = 0

        console.log('🔍 Subscription periods:', {
            currentPeriodStart,
            currentPeriodEnd,
            trialStart,
            trialEnd: trialEnd,
            note: 'trialEnd set to 0 for paid subscription - user no longer in trial',
        })

        // Store the subscription in database as 'incomplete' initially
        await prisma.subscription.upsert({
            where: { userId: user.id },
            update: {
                id: subscription.id,
                planId,
                priceId: dbPrice.id,
                interval,
                status: 'incomplete',
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
                priceId: dbPrice.id,
                interval,
                status: 'incomplete',
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
            isUpgrade,
        })
    } catch (error) {
        console.error('❌ Subscription creation error:', error)
        return Response.json({ error: 'Failed to create subscription' }, { status: 500 })
    }
}
