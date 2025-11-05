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

interface SubscriptionCancelledEmailProps {
  name?: string
  planName?: string
  cancellationDate?: string
  endDate?: string
  reason?: string
  reactivateUrl?: string
  exportDataUrl?: string
  feedbackUrl?: string
  locale?: 'en' | 'fr'
}

function interpolate(text: string, variables: Record<string, any>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key]
    return value !== undefined ? String(value) : match
  })
}

export default function SubscriptionCancelledEmail({
  name = 'User',
  planName = 'Professional',
  cancellationDate = 'today',
  endDate = 'end of billing period',
  reason = 'At your request',
  reactivateUrl = 'https://app.triven.com/billing/reactivate',
  exportDataUrl = 'https://app.triven.com/export',
  feedbackUrl = 'https://app.triven.com/feedback',
  locale = 'en',
}: SubscriptionCancelledEmailProps) {
  const t =
    locale === 'fr'
      ? {
          preview: "Abonnement annulé - Nous vous remercions d'avoir utilisé Triven 😢",
          title: 'Abonnement Annulé',
          greeting: 'Bonjour {name},',
          intro:
            "Nous confirmons que votre abonnement {planName} a été annulé. Nous sommes désolés de vous voir partir et espérons avoir l'opportunité de vous servir à nouveau dans le futur.",
          cancellationDetails: "📅 Détails de l'Annulation",
          cancellationDate: "Date d'Annulation :",
          accessUntil: "Accès Jusqu'à :",
          reason: 'Raison :',
          whatHappensNext: 'Que se passe-t-il maintenant ?',
          currentAccess: '1. Accès Actuel',
          currentAccessText:
            "Vous conservez l'accès complet à votre compte Triven jusqu'à {endDate}. Toutes vos fonctionnalités restent actives jusqu'alors.",
          dataRetention: '2. Conservation des Données',
          dataRetentionText:
            "Vos données d'inventaire, rapports et paramètres seront conservés en toute sécurité pendant 90 jours au cas où vous décideriez de revenir. Après cette période, les données seront supprimées définitivement.",
          exportData: 'Exporter Vos Données',
          dataExportText:
            "Avant la fin de votre période d'accès, nous vous recommandons d'exporter vos données importantes :",
          inventoryData: "• Données d'inventaire et niveaux de stock",
          orderHistory: '• Historique des commandes et transactions',
          customerData: '• Informations sur les clients et fournisseurs',
          reports: '• Rapports personnalisés et analyses',
          settings: '• Paramètres et configurations',
          downloadData: 'Télécharger Mes Données',
          changeMind: "Vous avez changé d'avis ?",
          changeMindText:
            'Si vous avez annulé par erreur ou souhaitez donner une autre chance à Triven, vous pouvez facilement réactiver votre abonnement à tout moment avant {endDate}.',
          reactivateSubscription: "Réactiver l'Abonnement",
          weSadToSeeYouGo: 'Nous sommes désolés de vous voir partir',
          sadToSeeYouGoText:
            'Votre expérience est importante pour nous. Si vous avez quelques minutes, nous aimerions connaître les raisons de votre départ pour améliorer Triven pour les futurs utilisateurs.',
          shareFeedback: 'Partager Mon Avis',
          stayConnected: 'Restez Connecté',
          stayConnectedText:
            "Même si vous n'utilisez plus Triven, nous aimerions rester en contact. Suivez-nous pour les mises à jour de produits, conseils sur la gestion d'inventaire et nouvelles fonctionnalités.",
          thankYou:
            "Merci d'avoir fait partie de la communauté Triven. Nous espérons vous revoir bientôt !",
          bestRegards: 'Cordialement,',
          teamName: "L'équipe Triven",
        }
      : {
          preview: 'Subscription cancelled - Thank you for using Triven 😢',
          title: 'Subscription Cancelled',
          greeting: 'Hi {name},',
          intro:
            "We confirm that your {planName} subscription has been cancelled. We're sorry to see you go and hope to have the opportunity to serve you again in the future.",
          cancellationDetails: '📅 Cancellation Details',
          cancellationDate: 'Cancellation Date:',
          accessUntil: 'Access Until:',
          reason: 'Reason:',
          whatHappensNext: 'What happens next?',
          currentAccess: '1. Current Access',
          currentAccessText:
            'You retain full access to your Triven account until {endDate}. All your features remain active until then.',
          dataRetention: '2. Data Retention',
          dataRetentionText:
            'Your inventory data, reports, and settings will be safely stored for 90 days in case you decide to return. After this period, the data will be permanently deleted.',
          exportData: 'Export Your Data',
          dataExportText:
            'Before your access period ends, we recommend exporting your important data:',
          inventoryData: '• Inventory data and stock levels',
          orderHistory: '• Order history and transactions',
          customerData: '• Customer and supplier information',
          reports: '• Custom reports and analytics',
          settings: '• Settings and configurations',
          downloadData: 'Download My Data',
          changeMind: 'Changed your mind?',
          changeMindText:
            'If you cancelled by mistake or want to give Triven another try, you can easily reactivate your subscription anytime before {endDate}.',
          reactivateSubscription: 'Reactivate Subscription',
          weSadToSeeYouGo: "We're sad to see you go",
          sadToSeeYouGoText:
            "Your experience matters to us. If you have a few minutes, we'd love to know why you're leaving to help us improve Triven for future users.",
          shareFeedback: 'Share My Feedback',
          stayConnected: 'Stay Connected',
          stayConnectedText:
            "Even though you're no longer using Triven, we'd love to stay in touch. Follow us for product updates, inventory management tips, and new features.",
          thankYou:
            'Thank you for being part of the Triven community. We hope to see you again soon!',
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

            <Section style={cancellationBox}>
              <Text style={cancellationTitle}>{t.cancellationDetails}</Text>
              <Text style={detailRow}>
                <strong>{t.cancellationDate}</strong> {cancellationDate}
              </Text>
              <Text style={detailRow}>
                <strong>{t.accessUntil}</strong> {endDate}
              </Text>
              <Text style={detailRow}>
                <strong>{t.reason}</strong> {reason}
              </Text>
            </Section>

            <Text style={text}>
              <strong>{t.whatHappensNext}</strong>
            </Text>

            <Text style={text}>
              <strong>{t.currentAccess}</strong>
            </Text>
            <Text style={text}>{interpolate(t.currentAccessText, { endDate })}</Text>

            <Text style={text}>
              <strong>{t.dataRetention}</strong>
            </Text>
            <Text style={text}>{t.dataRetentionText}</Text>

            <Hr style={hr} />

            <Text style={text}>
              <strong>{t.exportData}</strong>
            </Text>
            <Text style={text}>{t.dataExportText}</Text>
            <Text style={featureText}>{t.inventoryData}</Text>
            <Text style={featureText}>{t.orderHistory}</Text>
            <Text style={featureText}>{t.customerData}</Text>
            <Text style={featureText}>{t.reports}</Text>
            <Text style={featureText}>{t.settings}</Text>

            <Section style={buttonContainer}>
              <Button style={button} href={exportDataUrl}>
                {t.downloadData}
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={text}>
              <strong>{t.changeMind}</strong>
            </Text>
            <Text style={text}>{interpolate(t.changeMindText, { endDate })}</Text>

            <Section style={buttonContainer}>
              <Button style={primaryButton} href={reactivateUrl}>
                {t.reactivateSubscription}
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={text}>
              <strong>{t.weSadToSeeYouGo}</strong>
            </Text>
            <Text style={text}>{t.sadToSeeYouGoText}</Text>

            <Section style={buttonContainer}>
              <Button style={secondaryButton} href={feedbackUrl}>
                {t.shareFeedback}
              </Button>
            </Section>

            <Text style={text}>
              <strong>{t.stayConnected}</strong>
            </Text>
            <Text style={text}>{t.stayConnectedText}</Text>

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

const cancellationBox = {
  backgroundColor: '#ffebee',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  border: '1px solid #ffcdd2',
}

const cancellationTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#d32f2f',
  margin: '0 0 15px 0',
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

const primaryButton = {
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
