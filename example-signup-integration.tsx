// Example integration for your signup page
// Add this to your signup success handler after user creation

import { usePostSignupSubscription } from "~/app/lib/hooks/usePostSignupSubscription"

export function SignupPage() {
    const { planSelection, handlePostSignupSubscription } = usePostSignupSubscription()

    // In your signup success handler (after user is created and logged in):
    const handleSignupSuccess = async () => {
        // If user came from a pricing plan selection, create subscription
        if (planSelection) {
            await handlePostSignupSubscription()
        } else {
            // Regular signup, redirect to dashboard
            window.location.href = "/dashboard"
        }
    }

    // Show plan selection info in the signup form if present
    const renderPlanInfo = () => {
        if (!planSelection) return null

        return (
            <div className="plan-selection-info">
                <h3>Selected Plan: {planSelection.planId}</h3>
                <p>
                    {planSelection.interval === 'year' ? 'Yearly' : 'Monthly'} billing
                    • {planSelection.trialDays} days free trial
                </p>
            </div>
        )
    }

    return (
        <div>
            {renderPlanInfo()}
            {/* Your signup form */}
            {/* After successful signup, call handleSignupSuccess() */}
        </div>
    )
}