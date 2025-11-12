// T013: React Email template for approval reassignment notification
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
interface ApprovalReassignedEmailProps {
  recipientName: string
  approvalTitle: string
  entityType: string
  priority: string
  previousAssigneeName: string
  reassignedBy: string
  reassignReason?: string
  actionUrl: string
  locale?: 'en' | 'fr'
}

export default function ApprovalReassignedEmail({
  recipientName,
  approvalTitle,
  entityType,
  priority,
  previousAssigneeName,
  reassignedBy,
  reassignReason,
  actionUrl,
  locale = 'en',
}: ApprovalReassignedEmailProps) {
  const translations: Record<'en' | 'fr', {
    subject: string
    greeting: string
    intro: string
    reassignedFrom: string
    reassignedBy: string
    reason: string
    detailsHeading: string
    title: string
    type: string
    priority: string
    actionButton: string
    footer: string
  }> = {
    en: {
      subject: 'Approval Request Reassigned to You',
      greeting: `Hi ${recipientName},`,
      intro: `An approval request has been reassigned to you.`,
      reassignedFrom: `Previously assigned to: ${previousAssigneeName}`,
      reassignedBy: `Reassigned by: ${reassignedBy}`,
      reason: 'Reason',
      detailsHeading: 'Request Details',
      title: 'Title',
      type: 'Type',
      priority: 'Priority',
      actionButton: 'Review Request',
      footer: 'This is an automated notification from your workflow system.',
    },
    fr: {
      subject: 'Demande d\'approbation réaffectée à vous',
      greeting: `Bonjour ${recipientName},`,
      intro: `Une demande d'approbation vous a été réaffectée.`,
      reassignedFrom: `Précédemment affecté à : ${previousAssigneeName}`,
      reassignedBy: `Réaffecté par : ${reassignedBy}`,
      reason: 'Raison',
      detailsHeading: 'Détails de la demande',
      title: 'Titre',
      type: 'Type',
      priority: 'Priorité',
      actionButton: 'Examiner la demande',
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
          <Heading style={h1}>↪️ {t.subject}</Heading>
          <Text style={text}>{t.greeting}</Text>
          <Text style={text}>{t.intro}</Text>

          <Section style={infoSection}>
            <Text style={infoText}>{t.reassignedFrom}</Text>
            <Text style={infoText}>{t.reassignedBy}</Text>
            {reassignReason && (
              <Text style={infoText}>
                <strong>{t.reason}:</strong> {reassignReason}
              </Text>
            )}
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
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
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

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
}

const infoSection = {
  backgroundColor: '#e7f5ff',
  padding: '16px 48px',
  margin: '24px 0',
  border: '1px solid #74c0fc',
}

const infoText = {
  color: '#1864ab',
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

const buttonContainer = {
  padding: '27px 48px',
}

const button = {
  backgroundColor: '#228be6',
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
