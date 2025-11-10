// T010: React Email template for initial approval request notification
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
interface ApprovalRequestEmailProps {
  recipientName: string
  requesterName: string
  approvalTitle: string
  approvalDescription?: string
  entityType: string
  priority: string
  dueDate?: string
  actionUrl: string
  locale?: 'en' | 'fr'
}

export default function ApprovalRequestEmail({
  recipientName,
  requesterName,
  approvalTitle,
  approvalDescription,
  entityType,
  priority,
  dueDate,
  actionUrl,
  locale = 'en',
}: ApprovalRequestEmailProps) {
  const translations: Record<'en' | 'fr', {
    subject: string
    greeting: string
    intro: string
    detailsHeading: string
    title: string
    description: string
    type: string
    priority: string
    dueDate: string
    actionButton: string
    footer: string
  }> = {
    en: {
      subject: 'New Approval Request',
      greeting: `Hi ${recipientName},`,
      intro: `${requesterName} has submitted a new approval request that requires your attention.`,
      detailsHeading: 'Request Details',
      title: 'Title',
      description: 'Description',
      type: 'Type',
      priority: 'Priority',
      dueDate: 'Due Date',
      actionButton: 'Review Request',
      footer: 'This is an automated notification from your workflow system.',
    },
    fr: {
      subject: 'Nouvelle demande d\'approbation',
      greeting: `Bonjour ${recipientName},`,
      intro: `${requesterName} a soumis une nouvelle demande d'approbation qui nécessite votre attention.`,
      detailsHeading: 'Détails de la demande',
      title: 'Titre',
      description: 'Description',
      type: 'Type',
      priority: 'Priorité',
      dueDate: 'Date d\'échéance',
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
          <Heading style={h1}>{t.subject}</Heading>
          <Text style={text}>{t.greeting}</Text>
          <Text style={text}>{t.intro}</Text>

          <Section style={detailsSection}>
            <Heading as="h2" style={h2}>
              {t.detailsHeading}
            </Heading>
            <Text style={detailText}>
              <strong>{t.title}:</strong> {approvalTitle}
            </Text>
            {approvalDescription && (
              <Text style={detailText}>
                <strong>{t.description}:</strong> {approvalDescription}
              </Text>
            )}
            <Text style={detailText}>
              <strong>{t.type}:</strong> {entityType}
            </Text>
            <Text style={detailText}>
              <strong>{t.priority}:</strong>{' '}
              <span style={getPriorityStyle(priority)}>{priority}</span>
            </Text>
            {dueDate && (
              <Text style={detailText}>
                <strong>{t.dueDate}:</strong> {new Date(dueDate).toLocaleString(locale)}
              </Text>
            )}
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
