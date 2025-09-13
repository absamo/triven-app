import { BACKORDER_ITEM_STATUSES, BACKORDER_STATUSES } from "~/app/common/constants"
import type { IBackorder } from "~/app/common/validations/backorderSchema"
import { prisma } from "~/app/db.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"

export async function getBackorders(
    request: Request,
    {
        backorderId,
        search,
        statuses,
        date,
        backorderReferences,
    }: {
        backorderId?: string
        search?: string | null
        statuses?: string[] | null
        date?: Date | null
        backorderReferences?: string[]
    } = {}
) {
    const user = await requireBetterAuthUser(request, ["read:backorders"])

    const whereClause: any = {
        companyId: user.companyId!,
    }

    if (backorderId) {
        whereClause.id = backorderId
    }

    if (search) {
        whereClause.OR = [
            {
                backorderReference: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            {
                customer: {
                    OR: [
                        {
                            firstName: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                        {
                            lastName: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                    ],
                },
            },
        ]
    }

    if (statuses && statuses.length > 0) {
        whereClause.status = {
            in: statuses as any,
        }
    }

    if (date) {
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        whereClause.originalOrderDate = {
            gte: startOfDay,
            lte: endOfDay,
        }
    }

    if (backorderReferences && backorderReferences.length > 0) {
        whereClause.backorderReference = {
            in: backorderReferences,
        }
    }

    return await prisma.backorder.findMany({
        where: whereClause,
        include: {
            customer: true,
            agency: true,
            site: true,
            company: {
                include: {
                    currencies: true,
                },
            },
            backorderItems: {
                include: {
                    product: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    })
}

export async function getFilteredBackordersByStatus(
    request: Request,
    statuses: string[]
) {
    const user = await requireBetterAuthUser(request, ["read:backorders"])

    return await prisma.backorder.findMany({
        where: {
            companyId: user.companyId!,
            status: {
                in: statuses as any,
            },
        },
        include: {
            customer: true,
            agency: true,
            site: true,
            backorderItems: {
                include: {
                    product: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    })
}

export async function getBackorder(
    request: Request,
    backorderId: IBackorder["id"]
) {
    const user = await requireBetterAuthUser(request, ["read:backorders"])

    return await prisma.backorder.findFirst({
        where: {
            id: backorderId,
            companyId: user.companyId!,
        },
        include: {
            customer: true,
            agency: true,
            site: true,
            salesOrder: {
                select: {
                    id: true,
                    salesOrderReference: true,
                    salesOrderNumber: true,
                    orderDate: true,
                    status: true,
                },
            },
            company: {
                include: {
                    currencies: true,
                },
            },
            backorderItems: {
                include: {
                    product: true,
                },
            },
        },
    })
}

export async function getMaxBackorderNumber(request: Request): Promise<string> {
    const user = await requireBetterAuthUser(request, ["read:backorders"])

    const lastBackorder = await prisma.backorder.findFirst({
        where: {
            companyId: user.companyId!,
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            backorderNumber: true,
        },
    })

    if (!lastBackorder?.backorderNumber) {
        return "000001"
    }

    // Extract the numeric part from "BO-000001" format
    const numericPart = lastBackorder.backorderNumber.split("-")[1]
    const lastNumber = parseInt(numericPart) || 0
    const nextNumber = lastNumber + 1

    return nextNumber.toString().padStart(6, "0")
}

export async function createBackorder(
    request: Request,
    backorder: IBackorder
) {
    const user = await requireBetterAuthUser(request, ["create:backorders"])

    try {
        const backorderNumber = await getMaxBackorderNumber(request)
        // Auto-generate backorder reference using the backorder number
        const backorderReference = `BO-${backorderNumber}`
        const fullBackorderNumber = `BO-${backorderNumber}`

        await prisma.backorder.create({
            data: {
                status: BACKORDER_STATUSES.PENDING,
                expectedFulfillDate: backorder.expectedFulfillDate,
                originalOrderDate: new Date(backorder.originalOrderDate),
                backorderReference,
                backorderNumber: fullBackorderNumber,
                notes: backorder.notes,
                company: {
                    connect: {
                        id: user.companyId!,
                    },
                },
                customer: {
                    connect: {
                        id: backorder.customerId,
                    },
                },
                agency: {
                    connect: {
                        id: backorder.agencyId,
                    },
                },
                site: {
                    connect: {
                        id: backorder.siteId,
                    },
                },
                backorderItems: {
                    create: backorder.backorderItems?.map((item) => ({
                        productId: item.productId,
                        orderedQuantity: item.orderedQuantity,
                        fulfilledQuantity: 0,
                        remainingQuantity: item.orderedQuantity,
                        rate: item.rate,
                        amount: item.amount,
                        status: BACKORDER_ITEM_STATUSES.PENDING,
                    })) as any,
                },
            },
        })

        return {
            notification: {
                message: "Backorder created successfully",
                status: "Success",
                redirectTo: "/backorders",
            },
        }
    } catch (error) {
        console.error("Create backorder error:", error)
        return {
            notification: {
                message: "Backorder could not be created",
                status: "Error",
            },
        }
    }
}

export async function updateBackorder(
    request: Request,
    backorder: IBackorder
) {
    const user = await requireBetterAuthUser(request, ["update:backorders"])

    const foundBackorder = await prisma.backorder.findFirst({
        where: {
            backorderReference: backorder?.backorderReference,
            id: { not: backorder.id },
            companyId: user.companyId!,
        },
    })

    if (foundBackorder) {
        return {
            errors: {
                backorderReference:
                    "A backorder already exists with this reference",
            },
        }
    }

    try {
        await prisma.backorder.update({
            where: { id: backorder.id },
            data: {
                backorderReference: backorder.backorderReference,
                customer: { connect: { id: backorder.customerId } },
                site: { connect: { id: backorder.siteId } },
                agency: { connect: { id: backorder.agencyId } },
                expectedFulfillDate: backorder.expectedFulfillDate,
                originalOrderDate: backorder.originalOrderDate,
                backorderItems: {
                    deleteMany: {},
                    create: backorder.backorderItems?.map((item) => ({
                        productId: item.productId,
                        orderedQuantity: item.orderedQuantity,
                        fulfilledQuantity: item.fulfilledQuantity || 0,
                        remainingQuantity: item.remainingQuantity,
                        rate: item.rate,
                        amount: item.amount,
                        status: item.status || BACKORDER_ITEM_STATUSES.PENDING,
                    })) as any,
                },
                notes: backorder.notes,
            },
        })

        return {
            notification: {
                message: "Backorder updated successfully",
                status: "Success",
                redirectTo: "/backorders",
            },
        }
    } catch (error) {
        console.error("Update backorder error:", error)
        return {
            notification: {
                message: "Backorder could not be updated",
                status: "Error",
                autoClose: false,
            },
        }
    }
}

export async function updateBackorderStatus(
    request: Request,
    {
        backorderId,
        status,
    }: { backorderId: IBackorder["id"]; status: IBackorder["status"] }
) {
    const user = await requireBetterAuthUser(request, ["update:backorders"])

    try {
        await prisma.backorder.update({
            where: {
                id: backorderId,
                companyId: user.companyId!,
            },
            data: {
                status,
            },
        })

        return {
            notification: {
                message: "Backorder status updated successfully",
                status: "Success",
            },
        }
    } catch (error) {
        console.error("Update backorder status error:", error)
        return {
            notification: {
                message: "Backorder status could not be updated",
                status: "Error",
            },
        }
    }
}

export async function fulfillBackorderItem(
    request: Request,
    {
        backorderItemId,
        fulfilledQuantity,
    }: { backorderItemId: string; fulfilledQuantity: number }
) {
    const user = await requireBetterAuthUser(request, ["update:backorders"])

    try {
        const backorderItem = await prisma.backorderItem.findFirst({
            where: {
                id: backorderItemId,
                backorder: {
                    companyId: user.companyId!,
                },
            },
            include: {
                backorder: {
                    include: {
                        backorderItems: true,
                    },
                },
            },
        })

        if (!backorderItem) {
            return {
                notification: {
                    message: "Backorder item not found",
                    status: "Error",
                },
            }
        }

        const newFulfilledQuantity = backorderItem.fulfilledQuantity + fulfilledQuantity
        const remainingQuantity = backorderItem.orderedQuantity - newFulfilledQuantity

        let itemStatus: any = BACKORDER_ITEM_STATUSES.PENDING
        if (remainingQuantity === 0) {
            itemStatus = BACKORDER_ITEM_STATUSES.FULFILLED
        } else if (newFulfilledQuantity > 0) {
            itemStatus = BACKORDER_ITEM_STATUSES.PARTIALLY_FULFILLED
        }

        // Update the backorder item
        await prisma.backorderItem.update({
            where: { id: backorderItemId },
            data: {
                fulfilledQuantity: newFulfilledQuantity,
                remainingQuantity,
                status: itemStatus,
            },
        })

        // Check if all items in the backorder are fulfilled
        const updatedBackorder = await prisma.backorder.findFirst({
            where: { id: backorderItem.backorderId },
            include: { backorderItems: true },
        })

        if (updatedBackorder) {
            const allItemsFulfilled = updatedBackorder.backorderItems.every(
                item => item.status === BACKORDER_ITEM_STATUSES.FULFILLED
            )
            const someItemsFulfilled = updatedBackorder.backorderItems.some(
                item => item.status === BACKORDER_ITEM_STATUSES.FULFILLED ||
                    item.status === BACKORDER_ITEM_STATUSES.PARTIALLY_FULFILLED
            )

            let backorderStatus: any = BACKORDER_STATUSES.PENDING
            if (allItemsFulfilled) {
                backorderStatus = BACKORDER_STATUSES.FULFILLED
            } else if (someItemsFulfilled) {
                backorderStatus = BACKORDER_STATUSES.PARTIAL
            }

            await prisma.backorder.update({
                where: { id: backorderItem.backorderId },
                data: { status: backorderStatus },
            })
        }

        return {
            notification: {
                message: "Backorder item fulfilled successfully",
                status: "Success",
            },
        }
    } catch (error) {
        console.error("Fulfill backorder item error:", error)
        return {
            notification: {
                message: "Backorder item could not be fulfilled",
                status: "Error",
            },
        }
    }
}
