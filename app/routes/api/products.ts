import { type LoaderFunction } from "react-router";
import { requireBetterAuthUser } from "~/app/services/better-auth.server";
import { getProducts } from "~/app/services/products.server";

export const loader: LoaderFunction = async ({ request }) => {
    // Ensure user has permission to read products
    await requireBetterAuthUser(request, ["read:products"]);

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "1000");

    const products = await getProducts(request, { limit });

    return new Response(
        JSON.stringify({ products: products || [] }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }
    );
};
