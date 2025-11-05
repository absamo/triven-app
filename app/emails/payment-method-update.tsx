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

interface PaymentMethodUpdateEmailProps {
  name?: string
  planName?: string
  newPaymentMethod?: string
  lastFour?: string
  updateDate?: string
  nextBillingDate?: string
  amount?: string
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

export default function PaymentMethodUpdateEmail({
  name = 'User',
  planName = 'Professional',
  newPaymentMethod = 'Visa',
  lastFour = '****',
  updateDate = 'today',
  nextBillingDate = 'in 30 days',
  amount = '$29',
  billingUrl = 'https://app.triven.com/billing',
  supportUrl = 'https://app.triven.com/support',
  locale = 'en',
}: PaymentMethodUpdateEmailProps) {
  const t =
    locale === 'fr'
      ? {
          preview: 'Méthode de paiement mise à jour avec succès pour votre abonnement Triven 💳',
          title: 'Méthode de Paiement Mise à Jour',
          greeting: 'Bonjour {name},',
          intro:
            'Nous confirmons que votre méthode de paiement pour votre abonnement {planName} Triven a été mise à jour avec succès.',
          updateDetails: '💳 Détails de la Mise à Jour',
          newMethod: 'Nouvelle Méthode :',
          updateDate: 'Date de Mise à Jour :',
          effectiveImmediately: 'Cette modification est effective immédiatement.',
          nextBilling: 'Prochaine Facturation',
          nextBillingText:
            'Votre prochaine facturation de {amount} pour votre plan {planName} sera prélevée sur votre nouvelle méthode de paiement {nextBillingDate}.',
          billingDate: 'Date de Facturation :',
          amount: 'Montant :',
          paymentMethod: 'Méthode de Paiement :',
          manageBilling: 'Gérer la Facturation',
          securityNote: '🔒 Note de Sécurité',
          securityText:
            "Si vous n'avez pas effectué cette modification, veuillez nous contacter immédiatement. Votre sécurité compte est notre priorité.",
          notYou: "Ce n'est pas vous ?",
          contactSupport: 'Contacter le Support',
          whatCanYouDo: 'Que pouvez-vous faire ?',
          viewBillingHistory: '• Consulter votre historique de facturation complet',
          updatePaymentMethods: '• Ajouter ou supprimer des méthodes de paiement',
          manageSubscription: '• Gérer les détails de votre abonnement',
          downloadInvoices: '• Télécharger vos factures',
          setBackupMethod: '• Définir une méthode de paiement de sauvegarde',
          visitBillingPage:
            'Visitez votre page de facturation pour gérer tous les aspects de votre abonnement et de vos paiements.',
          thankYou:
            'Merci de nous faire confiance avec la gestion de votre inventaire. Nous nous engageons à fournir un service sécurisé et fiable.',
          questions: 'Des questions ? Notre équipe de support est là pour vous aider.',
          bestRegards: 'Cordialement,',
          teamName: "L'équipe Triven",
        }
      : {
          preview: 'Payment method updated successfully for your Triven subscription 💳',
          title: 'Payment Method Updated',
          greeting: 'Hi {name},',
          intro:
            'We confirm that your payment method for your Triven {planName} subscription has been successfully updated.',
          updateDetails: '💳 Update Details',
          newMethod: 'New Method:',
          updateDate: 'Update Date:',
          effectiveImmediately: 'This change is effective immediately.',
          nextBilling: 'Next Billing',
          nextBillingText:
            'Your next billing of {amount} for your {planName} plan will be charged to your new payment method {nextBillingDate}.',
          billingDate: 'Billing Date:',
          amount: 'Amount:',
          paymentMethod: 'Payment Method:',
          manageBilling: 'Manage Billing',
          securityNote: '🔒 Security Note',
          securityText:
            "If you didn't make this change, please contact us immediately. Your account security is our priority.",
          notYou: 'Not you?',
          contactSupport: 'Contact Support',
          whatCanYouDo: 'What can you do?',
          viewBillingHistory: '• View your complete billing history',
          updatePaymentMethods: '• Add or remove payment methods',
          manageSubscription: '• Manage your subscription details',
          downloadInvoices: '• Download your invoices',
          setBackupMethod: '• Set up a backup payment method',
          visitBillingPage:
            'Visit your billing page to manage all aspects of your subscription and payments.',
          thankYou:
            "Thank you for trusting us with your inventory management. We're committed to providing secure and reliable service.",
          questions: 'Questions? Our support team is here to help.',
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

            <Section style={updateBox}>
              <Text style={updateTitle}>{t.updateDetails}</Text>
              <Text style={detailRow}>
                <strong>{t.newMethod}</strong> {newPaymentMethod}{' '}
                {locale === 'fr' ? 'se terminant par' : 'ending in'} {lastFour}
              </Text>
              <Text style={detailRow}>
                <strong>{t.updateDate}</strong> {updateDate}
              </Text>
              <Text style={effectiveText}>{t.effectiveImmediately}</Text>
            </Section>

            <Text style={text}>
              <strong>{t.nextBilling}</strong>
            </Text>
            <Text style={text}>
              {interpolate(t.nextBillingText, { amount, planName, nextBillingDate })}
            </Text>

            <Section style={billingBox}>
              <Text style={detailRow}>
                <strong>{t.billingDate}</strong> {nextBillingDate}
              </Text>
              <Text style={detailRow}>
                <strong>{t.amount}</strong> {amount}
              </Text>
              <Text style={detailRow}>
                <strong>{t.paymentMethod}</strong> {newPaymentMethod}{' '}
                {locale === 'fr' ? 'se terminant par' : 'ending in'} {lastFour}
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={billingUrl}>
                {t.manageBilling}
              </Button>
            </Section>

            <Hr style={hr} />

            <Section style={securityBox}>
              <Text style={securityTitle}>{t.securityNote}</Text>
              <Text style={text}>{t.securityText}</Text>
              <Text style={text}>
                <strong>{t.notYou}</strong>
              </Text>
              <Section style={buttonContainer}>
                <Button style={urgentButton} href={supportUrl}>
                  {t.contactSupport}
                </Button>
              </Section>
            </Section>

            <Hr style={hr} />

            <Text style={text}>
              <strong>{t.whatCanYouDo}</strong>
            </Text>
            <Text style={featureText}>{t.viewBillingHistory}</Text>
            <Text style={featureText}>{t.updatePaymentMethods}</Text>
            <Text style={featureText}>{t.manageSubscription}</Text>
            <Text style={featureText}>{t.downloadInvoices}</Text>
            <Text style={featureText}>{t.setBackupMethod}</Text>

            <Text style={text}>{t.visitBillingPage}</Text>

            <Text style={footer}>{t.thankYou}</Text>

            <Text style={footer}>{t.questions}</Text>

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

const updateBox = {
  backgroundColor: '#e8f5e8',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  border: '1px solid #a5d6a7',
}

const updateTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#2e7d32',
  margin: '0 0 15px 0',
}

const billingBox = {
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  padding: '15px',
  margin: '15px 0',
  border: '1px solid #e0e0e0',
}

const securityBox = {
  backgroundColor: '#fff3e0',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  border: '1px solid #ffcc02',
}

const securityTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#e65100',
  margin: '0 0 15px 0',
}

const effectiveText = {
  fontSize: '12px',
  color: '#2e7d32',
  fontStyle: 'italic',
  margin: '10px 0 0 0',
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

const urgentButton = {
  backgroundColor: '#e65100',
  borderRadius: '8px',
  fontWeight: '600',
  color: '#fff',
  fontSize: '14px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
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
