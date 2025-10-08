import { Body, Container, Head, Hr, Html, Preview, Section, Text } from '@react-email/components'

interface EmailOTPVerificationProps {
  name?: string
  otp: string
}

export default function EmailOTPVerification({ name = 'User', otp }: EmailOTPVerificationProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your verification code: {otp}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>Triven</Text>
          </Section>

          <Section style={section}>
            <Text style={title}>Verify your email address</Text>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              Thank you for signing up! Please use the following verification code to complete your
              email verification:
            </Text>

            <Section style={otpContainer}>
              <Text style={otpCode}>{otp}</Text>
            </Section>

            <Text style={smallText}>
              This code will expire in 10 minutes. If you didn't create an account, you can safely
              ignore this email.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              If you have any questions or need help, please contact our support team.
            </Text>
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

const otpContainer = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '32px 0',
  border: '2px dashed #d1d5db',
}

const otpCode = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#1f2937',
  letterSpacing: '8px',
  margin: 0,
  fontFamily: 'monospace',
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
