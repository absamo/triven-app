#!/usr/bin/env bun
/**
 * Cleanup script to remove duplicate active subscriptions
 * Run with: bun run scripts/cleanup-duplicate-subscriptions.ts
 */

import { prisma } from '../app/db.server'
import { stripe } from '../app/modules/stripe/stripe.server'

async function cleanupDuplicateSubscriptions() {
  console.log('🔍 Checking for users with duplicate subscriptions...\n')

  // Get all users with Stripe customer IDs
  const users = await prisma.user.findMany({
    where: {
      stripeCustomerId: {
        not: null,
      },
    },
    select: {
      id: true,
      email: true,
      stripeCustomerId: true,
    },
  })

  console.log(`Found ${users.length} users with Stripe customers\n`)

  let totalDuplicatesFound = 0
  let totalCanceled = 0

  for (const user of users) {
    if (!user.stripeCustomerId) continue

    try {
      // Get all subscriptions for this customer from Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'all',
        limit: 100,
      })

      const activeSubscriptions = subscriptions.data.filter(
        (sub) => sub.status === 'active' || sub.status === 'trialing'
      )

      if (activeSubscriptions.length > 1) {
        console.log(`⚠️  User: ${user.email} (${user.id})`)
        console.log(`   Found ${activeSubscriptions.length} active subscriptions:`)

        totalDuplicatesFound++

        // Sort by creation date - keep the newest one
        const sortedSubs = activeSubscriptions.sort((a, b) => b.created - a.created)
        const keepSubscription = sortedSubs[0]
        const cancelSubscriptions = sortedSubs.slice(1)

        console.log(
          `   ✅ Keeping: ${keepSubscription.id} (created: ${new Date(keepSubscription.created * 1000).toISOString()})`
        )

        // Cancel older subscriptions
        for (const sub of cancelSubscriptions) {
          console.log(
            `   ❌ Canceling: ${sub.id} (created: ${new Date(sub.created * 1000).toISOString()})`
          )
          try {
            await stripe.subscriptions.cancel(sub.id)
            totalCanceled++
            console.log(`   ✅ Canceled successfully`)
          } catch (error) {
            console.error(`   ⚠️  Failed to cancel: ${error}`)
          }
        }

        // Update database to point to the kept subscription
        const dbSub = await prisma.subscription.findUnique({
          where: { userId: user.id },
        })

        if (dbSub && dbSub.id !== keepSubscription.id) {
          console.log(
            `   🔄 Updating database subscription ID from ${dbSub.id} to ${keepSubscription.id}`
          )
          await prisma.subscription.update({
            where: { userId: user.id },
            data: { id: keepSubscription.id },
          })
        }

        console.log('')
      }
    } catch (error) {
      console.error(`❌ Error processing user ${user.email}:`, error)
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   Users checked: ${users.length}`)
  console.log(`   Users with duplicates: ${totalDuplicatesFound}`)
  console.log(`   Subscriptions canceled: ${totalCanceled}`)
  console.log('\n✅ Cleanup complete!')
}

// Run the cleanup
cleanupDuplicateSubscriptions()
  .catch((error) => {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
