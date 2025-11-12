// T014: React Email template for orphaned approval notification
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
interface ApprovalOrphanedEmailProps {
  recipientName: string
  approvalTitle: string
  entityType: string
  priority: string
  originalAssigneeName: string
  orphanedReason: string
  actionUrl: string
  locale?: 'en' | 'fr'
}

export default function ApprovalOrphanedEmail({
  recipientName,
  approvalTitle,
  entityType,
  priority,
  originalAssigneeName,
  orphanedReason,
  actionUrl,
  locale = 'en',
}: ApprovalOrphanedEmailProps) {
  const translations: Record<'en' | 'fr', {
    subject: string
    greeting: string
    intro: string
    originalAssignee: string
    reason: string
    detailsHeading: string
    title: string
    type: string
    priority: string
    actionRequired: string
    actionDescription: string
    actionButton: string
    footer: string
  }> = {
    en: {
      subject: 'Orphaned Approval Request Needs Reassignment',
      greeting: `Hi ${recipientName},`,
      intro: `An approval request has been orphaned and requires immediate reassignment.`,
      originalAssignee: `Originally assigned to: ${originalAssigneeName}`,
      reason: 'Reason',
      detailsHeading: 'Request Details',
      title: 'Title',
      type: 'Type',
      priority: 'Priority',
      actionRequired: 'Action Required',
      actionDescription: 'Please reassign this request to an appropriate user to avoid workflow delays.',
      actionButton: 'Reassign Request',
      footer: 'This is an automated notification from your workflow system.',
    },
    fr: {
      subject: 'Demande d\'approbation orpheline nécessite une réaffectation',
      greeting: `Bonjour ${recipientName},`,
      intro: `Une demande d'approbation a été orpheline et nécessite une réaffectation immédiate.`,
      originalAssignee: `Initialement affecté à : ${originalAssigneeName}`,
      reason: 'Raison',
      detailsHeading: 'Détails de la demande',
      title: 'Titre',
      type: 'Type',
      priority: 'Priorité',
      actionRequired: 'Action requise',
      actionDescription: 'Veuillez réaffecter cette demande à un utilisateur approprié pour éviter les retards de flux de travail.',
      actionButton: 'Réaffecter la demande',
      footer: 'Ceci est une notification automatique de votre système de flux de travail.',
    },
  }

  const t = translations[locale as 'en' | 'fr']

  return (
    <Html>
      <Head />
      <Preview>{t.subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>⚠️ {t.subject}</Heading>
          <Text style={text}>{t.greeting}</Text>
          <Text style={warningText}>{t.intro}</Text>

          <Section style={warningSection}>
            <Text style={warningDetailText}>{t.originalAssignee}</Text>
            <Text style={warningDetailText}>
              <strong>{t.reason}:</strong> {orphanedReason}
            </Text>
          </Section>

          <Section style={detailsSection}>
            <Heading as="h2" style={h2}>
              {t.detailsHeading}
            </Heading>
            <Text style={detailText}>
              <strong>{t.title}:</strong> {approvalTitle}
            </Text>
            <Text style={detailText}>
              <strong>{t.type}:</strong> {entityType}
            </Text>
            <Text style={detailText}>
              <strong>{t.priority}:</strong>{' '}
              <span style={getPriorityStyle(priority)}>{priority}</span>
            </Text>
          </Section>

          <Section style={actionSection}>
            <Heading as="h3" style={h3}>
              {t.actionRequired}
            </Heading>
            <Text style={actionText}>{t.actionDescription}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={actionUrl}>
              {t.actionButton}
            </Button>
          </Section>

          <Text style={footer}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#fff9db',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  border: '2px solid #fab005',
}

const h1 = {
  color: '#f08c00',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 48px',
}

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '24px 0 16px',
}

const h3 = {
  color: '#d9480f',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '16px 0 8px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
}

const warningText = {
  color: '#f08c00',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
  fontWeight: 'bold',
}

const warningSection = {
  backgroundColor: '#fff3bf',
  padding: '16px 48px',
  margin: '24px 0',
  border: '2px solid #ffe066',
}

const warningDetailText = {
  color: '#862e9c',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
}

const detailsSection = {
  backgroundColor: '#f8f9fa',
  padding: '24px 48px',
  margin: '24px 0',
}

const detailText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
}

const actionSection = {
  backgroundColor: '#ffe8cc',
  padding: '16px 48px',
  margin: '24px 0',
  border: '1px solid #ffd8a8',
}

const actionText = {
  color: '#495057',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
}

const buttonContainer = {
  padding: '27px 48px',
}

const button = {
  backgroundColor: '#fd7e14',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 48px',
  marginTop: '32px',
}

function getPriorityStyle(priority: string) {
  const colors: Record<string, string> = {
    Low: '#51cf66',
    Medium: '#ffd43b',
    High: '#ff8787',
    Critical: '#ff6b6b',
    Urgent: '#e03131',
  }
  return {
    color: colors[priority] || '#333',
    fontWeight: 'bold' as const,
  }
}
