// T011: React Email template for standard 24-hour reminder
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
interface ApprovalReminderEmailProps {
  recipientName: string
  approvalTitle: string
  entityType: string
  priority: string
  dueDate?: string
  hoursSinceCreated: number
  actionUrl: string
  locale?: 'en' | 'fr'
}

export default function ApprovalReminderEmail({
  recipientName,
  approvalTitle,
  entityType,
  priority,
  dueDate,
  hoursSinceCreated,
  actionUrl,
  locale = 'en',
}: ApprovalReminderEmailProps) {
  const translations: Record<'en' | 'fr', {
    subject: string
    greeting: string
    intro: string
    timePending: string
    detailsHeading: string
    title: string
    type: string
    priority: string
    dueDate: string
    actionButton: string
    footer: string
  }> = {
    en: {
      subject: 'Reminder: Pending Approval Request',
      greeting: `Hi ${recipientName},`,
      intro: `This is a reminder that you have a pending approval request that needs your attention.`,
      timePending: `This request has been pending for ${hoursSinceCreated} hours.`,
      detailsHeading: 'Request Details',
      title: 'Title',
      type: 'Type',
      priority: 'Priority',
      dueDate: 'Due Date',
      actionButton: 'Review Now',
      footer: 'This is an automated reminder from your workflow system.',
    },
    fr: {
      subject: 'Rappel : Demande d\'approbation en attente',
      greeting: `Bonjour ${recipientName},`,
      intro: `Ceci est un rappel que vous avez une demande d'approbation en attente qui nécessite votre attention.`,
      timePending: `Cette demande est en attente depuis ${hoursSinceCreated} heures.`,
      detailsHeading: 'Détails de la demande',
      title: 'Titre',
      type: 'Type',
      priority: 'Priorité',
      dueDate: 'Date d\'échéance',
      actionButton: 'Examiner maintenant',
      footer: 'Ceci est un rappel automatique de votre système de flux de travail.',
    },
  }

  const t = translations[locale as 'en' | 'fr']

  return (
    <Html>
      <Head />
      <Preview>{t.subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>⏰ {t.subject}</Heading>
          <Text style={text}>{t.greeting}</Text>
          <Text style={text}>{t.intro}</Text>
          <Text style={warningText}>{t.timePending}</Text>

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

const warningText = {
  color: '#fa5252',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
  fontWeight: 'bold',
}

const detailsSection = {
  backgroundColor: '#fff5f5',
  padding: '24px 48px',
  margin: '24px 0',
  border: '2px solid #ffc9c9',
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
  backgroundColor: '#fa5252',
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
