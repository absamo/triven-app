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

interface TrialExpiringEmailProps {
  name?: string
  daysLeft?: number
  expirationDate?: string
  planRecommendation?: string
  planPrice?: string
  upgradeUrl?: string
  dashboardUrl?: string
  locale?: 'en' | 'fr'
}

function interpolate(text: string, variables: Record<string, any>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key]
    return value !== undefined ? String(value) : match
  })
}

export default function TrialExpiringEmail({
  name = 'User',
  daysLeft = 3,
  expirationDate = 'in 3 days',
  planRecommendation = 'Professional',
  planPrice = '$29',
  upgradeUrl = 'https://app.triven.com/billing/upgrade',
  dashboardUrl = 'https://app.triven.com/dashboard',
  locale = 'en',
}: TrialExpiringEmailProps) {
  const t =
    locale === 'fr'
      ? {
          preview: "Votre essai Triven expire {expirationDate} - Ne perdez pas l'accès ! ⏰",
          title: 'Votre essai expire {expirationDate} !',
          greeting: 'Bonjour {name},',
          intro:
            "Votre essai gratuit Triven touche à sa fin. Il vous reste {daysLeft} jours pour continuer à profiter de toutes les fonctionnalités puissantes de gestion d'inventaire que vous avez utilisées.",
          trialStatus: "⏰ Statut de l'Essai",
          daysRemaining: 'Jours Restants :',
          expirationDate: "Date d'Expiration :",
          recommendedPlan: 'Plan Recommandé :',
          upgradeNow: 'Mettre à Niveau Maintenant - {planPrice}/mois',
          dontLoseAccess: "Ne perdez pas l'accès à :",
          inventoryData: "✓ Toutes vos données d'inventaire et produits",
          analytics: '✓ Analyses et insights avancés',
          reorderNotifications: '✓ Notifications de réapprovisionnement automatisées',
          multiLocation: '✓ Gestion multi-emplacements',
          customReports: '✓ Rapports personnalisés et intégrations',
          prioritySupport: '✓ Support client prioritaire',
          trialUsage: '📊 Utilisation de Votre Essai',
          usageText:
            "Pendant votre essai, vous avez expérimenté la puissance de la gestion d'inventaire professionnelle. Voici ce que signifie la mise à niveau :",
          keepData: '• Conservez toutes vos données et paramètres',
          unlimitedTracking: "• Débloquez le suivi d'inventaire illimité",
          advancedFeatures: '• Accédez aux fonctionnalités avancées et intégrations',
          getPrioritySupport: '• Obtenez un support prioritaire',
          whatIfDontUpgrade: 'Que se passe-t-il si je ne fais pas la mise à niveau ?',
          suspensionText:
            "Après l'expiration de votre essai, votre compte sera temporairement suspendu. Vous perdrez l'accès à votre tableau de bord et à vos données jusqu'à ce que vous passiez à un plan payant. Ne vous inquiétez pas - vos données sont en sécurité et seront restaurées lorsque vous ferez la mise à niveau.",
          choosePlan: 'Choisir Votre Plan',
          viewDashboard: 'Voir le Tableau de Bord',
          supportText:
            'Des questions sur la mise à niveau ? Notre équipe est là pour vous aider à choisir le bon plan pour votre entreprise.',
          bestRegards: 'Cordialement,',
          teamName: "L'équipe Triven",
        }
      : {
          preview: "Your Triven trial expires {expirationDate} - Don't lose access! ⏰",
          title: 'Your trial expires {expirationDate}!',
          greeting: 'Hi {name},',
          intro:
            "Your Triven free trial is coming to an end. You have {daysLeft} days left to continue enjoying all the powerful inventory management features you've been using.",
          trialStatus: '⏰ Trial Status',
          daysRemaining: 'Days Remaining:',
          expirationDate: 'Expiration Date:',
          recommendedPlan: 'Recommended Plan:',
          upgradeNow: 'Upgrade Now - {planPrice}/month',
          dontLoseAccess: "Don't lose access to:",
          inventoryData: '✓ All your inventory data and products',
          analytics: '✓ Advanced analytics and insights',
          reorderNotifications: '✓ Automated reorder notifications',
          multiLocation: '✓ Multi-location management',
          customReports: '✓ Custom reports and integrations',
          prioritySupport: '✓ Priority customer support',
          trialUsage: '📊 Your Trial Usage',
          usageText:
            "During your trial, you've experienced the power of professional inventory management. Here's what upgrading means:",
          keepData: '• Keep all your data and settings',
          unlimitedTracking: '• Unlock unlimited inventory tracking',
          advancedFeatures: '• Access advanced features and integrations',
          getPrioritySupport: '• Get priority support',
          whatIfDontUpgrade: "What happens if I don't upgrade?",
          suspensionText:
            "After your trial expires, your account will be temporarily suspended. You'll lose access to your dashboard and data until you upgrade to a paid plan. Don't worry - your data is safe and will be restored when you upgrade.",
          choosePlan: 'Choose Your Plan',
          viewDashboard: 'View Dashboard',
          supportText:
            'Questions about upgrading? Our team is here to help you choose the right plan for your business.',
          bestRegards: 'Best regards,',
          teamName: 'The Triven Team',
        }

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{interpolate(t.preview, { expirationDate })}</Preview>
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
            <Text style={title}>{interpolate(t.title, { expirationDate })}</Text>
            <Text style={text}>{interpolate(t.greeting, { name })}</Text>
            <Text style={text}>{interpolate(t.intro, { daysLeft: String(daysLeft) })}</Text>

            <Section style={expirationBox}>
              <Text style={expirationTitle}>{t.trialStatus}</Text>
              <Text style={detailRow}>
                <strong>{t.daysRemaining}</strong>{' '}
                <span style={urgentText}>
                  {daysLeft} {locale === 'fr' ? 'jours' : 'days'}
                </span>
              </Text>
              <Text style={detailRow}>
                <strong>{t.expirationDate}</strong> {expirationDate}
              </Text>
              <Text style={detailRow}>
                <strong>{t.recommendedPlan}</strong> {planRecommendation}
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={urgentButton} href={upgradeUrl}>
                {interpolate(t.upgradeNow, { planPrice })}
              </Button>
            </Section>

            <Text style={text}>
              <strong>{t.dontLoseAccess}</strong>
            </Text>
            <Text style={featureText}>{t.inventoryData}</Text>
            <Text style={featureText}>{t.analytics}</Text>
            <Text style={featureText}>{t.reorderNotifications}</Text>
            <Text style={featureText}>{t.multiLocation}</Text>
            <Text style={featureText}>{t.customReports}</Text>
            <Text style={featureText}>{t.prioritySupport}</Text>

            <Section style={statsBox}>
              <Text style={statsTitle}>{t.trialUsage}</Text>
              <Text style={text}>{t.usageText}</Text>
              <Text style={statsText}>{t.keepData}</Text>
              <Text style={statsText}>{t.unlimitedTracking}</Text>
              <Text style={statsText}>{t.advancedFeatures}</Text>
              <Text style={statsText}>{t.getPrioritySupport}</Text>
            </Section>

            <Hr style={hr} />

            <Text style={text}>
              <strong>{t.whatIfDontUpgrade}</strong>
            </Text>
            <Text style={text}>{t.suspensionText}</Text>

            <Section style={buttonContainer}>
              <Button style={button} href={upgradeUrl}>
                {t.choosePlan}
              </Button>
              <Button style={secondaryButton} href={dashboardUrl}>
                {t.viewDashboard}
              </Button>
            </Section>

            <Text style={footer}>{t.supportText}</Text>

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

const expirationBox = {
  backgroundColor: '#fff3cd',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  border: '1px solid #ffeaa7',
}

const expirationTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#f39c12',
  margin: '0 0 15px 0',
}

const urgentText = {
  color: '#e74c3c',
  fontWeight: '600',
}

const statsBox = {
  backgroundColor: '#f0f8ff',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  border: '1px solid #e1f5fe',
}

const statsTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1976d2',
  margin: '0 0 15px 0',
}

const statsText = {
  margin: '0 0 8px 0',
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

const urgentButton = {
  backgroundColor: '#e74c3c',
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
