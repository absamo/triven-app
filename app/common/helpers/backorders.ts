import { BACKORDER_ITEM_STATUSES, BACKORDER_STATUSES } from "~/app/common/constants"

interface BackorderStatusInfo {
    label: string
    color: string
}

export function getBackorderStatusLabel(status: string): BackorderStatusInfo {
    switch (status) {
        case BACKORDER_STATUSES.PENDING:
            return { label: "Pending", color: "orange" }
        case BACKORDER_STATUSES.PARTIAL:
            return { label: "Partial", color: "blue" }
        case BACKORDER_STATUSES.FULFILLED:
            return { label: "Fulfilled", color: "green" }
        case BACKORDER_STATUSES.CANCELLED:
            return { label: "Cancelled", color: "red" }
        default:
            return { label: "Unknown", color: "gray" }
    }
}

export function getBackorderItemStatusLabel(status: string): BackorderStatusInfo {
    switch (status) {
        case BACKORDER_ITEM_STATUSES.PENDING:
            return { label: "Pending", color: "orange" }
        case BACKORDER_ITEM_STATUSES.PARTIALLY_FULFILLED:
            return { label: "Partially Fulfilled", color: "blue" }
        case BACKORDER_ITEM_STATUSES.FULFILLED:
            return { label: "Fulfilled", color: "green" }
        case BACKORDER_ITEM_STATUSES.CANCELLED:
            return { label: "Cancelled", color: "red" }
        default:
            return { label: "Unknown", color: "gray" }
    }
}
