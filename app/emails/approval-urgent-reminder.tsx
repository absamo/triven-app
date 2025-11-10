// T012: React Email template for urgent 48-hour reminder
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
interface ApprovalUrgentReminderEmailProps {
  recipientName: string
  approvalTitle: string
  entityType: string
  priority: string
  dueDate?: string
  hoursSinceCreated: number
  actionUrl: string
  locale?: 'en' | 'fr'
}

export default function ApprovalUrgentReminderEmail({
  recipientName,
  approvalTitle,
  entityType,
  priority,
  dueDate,
  hoursSinceCreated,
  actionUrl,
  locale = 'en',
}: ApprovalUrgentReminderEmailProps) {
  const translations: Record<'en' | 'fr', {
    subject: string
    greeting: string
    intro: string
    timePending: string
    impact: string
    detailsHeading: string
    title: string
    type: string
    priority: string
    dueDate: string
    actionButton: string
    escalation: string
    footer: string
  }> = {
    en: {
      subject: '🚨 URGENT: Approval Request Overdue',
      greeting: `Hi ${recipientName},`,
      intro: `This approval request requires immediate attention.`,
      timePending: `This request has been pending for ${hoursSinceCreated} hours and is now overdue.`,
      impact: 'Delayed approval may impact business operations and other team members.',
      detailsHeading: 'Request Details',
      title: 'Title',
      type: 'Type',
      priority: 'Priority',
      dueDate: 'Due Date',
      actionButton: 'Take Action Now',
      escalation: 'If you cannot review this request, please escalate or reassign immediately.',
      footer: 'This is an urgent automated reminder from your workflow system.',
    },
    fr: {
      subject: '🚨 URGENT : Demande d\'approbation en retard',
      greeting: `Bonjour ${recipientName},`,
      intro: `Cette demande d'approbation nécessite une attention immédiate.`,
      timePending: `Cette demande est en attente depuis ${hoursSinceCreated} heures et est maintenant en retard.`,
      impact: 'Le retard d\'approbation peut avoir un impact sur les opérations commerciales et les autres membres de l\'équipe.',
      detailsHeading: 'Détails de la demande',
      title: 'Titre',
      type: 'Type',
      priority: 'Priorité',
      dueDate: 'Date d\'échéance',
      actionButton: 'Agir maintenant',
      escalation: 'Si vous ne pouvez pas examiner cette demande, veuillez l\'escalader ou la réaffecter immédiatement.',
      footer: 'Ceci est un rappel urgent automatique de votre système de flux de travail.',
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
          <Text style={urgentText}>{t.intro}</Text>
          <Text style={urgentText}>{t.timePending}</Text>
          <Text style={warningText}>{t.impact}</Text>

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

          <Text style={escalationText}>{t.escalation}</Text>

          <Text style={footer}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#fff5f5',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  border: '3px solid #e03131',
}

const h1 = {
  color: '#e03131',
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

const urgentText = {
  color: '#e03131',
  fontSize: '18px',
  lineHeight: '28px',
  padding: '0 48px',
  fontWeight: 'bold',
}

const warningText = {
  color: '#d9480f',
  fontSize: '14px',
  lineHeight: '22px',
  padding: '0 48px',
  marginTop: '16px',
  fontStyle: 'italic',
}

const detailsSection = {
  backgroundColor: '#ffe3e3',
  padding: '24px 48px',
  margin: '24px 0',
  border: '3px solid #ff8787',
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
  backgroundColor: '#e03131',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 24px',
}

const escalationText = {
  color: '#495057',
  fontSize: '14px',
  lineHeight: '22px',
  padding: '0 48px',
  marginTop: '24px',
  fontWeight: 'bold',
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
