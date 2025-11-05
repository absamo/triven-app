import type { ICustomer } from '~/app/common/validations/customerSchema'
import { prisma } from '~/app/db.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import type { ILocation } from '../common/validations/locationSchema'

export async function getCustomers(request: Request) {
  const user = await requireBetterAuthUser(request, ['read:customers'])

  const customers = await prisma.customer.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: 'desc' },
  })

  return customers || []
}

export async function getCustomersById(customerId: ICustomer['id']) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      agency: true,
      site: true,
      billingAddress: true,
      shippingAddress: true,
    },
  })

  return customer
}

export async function createCustomer(request: Request, customer: ICustomer) {
  const user = await requireBetterAuthUser(request, ['read:customers'])

  const foundCustomer = await prisma.customer.findFirst({
    where: { email: customer.email },
  })

  if (foundCustomer) {
    return {
      errors: {
        email: 'Customer already exists',
      },
    }
  }

  try {
    await prisma.customer.create({
      data: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        companyName: customer.companyName,
        shippingAddress: {
          create: { ...customer.shippingAddress } as ILocation,
        },
        billingAddress: {
          create: { ...customer.billingAddress } as ILocation,
        },
        company: {
          connect: { id: user.companyId },
        },
        site: {
          connect: { id: customer.siteId },
        },
        agency: {
          connect: { id: customer.agencyId },
        },
        useBillingAddressAsShippingAddress: customer.useBillingAddressAsShippingAddress,
      } as any,
    })

    return {
      notification: {
        message: 'Customer created successfully',
        status: 'Success',
        redirectTo: '/customers',
      },
    }
  } catch {
    return {
      notification: {
        message: 'An error occurred while creating the customer',
        status: 'Error',
      },
    }
  }
}

export async function updateCustomer(customer: ICustomer, request: Request) {
  const user = await requireBetterAuthUser(request, ['read:customers'])

  try {
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        billingAddress: {
          upsert: {
            create: { ...customer.billingAddress } as ILocation,
            update: {
              city: customer.billingAddress?.city,
              country: customer.billingAddress?.country,
              address: customer.billingAddress?.address,
              postalCode: customer.billingAddress?.postalCode,
            } as ILocation,
          },
        } as any,
        shippingAddress: {
          upsert: {
            create: { ...customer.shippingAddress } as ILocation,
            update: {
              city: customer.shippingAddress?.city,
              country: customer.shippingAddress?.country,
              address: customer.shippingAddress?.address,
              postalCode: customer.shippingAddress?.postalCode,
            } as ILocation,
          },
        } as any,
        useBillingAddressAsShippingAddress: customer.useBillingAddressAsShippingAddress,
      },
    })

    return {
      notification: {
        message: 'Customer updated successfully',
        status: 'Success',
        redirectTo: '/customers',
      },
    }
  } catch {
    return {
      notification: {
        message: 'An error occurred while updating the customer',
        status: 'Error',
      },
    }
  }
}

export async function updateCustomerPortalAccess(
  request: Request,
  {
    customerId,
    hasPortalAccess,
  }: {
    customerId: ICustomer['id']
    hasPortalAccess: ICustomer['hasPortalAccess']
  }
) {
  const user = await requireBetterAuthUser(request, ['read:customers'])

  try {
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        hasPortalAccess,
      },
    })

    return {
      notification: {
        message: 'Customer portal access updated successfully',
        status: 'Success',
        redirectTo: '/customers',
      },
    }
  } catch (error) {
    return {
      notification: {
        message: 'An error occurred while updating the customer portal access',
        status: 'Error',
        autoClose: false,
      },
    }
  }
}
