// Debug script to test stock status logic
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock the stock status function to debug
function getStockStatus(product) {
    const stockOnHand = product.accountingStockOnHand || 0;
    const reorderPoint = product.reorderPoint || 0;

    console.log(`Product: ${product.name}`);
    console.log(`  Stock: ${stockOnHand}`);
    console.log(`  Reorder Point: ${reorderPoint}`);

    if (stockOnHand === 0) {
        console.log(`  Status: OutOfStock\n`);
        return 'OutOfStock';
    }

    if (stockOnHand <= reorderPoint) {
        console.log(`  Status: Critical\n`);
        return 'Critical';
    }

    if (stockOnHand > reorderPoint && stockOnHand - reorderPoint <= reorderPoint * 0.6) {
        console.log(`  Status: LowStock\n`);
        return 'LowStock';
    }

    console.log(`  Status: Available\n`);
    return 'Available';
}

async function debugStockStatus() {
    try {
        const company = await prisma.company.findFirst();
        if (!company) {
            console.log('No company found');
            return;
        }

        const products = await prisma.product.findMany({
            where: { companyId: company.id, active: true },
            take: 10
        });

        console.log('=== DEBUGGING STOCK STATUS ===\n');

        products.forEach(product => {
            const productWithStock = {
                ...product,
                accountingStockOnHand: product.availableQuantity
            };

            const status = getStockStatus(productWithStock);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugStockStatus();