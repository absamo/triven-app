// T016: Approval reminder job - sends reminders for pending approvals

import type { ApprovalRequest, Profile, User } from '@prisma/client'
import { prisma } from '~/app/db.server'
import { sendEmailWithRetry } from '~/app/services/email.server'

const REMINDER_24H_THRESHOLD = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const REMINDER_48H_THRESHOLD = 48 * 60 * 60 * 1000 // 48 hours in milliseconds

/**
 * Process approval reminders - sends 24h and 48h reminder emails
 * This job should run every hour
 */
export async function processApprovalReminders(): Promise<void> {
  console.log('[ApprovalReminders] Starting approval reminders job')

  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - REMINDER_24H_THRESHOLD)
  const fortyEightHoursAgo = new Date(now.getTime() - REMINDER_48H_THRESHOLD)

  try {
    // Find pending approvals that need reminders
    const pendingApprovals = await prisma.approvalRequest.findMany({
      where: {
        status: 'pending',
        requestedAt: {
          lte: twentyFourHoursAgo, // At least 24h old
        },
        // Only send reminders if not expired
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        requestedByUser: {
          include: {
            profile: true,
          },
        },
        assignedToUser: {
          include: {
            profile: true,
          },
        },
        assignedToRole: {
          include: {
            users: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    })

    console.log(`[ApprovalReminders] Found ${pendingApprovals.length} pending approvals`)

    // Group approvals by age for appropriate reminder type
    const reminders24h: typeof pendingApprovals = []
    const reminders48h: typeof pendingApprovals = []

    for (const approval of pendingApprovals) {
      const ageMs = now.getTime() - approval.requestedAt.getTime()

      if (ageMs >= REMINDER_48H_THRESHOLD) {
        reminders48h.push(approval)
      } else if (ageMs >= REMINDER_24H_THRESHOLD) {
        reminders24h.push(approval)
      }
    }

    console.log(
      `[ApprovalReminders] 24h reminders: ${reminders24h.length}, 48h reminders: ${reminders48h.length}`
    )

    // Send 24h reminders
    for (const approval of reminders24h) {
      await sendReminder(approval, '24h')
    }

    // Send 48h urgent reminders
    for (const approval of reminders48h) {
      await sendReminder(approval, '48h')
    }

    console.log('[ApprovalReminders] Approval reminders job completed')
  } catch (error) {
    console.error('[ApprovalReminders] Error processing approval reminders:', error)
    throw error
  }
}

/**
 * Send reminder email to approval assignee(s)
 */
async function sendReminder(
  approval: ApprovalRequest & {
    requestedByUser: User & { profile: Profile | null }
    assignedToUser: (User & { profile: Profile | null }) | null
    assignedToRole: {
      users: Array<User & { profile: Profile | null }>
    } | null
  },
  type: '24h' | '48h'
): Promise<void> {
  // Get recipients (deduplicated)
  const recipients: Array<User & { profile: Profile | null }> = []

  if (approval.assignedToUser) {
    recipients.push(approval.assignedToUser)
  }

  if (approval.assignedToRole) {
    for (const user of approval.assignedToRole.users) {
      if (!recipients.find((r) => r.id === user.id)) {
        recipients.push(user)
      }
    }
  }

  // Send reminder to each recipient based on their preference
  for (const recipient of recipients) {
    const locale = recipient.profile?.locale || 'en'
    const emailPreference = recipient.profile?.emailDeliveryPreference || 'immediate'

    // Skip if emails disabled
    if (emailPreference === 'disabled') {
      console.log(`[ApprovalReminders] Skipping email for ${recipient.email} (disabled)`)
      continue
    }

    // For reminders, always send immediately (don't queue for digest)
    // Reminders are time-sensitive
    const actionUrl = `${process.env.APP_URL}/approvals/${approval.id}`

    try {
      if (type === '24h') {
        await sendEmailWithRetry({
          to: recipient.email,
          approvalId: approval.id,
          approvalTitle: approval.title,
          approvalDescription: approval.description || undefined,
          requesterName: approval.requestedByUser.name || undefined,
          priority: approval.priority,
          expiresAt: approval.expiresAt?.toISOString(),
          reviewUrl: actionUrl,
          type: 'approval_reminder_24h',
          locale: locale as 'en' | 'fr',
          recipientId: recipient.id,
        })
      } else {
        await sendEmailWithRetry({
          to: recipient.email,
          approvalId: approval.id,
          approvalTitle: approval.title,
          approvalDescription: approval.description || undefined,
          requesterName: approval.requestedByUser.name || undefined,
          priority: approval.priority,
          expiresAt: approval.expiresAt?.toISOString(),
          reviewUrl: actionUrl,
          type: 'approval_reminder_48h',
          locale: locale as 'en' | 'fr',
          recipientId: recipient.id,
        })
      }

      console.log(
        `[ApprovalReminders] Sent ${type} reminder to ${recipient.email} for approval ${approval.id}`
      )
    } catch (error) {
      console.error(
        `[ApprovalReminders] Failed to send ${type} reminder to ${recipient.email}:`,
        error
      )
      // Continue with other recipients
    }
  }
}
