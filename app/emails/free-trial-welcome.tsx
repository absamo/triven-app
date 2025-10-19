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

interface FreeTrialWelcomeEmailProps {
  name?: string
  trialEndDate?: string
  dashboardUrl?: string
  planUpgradeUrl?: string
  locale?: 'en' | 'fr'
}

function interpolate(text: string, variables: Record<string, any>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key]
    return value !== undefined ? String(value) : match
  })
}

export default function FreeTrialWelcomeEmail({
  name = 'User',
  trialEndDate = '30 days',
  dashboardUrl = 'https://app.triven.com/dashboard',
  planUpgradeUrl = 'https://app.triven.com/billing',
  locale = 'en',
}: FreeTrialWelcomeEmailProps) {
  const t = locale === 'fr' ? {
    preview: 'Bienvenue à votre essai gratuit Triven ! Commencez à explorer dès aujourd\'hui 🚀',
    title: 'Bienvenue à votre essai gratuit !',
    greeting: 'Bonjour {name},',
    intro: 'Félicitations ! Vous avez démarré avec succès votre essai gratuit Triven. Vous avez maintenant un accès complet à notre plateforme puissante de gestion d\'inventaire pour les prochains {trialEndDate}.',
    trialIncludes: '🎉 Votre essai gratuit inclut :',
    inventoryTracking: '✓ Suivi complet de l\'inventaire',
    analytics: '✓ Tableau de bord analytique en temps réel',
    orderManagement: '✓ Gestion des commandes',
    supplierManagement: '✓ Gestion des fournisseurs',
    multiLocation: '✓ Support multi-emplacements',
    support: '✓ Support client',
    startManaging: 'Commencer la Gestion d\'Inventaire',
    quickStart: 'Guide de démarrage rapide :',
    step1: '1. Ajoutez vos premiers produits à l\'inventaire',
    step2: '2. Configurez vos fournisseurs et emplacements',
    step3: '3. Créez votre première commande d\'achat',
    step4: '4. Explorez les analyses en temps réel',
    trialExpiry: 'Votre essai expirera le {trialEndDate}. Pour continuer à utiliser Triven sans interruption, vous pouvez passer à un plan payant à tout moment.',
    viewPricing: 'Voir les Plans Tarifaires',
    supportText: 'Besoin d\'aide pour commencer ? Notre équipe de support est là pour vous aider à tirer le meilleur parti de votre essai.',
    bestRegards: 'Cordialement,',
    teamName: 'L\'équipe Triven'
  } : {
    preview: 'Welcome to your Triven free trial! Start exploring today 🚀',
    title: 'Welcome to your free trial!',
    greeting: 'Hi {name},',
    intro: 'Congratulations! You\'ve successfully started your Triven free trial. You now have full access to our powerful inventory management platform for the next {trialEndDate}.',
    trialIncludes: '🎉 Your free trial includes:',
    inventoryTracking: '✓ Complete inventory tracking',
    analytics: '✓ Real-time analytics dashboard',
    orderManagement: '✓ Order management',
    supplierManagement: '✓ Supplier management',
    multiLocation: '✓ Multi-location support',
    support: '✓ Customer support',
    startManaging: 'Start Managing Inventory',
    quickStart: 'Quick start guide:',
    step1: '1. Add your first products to the inventory',
    step2: '2. Set up your suppliers and locations',
    step3: '3. Create your first purchase order',
    step4: '4. Explore the real-time analytics',
    trialExpiry: 'Your trial will expire on {trialEndDate}. To continue using Triven without interruption, you can upgrade to a paid plan at any time.',
    viewPricing: 'View Pricing Plans',
    supportText: 'Need help getting started? Our support team is here to help you make the most of your trial.',
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
              {interpolate(t.intro, { trialEndDate })}
            </Text>

            <Section style={trialBanner}>
              <Text style={trialText}>
                {t.trialIncludes}
              </Text>
              <Text style={featureText}>{t.inventoryTracking}</Text>
              <Text style={featureText}>{t.analytics}</Text>
              <Text style={featureText}>{t.orderManagement}</Text>
              <Text style={featureText}>{t.supplierManagement}</Text>
              <Text style={featureText}>{t.multiLocation}</Text>
              <Text style={featureText}>{t.support}</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={dashboardUrl}>
                {t.startManaging}
              </Button>
            </Section>

            <Text style={text}>
              <strong>{t.quickStart}</strong>
            </Text>
            <Text style={listItem}>{t.step1}</Text>
            <Text style={listItem}>{t.step2}</Text>
            <Text style={listItem}>{t.step3}</Text>
            <Text style={listItem}>{t.step4}</Text>

            <Hr style={hr} />

            <Text style={text}>
              {interpolate(t.trialExpiry, { trialEndDate })}
            </Text>

            <Section style={buttonContainer}>
              <Button style={secondaryButton} href={planUpgradeUrl}>
                {t.viewPricing}
              </Button>
            </Section>

            <Text style={footer}>
              {t.supportText}
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

const trialBanner = {
  backgroundColor: '#f0f8ff',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  border: '1px solid #e1f5fe',
}

const trialText = {
  margin: '0 0 15px 0',
  fontSize: '16px',
  fontWeight: '600',
  color: '#1976d2',
}

const featureText = {
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