// T017: Email digest job - processes queued digest emails and sends daily summaries
// import { render } from '@react-email/render'
import type { Profile, User } from '@prisma/client'
import { prisma } from '~/app/db.server'
import { sendEmailWithRetry } from '~/app/services/email.server'
// import ApprovalDigestEmail from '~/emails/approval-digest'

/**
 * Process email digests - sends daily digest emails to users with digest preference
 * This job should run daily at configured digest times (default: 09:00 local time)
 */
export async function processEmailDigests(): Promise<void> {
  console.log('[EmailDigest] Starting email digest job')

  const now = new Date()
  const currentHour = now.getHours()

  try {
    // Find all users with digest preference
    const usersWithDigest = await prisma.user.findMany({
      where: {
        profile: {
          emailDeliveryPreference: 'daily_digest',
        },
      },
      include: {
        profile: true,
      },
    })

    console.log(`[EmailDigest] Found ${usersWithDigest.length} users with digest preference`)

    for (const user of usersWithDigest) {
      // Check if it's time to send this user's digest
      const digestHour = user.profile?.digestTime
        ? Number.parseInt(user.profile.digestTime.split(':')[0])
        : 9 // Default 09:00

      if (currentHour !== digestHour) {
        console.log(
          `[EmailDigest] Skipping ${user.email} - not their digest time (${digestHour}:00)`
        )
        continue
      }

      await sendUserDigest(user)
    }

    console.log('[EmailDigest] Email digest job completed')
  } catch (error) {
    console.error('[EmailDigest] Error processing email digests:', error)
    throw error
  }
}

/**
 * Send daily digest email to a user
 */
async function sendUserDigest(user: User & { profile: Profile | null }): Promise<void> {
  const locale = (user.profile?.locale || 'en') as 'en' | 'fr'

  try {
    // Find all pending approvals assigned to this user
    const userApprovals = await prisma.approvalRequest.findMany({
      where: {
        status: 'pending',
        AND: [
          {
            OR: [
              { assignedTo: user.id },
              {
                assignedToRole: {
                  users: {
                    some: {
                      id: user.id,
                    },
                  },
                },
              },
            ],
          },
          {
            // Only include non-expired approvals
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        ],
      },
      include: {
        requestedByUser: true,
      },
      orderBy: [
        { priority: 'desc' }, // Critical first
        { requestedAt: 'asc' }, // Oldest first
      ],
    })

    if (userApprovals.length === 0) {
      console.log(`[EmailDigest] No pending approvals for ${user.email}`)
      return
    }

    console.log(
      `[EmailDigest] Sending digest to ${user.email} with ${userApprovals.length} pending approvals`
    )

    // Build digest HTML using React Email (commented out until email template is ready)
    // const html = render(
    //   ApprovalDigestEmail({
    //     recipientName: user.name || user.email.split('@')[0],
    //     approvals: userApprovals.map((approval) => ({
    //       id: approval.id,
    //       title: approval.title,
    //       entityType: approval.entityType,
    //       requesterName: approval.requestedByUser.name || approval.requestedByUser.email,
    //       priority: approval.priority,
    //       createdAt: approval.requestedAt.toISOString(),
    //     })),
    //     locale,
    //   })
    // )

    // For digest emails, we need to send the first approval's data or create a summary
    const firstApproval = userApprovals[0]
    await sendEmailWithRetry({
      to: user.email,
      approvalId: firstApproval.id,
      approvalTitle: `Daily Digest: ${userApprovals.length} Pending Approval(s)`,
      approvalDescription: `You have ${userApprovals.length} pending approval requests requiring your attention.`,
      reviewUrl: `${process.env.APP_URL}/approvals`,
      type: 'initial_approval',
      locale: locale as 'en' | 'fr',
      recipientId: user.id,
    })

    console.log(`[EmailDigest] Sent digest to ${user.email}`)
  } catch (error) {
    console.error(`[EmailDigest] Failed to send digest to ${user.email}:`, error)
    // Continue with other users
  }
}
