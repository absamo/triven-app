import type { ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import { prisma } from '~/app/db.server'
import { stripe } from '~/app/modules/stripe/stripe.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

const updatePaymentMethodSchema = z.object({
  subscriptionId: z.string(),
  paymentMethodId: z.string(),
})

/**
 * Updates the payment method for a subscription
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const user = await requireBetterAuthUser(request)
    const body = await request.json()
    const { subscriptionId, paymentMethodId } = updatePaymentMethodSchema.parse(body)

    // Verify that the subscription belongs to the authenticated user
    const dbSubscription = await prisma.subscription.findUnique({
      where: { 
        id: subscriptionId,
        userId: user.id,
      },
    })

    if (!dbSubscription) {
      return Response.json(
        { error: 'Subscription not found or access denied' },
        { status: 404 }
      )
    }

    // Get the user's Stripe customer ID
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    })

    if (!dbUser?.stripeCustomerId) {
      return Response.json(
        { error: 'No Stripe customer found' },
        { status: 400 }
      )
    }

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: dbUser.stripeCustomerId,
    })

    // Update the subscription's default payment method
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      default_payment_method: paymentMethodId,
    })

    console.log(`✅ Updated payment method for subscription ${subscriptionId}`)

    // Get the updated payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    
    let paymentMethodDetails = null
    if (paymentMethod.type === 'card' && paymentMethod.card) {
      paymentMethodDetails = {
        paymentMethodId: paymentMethod.id,
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
      }
    }

    // Update the database with new payment method details
    const updatedDbSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        paymentMethodId: paymentMethodDetails?.paymentMethodId,
        last4: paymentMethodDetails?.last4,
        brand: paymentMethodDetails?.brand,
        expMonth: paymentMethodDetails?.expMonth,
        expYear: paymentMethodDetails?.expYear,
      },
    })

    console.log(`✅ Database updated with new payment method details`)

    return Response.json({
      success: true,
      subscription: {
        id: updatedDbSubscription.id,
        paymentMethod: paymentMethodDetails,
      },
      message: 'Payment method updated successfully',
    })
  } catch (error) {
    console.error('❌ Payment method update error:', error)
    
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    // Handle Stripe-specific errors
    if (error && typeof error === 'object' && 'type' in error) {
      switch (error.type) {
        case 'StripeCardError':
          return Response.json(
            { error: 'Your card was declined. Please try a different payment method.' },
            { status: 400 }
          )
        case 'StripeInvalidRequestError':
          return Response.json(
            { error: 'Invalid payment method. Please try again.' },
            { status: 400 }
          )
        default:
          break
      }
    }

    return Response.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    )
  }
}