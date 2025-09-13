import type { MetaFunction } from "react-router"
import PricingPage from "~/app/pages/Pricing"
import PublicLayout from "~/app/pages/PublicLayout"

export const meta: MetaFunction = () => {
    return [
        { title: "Pricing - Triven | Choose Your Perfect Plan" },
        {
            name: "description",
            content: "Choose the perfect plan for your business. Professional, Business, and Enterprise plans with powerful add-ons. Scale your operations with Triven's comprehensive inventory management solution."
        },
        { name: "keywords", content: "pricing, plans, subscription, inventory management, business software, enterprise" },
    ]
}

export default function Pricing() {
    return (
        <PublicLayout>
            <PricingPage />
        </PublicLayout>
    )
}
