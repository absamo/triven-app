// React Email template for daily approval digest
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components'

interface ApprovalDigestEmailProps {
  recipientName: string
  approvals: Array<{
    id: string
    title: string
    entityType: string
    requesterName: string
    priority: string
    createdAt: string
  }>
  locale?: 'en' | 'fr'
}

export default function ApprovalDigestEmail({
  recipientName,
  approvals,
  locale = 'en',
}: ApprovalDigestEmailProps) {
  const translations: Record<'en' | 'fr', {
    subject: string
    greeting: string
    intro: string
    pendingCount: string
    viewAll: string
    requester: string
    priority: string
    created: string
    review: string
    footer: string
  }> = {
    en: {
      subject: `Daily Digest: ${approvals.length} Pending Approval(s)`,
      greeting: `Hi ${recipientName},`,
      intro: 'You have pending approval requests that require your attention.',
      pendingCount: 'Pending Approvals',
      viewAll: 'View All Approvals',
      requester: 'Requester',
      priority: 'Priority',
      created: 'Created',
      review: 'Review',
      footer: 'This is your daily approval digest. You can change your email preferences in your account settings.',
    },
    fr: {
      subject: `Résumé quotidien : ${approvals.length} approbation(s) en attente`,
      greeting: `Bonjour ${recipientName},`,
      intro: 'Vous avez des demandes d\'approbation en attente qui nécessitent votre attention.',
      pendingCount: 'Approbations en attente',
      viewAll: 'Voir toutes les approbations',
      requester: 'Demandeur',
      priority: 'Priorité',
      created: 'Créé',
      review: 'Examiner',
      footer: 'Ceci est votre résumé quotidien des approbations. Vous pouvez modifier vos préférences de messagerie dans les paramètres de votre compte.',
    },
  }

  const t = translations[locale as 'en' | 'fr']

  return (
    <Html>
      <Head />
      <Preview>{t.subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>{t.subject.split(':')[0]}</Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>{t.greeting}</Text>
            <Text style={text}>{t.intro}</Text>

            <Section style={countBadge}>
              <Text style={countText}>
                {approvals.length} {t.pendingCount}
              </Text>
            </Section>

            <table style={approvalTable}>
              <thead>
                <tr style={tableHeaderRow}>
                  <th style={tableHeaderCell}>Title</th>
                  <th style={tableHeaderCell}>{t.requester}</th>
                  <th style={tableHeaderCell}>{t.priority}</th>
                  <th style={tableHeaderCell}>{t.created}</th>
                  <th style={tableHeaderCell}></th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((approval) => {
                  const actionUrl = `${process.env.APP_URL || 'http://localhost:3000'}/approvals/${approval.id}`
                  const createdDate = new Date(approval.createdAt).toLocaleDateString(locale)

                  return (
                    <tr key={approval.id} style={tableBodyRow}>
                      <td style={tableBodyCell}>
                        <strong>{approval.title}</strong>
                        <br />
                        <span style={smallText}>{approval.entityType}</span>
                      </td>
                      <td style={tableBodyCell}>{approval.requesterName}</td>
                      <td style={tableBodyCell}>
                        <span style={getPriorityStyle(approval.priority)}>
                          {approval.priority}
                        </span>
                      </td>
                      <td style={tableBodyCell}>{createdDate}</td>
                      <td style={tableBodyCell}>
                        <a href={actionUrl} style={reviewLink}>
                          {t.review} →
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <Section style={buttonContainer}>
              <Button
                style={button}
                href={`${process.env.APP_URL || 'http://localhost:3000'}/approvals`}
              >
                {t.viewAll}
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>{t.footer}</Text>
          </Section>
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
  marginBottom: '64px',
  maxWidth: '800px',
  borderRadius: '8px',
  overflow: 'hidden',
}

const header = {
  backgroundColor: '#228be6',
  padding: '24px',
}

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
}

const content = {
  padding: '24px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const countBadge = {
  backgroundColor: '#e7f5ff',
  padding: '16px',
  borderRadius: '4px',
  margin: '24px 0',
}

const countText = {
  color: '#1864ab',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
}

const approvalTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  margin: '24px 0',
}

const tableHeaderRow = {
  backgroundColor: '#f8f9fa',
  borderBottom: '2px solid #dee2e6',
}

const tableHeaderCell = {
  padding: '12px',
  textAlign: 'left' as const,
  fontSize: '14px',
  fontWeight: '600',
  color: '#495057',
}

const tableBodyRow = {
  borderBottom: '1px solid #e9ecef',
}

const tableBodyCell = {
  padding: '12px',
  fontSize: '14px',
  color: '#333',
}

const smallText = {
  fontSize: '12px',
  color: '#868e96',
}

const reviewLink = {
  color: '#228be6',
  textDecoration: 'none',
  fontWeight: '500',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#228be6',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const footer = {
  backgroundColor: '#f8f9fa',
  padding: '16px 24px',
  textAlign: 'center' as const,
  borderTop: '1px solid #dee2e6',
}

const footerText = {
  margin: '0',
  fontSize: '12px',
  color: '#868e96',
  lineHeight: '16px',
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
