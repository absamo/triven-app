import {
  type ActionFunction,
  type ActionFunctionArgs,
  type LoaderFunction,
  type LoaderFunctionArgs,
} from "react-router"

import { type ICurrency } from "~/app/common/validations/currencySchema"
import Settings from "~/app/pages/Settings"
import {
  createCurrency,
  getCurrenciesByCompany,
} from "~/app/services/settings.server"

import { prisma } from "~/app/db.server"
import {
  getAllInvoices,
  getUpcomingInvoice,
} from "~/app/modules/stripe/queries.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import type { Route } from "./+types/settings"

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {

  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ["read:settings"])


  const permissions = user?.role?.permissions.filter(
    (permission) =>
      permission === "create:settings" ||
      permission === "update:settings" ||
      permission === "delete:settings"
  )

  const defaultCurrencies: ICurrency[] =
    ((await getCurrenciesByCompany(request)) as ICurrency[]) || []

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
    },
    include: {
      price: true,
    },
  })

  // if (!subscription) {
  //   return Error("No subscription found")
  // }

  let invoices: any = []
  let upcomingInvoice: any = {}
  let currentsubscription = {}

  if (subscription) {
    // Check if this is a demo subscription (starts with 'demo_sub_')
    const isDemoSubscription = subscription.id.startsWith('demo_sub_')

    if (!isDemoSubscription) {
      // Only call Stripe APIs for real subscriptions
      invoices = await (
        await getAllInvoices(subscription?.id)
      ).map((invoice: any) => {
        return {
          id: invoice.id,
          amountPaid: invoice.amount_paid,
          amountDue: invoice.amount_due,
          currency: invoice.currency,
          effectiveAt: invoice.effective_at,
          status: invoice.status,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end,
          attempted: invoice.attempted,
          billingReason: invoice.billing_reason,
          customerName: invoice.customer_name,
          customerEmail: invoice.customer_email,
          customerAddress: {
            city: invoice.customer_address?.city,
            country: invoice.customer_address?.country,
            line1: invoice.customer_address?.line1,
            postalCode: invoice.customer_address?.postal_code,
            state: invoice.customer_address?.state,
          },
          customerPhone: invoice.customer_phone,
        }
      })

      upcomingInvoice = await getUpcomingInvoice(subscription?.id)
    } else {
      // For demo subscriptions, use mock data
      invoices = []
      upcomingInvoice = {
        amount_due: subscription.price?.amount || 0,
        currency: subscription.price?.currency || 'USD',
        period_start: subscription.currentPeriodStart,
        period_end: subscription.currentPeriodEnd,
        billing_reason: 'subscription_create',
        status: 'draft',
        next_payment_attempt: subscription.currentPeriodEnd,
        customer_name: 'Demo Customer',
        customer_email: 'demo@example.com',
        customer_address: {},
        customer_phone: null,
      }
    }

    currentsubscription = {
      currentPlan: subscription.planId || "Free",
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      trialStart: subscription.trialStart,
      trialEnd: subscription.trialEnd,
      interval: subscription.interval,
      amount: subscription.price?.amount,
      currency: subscription.price?.currency,
      status: subscription.status,
    }
  }

  return {
    defaultCurrencies,
    subscription: currentsubscription,
    invoices,
    upcomingInvoice: {
      amountDue: upcomingInvoice.amount_due,
      currency: upcomingInvoice.currency,
      periodStart: upcomingInvoice.period_start,
      periodEnd: upcomingInvoice.period_end,
      billingReason: upcomingInvoice.billing_reason,
      status: upcomingInvoice.status,
      nextPayment_attempt: upcomingInvoice.next_payment_attempt,
      customerName: upcomingInvoice.customer_name,
      customerEmail: upcomingInvoice.customer_email,
      customerAddress: {
        city: upcomingInvoice.customer_address?.city,
        country: upcomingInvoice.customer_address?.country,
        line1: upcomingInvoice.customer_address?.line1,
        postalCode: upcomingInvoice.customer_address?.postal_code,
        state: upcomingInvoice.customer_address?.state,
      },
      customerPhone: upcomingInvoice.customer_phone,
    },
    permissions,
  }
}

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData()

  const currencyCode = formData.get("currencyCode") as ICurrency["currencyCode"]
  const currencyName = formData.get("currencyName") as ICurrency["currencyName"]
  const countryName = formData.get("countryName") as ICurrency["countryName"]
  const isoCode = formData.get("isoCode") as ICurrency["isoCode"]
  const order = JSON.parse(
    formData.get("order") as string
  ) as ICurrency["order"]

  return await createCurrency(request, {
    currencyCode,
    currencyName,
    countryName,
    isoCode,
    order,
  })
}

export default function SettingsRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { subscription, permissions, defaultCurrencies } = loaderData as unknown as {
    subscription: {
      currentPlan: string
      currentPeriodStart: number
      currentPeriodEnd: number
      cancelAtPeriodEnd: boolean
      trialStart: number
      trialEnd: number
      interval: string
      amount: number
      currency: string
      status: string
    }
    permissions: string[]
    defaultCurrencies: ICurrency[]
  }

  return (
    <Settings
      currencies={defaultCurrencies}
      billing={{
        currentPlan: subscription?.currentPlan,
        planStatus: subscription?.status,
        currentPeriodStart: subscription?.currentPeriodStart,
        currentPeriodEnd: subscription?.currentPeriodEnd,
        trialStart: subscription?.trialStart,
        trialEnd: subscription?.trialEnd,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
        interval: subscription?.interval,
        amount: subscription?.amount,
        currency: subscription?.currency,
      }}
      permissions={permissions}
    />
  )
}
