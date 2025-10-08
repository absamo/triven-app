import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface PasswordResetProps {
  name?: string
  resetUrl: string
}

export default function PasswordReset({ name = 'User', resetUrl }: PasswordResetProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Reset your password - Triven</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>Triven</Text>
          </Section>

          <Section style={section}>
            <Text style={title}>Reset your password</Text>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              We received a request to reset your password. Click the button below to set a new
              password:
            </Text>

            <Button href={resetUrl} style={button}>
              Reset Password
            </Button>

            <Text style={smallText}>
              If you didn't request a password reset, you can safely ignore this email. Your
              password will remain unchanged.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              This link will expire in 1 hour. If you're having trouble clicking the button, copy
              and paste the URL below into your web browser:
            </Text>
            <Text style={footerLink}>{resetUrl}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

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
}

const logoSection = {
  padding: '32px 40px',
  textAlign: 'center' as const,
}

const logoText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: 0,
}

const section = {
  padding: '0 40px',
}

const title = {
  fontSize: '24px',
  lineHeight: '28px',
  fontWeight: '600',
  color: '#1f2937',
  marginBottom: '20px',
}

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  marginBottom: '16px',
}

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '24px 0',
}

const smallText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6b7280',
  marginTop: '24px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const footer = {
  fontSize: '12px',
  lineHeight: '16px',
  color: '#9ca3af',
  marginBottom: '8px',
}

const footerLink = {
  fontSize: '12px',
  lineHeight: '16px',
  color: '#6b7280',
  wordBreak: 'break-all' as const,
}
