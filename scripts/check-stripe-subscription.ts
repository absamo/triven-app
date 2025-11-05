import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const db = new PrismaClient()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

async function checkSubscriptionStatus() {
  try {
    // Get all subscriptions from database
    const subscriptions = await db.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    console.log(`\n📊 Found ${subscriptions.length} subscription(s) in database\n`)

    for (const sub of subscriptions) {
      console.log(`\n${'='.repeat(80)}`)
      console.log(`User: ${sub.user.name} (${sub.user.email})`)
      console.log(`Database Subscription ID: ${sub.id}`)
      console.log(`Database Status: ${sub.status}`)
      console.log(`Database Plan: ${sub.planId}`)
      console.log(`Database Interval: ${sub.interval}`)
      console.log(`Cancel at Period End: ${sub.cancelAtPeriodEnd}`)
      console.log(`Cancelled At: ${sub.cancelledAt || 'N/A'}`)
      console.log(`Cancelled By: ${sub.cancelledBy || 'N/A'}`)
      console.log(`Cancellation Reason: ${sub.cancellationReason || 'N/A'}`)

      try {
        // Fetch from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(sub.id)

        console.log(`\n🔹 Stripe Status: ${stripeSubscription.status}`)
        console.log(`🔹 Stripe Plan: ${stripeSubscription.items.data[0]?.price?.id || 'N/A'}`)
        console.log(`🔹 Stripe Cancel at Period End: ${stripeSubscription.cancel_at_period_end}`)
        console.log(
          `🔹 Stripe Cancelled At: ${stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000).toISOString() : 'N/A'}`
        )
        const periodEnd = (stripeSubscription as any).current_period_end
        console.log(
          `🔹 Stripe Current Period End: ${periodEnd ? new Date(periodEnd * 1000).toISOString() : 'N/A'}`
        )

        // Check for mismatch
        if (sub.status !== stripeSubscription.status) {
          console.log(`\n⚠️  MISMATCH DETECTED!`)
          console.log(`   Database says: ${sub.status}`)
          console.log(`   Stripe says: ${stripeSubscription.status}`)
          console.log(`\n   Would you like to sync? (Update database to match Stripe)`)
        } else {
          console.log(`\n✅ Status matches between database and Stripe`)
        }
      } catch (error) {
        if (error instanceof Stripe.errors.StripeError) {
          console.log(`\n❌ Error fetching from Stripe: ${error.message}`)
          console.log(`   This subscription may not exist in Stripe anymore`)
        } else {
          console.log(`\n❌ Unexpected error: ${error}`)
        }
      }
    }

    console.log(`\n${'='.repeat(80)}\n`)
  } catch (error) {
    console.error('Error checking subscriptions:', error)
    process.exit(1)
  }
}

checkSubscriptionStatus()
  .then(() => {
    console.log('\n✅ Check complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
