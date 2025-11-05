import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface PaymentFailedEmailProps {
  name?: string
  planName?: string
  amount?: string
  failureReason?: string
  retryDate?: string
  suspensionDate?: string
  updatePaymentUrl?: string
  billingUrl?: string
  supportUrl?: string
  locale?: 'en' | 'fr'
}

function interpolate(text: string, variables: Record<string, any>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key]
    return value !== undefined ? String(value) : match
  })
}

export default function PaymentFailedEmail({
  name = 'User',
  planName = 'Professional',
  amount = '$29.00',
  failureReason = 'insufficient funds',
  retryDate = 'in 3 days',
  suspensionDate = 'in 7 days',
  updatePaymentUrl = 'https://app.triven.com/billing/payment-method',
  billingUrl = 'https://app.triven.com/billing',
  supportUrl = 'https://app.triven.com/support',
  locale = 'en',
}: PaymentFailedEmailProps) {
  const t =
    locale === 'fr'
      ? {
          preview: 'Action requise : Échec du paiement pour votre abonnement Triven ⚠️',
          title: 'Échec du Paiement - Action Requise',
          greeting: 'Bonjour {name},',
          intro:
            "Nous n'avons pas pu traiter votre paiement pour votre abonnement Triven {planName}. Pour assurer un service ininterrompu, veuillez mettre à jour votre méthode de paiement dès que possible.",
          paymentDetails: '⚠️ Détails du Paiement',
          plan: 'Plan :',
          amount: 'Montant :',
          failureReason: "Raison de l'Échec :",
          nextRetry: 'Prochaine Tentative :',
          updatePayment: 'Mettre à Jour la Méthode de Paiement',
          whatHappensNext: '📅 Ce Qui Se Passe Ensuite',
          timelineToday:
            "Aujourd'hui : Échec du paiement - mettez à jour votre méthode de paiement",
          timelineRetry: '{retryDate} : Nous réessaierons automatiquement le paiement',
          timelineSuspension:
            '{suspensionDate} : Le compte sera suspendu si le paiement échoue encore',
          howToResolve: 'Comment résoudre ceci :',
          step1: '1. Cliquez sur "Mettre à Jour la Méthode de Paiement" ci-dessus',
          step2: "2. Ajoutez une nouvelle méthode de paiement ou mettez à jour l'existante",
          step3: '3. Vérifiez que vos informations de facturation sont correctes',
          step4: "4. Contactez votre banque si vous avez besoin d'aide",
          needHelp: "Besoin d'Aide ?",
          helpText:
            'Si vous avez des difficultés à mettre à jour votre méthode de paiement ou avez des questions sur cette charge, notre équipe de support est là pour vous aider.',
          viewBilling: "Voir l'Historique de Facturation",
          contactSupport: 'Contacter le Support',
          keepActive:
            'Nous voulons maintenir votre service Triven actif. Veuillez mettre à jour votre méthode de paiement pour éviter toute interruption de service.',
          bestRegards: 'Cordialement,',
          teamName: "L'équipe Triven",
        }
      : {
          preview: 'Action required: Payment failed for your Triven subscription ⚠️',
          title: 'Payment Failed - Action Required',
          greeting: 'Hi {name},',
          intro:
            'We were unable to process your payment for your Triven {planName} subscription. To ensure uninterrupted service, please update your payment method as soon as possible.',
          paymentDetails: '⚠️ Payment Details',
          plan: 'Plan:',
          amount: 'Amount:',
          failureReason: 'Failure Reason:',
          nextRetry: 'Next Retry:',
          updatePayment: 'Update Payment Method',
          whatHappensNext: '📅 What Happens Next',
          timelineToday: 'Today: Payment failed - update your payment method',
          timelineRetry: "{retryDate}: We'll automatically retry the payment",
          timelineSuspension: '{suspensionDate}: Account will be suspended if payment still fails',
          howToResolve: 'How to resolve this:',
          step1: '1. Click "Update Payment Method" above',
          step2: '2. Add a new payment method or update your existing one',
          step3: '3. Verify your billing information is correct',
          step4: '4. Contact your bank if you need assistance',
          needHelp: 'Need Help?',
          helpText:
            "If you're having trouble updating your payment method or have questions about this charge, our support team is here to help.",
          viewBilling: 'View Billing History',
          contactSupport: 'Contact Support',
          keepActive:
            'We want to keep your Triven service active. Please update your payment method to avoid any service interruption.',
          bestRegards: 'Best regards,',
          teamName: 'The Triven Team',
        }

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src={`${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/assets/triven-logo.png`}
              width="170"
              height="50"
              alt="TRIVEN"
              style={logo}
            />
          </Section>

          <Section style={section}>
            <Text style={title}>{t.title}</Text>
            <Text style={text}>{interpolate(t.greeting, { name })}</Text>
            <Text style={text}>{interpolate(t.intro, { planName })}</Text>

            <Section style={failureBox}>
              <Text style={failureTitle}>{t.paymentDetails}</Text>
              <Text style={detailRow}>
                <strong>{t.plan}</strong> {planName}
              </Text>
              <Text style={detailRow}>
                <strong>{t.amount}</strong> {amount}
              </Text>
              <Text style={detailRow}>
                <strong>{t.failureReason}</strong> {failureReason}
              </Text>
              <Text style={detailRow}>
                <strong>{t.nextRetry}</strong> {retryDate}
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={urgentButton} href={updatePaymentUrl}>
                {t.updatePayment}
              </Button>
            </Section>

            <Section style={timelineBox}>
              <Text style={timelineTitle}>{t.whatHappensNext}</Text>
              <Text style={timelineItem}>
                <strong>{t.timelineToday}</strong>
              </Text>
              <Text style={timelineItem}>
                <strong>{interpolate(t.timelineRetry, { retryDate })}</strong>
              </Text>
              <Text style={timelineItem}>
                <strong>{interpolate(t.timelineSuspension, { suspensionDate })}</strong>
              </Text>
            </Section>

            <Text style={text}>
              <strong>{t.howToResolve}</strong>
            </Text>
            <Text style={listItem}>{t.step1}</Text>
            <Text style={listItem}>{t.step2}</Text>
            <Text style={listItem}>{t.step3}</Text>
            <Text style={listItem}>{t.step4}</Text>

            <Hr style={hr} />

            <Text style={text}>
              <strong>{t.needHelp}</strong>
            </Text>
            <Text style={text}>{t.helpText}</Text>

            <Section style={buttonContainer}>
              <Button style={secondaryButton} href={billingUrl}>
                {t.viewBilling}
              </Button>
              <Button style={secondaryButton} href={supportUrl}>
                {t.contactSupport}
              </Button>
            </Section>

            <Text style={footer}>{t.keepActive}</Text>

            <Text style={footer}>
              {t.bestRegards}
              <br />
              {t.teamName}
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

const logo = {
  margin: '0 auto',
}

const section = {
  padding: '0 40px',
}

const title = {
  fontSize: '21px',
  lineHeight: '1.3',
  fontWeight: '600',
  color: '#484848',
  padding: '17px 0 0',
}

const text = {
  margin: '0 0 10px 0',
  textAlign: 'left' as const,
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#3c4149',
}

const failureBox = {
  backgroundColor: '#ffeaea',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  border: '1px solid #ffcdd2',
}

const failureTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#d32f2f',
  margin: '0 0 15px 0',
}

const timelineBox = {
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  border: '1px solid #e0e0e0',
}

const timelineTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#424242',
  margin: '0 0 15px 0',
}

const timelineItem = {
  margin: '0 0 10px 0',
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#3c4149',
}

const detailRow = {
  margin: '0 0 8px 0',
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#3c4149',
}

const listItem = {
  margin: '0 0 8px 0',
  textAlign: 'left' as const,
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#3c4149',
  paddingLeft: '16px',
}

const buttonContainer = {
  padding: '20px 0',
  textAlign: 'center' as const,
}

const urgentButton = {
  backgroundColor: '#d32f2f',
  borderRadius: '8px',
  fontWeight: '600',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0 5px',
}

const secondaryButton = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  fontWeight: '600',
  color: '#4C8CFF',
  fontSize: '14px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
  border: '1px solid #4C8CFF',
  margin: '0 5px',
}

const hr = {
  borderColor: '#dfe1e4',
  margin: '42px 0 26px',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '1.4',
  margin: '0 0 10px 0',
}
