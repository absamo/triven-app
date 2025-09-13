import { Table, Text, Title } from "@mantine/core"
import { useTranslation } from "react-i18next"
import classes from "./InventoryOverview.module.css"

interface InventoryOverviewProps {
    analyticsData: {
        totalProducts: number
        totalValue: number
        lowStockItems: number
        outOfStockItems: number
        products: Array<{
            id: string
            name: string
            sku: string
            categoryName: string
            qtyOrdered: number
            qtyIn: number
            qtyOut: number
            stockOnHand: number
            committedStock: number
            availableForSale: number
            costPrice: number
            sellingPrice: number
            reorderPoint: number
        }>
    }
    permissions: string[]
}

export default function InventoryOverview({ analyticsData, permissions }: InventoryOverviewProps) {
    const { t } = useTranslation('inventory')
    const { t: tCommon } = useTranslation('common')

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <Title order={2} className={classes.title}>
                    {t('inventoryOverview')}
                </Title>
                <Text className={classes.description}>
                    Comprehensive inventory analytics including stock levels, order quantities, and availability.
                </Text>
            </div>

            <Table
                striped
                highlightOnHover
                withTableBorder
                withColumnBorders
                className={classes.table}
            >
                <Table.Thead>
                    <Table.Tr className={classes.tableHeader}>
                        <Table.Th className={classes.tableHeaderCell}>
                            Product Name
                        </Table.Th>
                        <Table.Th className={classes.tableHeaderCellRight}>
                            Qty Ordered
                        </Table.Th>
                        <Table.Th className={classes.tableHeaderCellRight}>
                            Qty In
                        </Table.Th>
                        <Table.Th className={classes.tableHeaderCellRight}>
                            Qty Out
                        </Table.Th>
                        <Table.Th className={classes.tableHeaderCellRight}>
                            Stock on Hand
                        </Table.Th>
                        <Table.Th className={classes.tableHeaderCellRight}>
                            Committed Stock
                        </Table.Th>
                        <Table.Th className={classes.tableHeaderCellRight}>
                            Available for Sale
                        </Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {analyticsData.products.map((product) => (
                        <Table.Tr key={product.id}>
                            <Table.Td className={classes.tableCell}>
                                <Text size="sm">{product.name}</Text>
                            </Table.Td>
                            <Table.Td className={classes.tableCellRight}>
                                <Text size="sm">{product.qtyOrdered}</Text>
                            </Table.Td>
                            <Table.Td className={classes.tableCellRight}>
                                <Text size="sm">{product.qtyIn}</Text>
                            </Table.Td>
                            <Table.Td className={classes.tableCellRight}>
                                <Text size="sm">{product.qtyOut}</Text>
                            </Table.Td>
                            <Table.Td className={classes.tableCellRight}>
                                <Text
                                    size="sm"
                                    className={`${classes.stockValue} ${product.stockOnHand <= product.reorderPoint
                                        ? product.stockOnHand === 0
                                            ? classes.stockCritical
                                            : classes.stockLow
                                        : classes.stockGood
                                        }`}
                                >
                                    {product.stockOnHand}
                                </Text>
                            </Table.Td>
                            <Table.Td className={classes.tableCellRight}>
                                <Text size="sm">{product.committedStock}</Text>
                            </Table.Td>
                            <Table.Td className={classes.tableCellRight}>
                                <Text
                                    size="sm"
                                    className={`${classes.availableStock} ${product.availableForSale > 0
                                        ? classes.availablePositive
                                        : classes.availableNegative
                                        }`}
                                >
                                    {product.availableForSale}
                                </Text>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>

            {analyticsData.products.length === 0 && (
                <div className={classes.emptyState}>
                    <Text className={classes.emptyStateText}>
                        {t('products:noProductsFound', 'No products found. Add some products to see inventory details.')}
                    </Text>
                </div>
            )}
        </div>
    )
}
