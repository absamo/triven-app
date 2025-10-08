import { render } from '@react-email/render'
import { Resend } from 'resend'
import { USER_ROLES, USER_STATUSES } from '~/app/common/constants'
import { prisma } from '~/app/db.server'
import WelcomeEmail from '~/app/emails/welcome-email'

const resend = new Resend(process.env.RESEND_API_KEY)

interface BusinessSetupData {
  companyName: string
  companyCountry: string
  companyCity: string
  companyAddress?: string
  companyPostalCode?: string
  agencyName: string
  warehouseName: string
  warehouseAddress?: string
  warehouseCity: string
  warehouseCountry: string
  warehousePostalCode?: string
  defaultCurrency: string
}

export async function completeBusinessSetup(userId: string, data: BusinessSetupData) {
  const {
    companyName,
    companyCountry,
    companyCity,
    companyAddress = '',
    companyPostalCode = '',
    agencyName,
    warehouseName,
    warehouseAddress = '',
    warehouseCity,
    warehouseCountry,
    warehousePostalCode = '',
    defaultCurrency,
  } = data

  // Create the company
  const company = await prisma.company.create({
    data: {
      name: companyName,
      active: true,
      sandbox: process.env.NODE_ENV !== 'production',
    },
  })

  // Helper function to get currency details
  const getCurrencyDetails = (code: string) => {
    const currencies: Record<
      string,
      { name: string; symbol: string; country: string; isoCode: string }
    > = {
      USD: { name: 'US Dollar', symbol: '$', country: 'United States', isoCode: 'US' },
      EUR: { name: 'Euro', symbol: '€', country: 'European Union', isoCode: 'EU' },
      GBP: { name: 'British Pound', symbol: '£', country: 'United Kingdom', isoCode: 'GB' },
      CAD: { name: 'Canadian Dollar', symbol: 'C$', country: 'Canada', isoCode: 'CA' },
      AUD: { name: 'Australian Dollar', symbol: 'A$', country: 'Australia', isoCode: 'AU' },
      JPY: { name: 'Japanese Yen', symbol: '¥', country: 'Japan', isoCode: 'JP' },
      CHF: { name: 'Swiss Franc', symbol: 'CHF', country: 'Switzerland', isoCode: 'CH' },
      CNY: { name: 'Chinese Yuan', symbol: '¥', country: 'China', isoCode: 'CN' },
      INR: { name: 'Indian Rupee', symbol: '₹', country: 'India', isoCode: 'IN' },
      SGD: { name: 'Singapore Dollar', symbol: 'S$', country: 'Singapore', isoCode: 'SG' },
    }
    return currencies[code] || { name: code, symbol: code, country: 'Unknown', isoCode: 'XX' }
  }

  // Create the selected default currency first
  const defaultCurrencyDetails = getCurrencyDetails(defaultCurrency)
  const baseCurrency = await prisma.currency.create({
    data: {
      symbol: defaultCurrencyDetails.symbol,
      currencyCode: defaultCurrency,
      currencyName: defaultCurrencyDetails.name,
      countryName: defaultCurrencyDetails.country,
      companyId: company.id,
      isoCode: defaultCurrencyDetails.isoCode,
      base: true,
      order: 0,
    },
  })

  // Create common additional currencies (excluding the default one if it's already created)
  const commonCurrencies = ['USD', 'EUR', 'GBP'].filter((code) => code !== defaultCurrency)
  if (commonCurrencies.length > 0) {
    await prisma.currency.createMany({
      data: commonCurrencies.map((code, index) => {
        const details = getCurrencyDetails(code)
        return {
          symbol: details.symbol,
          currencyCode: code,
          currencyName: details.name,
          countryName: details.country,
          companyId: company.id,
          isoCode: details.isoCode,
          base: false,
          order: index + 1,
        }
      }),
    })
  }

  // Create default location for company
  const companyLocation = await prisma.location.create({
    data: {
      address: companyAddress,
      city: companyCity,
      country: companyCountry,
      postalCode: companyPostalCode,
      companyId: company.id,
    },
  })

  // Create agency for the company using the provided name
  const agency = await prisma.agency.create({
    data: {
      name: agencyName,
      companyId: company.id,
      currencyId: baseCurrency.id,
      locationId: companyLocation.id,
    },
  })

  // Create site location using warehouse details
  const siteLocation = await prisma.location.create({
    data: {
      address: warehouseAddress,
      city: warehouseCity,
      country: warehouseCountry,
      postalCode: warehousePostalCode,
      companyId: company.id,
    },
  })

  // Create site for the agency using warehouse name
  const site = await prisma.site.create({
    data: {
      name: warehouseName,
      type: 'Warehouse',
      companyId: company.id,
      locationId: siteLocation.id,
      agencyId: agency.id,
      active: true,
      default: true,
    },
  })

  // Create or get admin role for the company
  const adminRole = await prisma.role.upsert({
    where: {
      name_companyId: {
        name: USER_ROLES.ADMIN,
        companyId: company.id,
      },
    },
    update: {}, // Don't update if exists
    create: {
      name: USER_ROLES.ADMIN,
      description: 'Full system access',
      companyId: company.id,
      permissions: [
        'read:products',
        'create:products',
        'update:products',
        'delete:products',
        'read:stockAdjustments',
        'create:stockAdjustments',
        'update:stockAdjustments',
        'delete:stockAdjustments',
        'read:categories',
        'create:categories',
        'update:categories',
        'delete:categories',
        'read:suppliers',
        'create:suppliers',
        'update:suppliers',
        'delete:suppliers',
        'read:purchaseOrders',
        'create:purchaseOrders',
        'update:purchaseOrders',
        'delete:purchaseOrders',
        'read:purchaseReceives',
        'create:purchaseReceives',
        'update:purchaseReceives',
        'delete:purchaseReceives',
        'read:bills',
        'create:bills',
        'update:bills',
        'delete:bills',
        'read:paymentsMade',
        'create:paymentsMade',
        'update:paymentsMade',
        'delete:paymentsMade',
        'read:customers',
        'create:customers',
        'update:customers',
        'delete:customers',
        'read:salesOrders',
        'create:salesOrders',
        'update:salesOrders',
        'delete:salesOrders',
        'read:invoices',
        'create:invoices',
        'update:invoices',
        'delete:invoices',
        'read:paymentsReceived',
        'create:paymentsReceived',
        'update:paymentsReceived',
        'delete:paymentsReceived',
        'read:agencies',
        'create:agencies',
        'update:agencies',
        'delete:agencies',
        'read:roles',
        'create:roles',
        'update:roles',
        'delete:roles',
        'read:settings',
        'create:settings',
        'update:settings',
        'delete:settings',
        'read:users',
        'create:users',
        'update:users',
        'delete:users',
        'read:sites',
        'create:sites',
        'update:sites',
        'delete:sites',
        'read:transferOrders',
        'create:transferOrders',
        'update:transferOrders',
        'delete:transferOrders',
        'read:analytics',
        'create:analytics',
        'update:analytics',
        'delete:analytics',
      ],
    },
  })

  // Update the user with the business relationships
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      companyId: company.id,
      roleId: adminRole.id,
      agencyId: agency.id,
      siteId: site.id,
      status: USER_STATUSES.REGISTERED,
    },
    include: {
      profile: true,
    },
  })

  // Send welcome email after successful business setup
  try {
    const firstName = updatedUser.profile?.firstName || updatedUser.email.split('@')[0]
    const dashboardUrl = `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/dashboard`

    const welcomeEmailHtml = await render(
      WelcomeEmail({
        name: firstName,
        dashboardUrl: dashboardUrl,
      })
    )

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Triven <onboarding@resend.dev>',
      to: updatedUser.email,
      subject: 'Welcome to Triven! Your business is ready 🎉',
      html: welcomeEmailHtml,
    })
  } catch (emailError: any) {
    // Don't fail the business setup if welcome email fails
    console.error('Failed to send welcome email after business setup:', {
      message: emailError.message,
      userId: userId,
      email: updatedUser.email,
    })
  }

  return updatedUser
}
