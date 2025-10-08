import { StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import type { IProduct } from '~/app/common/validations/productSchema'
import PDFLayout, { pdfLayoutStyles } from './pdfLayout'

// Create styles for the PDF content (extends the base layout styles)
const styles = StyleSheet.create({
  // Inherit from base layout styles
  ...pdfLayoutStyles,

  // Product-specific styles
  summarySection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 5,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a202c',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#e2e8f0',
    marginTop: 25,
    marginBottom: 80,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '16.66%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 8,
  },
  tableCol: {
    width: '16.66%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#e2e8f0',
    padding: 8,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: 9,
    color: '#1f2937',
  },
})

// Helper component for table header
const TableHeader = () => (
  <View style={styles.tableRow}>
    <View style={styles.tableColHeader}>
      <Text style={styles.tableCellHeader}>Product Name</Text>
    </View>
    <View style={styles.tableColHeader}>
      <Text style={styles.tableCellHeader}>SKU</Text>
    </View>
    <View style={styles.tableColHeader}>
      <Text style={styles.tableCellHeader}>Stock</Text>
    </View>
    <View style={styles.tableColHeader}>
      <Text style={styles.tableCellHeader}>Price</Text>
    </View>
    <View style={styles.tableColHeader}>
      <Text style={styles.tableCellHeader}>Status</Text>
    </View>
    <View style={styles.tableColHeader}>
      <Text style={styles.tableCellHeader}>Value</Text>
    </View>
  </View>
)

// Helper component for product row
const ProductRow = ({ product, index }: { product: IProduct; index: number }) => {
  const stockQuantity = product.physicalStockOnHand || 0
  const productPrice = Number(product.sellingPrice || 0)
  const productValue = stockQuantity * productPrice
  const status =
    stockQuantity === 0
      ? 'Out of Stock'
      : stockQuantity <= (product.safetyStockLevel || 10)
        ? 'Low Stock'
        : 'In Stock'

  return (
    <View style={styles.tableRow} key={product.id || index} break={false} wrap={false}>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>{product.name}</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>{product.sku}</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>{stockQuantity}</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>${productPrice.toFixed(2)}</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>{status}</Text>
      </View>
      <View style={styles.tableCol}>
        <Text style={styles.tableCell}>${productValue.toFixed(2)}</Text>
      </View>
    </View>
  )
}

// Product list PDF document component
const ProductListPDF = ({ products }: { products: IProduct[] }) => {
  const currentDate = new Date().toLocaleDateString()

  // Calculate summary statistics
  const totalProducts = products.length
  const totalValue = products.reduce(
    (sum, product) => sum + (product.physicalStockOnHand || 0) * Number(product.sellingPrice || 0),
    0
  )
  const lowStockCount = products.filter(
    (product) => (product.physicalStockOnHand || 0) <= (product.safetyStockLevel || 10)
  ).length
  const outOfStockCount = products.filter(
    (product) => (product.physicalStockOnHand || 0) === 0
  ).length

  // Summary section component
  const summaryContent = (
    <View style={styles.summarySection}>
      <Text style={styles.summaryTitle}>Summary</Text>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total Products:</Text>
        <Text style={styles.summaryValue}>{totalProducts}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total Inventory Value:</Text>
        <Text style={styles.summaryValue}>${totalValue.toLocaleString()}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Low Stock Items:</Text>
        <Text style={styles.summaryValue}>{lowStockCount}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Out of Stock Items:</Text>
        <Text style={styles.summaryValue}>{outOfStockCount}</Text>
      </View>
    </View>
  )

  return (
    <PDFLayout
      header={{
        title: 'Product Inventory Report',
        subtitle: `Generated on ${currentDate}`,
        additionalContent: summaryContent,
      }}
    >
      {/* Products Table */}
      <View style={styles.table}>
        <TableHeader />
        {products.map((product, index) => (
          <ProductRow key={product.id || index} product={product} index={index} />
        ))}
      </View>
    </PDFLayout>
  )
}

// Function to generate and download PDF
export const exportProductsToPDF = async (
  products: IProduct[],
  filename: string = 'products-report.pdf'
) => {
  try {
    const blob = await pdf(<ProductListPDF products={products} />).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF export')
  }
}

export default ProductListPDF
