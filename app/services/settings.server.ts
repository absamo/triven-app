import { redirect } from "react-router"

import { prisma } from "~/app/db.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import { type ICurrency } from "../common/validations/currencySchema"

export async function getCurrenciesByCompany(request: Request) {
  const user = await requireBetterAuthUser(request, ["read:settings"])

  const currencies = await prisma.currency.findMany({
    where: { companyId: user.companyId },
    orderBy: { order: "asc" },
  })

  return currencies || []
}

export async function createCurrency(request: Request, currency: ICurrency) {
  const user = await requireBetterAuthUser(request, ["read:settings"])

  const foundCurrency = await prisma.currency.findFirst({
    where: { currencyCode: currency.currencyCode },
  })

  if (foundCurrency) {
    return {
      errors: {
        name: "Currency already exists",
      },
    }
  }

  await prisma.currency.create({
    data: {
      currencyCode: currency.currencyCode,
      currencyName: currency.currencyName,
      countryName: currency.countryName,
      isoCode: currency.isoCode,
      order: currency.order,
      company: {
        connect: { id: user.companyId },
      },
    } as any,
  })

  return redirect("/settings")
}

export async function updateCurrencyBase(
  currencyId: ICurrency["id"],
  request: Request
) {
  const user = await requireBetterAuthUser(request, ["read:settings"])

  await prisma.currency.updateMany({
    where: { companyId: user.companyId },
    data: {
      base: false,
    },
  })

  await prisma.currency.update({
    where: { id: currencyId },
    data: {
      base: true,
    },
  })

  return redirect("/settings")
}

export async function deleteCurrency(
  currencyId: ICurrency["id"],
  request: Request
) {
  const user = await requireBetterAuthUser(request, ["read:settings"])

  await prisma.currency.delete({
    where: { id: currencyId },
  })

  return redirect("/settings")
}
