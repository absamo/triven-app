import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const db = new PrismaClient()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

async function syncSubscriptionFromStripe() {
  try {
    // Get the subscription from database
    const dbSubscription = await db.subscription.findFirst({
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

    if (!dbSubscription) {
      console.log('❌ No subscription found in database')
      return
    }

    console.log(`\n${'='.repeat(80)}`)
    console.log(`📊 Database Subscription Info`)
    console.log(`${'='.repeat(80)}`)
    console.log(`User: ${dbSubscription.user.name} (${dbSubscription.user.email})`)
    console.log(`Subscription ID: ${dbSubscription.id}`)
    console.log(`Status: ${dbSubscription.status}`)
    console.log(`Plan: ${dbSubscription.planId}`)
    console.log(`Interval: ${dbSubscription.interval}`)
    console.log(`Cancel at Period End: ${dbSubscription.cancelAtPeriodEnd}`)
    console.log(`Cancelled At: ${dbSubscription.cancelledAt?.toISOString() || 'N/A'}`)
    console.log(`Cancelled By: ${dbSubscription.cancelledBy || 'N/A'}`)

    console.log(`\n${'='.repeat(80)}`)
    console.log(`📡 Fetching from Stripe...`)
    console.log(`${'='.repeat(80)}`)

    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(dbSubscription.id)

      console.log(`Status: ${stripeSubscription.status}`)
      console.log(`Cancel at Period End: ${stripeSubscription.cancel_at_period_end}`)
      console.log(
        `Cancelled At: ${stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000).toISOString() : 'N/A'}`
      )
      console.log(
        `Current Period End: ${new Date((stripeSubscription as any).current_period_end * 1000).toISOString()}`
      )

      // Check for mismatch
      if (dbSubscription.status !== stripeSubscription.status) {
        console.log(`\n⚠️  STATUS MISMATCH DETECTED!`)
        console.log(`   Database: ${dbSubscription.status}`)
        console.log(`   Stripe: ${stripeSubscription.status}`)

        console.log(`\n🔄 Updating database to match Stripe...`)

        await db.subscription.update({
          where: { id: dbSubscription.id },
          data: {
            status: stripeSubscription.status,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            currentPeriodEnd: (stripeSubscription as any).current_period_end,
            updatedAt: new Date(),
          },
        })

        console.log(`✅ Database updated successfully!`)
        console.log(`   New status: ${stripeSubscription.status}`)
      } else {
        console.log(`\n✅ Status matches between database and Stripe`)
      }
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        console.log(`\n❌ Stripe Error: ${error.message}`)
        if (error.code === 'resource_missing') {
          console.log(`   This subscription doesn't exist in Stripe`)
          console.log(`   The subscription may have been deleted from Stripe dashboard`)
        }
      } else {
        throw error
      }
    }

    console.log(`\n${'='.repeat(80)}\n`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

syncSubscriptionFromStripe()
  .then(() => {
    console.log('✅ Sync complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
