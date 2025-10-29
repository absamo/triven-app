// Demo Request Notification Email Template
// Constitutional Principle VI: API-First Development

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { DemoRequest } from '~/app/lib/landing/types'

interface DemoRequestNotificationProps {
  demoRequest: DemoRequest
}

export function DemoRequestNotification({ demoRequest }: DemoRequestNotificationProps) {
  const previewText = `New demo request from ${demoRequest.name} at ${demoRequest.company}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Demo Request Received</Heading>

          <Section style={section}>
            <Text style={text}>
              A new demo request has been submitted through the Triven landing page.
            </Text>
          </Section>

          <Section style={infoSection}>
            <Heading as="h2" style={h2}>
              Contact Information
            </Heading>

            <Text style={infoText}>
              <strong>Name:</strong> {demoRequest.name}
            </Text>

            <Text style={infoText}>
              <strong>Email:</strong> {demoRequest.email}
            </Text>

            <Text style={infoText}>
              <strong>Company:</strong> {demoRequest.company}
            </Text>

            <Text style={infoText}>
              <strong>Team Size:</strong> {demoRequest.teamSize}
            </Text>

            {demoRequest.preferredDemoTime && (
              <Text style={infoText}>
                <strong>Preferred Demo Time:</strong>{' '}
                {new Date(demoRequest.preferredDemoTime).toLocaleString()}
              </Text>
            )}
          </Section>

          {demoRequest.message && (
            <Section style={messageSection}>
              <Heading as="h2" style={h2}>
                Message
              </Heading>
              <Text style={messageText}>{demoRequest.message}</Text>
            </Section>
          )}

          <Section style={metaSection}>
            <Text style={metaText}>
              <strong>Submitted:</strong> {new Date(demoRequest.createdAt).toLocaleString()}
            </Text>
            <Text style={metaText}>
              <strong>Request ID:</strong> {demoRequest.id}
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This is an automated notification from the Triven landing page demo request system.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Default export for Resend compatibility
export default DemoRequestNotification

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
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
}

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  margin: '20px 0 12px',
}

const section = {
  padding: '0 40px',
}

const infoSection = {
  padding: '20px 40px',
  backgroundColor: '#f8f9fa',
  margin: '20px 0',
  borderRadius: '6px',
}

const messageSection = {
  padding: '20px 40px',
  backgroundColor: '#fff9e6',
  margin: '20px 0',
  borderRadius: '6px',
  border: '1px solid #ffe066',
}

const metaSection = {
  padding: '20px 40px',
  backgroundColor: '#f1f3f5',
  margin: '20px 0',
  borderRadius: '6px',
}

const footer = {
  padding: '20px 40px 0',
  borderTop: '1px solid #e9ecef',
  marginTop: '32px',
}

const text = {
  color: '#495057',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const infoText = {
  color: '#212529',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '8px 0',
}

const messageText = {
  color: '#212529',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '12px 0',
  whiteSpace: 'pre-wrap' as const,
}

const metaText = {
  color: '#6c757d',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '6px 0',
}

const footerText = {
  color: '#868e96',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '8px 0',
}
