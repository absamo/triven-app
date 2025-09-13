import { pdf } from '@react-pdf/renderer';
import type { ActionFunction } from "react-router";
import { USER_ROLES } from "~/app/common/constants";
import { requireBetterAuthUser } from "~/app/services/better-auth.server";
import { getProducts } from "~/app/services/products.server";
import ProductListPDF from "~/app/utils/pdfExport/pdfProductsExport";

export const action: ActionFunction = async ({ request }) => {
    // Ensure user has permission to read products
    const user = await requireBetterAuthUser(request, ["read:products"]);

    try {
        // Only admin users can export products from all sites
        const isAdmin = user?.role?.name === USER_ROLES.ADMIN;

        // Get ALL products from the database (no pagination)
        const allProducts = await getProducts(request, {
            limit: 10000, // Large limit to get all products
            offset: 0,
            search: undefined, // No search filter for full export
            allSites: isAdmin, // Only admins can export products from all sites
        });

        // Cast the products to the expected type (the PDF component is flexible enough to handle this)
        const productsForPDF = allProducts as any[];

        // Generate the PDF
        const pdfDocument = <ProductListPDF products={productsForPDF} />;
        const pdfBlob = await pdf(pdfDocument).toBlob();

        // Convert blob to buffer
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const pdfBuffer = new Uint8Array(arrayBuffer);

        // Return the PDF as a response
        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="products-report-${new Date().toISOString().split('T')[0]}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Error generating PDF export:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to generate PDF export' }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
};
