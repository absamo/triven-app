import { ActionIcon, Alert, Button, Group, NumberInput, Select, Table, Text } from "@mantine/core"
import { IconExclamationCircle, IconPlus, IconTrash } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { BACKORDER_ITEM_STATUSES } from "~/app/common/constants"
import type { IProduct } from "~/app/common/validations/productSchema"
import classes from "./BackorderItemsForm.module.css"

interface BackorderItemsFormProps {
    form: any
    products: IProduct[]
    agencyId: string
    siteId: string
    errors: Record<string, string>
    alertComponent?: React.ReactNode
}

export default function BackorderItemsForm({
    form,
    products,
    agencyId,
    siteId,
    errors,
    alertComponent,
}: BackorderItemsFormProps) {
    const { t } = useTranslation(['backorders', 'common'])
    const [selectedProduct, setSelectedProduct] = useState<string>("")
    const [quantity, setQuantity] = useState<number>(1)
    const [unitPrice, setUnitPrice] = useState<number>(0)

    // Clear local state when agency or site changes
    useEffect(() => {
        setSelectedProduct("")
        setQuantity(1)
        setUnitPrice(0)
    }, [agencyId, siteId])

    // Filter for out-of-stock products that haven't been added to backorder items yet
    // and match the selected agency and site
    const usedProductIds = form.values.backorderItems.map((item: any) => item.productId)
    const outOfStockProducts = products.filter(product =>
        !usedProductIds.includes(product.id) &&
        (product.availableQuantity === 0 || product.availableQuantity === null) &&
        (!agencyId || product.agencyId === agencyId) &&
        (!siteId || product.siteId === siteId)
    )

    const productOptions = outOfStockProducts.map((product) => ({
        value: product.id!,
        label: `${product.name} - ${product.sku} (Out of Stock)`,
    }))

    const addItem = () => {
        if (!selectedProduct) return

        const product = products.find(p => p.id === selectedProduct)
        if (!product) return

        const newItem = {
            productId: selectedProduct,
            product,
            orderedQuantity: quantity,
            fulfilledQuantity: 0,
            remainingQuantity: quantity,
            rate: unitPrice,
            amount: quantity * unitPrice,
            status: BACKORDER_ITEM_STATUSES.PENDING,
        }

        form.setFieldValue("backorderItems", [...form.values.backorderItems, newItem])

        // Reset form
        setSelectedProduct("")
        setQuantity(1)
        setUnitPrice(0)
    }

    const removeItem = (index: number) => {
        const items = [...form.values.backorderItems]
        const removedItem = items[index]
        items.splice(index, 1)
        form.setFieldValue("backorderItems", items)

        // Reset selected product if the removed product was selected
        if (selectedProduct === removedItem.productId) {
            setSelectedProduct("")
        }
    }

    const rows = form.values.backorderItems.map((item: any, index: number) => (
        <Table.Tr key={index}>
            <Table.Td>{item.product?.name || "Unknown Product"}</Table.Td>
            <Table.Td>{item.product?.sku || "N/A"}</Table.Td>
            <Table.Td>
                <Text size="sm">
                    {item.orderedQuantity}
                </Text>
            </Table.Td>
            <Table.Td>
                <Text size="sm">
                    ${item.rate?.toFixed(2)}
                </Text>
            </Table.Td>
            <Table.Td>
                <Text size="sm">
                    ${item.amount?.toFixed(2)}
                </Text>
            </Table.Td>
            <Table.Td>
                <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() => removeItem(index)}
                >
                    <IconTrash size={16} />
                </ActionIcon>
            </Table.Td>
        </Table.Tr>
    ))

    const totalAmount = form.values.backorderItems.reduce(
        (sum: number, item: any) => sum + (item.amount || 0),
        0
    )

    return (
        <>
            <Text size="lg" fw={500} mb="md">
                {t('items')}
            </Text>

            <Group mb="md" align="end">
                <Select
                    placeholder={
                        !agencyId
                            ? t('common:selectAgencyFirst', 'Please select an agency first')
                            : !siteId
                                ? t('common:selectSiteFirst', 'Please select a site first')
                                : outOfStockProducts.length > 0
                                    ? t('selectOutOfStockProduct')
                                    : t('noOutOfStockProductsAvailable')
                    }
                    data={productOptions}
                    value={selectedProduct}
                    onChange={(value) => setSelectedProduct(value || "")}
                    searchable
                    disabled={!agencyId || !siteId || outOfStockProducts.length === 0}
                    style={{ flex: 1 }}
                />
                <NumberInput
                    label="Qté"
                    placeholder={t('orderedQuantity')}
                    value={quantity}
                    onChange={(value) => setQuantity(Number(value))}
                    min={1}
                    disabled={!selectedProduct}
                    style={{ width: 100 }}
                />
                <NumberInput
                    label={t('rate')}
                    placeholder={t('rate')}
                    value={unitPrice}
                    onChange={(value) => setUnitPrice(Number(value))}
                    min={0}
                    step={0.01}
                    disabled={!selectedProduct}
                    style={{ width: 100 }}
                />
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={addItem}
                    color="blue"
                    disabled={!selectedProduct}
                >
                    {t('common:add')}
                </Button>
            </Group>

            {/* Items Table */}
            <Table
                striped
                withTableBorder
            >
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>{t('productName')}</Table.Th>
                        <Table.Th>SKU</Table.Th>
                        <Table.Th>{t('orderedQuantity')}</Table.Th>
                        <Table.Th>{t('rate')}</Table.Th>
                        <Table.Th>{t('amount')}</Table.Th>
                        <Table.Th></Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {rows.length > 0 ? (
                        rows
                    ) : (
                        <Table.Tr>
                            <Table.Td colSpan={6} style={{ textAlign: "center" }}>
                                <Text c="dimmed">{t('noBackordersFound')}</Text>
                            </Table.Td>
                        </Table.Tr>
                    )}
                </Table.Tbody>
                {rows.length > 0 && (
                    <Table.Tfoot>
                        <Table.Tr className={classes.totalRow}>
                            <Table.Td colSpan={4} className={classes.totalCell}>
                                <Text fw={500} ta={"right"}>{t('common:total')}</Text>
                            </Table.Td>
                            <Table.Td className={classes.totalCell}>
                                <Text fw={500}>${totalAmount.toFixed(2)}</Text>
                            </Table.Td>
                            <Table.Td colSpan={2} className={classes.totalCell}></Table.Td>
                        </Table.Tr>
                    </Table.Tfoot>
                )}
            </Table>

            {alertComponent}

            {/* Display backorder items errors */}
            {Object.keys(form.errors).some(key => key.startsWith('backorderItems.') && key.includes('.')) && (
                <Alert
                    variant="light"
                    color="red"
                    icon={<IconExclamationCircle />}
                    mt="md"
                >
                    <Text size="sm" c="red">
                        {[...new Set(Object.entries(form.errors)
                            .filter(([key]) => key.startsWith('backorderItems.') && key.includes('.'))
                            .map(([, error]) => error))].join('. ')}
                    </Text>
                </Alert>
            )}
        </>
    )
}
