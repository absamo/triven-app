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

interface SubscriptionConfirmationEmailProps {
  name?: string
  planName?: string
  planPrice?: string
  billingCycle?: string
  nextBillingDate?: string
  dashboardUrl?: string
  billingUrl?: string
  locale?: 'en' | 'fr'
}

function interpolate(text: string, variables: Record<string, any>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key]
    return value !== undefined ? String(value) : match
  })
}

export default function SubscriptionConfirmationEmail({
  name = 'User',
  planName = 'Professional',
  planPrice = '$29',
  billingCycle = 'monthly',
  nextBillingDate = '30 days',
  dashboardUrl = 'https://app.triven.com/dashboard',
  billingUrl = 'https://app.triven.com/billing',
  locale = 'en',
}: SubscriptionConfirmationEmailProps) {
  // Get translations based on locale
  const t = locale === 'fr' ? {
    subject: 'Bienvenue à Triven {planName} ! Votre abonnement est actif 🎉',
    preview: 'Bienvenue à Triven {planName} ! Votre abonnement est actif 🎉',
    title: 'Abonnement Confirmé !',
    greeting: 'Bonjour {name},',
    intro: 'Merci de vous être abonné à Triven ! Votre plan {planName} est maintenant actif et vous avez un accès complet à toutes les fonctionnalités premium.',
    subscriptionDetails: 'Détails de Votre Abonnement',
    plan: 'Plan :',
    price: 'Prix :',
    nextBilling: 'Prochaine facturation :',
    status: 'Statut :',
    active: 'Actif',
    accessDashboard: 'Accéder au Tableau de Bord',
    whatsIncluded: 'Ce qui est inclus dans votre plan {planName} :',
    unlimitedTracking: '✓ Suivi d\'inventaire illimité',
    advancedAnalytics: '✓ Analyses et rapports avancés',
    multiLocation: '✓ Gestion multi-emplacements',
    apiAccess: '✓ Accès API',
    prioritySupport: '✓ Support client prioritaire',
    customIntegrations: '✓ Intégrations personnalisées',
    billingInfo: 'Informations de Facturation',
    billingText: 'Votre abonnement se renouvellera automatiquement le {nextBillingDate}. Vous pouvez gérer vos paramètres de facturation, mettre à jour les méthodes de paiement ou annuler votre abonnement à tout moment.',
    manageBilling: 'Gérer la Facturation',
    supportText: 'Des questions sur votre abonnement ? Notre équipe de support est là pour vous aider !',
    bestRegards: 'Cordialement,',
    support: 'L\'équipe Triven'
  } : {
    subject: 'Welcome to Triven {planName}! Your subscription is active 🎉',
    preview: 'Welcome to Triven {planName}! Your subscription is active 🎉',
    title: 'Subscription Confirmed!',
    greeting: 'Hi {name},',
    intro: 'Thank you for subscribing to Triven! Your {planName} plan is now active and you have full access to all premium features.',
    subscriptionDetails: 'Your Subscription Details',
    plan: 'Plan:',
    price: 'Price:',
    nextBilling: 'Next billing:',
    status: 'Status:',
    active: 'Active',
    accessDashboard: 'Access Your Dashboard',
    whatsIncluded: 'What\'s included in your {planName} plan:',
    unlimitedTracking: '✓ Unlimited inventory tracking',
    advancedAnalytics: '✓ Advanced analytics and reporting',
    multiLocation: '✓ Multi-location management',
    apiAccess: '✓ API access',
    prioritySupport: '✓ Priority customer support',
    customIntegrations: '✓ Custom integrations',
    billingInfo: 'Billing Information',
    billingText: 'Your subscription will automatically renew on {nextBillingDate}. You can manage your billing settings, update payment methods, or cancel your subscription at any time.',
    manageBilling: 'Manage Billing',
    supportText: 'Questions about your subscription? Our support team is here to help!',
    bestRegards: 'Best regards,',
    support: 'The Triven Team'
  }

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{interpolate(t.preview, { planName })}</Preview>
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

            <Section style={subscriptionBox}>
              <Text style={subscriptionTitle}>{t.subscriptionDetails}</Text>
              <Text style={detailRow}>
                <strong>{t.plan}</strong> {planName}
              </Text>
              <Text style={detailRow}>
                <strong>{t.price}</strong> {planPrice} / {billingCycle}
              </Text>
              <Text style={detailRow}>
                <strong>{t.nextBilling}</strong> {nextBillingDate}
              </Text>
              <Text style={detailRow}>
                <strong>{t.status}</strong> <span style={activeStatus}>{t.active}</span>
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={dashboardUrl}>
                {t.accessDashboard}
              </Button>
            </Section>

            <Text style={text}>
              <strong>{interpolate(t.whatsIncluded, { planName })}</strong>
            </Text>
            <Text style={featureText}>{t.unlimitedTracking}</Text>
            <Text style={featureText}>{t.advancedAnalytics}</Text>
            <Text style={featureText}>{t.multiLocation}</Text>
            <Text style={featureText}>{t.apiAccess}</Text>
            <Text style={featureText}>{t.prioritySupport}</Text>
            <Text style={featureText}>{t.customIntegrations}</Text>

            <Hr style={hr} />

            <Text style={text}>
              <strong>{t.billingInfo}</strong>
            </Text>
            <Text style={text}>
              {interpolate(t.billingText, { nextBillingDate })}
            </Text>

            <Section style={buttonContainer}>
              <Button style={secondaryButton} href={billingUrl}>
                {t.manageBilling}
              </Button>
            </Section>

            <Text style={footer}>
              {t.supportText}
            </Text>

            <Text style={footer}>
              {t.bestRegards}<br />
              {t.support}
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

const subscriptionBox = {
  backgroundColor: '#f8fffe',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  border: '1px solid #e8f5e8',
}

const subscriptionTitle = {
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

const activeStatus = {
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