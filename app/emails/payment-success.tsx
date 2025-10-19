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

interface PaymentSuccessEmailProps {
  name?: string
  planName?: string
  amount?: string
  paymentDate?: string
  nextBillingDate?: string
  invoiceNumber?: string
  billingUrl?: string
  invoiceUrl?: string
  locale?: 'en' | 'fr'
}

function interpolate(text: string, variables: Record<string, any>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key]
    return value !== undefined ? String(value) : match
  })
}

export default function PaymentSuccessEmail({
  name = 'User',
  planName = 'Professional',
  amount = '$29.00',
  paymentDate = 'today',
  nextBillingDate = 'in 30 days',
  invoiceNumber = 'INV-2024-001',
  billingUrl = 'https://app.triven.com/billing',
  invoiceUrl = 'https://app.triven.com/invoice',
  locale = 'en',
}: PaymentSuccessEmailProps) {
  const t = locale === 'fr' ? {
    preview: 'Paiement reçu - Merci ! Votre abonnement Triven est actif 💳',
    title: 'Paiement Reçu - Merci !',
    greeting: 'Bonjour {name},',
    intro: 'Merci ! Nous avons traité avec succès votre paiement pour votre abonnement Triven {planName}. Votre service continue sans interruption.',
    paymentConfirmation: '✅ Confirmation de Paiement',
    amountPaid: 'Montant Payé :',
    plan: 'Plan :',
    paymentDate: 'Date de Paiement :',
    invoiceNumber: 'Numéro de Facture :',
    nextBilling: 'Prochaine Facturation :',
    status: 'Statut :',
    paid: 'Payé',
    downloadInvoice: 'Télécharger la Facture',
    planIncludes: 'Votre plan {planName} inclut :',
    unlimitedTracking: '✓ Suivi d\'inventaire illimité',
    advancedAnalytics: '✓ Analyses et rapports avancés',
    multiLocation: '✓ Gestion multi-emplacements',
    apiAccess: '✓ Accès API et intégrations',
    prioritySupport: '✓ Support client prioritaire',
    automatedBackup: '✓ Sauvegarde automatisée et sécurité',
    billingInfo: 'Informations de Facturation',
    billingText: 'Votre prochain paiement de {amount} sera automatiquement prélevé le {nextBillingDate}. Vous pouvez gérer vos paramètres de facturation, voir l\'historique des paiements ou mettre à jour votre méthode de paiement à tout moment.',
    manageBilling: 'Gérer la Facturation',
    thankYou: 'Merci d\'avoir choisi Triven pour vos besoins de gestion d\'inventaire. Nous sommes là pour aider votre entreprise à réussir !',
    bestRegards: 'Cordialement,',
    teamName: 'L\'équipe Triven'
  } : {
    preview: 'Payment received - Thank you! Your Triven subscription is active 💳',
    title: 'Payment Received - Thank You!',
    greeting: 'Hi {name},',
    intro: 'Thank you! We\'ve successfully processed your payment for your Triven {planName} subscription. Your service continues without interruption.',
    paymentConfirmation: '✅ Payment Confirmation',
    amountPaid: 'Amount Paid:',
    plan: 'Plan:',
    paymentDate: 'Payment Date:',
    invoiceNumber: 'Invoice Number:',
    nextBilling: 'Next Billing:',
    status: 'Status:',
    paid: 'Paid',
    downloadInvoice: 'Download Invoice',
    planIncludes: 'Your {planName} plan includes:',
    unlimitedTracking: '✓ Unlimited inventory tracking',
    advancedAnalytics: '✓ Advanced analytics and reporting',
    multiLocation: '✓ Multi-location management',
    apiAccess: '✓ API access and integrations',
    prioritySupport: '✓ Priority customer support',
    automatedBackup: '✓ Automated backup and security',
    billingInfo: 'Billing Information',
    billingText: 'Your next payment of {amount} will be automatically charged on {nextBillingDate}. You can manage your billing settings, view payment history, or update your payment method anytime.',
    manageBilling: 'Manage Billing',
    thankYou: 'Thank you for choosing Triven for your inventory management needs. We\'re here to help your business succeed!',
    bestRegards: 'Best regards,',
    teamName: 'The Triven Team'
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
            <Text style={text}>
              {interpolate(t.intro, { planName })}
            </Text>

            <Section style={successBox}>
              <Text style={successTitle}>{t.paymentConfirmation}</Text>
              <Text style={detailRow}>
                <strong>{t.amountPaid}</strong> {amount}
              </Text>
              <Text style={detailRow}>
                <strong>{t.plan}</strong> {planName}
              </Text>
              <Text style={detailRow}>
                <strong>{t.paymentDate}</strong> {paymentDate}
              </Text>
              <Text style={detailRow}>
                <strong>{t.invoiceNumber}</strong> {invoiceNumber}
              </Text>
              <Text style={detailRow}>
                <strong>{t.nextBilling}</strong> {nextBillingDate}
              </Text>
              <Text style={detailRow}>
                <strong>{t.status}</strong> <span style={paidStatus}>{t.paid}</span>
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={invoiceUrl}>
                {t.downloadInvoice}
              </Button>
            </Section>

            <Text style={text}>
              <strong>{interpolate(t.planIncludes, { planName })}</strong>
            </Text>
            <Text style={featureText}>{t.unlimitedTracking}</Text>
            <Text style={featureText}>{t.advancedAnalytics}</Text>
            <Text style={featureText}>{t.multiLocation}</Text>
            <Text style={featureText}>{t.apiAccess}</Text>
            <Text style={featureText}>{t.prioritySupport}</Text>
            <Text style={featureText}>{t.automatedBackup}</Text>

            <Hr style={hr} />

            <Text style={text}>
              <strong>{t.billingInfo}</strong>
            </Text>
            <Text style={text}>
              {interpolate(t.billingText, { amount, nextBillingDate })}
            </Text>

            <Section style={buttonContainer}>
              <Button style={secondaryButton} href={billingUrl}>
                {t.manageBilling}
              </Button>
            </Section>

            <Text style={footer}>
              {t.thankYou}
            </Text>

            <Text style={footer}>
              {t.bestRegards}<br />
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
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
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

const successBox = {
  backgroundColor: '#f8fffe',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  border: '1px solid #e8f5e8',
}

const successTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#2e7d32',
  margin: '0 0 15px 0',
}

const detailRow = {
  margin: '0 0 8px 0',
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#3c4149',
}

const paidStatus = {
  color: '#2e7d32',
  fontWeight: '600',
}

const featureText = {
  margin: '0 0 8px 0',
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#3c4149',
}

const buttonContainer = {
  padding: '20px 0',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#4C8CFF',
  borderRadius: '8px',
  fontWeight: '600',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
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