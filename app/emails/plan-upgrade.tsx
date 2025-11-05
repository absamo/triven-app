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

interface PlanUpgradeEmailProps {
  name?: string
  oldPlan?: string
  newPlan?: string
  newPrice?: string
  billingCycle?: string
  upgradeDate?: string
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

export default function PlanUpgradeEmail({
  name = 'User',
  oldPlan = 'Starter',
  newPlan = 'Professional',
  newPrice = '$29',
  billingCycle = 'monthly',
  upgradeDate = 'today',
  nextBillingDate = '30 days',
  dashboardUrl = 'https://app.triven.com/dashboard',
  billingUrl = 'https://app.triven.com/billing',
  locale = 'en',
}: PlanUpgradeEmailProps) {
  const t =
    locale === 'fr'
      ? {
          preview: 'Plan mis à niveau avec succès ! Bienvenue au {newPlan} 🚀',
          title: 'Plan Mis à Niveau avec Succès !',
          greeting: 'Bonjour {name},',
          intro:
            'Excellente nouvelle ! Vous avez mis à niveau avec succès de {oldPlan} vers {newPlan}. Votre nouveau plan est actif immédiatement et vous avez maintenant accès à toutes les fonctionnalités améliorées.',
          upgradeSummary: '🎉 Résumé de la Mise à Niveau',
          newPrice: 'Nouveau Prix :',
          upgradeDate: 'Date de Mise à Niveau :',
          nextBilling: 'Prochaine Facturation :',
          exploreFeatures: 'Explorer les Nouvelles Fonctionnalités',
          newFeatures: 'Nouvelles fonctionnalités maintenant disponibles :',
          advancedAnalytics: "✓ Analyses d'inventaire avancées",
          automatedReorder: '✓ Points de réapprovisionnement automatisés',
          customReporting: '✓ Rapports personnalisés',
          apiAccess: '✓ Accès API pour les intégrations',
          prioritySupport: '✓ Support client prioritaire',
          multiLocation: '✓ Gestion multi-emplacements',
          billingInfo: 'Informations de Facturation',
          billingText:
            "Vous serez facturé {newPrice} pour votre plan {newPlan} à partir de votre prochain cycle de facturation le {nextBillingDate}. Vous pouvez voir votre historique de facturation complet et gérer vos paramètres d'abonnement à tout moment.",
          viewBilling: 'Voir les Détails de Facturation',
          thankYou:
            "Merci d'avoir choisi Triven ! Nous sommes ravis de vous aider à faire passer votre gestion d'inventaire au niveau supérieur.",
          bestRegards: 'Cordialement,',
          teamName: "L'équipe Triven",
        }
      : {
          preview: 'Plan upgraded successfully! Welcome to {newPlan} 🚀',
          title: 'Plan Upgraded Successfully!',
          greeting: 'Hi {name},',
          intro:
            "Great news! You've successfully upgraded from {oldPlan} to {newPlan}. Your new plan is active immediately and you now have access to all enhanced features.",
          upgradeSummary: '🎉 Upgrade Summary',
          newPrice: 'New Price:',
          upgradeDate: 'Upgrade Date:',
          nextBilling: 'Next Billing:',
          exploreFeatures: 'Explore New Features',
          newFeatures: 'New features now available:',
          advancedAnalytics: '✓ Advanced inventory analytics',
          automatedReorder: '✓ Automated reorder points',
          customReporting: '✓ Custom reporting',
          apiAccess: '✓ API access for integrations',
          prioritySupport: '✓ Priority customer support',
          multiLocation: '✓ Multi-location management',
          billingInfo: 'Billing Information',
          billingText:
            "You'll be charged {newPrice} for your {newPlan} plan starting with your next billing cycle on {nextBillingDate}. You can view your complete billing history and manage your subscription settings anytime.",
          viewBilling: 'View Billing Details',
          thankYou:
            "Thank you for choosing Triven! We're excited to help you take your inventory management to the next level.",
          bestRegards: 'Best regards,',
          teamName: 'The Triven Team',
        }

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{interpolate(t.preview, { newPlan })}</Preview>
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
            <Text style={text}>{interpolate(t.intro, { oldPlan, newPlan })}</Text>

            <Section style={upgradeBox}>
              <Text style={upgradeTitle}>{t.upgradeSummary}</Text>
              <Text style={upgradeRow}>
                <span style={oldPlanStyle}>{oldPlan}</span> →{' '}
                <span style={newPlanStyle}>{newPlan}</span>
              </Text>
              <Text style={detailRow}>
                <strong>{t.newPrice}</strong> {newPrice} / {billingCycle}
              </Text>
              <Text style={detailRow}>
                <strong>{t.upgradeDate}</strong> {upgradeDate}
              </Text>
              <Text style={detailRow}>
                <strong>{t.nextBilling}</strong> {nextBillingDate}
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={dashboardUrl}>
                {t.exploreFeatures}
              </Button>
            </Section>

            <Text style={text}>
              <strong>{t.newFeatures}</strong>
            </Text>
            <Text style={featureText}>{t.advancedAnalytics}</Text>
            <Text style={featureText}>{t.automatedReorder}</Text>
            <Text style={featureText}>{t.customReporting}</Text>
            <Text style={featureText}>{t.apiAccess}</Text>
            <Text style={featureText}>{t.prioritySupport}</Text>
            <Text style={featureText}>{t.multiLocation}</Text>

            <Hr style={hr} />

            <Text style={text}>
              <strong>{t.billingInfo}</strong>
            </Text>
            <Text style={text}>
              {interpolate(t.billingText, { newPrice, newPlan, nextBillingDate })}
            </Text>

            <Section style={buttonContainer}>
              <Button style={secondaryButton} href={billingUrl}>
                {t.viewBilling}
              </Button>
            </Section>

            <Text style={footer}>{t.thankYou}</Text>

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

const upgradeBox = {
  backgroundColor: '#f0f8ff',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  border: '1px solid #e1f5fe',
}

const upgradeTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1976d2',
  margin: '0 0 15px 0',
}

const upgradeRow = {
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 15px 0',
  textAlign: 'center' as const,
}

const oldPlanStyle = {
  color: '#9e9e9e',
  textDecoration: 'line-through',
}

const newPlanStyle = {
  color: '#4C8CFF',
  fontWeight: '700',
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
