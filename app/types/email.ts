// T006: Email template props interfaces

export interface ApprovalRequestEmailProps {
  approvalTitle: string;
  approvalDescription?: string;
  requesterName: string;
  priority: string;
  expiresAt?: string;
  reviewUrl: string;
  locale: 'en' | 'fr';
}

export interface ApprovalReminderEmailProps {
  approvalTitle: string;
  approvalDescription?: string;
  requesterName: string;
  priority: string;
  requestedAt: string;
  elapsedTime: string;
  reviewUrl: string;
  locale: 'en' | 'fr';
}

export interface ApprovalUrgentReminderEmailProps {
  approvalTitle: string;
  approvalDescription?: string;
  requesterName: string;
  priority: string;
  expiresAt: string;
  remainingTime: string;
  reviewUrl: string;
  locale: 'en' | 'fr';
}

export interface ApprovalReassignedEmailProps {
  approvalTitle: string;
  approvalDescription?: string;
  requesterName: string;
  priority: string;
  reason: string;
  reviewUrl: string;
  locale: 'en' | 'fr';
}

export interface ApprovalOrphanedEmailProps {
  approvalTitle: string;
  approvalDescription?: string;
  assignedRole: string;
  workflowName: string;
  requestedAt: string;
  locale: 'en' | 'fr';
}

export interface ApprovalCompletedEmailProps {
  approvalTitle: string;
  decision: 'Approve' | 'Reject' | 'RequestChanges';
  decisionReason?: string;
  reviewedBy: string;
  reviewedAt: string;
  locale: 'en' | 'fr';
}

export interface ApprovalExpiredEmailProps {
  approvalTitle: string;
  requesterName: string;
  expiredAt: string;
  locale: 'en' | 'fr';
}

export interface EmailDigestProps {
  recipientName: string;
  pendingApprovals: Array<{
    id: string;
    title: string;
    requesterName: string;
    priority: string;
    requestedAt: string;
    reviewUrl: string;
  }>;
  locale: 'en' | 'fr';
}
