export default {
  // Common
  company: 'Triven',
  support: 'The Triven Team',
  bestRegards: 'Best regards,',
  needHelp: 'Need help?',
  contactSupport: 'Contact Support',
  manageBilling: 'Manage Billing',
  viewDashboard: 'View Dashboard',
  accessDashboard: 'Access Dashboard',

  // Free Trial Welcome
  freeTrialWelcome: {
    subject: 'Welcome to your Triven free trial! Start exploring today 🚀',
    preview: 'Welcome to your Triven free trial! Start exploring today 🚀',
    title: 'Welcome to your free trial!',
    greeting: 'Hi {name},',
    intro:
      "Congratulations! You've successfully started your Triven free trial. You now have full access to our powerful inventory management platform for the next {trialEndDate}.",
    trialIncludes: '🎉 Your free trial includes:',
    features: {
      inventoryTracking: '✓ Complete inventory tracking',
      analytics: '✓ Real-time analytics dashboard',
      orderManagement: '✓ Order management',
      supplierManagement: '✓ Supplier management',
      multiLocation: '✓ Multi-location support',
      support: '✓ Customer support',
    },
    startManaging: 'Start Managing Inventory',
    quickStart: 'Quick start guide:',
    steps: {
      addProducts: '1. Add your first products to the inventory',
      setupSuppliers: '2. Set up your suppliers and locations',
      createOrder: '3. Create your first purchase order',
      exploreAnalytics: '4. Explore the real-time analytics',
    },
    trialExpiry:
      'Your trial will expire on {trialEndDate}. To continue using Triven without interruption, you can upgrade to a paid plan at any time.',
    viewPricing: 'View Pricing Plans',
    supportText:
      'Need help getting started? Our support team is here to help you make the most of your trial.',
  },

  // Subscription Confirmation
  subscriptionConfirmation: {
    subject: 'Welcome to Triven {planName}! Your subscription is active 🎉',
    preview: 'Welcome to Triven {planName}! Your subscription is active 🎉',
    title: 'Subscription Confirmed!',
    greeting: 'Hi {name},',
    intro:
      'Thank you for subscribing to Triven! Your {planName} plan is now active and you have full access to all premium features.',
    subscriptionDetails: 'Your Subscription Details',
    plan: 'Plan:',
    price: 'Price:',
    nextBilling: 'Next billing:',
    status: 'Status:',
    active: 'Active',
    whatsIncluded: "What's included in your {planName} plan:",
    features: {
      unlimitedTracking: '✓ Unlimited inventory tracking',
      advancedAnalytics: '✓ Advanced analytics and reporting',
      multiLocation: '✓ Multi-location management',
      apiAccess: '✓ API access',
      prioritySupport: '✓ Priority customer support',
      customIntegrations: '✓ Custom integrations',
    },
    billingInfo: 'Billing Information',
    billingText:
      'Your subscription will automatically renew on {nextBillingDate}. You can manage your billing settings, update payment methods, or cancel your subscription at any time.',
    supportText: 'Questions about your subscription? Our support team is here to help!',
  },

  // Plan Upgrade
  planUpgrade: {
    subject: 'Plan upgraded successfully! Welcome to {newPlan} 🚀',
    preview: 'Plan upgraded successfully! Welcome to {newPlan} 🚀',
    title: 'Plan Upgraded Successfully!',
    greeting: 'Hi {name},',
    intro:
      "Great news! You've successfully upgraded from {oldPlan} to {newPlan}. Your new plan is active immediately and you now have access to all enhanced features.",
    upgradeSummary: '🎉 Upgrade Summary',
    newPrice: 'New Price:',
    upgradeDate: 'Upgrade Date:',
    nextBilling: 'Next Billing:',
    exploreFeatures: 'Explore New Features',
    newFeatures: 'New features now available:',
    features: {
      advancedAnalytics: '✓ Advanced inventory analytics',
      automatedReorder: '✓ Automated reorder points',
      customReporting: '✓ Custom reporting',
      apiAccess: '✓ API access for integrations',
      prioritySupport: '✓ Priority customer support',
      multiLocation: '✓ Multi-location management',
    },
    billingInfo: 'Billing Information',
    billingText:
      "You'll be charged {newPrice} for your {newPlan} plan starting with your next billing cycle on {nextBillingDate}. You can view your complete billing history and manage your subscription settings anytime.",
    viewBilling: 'View Billing Details',
    thankYou:
      "Thank you for choosing Triven! We're excited to help you take your inventory management to the next level.",
  },

  // Payment Method Update
  paymentMethodUpdate: {
    subject: 'Payment method updated successfully 💳',
    preview: 'Payment method updated successfully 💳',
    title: 'Payment Method Updated',
    greeting: 'Hi {name},',
    intro:
      "We're confirming that your payment method has been successfully updated in your Triven account.",
    updatedPayment: '💳 Updated Payment Method',
    cardType: 'Card Type:',
    cardNumber: 'Card Number:',
    updated: 'Updated:',
    status: 'Status:',
    active: 'Active',
    nextSteps: 'Next Steps',
    nextStepsText:
      'Your new payment method will be used for your next billing cycle on {nextBillingDate}. Your subscription will continue without interruption.',
    viewBilling: 'View Billing Settings',
    securityNotice: '🔒 Security Notice',
    securityText:
      "If you didn't make this change, please contact our support team immediately. Your account security is our top priority.",
    needHelp: 'Need Help?',
    helpText:
      'You can manage all your billing settings, update payment methods, or view your billing history anytime from your account dashboard.',
    supportText:
      'If you have any questions about your payment method or billing, our support team is here to help.',
  },

  // Payment Failed
  paymentFailed: {
    subject: 'Action required: Payment failed for your Triven subscription ⚠️',
    preview: 'Action required: Payment failed for your Triven subscription ⚠️',
    title: 'Payment Failed - Action Required',
    greeting: 'Hi {name},',
    intro:
      'We were unable to process your payment for your Triven {planName} subscription. To ensure uninterrupted service, please update your payment method as soon as possible.',
    paymentDetails: '⚠️ Payment Details',
    plan: 'Plan:',
    amount: 'Amount:',
    failureReason: 'Failure Reason:',
    nextRetry: 'Next Retry:',
    updatePayment: 'Update Payment Method',
    whatHappensNext: '📅 What Happens Next',
    timeline: {
      today: 'Today: Payment failed - update your payment method',
      retry: "{retryDate}: We'll automatically retry the payment",
      suspension: '{suspensionDate}: Account will be suspended if payment still fails',
    },
    howToResolve: 'How to resolve this:',
    steps: {
      updateMethod: '1. Click "Update Payment Method" above',
      addNew: '2. Add a new payment method or update your existing one',
      verifyInfo: '3. Verify your billing information is correct',
      contactBank: '4. Contact your bank if you need assistance',
    },
    needHelp: 'Need Help?',
    helpText:
      "If you're having trouble updating your payment method or have questions about this charge, our support team is here to help.",
    viewBilling: 'View Billing History',
    keepActive:
      'We want to keep your Triven service active. Please update your payment method to avoid any service interruption.',
  },

  // Payment Success
  paymentSuccess: {
    subject: 'Payment received - Thank you! Your Triven subscription is active 💳',
    preview: 'Payment received - Thank you! Your Triven subscription is active 💳',
    title: 'Payment Received - Thank You!',
    greeting: 'Hi {name},',
    intro:
      "Thank you! We've successfully processed your payment for your Triven {planName} subscription. Your service continues without interruption.",
    paymentConfirmation: '✅ Payment Confirmation',
    amountPaid: 'Amount Paid:',
    plan: 'Plan:',
    paymentDate: 'Payment Date:',
    invoiceNumber: 'Invoice Number:',
    nextBilling: 'Next Billing:',
    status: 'Status:',
    paid: 'Paid',
    downloadInvoice: 'Download Invoice',
    planIncludes: 'Your {planName} plan includes:',
    features: {
      unlimitedTracking: '✓ Unlimited inventory tracking',
      advancedAnalytics: '✓ Advanced analytics and reporting',
      multiLocation: '✓ Multi-location management',
      apiAccess: '✓ API access and integrations',
      prioritySupport: '✓ Priority customer support',
      automatedBackup: '✓ Automated backup and security',
    },
    billingInfo: 'Billing Information',
    billingText:
      'Your next payment of {amount} will be automatically charged on {nextBillingDate}. You can manage your billing settings, view payment history, or update your payment method anytime.',
    thankYou:
      "Thank you for choosing Triven for your inventory management needs. We're here to help your business succeed!",
  },

  // Trial Expiring
  trialExpiring: {
    subject: "Your Triven trial expires {expirationDate} - Don't lose access! ⏰",
    preview: "Your Triven trial expires {expirationDate} - Don't lose access! ⏰",
    title: 'Your trial expires {expirationDate}!',
    greeting: 'Hi {name},',
    intro:
      "Your Triven free trial is coming to an end. You have {daysLeft} days left to continue enjoying all the powerful inventory management features you've been using.",
    trialStatus: '⏰ Trial Status',
    daysRemaining: 'Days Remaining:',
    expirationDate: 'Expiration Date:',
    recommendedPlan: 'Recommended Plan:',
    upgradeNow: 'Upgrade Now - {planPrice}/month',
    dontLoseAccess: "Don't lose access to:",
    features: {
      inventoryData: '✓ All your inventory data and products',
      analytics: '✓ Advanced analytics and insights',
      reorderNotifications: '✓ Automated reorder notifications',
      multiLocation: '✓ Multi-location management',
      customReports: '✓ Custom reports and integrations',
      prioritySupport: '✓ Priority customer support',
    },
    trialUsage: '📊 Your Trial Usage',
    usageText:
      "During your trial, you've experienced the power of professional inventory management. Here's what upgrading means:",
    upgradePoints: {
      keepData: '• Keep all your data and settings',
      unlimitedTracking: '• Unlock unlimited inventory tracking',
      advancedFeatures: '• Access advanced features and integrations',
      prioritySupport: '• Get priority support',
    },
    whatIfDontUpgrade: "What happens if I don't upgrade?",
    suspensionText:
      "After your trial expires, your account will be temporarily suspended. You'll lose access to your dashboard and data until you upgrade to a paid plan. Don't worry - your data is safe and will be restored when you upgrade.",
    choosePlan: 'Choose Your Plan',
    supportText:
      'Questions about upgrading? Our team is here to help you choose the right plan for your business.',
  },

  // Subscription Cancelled
  subscriptionCancelled: {
    subject: 'Your Triven subscription has been cancelled',
    preview: 'Your Triven subscription has been cancelled',
    title: 'Subscription Cancelled',
    greeting: 'Hi {name},',
    intro:
      "We're sorry to see you go! Your Triven {planName} subscription has been cancelled as requested. We've confirmed the details below.",
    cancellationDetails: '📋 Cancellation Details',
    plan: 'Plan:',
    cancelled: 'Cancelled:',
    accessUntil: 'Access Until:',
    reason: 'Reason:',
    status: 'Status:',
    cancelledStatus: 'Cancelled',
    whatThisMeans: 'What this means:',
    implications: {
      accessUntil: "• You'll continue to have full access until {accessUntil}",
      noCharges: '• No future charges will be made to your payment method',
      dataStored: '• Your data will be safely stored for 90 days after cancellation',
      reactivate: '• You can reactivate your subscription anytime during this period',
    },
    beforeYouGo: '🔄 Before You Go',
    beforeText:
      "Would you like to export your data or consider reactivating? We're here to help with whatever you need.",
    exportData: 'Export My Data',
    reactivateSubscription: 'Reactivate Subscription',
    feedback: "We'd love your feedback",
    feedbackText:
      'Your experience matters to us. If you have a moment, please let us know how we could have served you better. Your feedback helps us improve Triven for everyone.',
    shareFeedback: 'Share Feedback',
    reactivateLater: 'Need to reactivate later?',
    reactivateText:
      'You can reactivate your subscription anytime by logging into your account. Your data and settings will be restored exactly as you left them.',
    thankYou:
      'Thank you for being a part of the Triven community. We hope to see you again in the future!',
  },
}
