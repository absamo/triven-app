import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'

import Stripe from 'stripe'
import {
  APPROVAL_ASSIGNEE_TYPES,
  APPROVAL_ENTITY_TYPES,
  APPROVAL_PRIORITIES,
  APPROVAL_REQUEST_TYPES,
  APPROVAL_STATUSES,
  BACKORDER_ITEM_STATUSES,
  BACKORDER_STATUSES,
  PURCHASE_ORDER_PAYMENT_TERMS,
  PURCHASE_ORDER_STATUSES,
  SALES_ORDERS_STATUSES,
  WORKFLOW_STEP_TYPES,
  WORKFLOW_TRIGGER_TYPES,
} from '~/app/common/constants'
import { createEan13 } from '~/app/common/helpers/inventories'
import { auth } from '~/app/lib/auth'
import { PRICING_PLANS } from '~/app/modules/stripe/plans'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

// Set faker seed for consistent demo data
faker.seed(123)

const prisma = new PrismaClient()

// Demo product categories with realistic inventory items
const DEMO_CATEGORIES = [
  {
    name: 'Electronics',
    description: 'Electronic devices and components',
    products: [
      { name: 'MacBook Pro 16"', brand: 'Apple', costPrice: 2200, sellingPrice: 2499 },
      { name: 'iPhone 15 Pro', brand: 'Apple', costPrice: 850, sellingPrice: 999 },
      { name: 'Samsung Galaxy S24', brand: 'Samsung', costPrice: 700, sellingPrice: 799 },
      { name: 'Dell XPS 13', brand: 'Dell', costPrice: 1000, sellingPrice: 1299 },
      { name: 'Sony WH-1000XM4', brand: 'Sony', costPrice: 250, sellingPrice: 349 },
      { name: 'iPad Pro 12.9"', brand: 'Apple', costPrice: 950, sellingPrice: 1099 },
      { name: 'Surface Pro 9', brand: 'Microsoft', costPrice: 900, sellingPrice: 1199 },
      { name: 'Nintendo Switch', brand: 'Nintendo', costPrice: 250, sellingPrice: 299 },
    ],
  },
  {
    name: 'Clothing',
    description: 'Apparel and fashion items',
    products: [
      { name: "Levi's 501 Jeans", brand: "Levi's", costPrice: 45, sellingPrice: 89 },
      { name: 'Nike Air Max 270', brand: 'Nike', costPrice: 90, sellingPrice: 150 },
      { name: 'Adidas Ultraboost 22', brand: 'Adidas', costPrice: 110, sellingPrice: 180 },
      { name: 'Ralph Lauren Polo Shirt', brand: 'Ralph Lauren', costPrice: 35, sellingPrice: 89 },
      { name: 'Patagonia Fleece Jacket', brand: 'Patagonia', costPrice: 120, sellingPrice: 199 },
      { name: 'Uniqlo Merino Sweater', brand: 'Uniqlo', costPrice: 25, sellingPrice: 49 },
      { name: 'Lululemon Leggings', brand: 'Lululemon', costPrice: 60, sellingPrice: 128 },
      { name: 'Champion Hoodie', brand: 'Champion', costPrice: 30, sellingPrice: 60 },
    ],
  },
  {
    name: 'Home & Garden',
    description: 'Home improvement and gardening supplies',
    products: [
      { name: 'Dyson V15 Vacuum', brand: 'Dyson', costPrice: 450, sellingPrice: 749 },
      { name: 'KitchenAid Stand Mixer', brand: 'KitchenAid', costPrice: 200, sellingPrice: 379 },
      { name: 'Philips Hue Smart Bulbs', brand: 'Philips', costPrice: 35, sellingPrice: 49 },
      { name: 'Nest Thermostat', brand: 'Google', costPrice: 180, sellingPrice: 249 },
      { name: 'Weber Genesis Grill', brand: 'Weber', costPrice: 600, sellingPrice: 899 },
      { name: 'Roomba i7+', brand: 'iRobot', costPrice: 450, sellingPrice: 599 },
      { name: 'Instant Pot Duo', brand: 'Instant Pot', costPrice: 60, sellingPrice: 99 },
      { name: 'Shark Navigator', brand: 'Shark', costPrice: 80, sellingPrice: 149 },
    ],
  },
  {
    name: 'Sports & Outdoors',
    description: 'Sports equipment and outdoor gear',
    products: [
      { name: 'Peloton Bike+', brand: 'Peloton', costPrice: 1800, sellingPrice: 2495 },
      { name: 'Yeti Cooler 45', brand: 'Yeti', costPrice: 200, sellingPrice: 325 },
      { name: 'Coleman Tent 6-Person', brand: 'Coleman', costPrice: 120, sellingPrice: 199 },
      { name: 'North Face Backpack', brand: 'The North Face', costPrice: 80, sellingPrice: 149 },
      { name: 'REI Sleeping Bag', brand: 'REI', costPrice: 150, sellingPrice: 249 },
      { name: 'Hydro Flask Water Bottle', brand: 'Hydro Flask', costPrice: 25, sellingPrice: 44 },
      { name: 'Garmin Forerunner 945', brand: 'Garmin', costPrice: 400, sellingPrice: 599 },
      { name: 'Specialized Road Bike', brand: 'Specialized', costPrice: 1200, sellingPrice: 1899 },
    ],
  },
  {
    name: 'Books & Media',
    description: 'Books, magazines, and media products',
    products: [
      { name: 'The Great Gatsby', brand: 'Penguin Classics', costPrice: 8, sellingPrice: 15 },
      { name: 'Harry Potter Box Set', brand: 'Scholastic', costPrice: 35, sellingPrice: 59 },
      {
        name: 'National Geographic Magazine',
        brand: 'National Geographic',
        costPrice: 3,
        sellingPrice: 6,
      },
      { name: 'Kindle Paperwhite', brand: 'Amazon', costPrice: 90, sellingPrice: 139 },
      { name: 'Moleskine Notebook', brand: 'Moleskine', costPrice: 12, sellingPrice: 22 },
      { name: 'Blue Yeti Microphone', brand: 'Blue', costPrice: 80, sellingPrice: 129 },
      { name: 'Bose QuietComfort Earbuds', brand: 'Bose', costPrice: 200, sellingPrice: 279 },
      { name: 'Adobe Creative Suite', brand: 'Adobe', costPrice: 40, sellingPrice: 52 },
    ],
  },
]

// Demo supplier companies
const DEMO_SUPPLIERS = [
  {
    name: 'TechSource Electronics',
    email: 'orders@techsource.com',
    phone: '(555) 123-4567',
    companyName: 'TechSource Electronics Inc.',
    categories: ['Electronics'],
  },
  {
    name: 'Fashion Forward Supply',
    email: 'wholesale@fashionforward.com',
    phone: '(555) 234-5678',
    companyName: 'Fashion Forward Supply LLC',
    categories: ['Clothing'],
  },
  {
    name: 'Home Essentials Wholesale',
    email: 'sales@homeessentials.com',
    phone: '(555) 345-6789',
    companyName: 'Home Essentials Wholesale Corp',
    categories: ['Home & Garden'],
  },
  {
    name: 'Outdoor Adventure Gear',
    email: 'b2b@outdooradventure.com',
    phone: '(555) 456-7890',
    companyName: 'Outdoor Adventure Gear Ltd',
    categories: ['Sports & Outdoors'],
  },
  {
    name: 'Knowledge Publishers',
    email: 'distribution@knowledgepub.com',
    phone: '(555) 567-8901',
    companyName: 'Knowledge Publishers Group',
    categories: ['Books & Media'],
  },
]

// Demo customer data
const DEMO_CUSTOMERS = [
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '(555) 111-2222',
    companyName: 'Smith Enterprises',
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '(555) 222-3333',
    companyName: 'Johnson & Associates',
  },
  {
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@email.com',
    phone: '(555) 333-4444',
    companyName: 'Brown Industries',
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@email.com',
    phone: '(555) 444-5555',
    companyName: 'Davis Solutions',
  },
  {
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@email.com',
    phone: '(555) 555-6666',
    companyName: 'Wilson Corp',
  },
  {
    firstName: 'Lisa',
    lastName: 'Martinez',
    email: 'lisa.martinez@email.com',
    phone: '(555) 666-7777',
    companyName: 'Martinez Consulting',
  },
  {
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'robert.taylor@email.com',
    phone: '(555) 777-8888',
    companyName: 'Taylor Technologies',
  },
  {
    firstName: 'Amanda',
    lastName: 'Anderson',
    email: 'amanda.anderson@email.com',
    phone: '(555) 888-9999',
    companyName: 'Anderson Retail',
  },
]

async function cleanupDatabase() {
  console.log('🧹 Cleaning up existing database...')

  try {
    // Delete in correct order due to foreign key constraints
    // Start with tables that have no dependencies first

    // Better-auth tables (delete sessions and accounts before users)
    await prisma.session.deleteMany().catch(() => {})
    await prisma.account.deleteMany().catch(() => {})
    await prisma.verification.deleteMany().catch(() => {})

    // Business logic tables (delete children before parents)
    // Approval and workflow tables first
    await prisma.approvalComment.deleteMany().catch(() => {})
    await prisma.approvalRequest.deleteMany().catch(() => {})
    await prisma.workflowStepExecution.deleteMany().catch(() => {})
    await prisma.workflowInstance.deleteMany().catch(() => {})
    await prisma.workflowStep.deleteMany().catch(() => {})
    await prisma.workflowTemplate.deleteMany().catch(() => {})

    await prisma.transferOrderItem.deleteMany().catch(() => {})
    await prisma.transferOrder.deleteMany().catch(() => {})
    await prisma.section.deleteMany().catch(() => {})
    await prisma.notification.deleteMany().catch(() => {})
    await prisma.stockAdjustmentHistory.deleteMany().catch(() => {})
    await prisma.stockAdjustment.deleteMany().catch(() => {})
    await prisma.purchaseReceiveItem.deleteMany().catch(() => {})
    await prisma.purchaseReceive.deleteMany().catch(() => {})
    await prisma.asset.deleteMany().catch(() => {})
    await prisma.attribute.deleteMany().catch(() => {})
    await prisma.salesOrderItem.deleteMany().catch(() => {})
    await prisma.purchaseOrderItem.deleteMany().catch(() => {})
    await prisma.backorderItem.deleteMany().catch(() => {})
    await prisma.paymentReceived.deleteMany().catch(() => {})
    await prisma.paymentMade.deleteMany().catch(() => {})
    await prisma.invoice.deleteMany().catch(() => {})
    await prisma.bill.deleteMany().catch(() => {})
    await prisma.salesOrder.deleteMany().catch(() => {})
    await prisma.purchaseOrder.deleteMany().catch(() => {})
    await prisma.backorder.deleteMany().catch(() => {})
    await prisma.shipment.deleteMany().catch(() => {})
    await prisma.customer.deleteMany().catch(() => {})
    await prisma.product.deleteMany().catch(() => {})
    await prisma.unitOfMeasure.deleteMany().catch(() => {})
    await prisma.supplier.deleteMany().catch(() => {})
    await prisma.category.deleteMany().catch(() => {})
    await prisma.invitation.deleteMany().catch(() => {})
    await prisma.subscription.deleteMany().catch(() => {})
    await prisma.price.deleteMany().catch(() => {})
    await prisma.plan.deleteMany().catch(() => {})
    await prisma.profile.deleteMany().catch(() => {})
    await prisma.user.deleteMany().catch(() => {})
    await prisma.role.deleteMany().catch(() => {})
    await prisma.site.deleteMany().catch(() => {})
    await prisma.agency.deleteMany().catch(() => {})
    await prisma.currency.deleteMany().catch(() => {})
    await prisma.company.deleteMany().catch(() => {})
    await prisma.location.deleteMany().catch(() => {})

    console.log('✅ Database cleaned up successfully')
  } catch (error) {
    console.warn('⚠️ Some cleanup operations failed, but continuing...')
    console.warn(error)
  }
}

async function createCurrencies(companyId: string) {
  console.log('💰 Creating currencies...')

  const currencies = await prisma.currency.createMany({
    data: [
      {
        symbol: '$',
        currencyCode: 'USD',
        currencyName: 'US Dollar',
        countryName: 'United States',
        companyId: companyId,
        isoCode: 'US',
        base: true,
        order: 0,
      },
      {
        symbol: '€',
        currencyCode: 'EUR',
        currencyName: 'Euro',
        countryName: 'European Union',
        companyId: companyId,
        isoCode: 'EU',
        order: 1,
      },
      {
        symbol: '£',
        currencyCode: 'GBP',
        currencyName: 'Pound Sterling',
        countryName: 'United Kingdom',
        companyId: companyId,
        isoCode: 'GB',
        order: 2,
      },
      {
        currencyCode: 'CAD',
        currencyName: 'Canadian Dollar',
        countryName: 'Canada',
        symbol: '$',
        companyId: companyId,
        isoCode: 'CA',
        order: 3,
      },
    ],
  })

  return await prisma.currency.findMany({
    where: { companyId: companyId },
  })
}

async function createLocations(companyId: string, count: number = 10) {
  console.log(`📍 Creating ${count} French locations...`)

  // French cities and their regions
  const frenchLocations = [
    {
      address: '25 Rue de la République',
      city: 'Lyon',
      state: 'Auvergne-Rhône-Alpes',
      postalCode: '69002',
    },
    {
      address: '45 Boulevard Haussmann',
      city: 'Paris',
      state: 'Île-de-France',
      postalCode: '75009',
    },
    {
      address: '12 Place Bellecour',
      city: 'Lyon',
      state: 'Auvergne-Rhône-Alpes',
      postalCode: '69002',
    },
    {
      address: '78 Rue Paradis',
      city: 'Marseille',
      state: "Provence-Alpes-Côte d'Azur",
      postalCode: '13006',
    },
    { address: '33 Place du Capitole', city: 'Toulouse', state: 'Occitanie', postalCode: '31000' },
    {
      address: "56 Cours de l'Intendance",
      city: 'Bordeaux',
      state: 'Nouvelle-Aquitaine',
      postalCode: '33000',
    },
    { address: '89 Rue Nationale', city: 'Lille', state: 'Hauts-de-France', postalCode: '59000' },
    { address: '21 Place Stanislas', city: 'Nancy', state: 'Grand Est', postalCode: '54000' },
    {
      address: '67 Rue de la Préfecture',
      city: 'Nice',
      state: "Provence-Alpes-Côte d'Azur",
      postalCode: '06000',
    },
    {
      address: '14 Place de la Comédie',
      city: 'Montpellier',
      state: 'Occitanie',
      postalCode: '34000',
    },
  ]

  const locationData = frenchLocations.slice(0, count).map((location) => ({
    ...location,
    country: 'France',
    companyId: companyId,
  }))

  await prisma.location.createMany({ data: locationData })

  return await prisma.location.findMany({
    where: { companyId: companyId },
  })
}

async function createCompanyStructure() {
  console.log('🏢 Creating company structure...')

  // Create main company location in Lyon
  const companyLocation = await prisma.location.create({
    data: {
      address: '15 Place Bellecour',
      city: 'Lyon',
      state: 'Auvergne-Rhône-Alpes',
      country: 'France',
      postalCode: '69002',
    },
  })

  // Create company
  const company = await prisma.company.create({
    data: {
      name: 'FlowTech Solutions',
      locationId: companyLocation.id,
      sandbox: false,
      active: true,
      phone: '+33 4 78 92 94 96',
    },
  })

  // Create currencies
  const currencies = await createCurrencies(company.id)

  // Create additional locations
  const locations = await createLocations(company.id, 8)

  return { company, currencies, locations: [companyLocation, ...locations] }
}

async function createAgenciesAndSites(company: any, currencies: any[], locations: any[]) {
  console.log('🏪 Creating French agencies and sites...')

  const baseCurrency = currencies.find((c) => c.base)

  // Create agencies with meaningful French names
  const agencies = await Promise.all([
    prisma.agency.create({
      data: {
        name: 'Agence Principale Lyon',
        companyId: company.id,
        currencyId: baseCurrency!.id,
        locationId: locations[0].id, // Lyon location
      },
    }),
    prisma.agency.create({
      data: {
        name: 'Agence Paris Haussmann',
        companyId: company.id,
        currencyId: baseCurrency!.id,
        locationId: locations[1].id, // Paris location
      },
    }),
    prisma.agency.create({
      data: {
        name: 'Agence Méditerranée',
        companyId: company.id,
        currencyId: baseCurrency!.id,
        locationId: locations[3].id, // Marseille location
      },
    }),
    prisma.agency.create({
      data: {
        name: 'Agence Sud-Ouest',
        companyId: company.id,
        currencyId: baseCurrency!.id,
        locationId: locations[4].id, // Toulouse location
      },
    }),
  ])

  // Create sites with French names
  const sites = await Promise.all([
    // Main warehouse in Lyon
    prisma.site.create({
      data: {
        name: 'Entrepôt Principal Lyon',
        companyId: company.id,
        locationId: locations[2].id, // Second Lyon location
        agencyId: agencies[0].id, // Lyon agency
        type: 'Warehouse',
        active: true,
        default: true,
      },
    }),
    // Secondary warehouse in Paris
    prisma.site.create({
      data: {
        name: 'Entrepôt Paris Nord',
        companyId: company.id,
        locationId: locations[6].id, // Lille location (near Paris)
        agencyId: agencies[1].id, // Paris agency
        type: 'Warehouse',
        active: true,
      },
    }),
    // Warehouse in Marseille
    prisma.site.create({
      data: {
        name: 'Entrepôt Méditerranée',
        companyId: company.id,
        locationId: locations[5].id, // Bordeaux location
        agencyId: agencies[2].id, // Méditerranée agency
        type: 'Warehouse',
        active: true,
      },
    }),
    // Warehouse in Toulouse
    prisma.site.create({
      data: {
        name: 'Entrepôt Sud-Ouest',
        companyId: company.id,
        locationId: locations[8].id, // Different location
        agencyId: agencies[3].id, // Sud-Ouest agency
        type: 'Warehouse',
        active: true,
      },
    }),
    // Retail stores
    prisma.site.create({
      data: {
        name: 'Magasin Centre Lyon',
        companyId: company.id,
        locationId: locations[7].id, // Nancy location
        agencyId: agencies[0].id, // Lyon agency
        type: 'Store',
        active: true,
      },
    }),
    prisma.site.create({
      data: {
        name: 'Boutique Champs-Élysées',
        companyId: company.id,
        locationId: locations[1].id, // Paris
        agencyId: agencies[1].id, // Paris agency
        type: 'Store',
        active: true,
      },
    }),
    prisma.site.create({
      data: {
        name: 'Magasin Vieux-Port Marseille',
        companyId: company.id,
        locationId: locations[3].id, // Marseille
        agencyId: agencies[2].id, // Méditerranée agency
        type: 'Store',
        active: true,
      },
    }),
    prisma.site.create({
      data: {
        name: 'Magasin Capitole Toulouse',
        companyId: company.id,
        locationId: locations[0].id, // Different location
        agencyId: agencies[3].id, // Sud-Ouest agency
        type: 'Store',
        active: true,
      },
    }),
  ])

  return { agencies, sites }
}

async function createRoles(companyId: string) {
  console.log('👥 Creating roles...')

  const roles = await prisma.role.createMany({
    data: [
      {
        name: 'Admin',
        description: 'Full system access',
        companyId: companyId,
        editable: false, // Built-in role
        permissions: [
          'read:products',
          'create:products',
          'update:products',
          'delete:products',
          'read:stockAdjustments',
          'create:stockAdjustments',
          'update:stockAdjustments',
          'delete:stockAdjustments',
          'read:categories',
          'create:categories',
          'update:categories',
          'delete:categories',
          'read:suppliers',
          'create:suppliers',
          'update:suppliers',
          'delete:suppliers',
          'read:purchaseOrders',
          'create:purchaseOrders',
          'update:purchaseOrders',
          'delete:purchaseOrders',
          'read:purchaseReceives',
          'create:purchaseReceives',
          'update:purchaseReceives',
          'delete:purchaseReceives',
          'read:bills',
          'create:bills',
          'update:bills',
          'delete:bills',
          'read:paymentsMade',
          'create:paymentsMade',
          'update:paymentsMade',
          'delete:paymentsMade',
          'read:customers',
          'create:customers',
          'update:customers',
          'delete:customers',
          'read:salesOrders',
          'create:salesOrders',
          'update:salesOrders',
          'delete:salesOrders',
          'read:backorders',
          'create:backorders',
          'update:backorders',
          'delete:backorders',
          'read:invoices',
          'create:invoices',
          'update:invoices',
          'delete:invoices',
          'read:paymentsReceived',
          'create:paymentsReceived',
          'update:paymentsReceived',
          'delete:paymentsReceived',
          'read:agencies',
          'create:agencies',
          'update:agencies',
          'delete:agencies',
          'read:roles',
          'create:roles',
          'update:roles',
          'delete:roles',
          'read:settings',
          'create:settings',
          'update:settings',
          'delete:settings',
          'read:users',
          'create:users',
          'update:users',
          'delete:users',
          'read:sites',
          'create:sites',
          'update:sites',
          'delete:sites',
          'read:transferOrders',
          'create:transferOrders',
          'update:transferOrders',
          'delete:transferOrders',
          'read:analytics',
          'create:analytics',
          'update:analytics',
          'delete:analytics',
          'read:plans',
          'create:plans',
          'update:plans',
          'delete:plans',
          'read:workflows',
          'create:workflows',
          'update:workflows',
          'delete:workflows',
          'read:approvals',
          'create:approvals',
          'update:approvals',
          'delete:approvals',
        ],
      },
      {
        name: 'Inventory Manager',
        description:
          'Oversees all inventory operations, stock level monitoring and optimization, supplier relationship management, purchase order approval and management',
        companyId: companyId,
        editable: false, // Built-in role
        permissions: [
          // Product and Inventory Management
          'read:products',
          'create:products',
          'update:products',
          'delete:products',
          'read:stockAdjustments',
          'create:stockAdjustments',
          'update:stockAdjustments',
          'delete:stockAdjustments',
          'read:categories',
          'create:categories',
          'update:categories',
          'delete:categories',

          // Supplier Relationship Management
          'read:suppliers',
          'create:suppliers',
          'update:suppliers',
          'delete:suppliers',

          // Purchase Order Approval and Management
          'read:purchaseOrders',
          'create:purchaseOrders',
          'update:purchaseOrders',
          'delete:purchaseOrders',
          'read:purchaseReceives',
          'create:purchaseReceives',
          'update:purchaseReceives',
          'delete:purchaseReceives',
          'read:bills',
          'create:bills',
          'update:bills',
          'delete:bills',
          'read:paymentsMade',
          'create:paymentsMade',
          'update:paymentsMade',
          'delete:paymentsMade',

          // Customer and Sales Order Oversight
          'read:customers',
          'create:customers',
          'update:customers',
          'read:salesOrders',
          'create:salesOrders',
          'update:salesOrders',
          'read:backorders',
          'create:backorders',
          'update:backorders',
          'delete:backorders',

          // Financial Operations
          'read:invoices',
          'create:invoices',
          'update:invoices',
          'read:paymentsReceived',
          'create:paymentsReceived',
          'update:paymentsReceived',

          // Transfer Orders and Site Management
          'read:transferOrders',
          'create:transferOrders',
          'update:transferOrders',
          'delete:transferOrders',
          'read:sites',
          'create:sites',
          'update:sites',

          // Analytics and Reporting for Stock Monitoring
          'read:analytics',
          'create:analytics',
          'update:analytics',

          // User Management for Inventory Team
          'read:users',
          'create:users',
          'update:users',
          'read:roles',

          // Workflow and Approval Management
          'read:workflows',
          'create:workflows',
          'update:workflows',
          'read:approvals',
          'create:approvals',
          'update:approvals',
        ],
      },
      {
        name: 'Warehouse Staff',
        description: 'Warehouse operations access',
        companyId: companyId,
        editable: false, // Built-in role
        permissions: [
          'read:products',
          'update:products',
          'read:stockAdjustments',
          'create:stockAdjustments',
          'update:stockAdjustments',
          'read:categories',
          'read:purchaseOrders',
          'read:purchaseReceives',
          'create:purchaseReceives',
          'update:purchaseReceives',
          // Transfer Orders and Site Management
          'read:transferOrders',
          'create:transferOrders',
          'update:transferOrders',
          'delete:transferOrders',
          'read:sites',
          'create:sites',
          'update:sites',
          'read:analytics', // Allow warehouse staff to view dashboard analytics
          'read:approvals', // Allow warehouse staff to view their approval requests
        ],
      },
      {
        name: 'Sales Staff',
        description: 'Sales operations access',
        companyId: companyId,
        editable: false, // Built-in role
        permissions: [
          'read:products',
          'read:customers',
          'create:customers',
          'update:customers',
          'read:salesOrders',
          'create:salesOrders',
          'update:salesOrders',
          'read:backorders',
          'create:backorders',
          'update:backorders',
          'read:invoices',
          'create:invoices',
          'update:invoices',
          'read:paymentsReceived',
          'create:paymentsReceived',
          'update:paymentsReceived',
        ],
      },
      {
        name: 'Accountant',
        description: 'Financial operations and reporting',
        companyId: companyId,
        editable: false, // Built-in role
        permissions: [
          'read:products',
          'read:invoices',
          'read:bills',
          'read:paymentsReceived',
          'create:paymentsReceived',
          'update:paymentsReceived',
          'read:paymentsMade',
          'create:paymentsMade',
          'update:paymentsMade',
          'read:analytics',
          'read:settings',
          'read:customers',
          'read:suppliers',
          'read:salesOrders',
          'read:purchaseOrders',
        ],
      },
      {
        name: 'Customer Service',
        description: 'Customer support and order assistance',
        companyId: companyId,
        editable: false, // Built-in role
        permissions: [
          'read:products',
          'read:customers',
          'update:customers',
          'read:salesOrders',
          'update:salesOrders',
          'read:invoices',
          'read:backorders',
          'update:backorders',
          'read:paymentsReceived',
          'read:categories',
          'read:agencies',
          'read:sites',
        ],
      },
      {
        name: 'Quality Control',
        description: 'Product quality and compliance management',
        companyId: companyId,
        editable: false, // Built-in role
        permissions: [
          'read:products',
          'update:products',
          'read:stockAdjustments',
          'create:stockAdjustments',
          'read:purchaseReceives',
          'update:purchaseReceives',
          'read:categories',
          'read:suppliers',
          'read:purchaseOrders',
        ],
      },
      {
        name: 'Store Manager',
        description: 'Individual store operations management',
        companyId: companyId,
        editable: false, // Built-in role
        permissions: [
          'read:products',
          'update:products',
          'read:customers',
          'create:customers',
          'update:customers',
          'read:salesOrders',
          'create:salesOrders',
          'update:salesOrders',
          'read:invoices',
          'create:invoices',
          'read:stockAdjustments',
          'create:stockAdjustments',
          'read:transferOrders',
          'create:transferOrders',
          'read:backorders',
          'update:backorders',
          'read:paymentsReceived',
          'create:paymentsReceived',
          'read:analytics',
        ],
      },
    ],
  })

  return await prisma.role.findMany({
    where: { companyId: companyId },
  })
}

async function createUsers(company: any, roles: any[], agencies: any[], sites: any[]) {
  console.log('👤 Creating users...')

  // Create auth context to get better-auth password hashing
  const ctx = await auth.$context
  const betterAuthPassword = await ctx.password.hash('password123')

  const users = await Promise.all([
    // Admin user
    prisma.user.create({
      data: {
        email: 'admin@flowtech.com',
        emailVerified: true,
        roleId: roles.find((r) => r.name === 'Admin')!.id,
        status: 'Registered',
        companyId: company.id,
        agencyId: agencies[0].id,
        siteId: sites[0].id,
        profile: {
          create: {
            firstName: 'Admin',
            lastName: 'User',
            phone: '(555) 100-0001',
          },
        },
        // Create Account for better-auth compatibility with proper password hash
        accounts: {
          create: {
            accountId: 'admin@flowtech.com',
            providerId: 'credential',
            password: betterAuthPassword,
          },
        },
      },
    }),
    // Inventory Manager user
    prisma.user.create({
      data: {
        email: 'manager@flowtech.com',
        emailVerified: true,
        roleId: roles.find((r) => r.name === 'Inventory Manager')!.id,
        status: 'Registered',
        companyId: company.id,
        agencyId: agencies[0].id,
        siteId: sites[0].id,
        profile: {
          create: {
            firstName: 'Jean-Pierre',
            lastName: 'Inventory',
            phone: '(555) 100-0002',
          },
        },
        // Create Account for better-auth compatibility with proper password hash
        accounts: {
          create: {
            accountId: 'manager@flowtech.com',
            providerId: 'credential',
            password: betterAuthPassword,
          },
        },
      },
    }),
    // Warehouse staff
    prisma.user.create({
      data: {
        email: 'warehouse@flowtech.com',
        emailVerified: true,
        roleId: roles.find((r) => r.name === 'Warehouse Staff')!.id,
        status: 'Registered',
        companyId: company.id,
        agencyId: agencies[0].id,
        siteId: sites[0].id,
        profile: {
          create: {
            firstName: 'Bob',
            lastName: 'Warehouse',
            phone: '(555) 100-0003',
          },
        },
        // Create Account for better-auth compatibility with proper password hash
        accounts: {
          create: {
            accountId: 'warehouse@flowtech.com',
            providerId: 'credential',
            password: betterAuthPassword,
          },
        },
      },
    }),
    // Sales staff
    prisma.user.create({
      data: {
        email: 'sales@flowtech.com',
        emailVerified: true,
        roleId: roles.find((r) => r.name === 'Sales Staff')!.id,
        status: 'Registered',
        companyId: company.id,
        agencyId: agencies[0].id,
        siteId: sites[2].id, // Downtown Store
        profile: {
          create: {
            firstName: 'Alice',
            lastName: 'Sales',
            phone: '(555) 100-0004',
          },
        },
        // Create Account for better-auth compatibility with proper password hash
        accounts: {
          create: {
            accountId: 'sales@flowtech.com',
            providerId: 'credential',
            password: betterAuthPassword,
          },
        },
      },
    }),
    // Accountant user
    prisma.user.create({
      data: {
        email: 'accountant@flowtech.com',
        emailVerified: true,
        roleId: roles.find((r) => r.name === 'Accountant')!.id,
        status: 'Registered',
        companyId: company.id,
        agencyId: agencies[0].id,
        siteId: sites[0].id,
        profile: {
          create: {
            firstName: 'Marie',
            lastName: 'Dubois',
            phone: '(555) 100-0005',
          },
        },
        accounts: {
          create: {
            accountId: 'accountant@flowtech.com',
            providerId: 'credential',
            password: betterAuthPassword,
          },
        },
      },
    }),
    // Customer Service user
    prisma.user.create({
      data: {
        email: 'customerservice@flowtech.com',
        emailVerified: true,
        roleId: roles.find((r) => r.name === 'Customer Service')!.id,
        status: 'Registered',
        companyId: company.id,
        agencyId: agencies[1].id, // Paris agency
        siteId: sites[5].id, // Boutique Champs-Élysées
        profile: {
          create: {
            firstName: 'Sophie',
            lastName: 'Martin',
            phone: '(555) 100-0006',
          },
        },
        accounts: {
          create: {
            accountId: 'customerservice@flowtech.com',
            providerId: 'credential',
            password: betterAuthPassword,
          },
        },
      },
    }),
    // Quality Control user
    prisma.user.create({
      data: {
        email: 'quality@flowtech.com',
        emailVerified: true,
        roleId: roles.find((r) => r.name === 'Quality Control')!.id,
        status: 'Registered',
        companyId: company.id,
        agencyId: agencies[0].id,
        siteId: sites[0].id, // Main warehouse
        profile: {
          create: {
            firstName: 'Pierre',
            lastName: 'Leroy',
            phone: '(555) 100-0007',
          },
        },
        accounts: {
          create: {
            accountId: 'quality@flowtech.com',
            providerId: 'credential',
            password: betterAuthPassword,
          },
        },
      },
    }),
    // Store Manager user
    prisma.user.create({
      data: {
        email: 'storemanager@flowtech.com',
        emailVerified: true,
        roleId: roles.find((r) => r.name === 'Store Manager')!.id,
        status: 'Registered',
        companyId: company.id,
        agencyId: agencies[2].id, // Méditerranée agency
        siteId: sites[6].id, // Magasin Vieux-Port Marseille
        profile: {
          create: {
            firstName: 'Laurent',
            lastName: 'Moreau',
            phone: '(555) 100-0008',
          },
        },
        accounts: {
          create: {
            accountId: 'storemanager@flowtech.com',
            providerId: 'credential',
            password: betterAuthPassword,
          },
        },
      },
    }),
  ])

  return users
}

async function createCategories(companyId: string) {
  console.log('📦 Creating categories...')

  const categories = await Promise.all(
    DEMO_CATEGORIES.map((cat) =>
      prisma.category.create({
        data: {
          name: cat.name,
          description: cat.description,
          companyId: companyId,
          active: true,
        },
      })
    )
  )

  return categories
}

async function createSuppliers(company: any, currencies: any[], locations: any[]) {
  console.log('🏭 Creating suppliers...')

  const baseCurrency = currencies.find((c) => c.base)

  const suppliers = await Promise.all(
    DEMO_SUPPLIERS.map((supplier, index) =>
      prisma.supplier.create({
        data: {
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          companyName: supplier.companyName,
          companyId: company.id,
          currencyId: baseCurrency!.id,
          locationId: locations[index % locations.length].id,
          active: true,
        },
      })
    )
  )

  return suppliers
}

async function createProducts(
  company: any,
  categories: any[],
  agencies: any[],
  sites: any[],
  users: any[]
) {
  console.log('🛍️ Creating products with staggered dates for testing...')

  const adminUser = users.find((u) => u.email === 'admin@flowtech.com')
  const products = []

  // Create date ranges for testing percentage differences
  const now = new Date()
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const last60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  let productIndex = 0

  for (const categoryData of DEMO_CATEGORIES) {
    const category = categories.find((c) => c.name === categoryData.name)

    for (const productData of categoryData.products) {
      // Create products with different creation dates to test percentage differences
      let createdAt: Date
      let openingStock: number
      let physicalStock: number

      // Distribute products across different time periods
      if (productIndex % 4 === 0) {
        // 25% of products created in last 7 days with higher stock
        createdAt = faker.date.between({ from: last7Days, to: now })
        openingStock = faker.number.int({ min: 80, max: 120 })
        physicalStock = faker.number.int({ min: 60, max: openingStock })
      } else if (productIndex % 4 === 1) {
        // 25% of products created in 7-14 days ago with medium stock
        createdAt = faker.date.between({ from: last14Days, to: last7Days })
        openingStock = faker.number.int({ min: 40, max: 80 })
        physicalStock = faker.number.int({ min: 20, max: openingStock })
      } else if (productIndex % 4 === 2) {
        // 25% of products created in 14-30 days ago with lower stock
        createdAt = faker.date.between({ from: last30Days, to: last14Days })
        openingStock = faker.number.int({ min: 20, max: 60 })
        physicalStock = faker.number.int({ min: 5, max: openingStock })
      } else {
        // 25% of products created in 30-60 days ago - half with very low stock, half out of stock
        createdAt = faker.date.between({ from: last60Days, to: last30Days })
        openingStock = faker.number.int({ min: 5, max: 30 })
        // Ensure half of these products are completely out of stock for backorder testing
        physicalStock =
          productIndex % 8 === 3 || productIndex % 8 === 7
            ? 0
            : faker.number.int({ min: 1, max: 5 })
      }

      // Distribute products across agencies to ensure proper filtering
      const selectedAgency = faker.helpers.arrayElement(agencies)
      const selectedSite = faker.helpers.arrayElement(
        sites.filter((s) => s.agencyId === selectedAgency.id)
      )

      const product = await prisma.product.create({
        data: {
          name: productData.name,
          description: faker.commerce.productDescription(),
          sku: faker.string.alphanumeric(8).toUpperCase(),
          brand: productData.brand,
          costPrice: productData.costPrice,
          sellingPrice: productData.sellingPrice,
          companyId: company.id,
          categoryId: category!.id,
          agencyId: selectedAgency.id, // Assign to specific agency
          siteId: selectedSite.id, // Assign to site within that agency
          active: true,
          returnable: true,
          trackable: true,
          openingStock: openingStock,
          openingValue: openingStock * productData.costPrice,
          availableQuantity: physicalStock,
          physicalStockOnHand: physicalStock,
          accountingStockOnHand:
            Math.random() > 0.3
              ? physicalStock
              : physicalStock + faker.number.int({ min: -3, max: 3 }), // 30% chance of discrepancy
          adjustedQuantity: 0,
          barcode: createEan13(),
          reorderPoint: faker.number.int({ min: 5, max: 15 }),
          safetyStockLevel: faker.number.int({ min: 2, max: 10 }),
          Length: faker.number.float({ min: 1, max: 50, fractionDigits: 1 }),
          Width: faker.number.float({ min: 1, max: 50, fractionDigits: 1 }),
          Height: faker.number.float({ min: 1, max: 50, fractionDigits: 1 }),
          Weight: faker.number.float({ min: 0.1, max: 20, fractionDigits: 1 }),
          status: physicalStock > 20 ? 'Available' : physicalStock > 0 ? 'LowStock' : 'OutOfStock',
          unit: faker.helpers.arrayElement(['Pieces', 'Box', 'Pack', 'Dozen']),
          createdby: adminUser!.id,
          tags: faker.helpers.arrayElements(
            ['popular', 'new', 'bestseller', 'premium', 'discount', 'featured'],
            { min: 1, max: 3 }
          ),
          createdAt: createdAt, // Set specific creation date
          updatedAt: createdAt, // Set updated date to match creation date
        },
      })

      products.push(product)
      productIndex++
    }
  }

  console.log(`📊 Created ${products.length} products with staggered dates:`)
  console.log(
    `   - Recent (last 7 days): ${Math.ceil(products.length / 4)} products with high stock`
  )
  console.log(
    `   - Medium (7-14 days): ${Math.ceil(products.length / 4)} products with medium stock`
  )
  console.log(`   - Older (14-30 days): ${Math.ceil(products.length / 4)} products with low stock`)
  console.log(
    `   - Oldest (30-60 days): ${Math.floor(products.length / 4)} products (half out of stock for backorders)`
  )

  return products
}

async function createCustomers(company: any, agencies: any[], sites: any[], locations: any[]) {
  console.log('👥 Creating customers...')

  // French addresses for customers
  const frenchCustomerAddresses = [
    {
      address: '42 Avenue de la Liberté',
      city: 'Lyon',
      state: 'Auvergne-Rhône-Alpes',
      postalCode: '69003',
    },
    { address: '18 Rue de Rivoli', city: 'Paris', state: 'Île-de-France', postalCode: '75001' },
    {
      address: '85 La Canebière',
      city: 'Marseille',
      state: "Provence-Alpes-Côte d'Azur",
      postalCode: '13001',
    },
    {
      address: '29 Rue Alsace Lorraine',
      city: 'Toulouse',
      state: 'Occitanie',
      postalCode: '31000',
    },
    {
      address: "67 Cours de l'Intendance",
      city: 'Bordeaux',
      state: 'Nouvelle-Aquitaine',
      postalCode: '33000',
    },
    { address: '33 Grande Rue', city: 'Lille', state: 'Hauts-de-France', postalCode: '59000' },
    {
      address: '91 Avenue Jean Médecin',
      city: 'Nice',
      state: "Provence-Alpes-Côte d'Azur",
      postalCode: '06000',
    },
    {
      address: '14 Place de la Cathédrale',
      city: 'Strasbourg',
      state: 'Grand Est',
      postalCode: '67000',
    },
  ]

  const customers = await Promise.all(
    DEMO_CUSTOMERS.map(async (customerData, index) => {
      const billingAddressData = frenchCustomerAddresses[index % frenchCustomerAddresses.length]
      const shippingAddressData =
        frenchCustomerAddresses[(index + 1) % frenchCustomerAddresses.length]

      // Create billing address
      const billingAddress = await prisma.location.create({
        data: {
          address: billingAddressData.address,
          city: billingAddressData.city,
          state: billingAddressData.state,
          country: 'France',
          postalCode: billingAddressData.postalCode,
        },
      })

      // Create shipping address
      const shippingAddress = await prisma.location.create({
        data: {
          address: shippingAddressData.address,
          city: shippingAddressData.city,
          state: shippingAddressData.state,
          country: 'France',
          postalCode: shippingAddressData.postalCode,
        },
      })

      return prisma.customer.create({
        data: {
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone,
          companyName: customerData.companyName,
          companyId: company.id,
          agencyId: agencies[index % agencies.length].id,
          siteId: sites[index % sites.length].id,
          billingAddressId: billingAddress.id,
          shippingAddressId: shippingAddress.id,
          hasPortalAccess: faker.datatype.boolean(),
        },
      })
    })
  )

  return customers
}

async function createPurchaseOrders(
  company: any,
  suppliers: any[],
  agencies: any[],
  sites: any[],
  products: any[]
) {
  console.log('📋 Creating purchase orders with sequential numbering...')

  const purchaseOrders = []
  const statuses = [
    PURCHASE_ORDER_STATUSES.PENDING,
    PURCHASE_ORDER_STATUSES.ISSUED,
    PURCHASE_ORDER_STATUSES.RECEIVED,
    PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED,
    PURCHASE_ORDER_STATUSES.CANCELLED,
  ]

  for (let i = 0; i < 15; i++) {
    const supplier = faker.helpers.arrayElement(suppliers)
    const agency = faker.helpers.arrayElement(agencies)
    const warehouseSites = sites.filter((s) => s.type === 'Warehouse' && s.agencyId === agency.id)

    if (warehouseSites.length === 0) {
      console.log(`Warning: No warehouse found for agency ${agency.name}, skipping order ${i}`)
      continue
    }

    const site = faker.helpers.arrayElement(warehouseSites)
    const orderDate = faker.date.between({ from: '2024-01-01', to: new Date() })

    // Sequential numbering: PO-00001, PO-00002, etc.
    const purchaseOrderNumber = (i + 1).toString().padStart(5, '0')
    const purchaseOrderReference = `PO-${purchaseOrderNumber}`

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        purchaseOrderNumber: purchaseOrderNumber,
        purchaseOrderReference: purchaseOrderReference,
        reference: faker.string.alphanumeric(10),
        orderDate: orderDate,
        expectedDeliveryDate: faker.date.future({ refDate: orderDate }),
        status: faker.helpers.arrayElement(statuses),
        paymentTerms: faker.helpers.arrayElement([
          PURCHASE_ORDER_PAYMENT_TERMS.NET15,
          PURCHASE_ORDER_PAYMENT_TERMS.NET30,
          PURCHASE_ORDER_PAYMENT_TERMS.NET45,
          PURCHASE_ORDER_PAYMENT_TERMS.NET60,
        ]),
        supplierId: supplier.id,
        agencyId: agency.id,
        companyId: company.id,
        siteId: site.id,
        notes: faker.lorem.sentence(),
      },
    })

    // Add items to purchase order - only products from the same agency and site
    const agencySiteProducts = products.filter(
      (p) => p.agencyId === agency.id && p.siteId === site.id
    )
    if (agencySiteProducts.length === 0) {
      console.log(
        `Warning: No products found for agency ${agency.name} and site ${site.name}, skipping items for order ${i}`
      )
      continue
    }
    const numItems = faker.number.int({ min: 1, max: Math.min(5, agencySiteProducts.length) })
    const selectedProducts = faker.helpers.arrayElements(agencySiteProducts, numItems)

    for (const product of selectedProducts) {
      const quantity = faker.number.int({ min: 1, max: 50 })
      const rate = product.costPrice * faker.number.float({ min: 0.8, max: 1.2, fractionDigits: 2 })
      const taxPercentage = faker.number.float({ min: 0, max: 20, fractionDigits: 2 }) // Tax percentage between 0% and 20%

      await prisma.purchaseOrderItem.create({
        data: {
          purchaseOrderId: purchaseOrder.id,
          productId: product.id,
          quantity: quantity,
          rate: rate,
          amount: rate * quantity,
          tax: taxPercentage, // Store as percentage, not absolute value
          received: faker.datatype.boolean(),
        },
      })
    }

    purchaseOrders.push(purchaseOrder)
  }

  return purchaseOrders
}

async function createSalesOrders(
  company: any,
  customers: any[],
  agencies: any[],
  sites: any[],
  products: any[]
) {
  console.log('💰 Creating sales orders with sequential numbering...')

  const salesOrders = []
  const statuses = [
    SALES_ORDERS_STATUSES.PENDING,
    SALES_ORDERS_STATUSES.ISSUED,
    SALES_ORDERS_STATUSES.SHIPPED,
    SALES_ORDERS_STATUSES.DELIVERED,
    SALES_ORDERS_STATUSES.PARTIALLY_DELIVERED,
    SALES_ORDERS_STATUSES.CANCELLED,
  ]

  for (let i = 0; i < 20; i++) {
    const customer = faker.helpers.arrayElement(customers)
    const agency = faker.helpers.arrayElement(agencies)
    const site = faker.helpers.arrayElement(sites.filter((s) => s.agencyId === agency.id))
    if (!site) {
      console.log(`Warning: No site found for agency ${agency.name}, skipping order ${i}`)
      continue
    }
    const orderDate = faker.date.between({ from: '2024-01-01', to: new Date() })

    // Sequential numbering: SO-000001, SO-000002, etc.
    const salesOrderNumber = (i + 1).toString().padStart(6, '0')
    const salesOrderReference = `SO-${salesOrderNumber}`

    const salesOrder = await prisma.salesOrder.create({
      data: {
        salesOrderNumber: salesOrderNumber,
        salesOrderReference: salesOrderReference,
        orderDate: orderDate,
        expectedShipmentDate: faker.date.future({ refDate: orderDate }),
        status: faker.helpers.arrayElement(statuses),
        paymentTerms: faker.helpers.arrayElement([
          PURCHASE_ORDER_PAYMENT_TERMS.NET15,
          PURCHASE_ORDER_PAYMENT_TERMS.NET30,
          PURCHASE_ORDER_PAYMENT_TERMS.NET45,
          PURCHASE_ORDER_PAYMENT_TERMS.NET60,
        ]),
        customerId: customer.id,
        agencyId: agency.id,
        companyId: company.id,
        siteId: site.id,
      },
    })

    // Add items to sales order - only products from the same agency and site
    const agencySiteProducts = products.filter(
      (p) => p.agencyId === agency.id && p.siteId === site.id
    )
    if (agencySiteProducts.length === 0) {
      console.log(
        `Warning: No products found for agency ${agency.name} and site ${site.name}, skipping items for order ${i}`
      )
      continue
    }
    const numItems = faker.number.int({ min: 1, max: Math.min(5, agencySiteProducts.length) })
    const selectedProducts = faker.helpers.arrayElements(agencySiteProducts, numItems)

    console.log(
      `Sales Order ${salesOrderReference}: Agency ${agency.name}, Site ${site.name} has ${agencySiteProducts.length} products, using ${selectedProducts.length} products`
    )

    for (const product of selectedProducts) {
      const quantity = faker.number.int({ min: 1, max: 10 })
      const rate =
        product.sellingPrice * faker.number.float({ min: 0.9, max: 1.1, fractionDigits: 2 })
      const taxPercentage = faker.number.float({ min: 0, max: 20, fractionDigits: 2 }) // Tax percentage between 0% and 20%

      await prisma.salesOrderItem.create({
        data: {
          salesOrderId: salesOrder.id,
          productId: product.id,
          quantity: quantity,
          rate: rate,
          amount: rate * quantity,
          tax: taxPercentage, // Store as percentage, not absolute value
          status: faker.helpers.arrayElement([
            SALES_ORDERS_STATUSES.PENDING,
            SALES_ORDERS_STATUSES.ISSUED,
            SALES_ORDERS_STATUSES.SHIPPED,
            SALES_ORDERS_STATUSES.DELIVERED,
          ]),
        },
      })
    }

    salesOrders.push(salesOrder)
  }

  return salesOrders
}

async function createBackorders(
  company: any,
  customers: any[],
  agencies: any[],
  sites: any[],
  products: any[]
) {
  console.log('📦 Creating backorders with sequential numbering...')

  const backorders = []
  const statuses = [
    BACKORDER_STATUSES.PENDING,
    BACKORDER_STATUSES.PARTIAL,
    BACKORDER_STATUSES.FULFILLED,
    BACKORDER_STATUSES.CANCELLED,
  ]

  // Create 25 backorders
  for (let i = 0; i < 25; i++) {
    const customer = faker.helpers.arrayElement(customers)
    const agency = faker.helpers.arrayElement(agencies)
    const site = sites.find((s) => s.agencyId === agency.id)

    if (!site) {
      console.log(`Warning: No site found for agency ${agency.name}, skipping backorder ${i}`)
      continue
    }

    const originalOrderDate = faker.date.between({ from: '2024-01-01', to: new Date() })

    // Sequential numbering: BO-000001, BO-000002, etc.
    const backorderNumber = (i + 1).toString().padStart(6, '0')
    const backorderReference = `BO-${backorderNumber}`

    const backorder = await prisma.backorder.create({
      data: {
        backorderNumber: backorderReference, // Store full reference as backorderNumber
        backorderReference: backorderReference,
        originalOrderDate: originalOrderDate,
        expectedFulfillDate: faker.date.future({ refDate: originalOrderDate }),
        status: faker.helpers.arrayElement(statuses),
        customerId: customer.id,
        agencyId: agency.id,
        companyId: company.id,
        siteId: site.id,
        notes: faker.lorem.sentence(),
      },
    })

    // Add items to backorder - only products from the same agency and site
    const agencySiteProducts = products.filter(
      (p) => p.agencyId === agency.id && p.siteId === site.id
    )
    if (agencySiteProducts.length === 0) {
      console.log(
        `Warning: No products found for agency ${agency.name} and site ${site.name}, skipping items for backorder ${i}`
      )
      continue
    }

    const numItems = faker.number.int({ min: 1, max: 5 })
    const selectedProducts = faker.helpers.arrayElements(agencySiteProducts, numItems)

    for (const product of selectedProducts) {
      const orderedQuantity = faker.number.int({ min: 1, max: 100 })
      // Determine fulfilled quantity safely: ensure faker receives a valid range
      let fulfilledQuantity = 0
      if (backorder.status === BACKORDER_STATUSES.FULFILLED) {
        fulfilledQuantity = orderedQuantity
      } else if (backorder.status === BACKORDER_STATUSES.PARTIAL) {
        const maxFulfill = Math.max(orderedQuantity - 1, 1)
        const minFulfill = 1
        // If orderedQuantity is 1, there's no room for partial fulfillment; treat as 0
        if (orderedQuantity <= 1) {
          fulfilledQuantity = 0
        } else {
          fulfilledQuantity = faker.number.int({ min: minFulfill, max: maxFulfill })
        }
      } else {
        fulfilledQuantity = 0
      }
      const remainingQuantity = orderedQuantity - fulfilledQuantity

      let itemStatus: any = BACKORDER_ITEM_STATUSES.PENDING
      if (fulfilledQuantity === orderedQuantity) {
        itemStatus = BACKORDER_ITEM_STATUSES.FULFILLED
      } else if (fulfilledQuantity > 0) {
        itemStatus = BACKORDER_ITEM_STATUSES.PARTIALLY_FULFILLED
      }

      const rate = product.sellingPrice
      const amount = orderedQuantity * rate

      await prisma.backorderItem.create({
        data: {
          backorderId: backorder.id,
          productId: product.id,
          orderedQuantity,
          fulfilledQuantity,
          remainingQuantity,
          rate,
          amount,
          status: itemStatus,
        },
      })
    }

    backorders.push(backorder)
  }

  return backorders
}

async function createInvoicesAndPayments(company: any, salesOrders: any[], users: any[]) {
  console.log('🧾 Creating invoices and payments with sequential numbering...')

  const invoices = []
  const paymentsReceived = []
  let paymentCounter = 1

  for (let i = 0; i < salesOrders.slice(0, 15).length; i++) {
    const salesOrder = salesOrders[i]
    const invoiceDate = faker.date.between({
      from: salesOrder.orderDate,
      to: new Date(),
    })

    // Sequential numbering for invoices: INV-000001, INV-000002, etc.
    const invoiceNumber = (i + 1).toString().padStart(6, '0')
    const invoiceReference = `INV-${invoiceNumber}`

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceNumber,
        invoiceReference: invoiceReference,
        invoiceDate: invoiceDate,
        dueDate: faker.date.future({ refDate: invoiceDate }),
        status: faker.helpers.arrayElement([
          'Pending',
          'Sent',
          'Paid',
          'PartiallyPaid',
          'Overdue',
          'Unpaid',
        ]),
        companyId: company.id,
        salesOrderId: salesOrder.id,
        userId: faker.helpers.arrayElement(users).id,
        notes: faker.lorem.sentence(),
      },
    })

    invoices.push(invoice)

    // Create payment received for some invoices
    if (faker.datatype.boolean(0.7)) {
      // 70% chance of payment
      const paymentAmount = faker.number.float({ min: 100, max: 5000, fractionDigits: 2 })
      const balanceDue = faker.number.float({ min: 0, max: 1000, fractionDigits: 2 })

      // Sequential numbering for payments: PAY-000001, PAY-000002, etc.
      const paymentNumber = paymentCounter.toString().padStart(6, '0')
      const paymentReference = `PAY-${paymentNumber}`

      const payment = await prisma.paymentReceived.create({
        data: {
          paymentNumber: paymentNumber,
          paymentReference: paymentReference,
          amountReceived: paymentAmount,
          balanceDue: balanceDue,
          paymentDate: faker.date.between({ from: invoiceDate, to: new Date() }),
          status: balanceDue > 0 ? 'PartiallyPaid' : 'Paid',
          paymentMethod: faker.helpers.arrayElement([
            'Cash',
            'CreditCard',
            'BankTransfer',
            'Cheque',
          ]),
          companyId: company.id,
          customerId: salesOrder.customerId,
          invoiceId: invoice.id,
          notes: faker.lorem.sentence(),
        },
      })

      paymentsReceived.push(payment)
      paymentCounter++
    }
  }

  return { invoices, paymentsReceived }
}

async function createBillsAndPayments(company: any, purchaseOrders: any[], users: any[]) {
  console.log('📄 Creating bills and payments with sequential numbering...')

  const bills = []
  const paymentsMade = []
  let paymentCounter = 1

  for (let i = 0; i < purchaseOrders.slice(0, 10).length; i++) {
    const purchaseOrder = purchaseOrders[i]
    const billDate = faker.date.between({
      from: purchaseOrder.orderDate,
      to: new Date(),
    })

    // Sequential numbering for bills: BILL-000001, BILL-000002, etc.
    const billNumber = (i + 1).toString().padStart(6, '0')
    const billReference = `BILL-${billNumber}`

    const bill = await prisma.bill.create({
      data: {
        billNumber: billNumber,
        billReference: billReference,
        billDate: billDate,
        dueDate: faker.date.future({ refDate: billDate }),
        status: faker.helpers.arrayElement([
          'Unbilled',
          'Sent',
          'Paid',
          'PartiallyPaid',
          'Overdue',
          'Unpaid',
        ]),
        companyId: company.id,
        purchaseOrderId: purchaseOrder.id,
        userId: faker.helpers.arrayElement(users).id,
        notes: faker.lorem.sentence(),
      },
    })

    bills.push(bill)

    // Create payment made for some bills
    if (faker.datatype.boolean(0.6)) {
      // 60% chance of payment
      const paymentAmount = faker.number.float({ min: 100, max: 8000, fractionDigits: 2 })
      const balanceDue = faker.number.float({ min: 0, max: 2000, fractionDigits: 2 })

      // Sequential numbering for payments made: PAYM-000001, PAYM-000002, etc.
      const paymentNumber = paymentCounter.toString().padStart(6, '0')
      const paymentReference = `PAYM-${paymentNumber}`

      const payment = await prisma.paymentMade.create({
        data: {
          paymentNumber: paymentNumber,
          paymentReference: paymentReference,
          amountReceived: paymentAmount,
          balanceDue: balanceDue,
          paymentDate: faker.date.between({ from: billDate, to: new Date() }),
          status: balanceDue > 0 ? 'PartiallyPaid' : 'Paid',
          paymentMethod: faker.helpers.arrayElement([
            'Cash',
            'CreditCard',
            'BankTransfer',
            'Cheque',
          ]),
          companyId: company.id,
          billId: bill.id,
          notes: faker.lorem.sentence(),
        },
      })

      paymentsMade.push(payment)
      paymentCounter++
    }
  }

  return { bills, paymentsMade }
}

async function createStockAdjustments(company: any, products: any[], sites: any[], users: any[]) {
  console.log('📊 Creating stock adjustments with sequential numbering...')

  const stockAdjustments = []
  const warehouseUser = users.find((u) => u.email === 'warehouse@flowtech.com')

  for (let i = 0; i < 10; i++) {
    const site = faker.helpers.arrayElement(sites.filter((s) => s.type === 'Warehouse'))
    const selectedProducts = faker.helpers.arrayElements(
      products,
      faker.number.int({ min: 1, max: 3 })
    )

    // Sequential numbering for stock adjustments: ADJ-000001, ADJ-000002, etc.
    const adjustmentNumber = (i + 1).toString().padStart(6, '0')
    const adjustmentReference = `ADJ-${adjustmentNumber}`

    const stockAdjustment = await prisma.stockAdjustment.create({
      data: {
        reference: adjustmentReference,
        date: faker.date.between({ from: '2024-01-01', to: new Date() }),
        reason: faker.helpers.arrayElement([
          'DamagedItems',
          'ExcessStock',
          'QualityControl',
          'InternalTransfer',
          'WriteOff',
          'UnaccountedInventory',
          'LostItems',
        ]),
        status: faker.helpers.arrayElement(['Pending', 'Approved', 'Completed']),
        notes: faker.lorem.sentence(),
        companyId: company.id,
        siteId: site.id,
        createdById: warehouseUser!.id,
        products: {
          connect: selectedProducts.map((p) => ({ id: p.id })),
        },
      },
    })

    stockAdjustments.push(stockAdjustment)

    // Create stock adjustment history for each product
    for (const product of selectedProducts) {
      await prisma.stockAdjustmentHistory.create({
        data: {
          openingStock: product.openingStock,
          adjustedQuantity: faker.number.int({ min: -10, max: 10 }),
          physicalStockOnHand: product.physicalStockOnHand,
          accountingStockOnHand: product.accountingStockOnHand,
          reference: stockAdjustment.reference,
          productId: product.id,
          createdById: warehouseUser!.id,
        },
      })
    }
  }

  return stockAdjustments
}

async function createTransferOrders(company: any, sites: any[], products: any[]) {
  console.log('🚚 Creating transfer orders with sequential numbering...')

  const transferOrders = []
  const warehouses = sites.filter((s) => s.type === 'Warehouse')
  const stores = sites.filter((s) => s.type === 'Store')

  for (let i = 0; i < 8; i++) {
    const fromSite = faker.helpers.arrayElement(warehouses)
    const toSite = faker.helpers.arrayElement(stores)
    const selectedProducts = faker.helpers.arrayElements(
      products,
      faker.number.int({ min: 1, max: 4 })
    )

    // Sequential numbering for transfer orders: TO-000001, TO-000002, etc.
    const transferNumber = (i + 1).toString().padStart(6, '0')
    const transferReference = `TO-${transferNumber}`

    const transferOrder = await prisma.transferOrder.create({
      data: {
        transferOrderNumber: transferNumber,
        transferOrderReference: transferReference,
        transferOrderDate: faker.date.between({ from: '2024-01-01', to: new Date() }),
        status: faker.helpers.arrayElement([
          'Pending',
          'Confirmed',
          'InTransit',
          'Delivered',
          'Cancelled',
        ]),
        reason: faker.helpers.arrayElement(['InternalTransfer', 'ExcessStock', 'Demo', 'Other']),
        otherReason: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        companyId: company.id,
        siteFromId: fromSite.id,
        siteToId: toSite.id,
      },
    })

    // Add items to transfer order
    for (const product of selectedProducts) {
      await prisma.transferOrderItem.create({
        data: {
          transferOrderId: transferOrder.id,
          productId: product.id,
          quantity: faker.number.int({ min: 1, max: 20 }),
        },
      })
    }

    transferOrders.push(transferOrder)
  }

  return transferOrders
}

async function createNotifications(company: any, products: any[], users: any[]) {
  console.log('🔔 Creating notifications...')

  const notifications = []

  for (let i = 0; i < 20; i++) {
    const product = faker.helpers.arrayElement(products)
    const user = faker.helpers.arrayElement(users)
    const status = faker.helpers.arrayElement([
      'LowStock',
      'OutOfStock',
      'RestockReminder',
      'NewOrder',
      'NewSale',
      'Critical',
    ])

    let message = ''
    switch (status) {
      case 'LowStock':
        message = `${product.name} is running low on stock (${product.physicalStockOnHand} remaining)`
        break
      case 'OutOfStock':
        message = `${product.name} is out of stock`
        break
      case 'RestockReminder':
        message = `Restock reminder for ${product.name}`
        break
      case 'NewOrder':
        message = `New order received for ${product.name}`
        break
      case 'NewSale':
        message = `New sale recorded for ${product.name}`
        break
      case 'Critical':
        message = `Critical stock level reached for ${product.name}`
        break
    }

    const notification = await prisma.notification.create({
      data: {
        status: status,
        message: message,
        companyId: company.id,
        productId: product.id,
        createdById: user.id,
        read: faker.datatype.boolean(0.3), // 30% chance of being read
      },
    })

    notifications.push(notification)
  }

  return notifications
}

async function createWorkflowTemplatesAndApprovals(
  company: any,
  roles: any[],
  users: any[],
  transferOrders: any[]
) {
  console.log('⚡ Creating workflow templates and approval workflows...')

  const adminUser = users.find((u) => u.email === 'admin@flowtech.com')
  const inventoryManagerRole = roles.find((r) => r.name === 'Inventory Manager')
  const accountantRole = roles.find((r) => r.name === 'Accountant')
  const warehouseRole = roles.find((r) => r.name === 'Warehouse Staff')

  const workflowTemplates = []

  // 1. MANUAL - Manual Workflow Template
  const manualWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'Manual Workflow - On-Demand Process',
      description: 'Manual workflow template for special processes requiring manual trigger',
      triggerType: WORKFLOW_TRIGGER_TYPES.MANUAL,
      triggerConditions: {
        entityType: 'custom',
      },
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Manual Review',
            description: 'Manual review of the process by the responsible manager',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: inventoryManagerRole!.id,
            timeoutHours: 24,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 2. PURCHASE_ORDER_CREATE - Simple Purchase Order Creation
  const purchaseOrderCreateWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'Purchase Order - Standard Validation',
      description: 'Automatic workflow for all new purchase orders',
      triggerType: WORKFLOW_TRIGGER_TYPES.PURCHASE_ORDER_CREATE,
      triggerConditions: {
        entityType: 'purchase_order',
      },
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Warehouse Validation',
            description: 'Validation by warehouse team',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: warehouseRole!.id,
            timeoutHours: 8,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 3. PURCHASE_ORDER_THRESHOLD - High Value Purchase Orders
  const purchaseOrderThresholdWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'Purchase Order - High Amount Approval',
      description: 'Approval workflow for purchase orders above €5,000',
      triggerType: WORKFLOW_TRIGGER_TYPES.PURCHASE_ORDER_THRESHOLD,
      triggerConditions: {
        threshold: {
          field: 'amount',
          operator: 'gte',
          value: 5000,
          currency: 'EUR',
        },
        fieldConditions: [
          {
            field: 'priority',
            operator: 'ne',
            value: 'Low',
          },
        ],
      },
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Inventory Manager Review',
            description: 'Inventory manager must review and approve the order',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: inventoryManagerRole!.id,
            timeoutHours: 24,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
          {
            stepNumber: 2,
            name: 'Accounting Validation',
            description: 'Budget validation by accounting department',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: accountantRole!.id,
            timeoutHours: 48,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 4. SALES_ORDER_CREATE - Sales Order Creation
  const salesOrderCreateWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'Sales Order - Standard Process',
      description: 'Automatic workflow for new sales orders',
      triggerType: WORKFLOW_TRIGGER_TYPES.SALES_ORDER_CREATE,
      triggerConditions: {
        entityType: 'sales_order',
      },
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Stock Verification',
            description: 'Check product availability in stock',
            stepType: WORKFLOW_STEP_TYPES.AUTOMATIC_ACTION,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: warehouseRole!.id,
            timeoutHours: 4,
            isRequired: true,
            autoApprove: true,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 5. SALES_ORDER_THRESHOLD - High Value Sales Orders
  const salesOrderThresholdWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'Sales Order - Large Amount',
      description: 'Workflow for high value sales orders (>€10,000)',
      triggerType: WORKFLOW_TRIGGER_TYPES.SALES_ORDER_THRESHOLD,
      triggerConditions: {
        threshold: {
          field: 'amount',
          operator: 'gt',
          value: 10000,
          currency: 'EUR',
        },
        fieldConditions: [
          {
            field: 'customerType',
            operator: 'eq',
            value: 'Corporate',
          },
        ],
      },
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Sales Director Approval',
            description: 'Sales director approval required for large contracts',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: inventoryManagerRole!.id,
            timeoutHours: 12,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 6. INVOICE_CREATE - Invoice Creation
  const invoiceCreateWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'Invoice - Creation Process',
      description: 'Workflow for new invoice validation',
      triggerType: WORKFLOW_TRIGGER_TYPES.INVOICE_CREATE,
      triggerConditions: {
        entityType: 'invoice',
      },
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Accounting Review',
            description: 'Review invoice details for accuracy',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: accountantRole!.id,
            timeoutHours: 24,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 7. BILL_CREATE - Bill Creation
  const billCreateWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'Bill - Vendor Bill Processing',
      description: 'Workflow for processing new vendor bills',
      triggerType: WORKFLOW_TRIGGER_TYPES.BILL_CREATE,
      triggerConditions: {
        entityType: 'bill',
        fieldConditions: [
          {
            field: 'status',
            operator: 'eq',
            value: 'pending',
          },
        ],
      },
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Bill Verification',
            description: 'Verify bill against purchase order',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: accountantRole!.id,
            timeoutHours: 48,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 8. CUSTOMER_CREATE - Customer Creation (New Implementation)
  const customerCreateWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'Customer - New Customer Onboarding',
      description: 'Workflow for new customer approval and setup',
      triggerType: WORKFLOW_TRIGGER_TYPES.CUSTOMER_CREATE,
      triggerConditions: {
        entityType: 'customer',
        fieldConditions: [
          {
            field: 'type',
            operator: 'eq',
            value: 'Corporate',
          },
        ],
      },
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Credit Check',
            description: 'Perform credit check for new corporate customer',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: accountantRole!.id,
            timeoutHours: 72,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 9. SUPPLIER_CREATE - Supplier Creation
  const supplierCreateWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'Supplier - New Supplier Approval',
      description: 'Workflow for approving new suppliers',
      triggerType: WORKFLOW_TRIGGER_TYPES.SUPPLIER_CREATE,
      triggerConditions: {
        entityType: 'supplier',
      },
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Supplier Verification',
            description: 'Verify supplier credentials and documentation',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: inventoryManagerRole!.id,
            timeoutHours: 48,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 10. PRODUCT_CREATE - Product Creation
  const productCreateWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'Product - New Product Approval',
      description: 'Workflow for new product approval and setup',
      triggerType: WORKFLOW_TRIGGER_TYPES.PRODUCT_CREATE,
      triggerConditions: {
        entityType: 'product',
        fieldConditions: [
          {
            field: 'category',
            operator: 'eq',
            value: 'Electronics',
          },
        ],
      },
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Product Review',
            description: 'Review product specifications and pricing',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: inventoryManagerRole!.id,
            timeoutHours: 24,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 11. LOW_STOCK_ALERT - Low Stock Alert
  const lowStockAlertWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'Inventory - Low Stock Alert',
      description: 'Workflow triggered when stock falls below minimum level',
      triggerType: WORKFLOW_TRIGGER_TYPES.LOW_STOCK_ALERT,
      triggerConditions: {
        threshold: {
          field: 'quantity',
          operator: 'lte',
          value: 10,
        },
        fieldConditions: [
          {
            field: 'category',
            operator: 'ne',
            value: 'Seasonal',
          },
        ],
      },
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Reorder Decision',
            description: 'Decide whether to reorder this product',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: warehouseRole!.id,
            timeoutHours: 12,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 12. HIGH_VALUE_TRANSACTION - High Value Transaction
  const highValueTransactionWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'Finance - High Value Transaction',
      description: 'Workflow for transactions exceeding €50,000',
      triggerType: WORKFLOW_TRIGGER_TYPES.HIGH_VALUE_TRANSACTION,
      triggerConditions: {
        threshold: {
          field: 'amount',
          operator: 'gt',
          value: 50000,
          currency: 'EUR',
        },
      },
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Financial Controller Review',
            description: 'Review by financial controller for high value transactions',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: accountantRole!.id,
            timeoutHours: 24,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
          {
            stepNumber: 2,
            name: 'Executive Approval',
            description: 'Executive approval for major financial transactions',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.USER,
            assigneeUserId: adminUser!.id,
            timeoutHours: 48,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 13. BULK_OPERATION - Bulk Operation
  const bulkOperationWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'System - Bulk Operation Approval',
      description: 'Workflow for approving bulk operations affecting multiple records',
      triggerType: WORKFLOW_TRIGGER_TYPES.BULK_OPERATION,
      triggerConditions: {
        threshold: {
          field: 'recordCount',
          operator: 'gt',
          value: 100,
        },
        fieldConditions: [
          {
            field: 'operationType',
            operator: 'in',
            value: ['delete', 'update'],
          },
        ],
      },
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Bulk Operation Review',
            description: 'Review bulk operation for safety and accuracy',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.USER,
            assigneeUserId: adminUser!.id,
            timeoutHours: 12,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 14. SCHEDULED - Scheduled Process
  const scheduledWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'System - Scheduled Maintenance',
      description: 'Workflow for scheduled system maintenance tasks',
      triggerType: WORKFLOW_TRIGGER_TYPES.SCHEDULED,
      triggerConditions: {
        schedule: {
          type: 'weekly',
          dayOfWeek: 0, // Sunday
          hour: 2,
          minute: 0,
        },
        fieldConditions: [
          {
            field: 'maintenanceType',
            operator: 'eq',
            value: 'database_cleanup',
          },
        ],
      },
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Maintenance Approval',
            description: 'Approve scheduled maintenance window',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.USER,
            assigneeUserId: adminUser!.id,
            timeoutHours: 168, // 7 days
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 15. CUSTOM_CONDITION - Custom Condition
  const customConditionWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'Custom - Special Business Rule',
      description: 'Workflow for custom business rule validation',
      triggerType: WORKFLOW_TRIGGER_TYPES.CUSTOM_CONDITION,
      triggerConditions: {
        customRule: {
          name: 'holiday_order_review',
          parameters: {
            dateRange: ['2024-12-20', '2025-01-05'],
            entityTypes: ['sales_order', 'purchase_order'],
          },
        },
        fieldConditions: [
          {
            field: 'priority',
            operator: 'eq',
            value: 'urgent',
          },
        ],
      },
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Holiday Period Review',
            description: 'Special review for orders during holiday period',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: inventoryManagerRole!.id,
            timeoutHours: 8,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 6. STOCK_ADJUSTMENT_CREATE - Stock Adjustment Workflow
  const stockAdjustmentWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'Stock Adjustment - Approval Process',
      description: 'Approval workflow for all stock adjustments',
      triggerType: WORKFLOW_TRIGGER_TYPES.STOCK_ADJUSTMENT_CREATE,
      triggerConditions: {},
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Manager Review',
            description: 'Inventory manager must review the adjustment',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: inventoryManagerRole!.id,
            timeoutHours: 12,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 3. Customer Creation Approval Workflow
  const customerApprovalWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'New Customer - Approval Process',
      description: 'Approval workflow for new customers',
      triggerType: WORKFLOW_TRIGGER_TYPES.CUSTOMER_CREATE,
      triggerConditions: {},
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Commercial Validation',
            description: 'Validation of customer information by manager',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: inventoryManagerRole!.id,
            timeoutHours: 24,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  // 4. Transfer Order Approval Workflow (Between Sites)
  const transferOrderWorkflow = await prisma.workflowTemplate.create({
    data: {
      name: 'Transfer Order - Approval Process',
      description: 'Approval workflow for transfers between sites',
      triggerType: WORKFLOW_TRIGGER_TYPES.TRANSFER_ORDER_CREATE,
      triggerConditions: {},
      isActive: true,
      companyId: company.id,
      createdById: adminUser!.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Warehouse Validation',
            description: 'Validation by source warehouse staff',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: warehouseRole!.id,
            timeoutHours: 8,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
          {
            stepNumber: 2,
            name: 'Manager Approval',
            description: 'Final approval by inventory manager',
            stepType: WORKFLOW_STEP_TYPES.APPROVAL,
            assigneeType: APPROVAL_ASSIGNEE_TYPES.ROLE,
            assigneeRoleId: inventoryManagerRole!.id,
            timeoutHours: 12,
            isRequired: true,
            autoApprove: false,
            allowParallel: false,
          },
        ],
      },
    },
  })

  workflowTemplates.push(
    manualWorkflow,
    purchaseOrderCreateWorkflow,
    purchaseOrderThresholdWorkflow,
    salesOrderCreateWorkflow,
    salesOrderThresholdWorkflow,
    invoiceCreateWorkflow,
    billCreateWorkflow,
    customerCreateWorkflow,
    supplierCreateWorkflow,
    productCreateWorkflow,
    lowStockAlertWorkflow,
    highValueTransactionWorkflow,
    bulkOperationWorkflow,
    scheduledWorkflow,
    customConditionWorkflow
  )

  // Create some demo approval requests
  const approvalRequests = []

  // Demo Purchase Order Approval
  const purchaseOrderApproval = await prisma.approvalRequest.create({
    data: {
      entityType: APPROVAL_ENTITY_TYPES.PURCHASE_ORDER,
      entityId: 'demo-po-001',
      requestType: APPROVAL_REQUEST_TYPES.THRESHOLD_BREACH,
      title: 'Purchase Order Approval PO-00001 - €8,500',
      description: 'Purchase order exceeding automatic approval threshold (€5,000)',
      data: {
        amount: 8500,
        currency: 'EUR',
        supplier: 'TechSource Electronics',
        items: [
          { product: 'MacBook Pro 16"', quantity: 3, unitPrice: 2200 },
          { product: 'iPad Pro 12.9"', quantity: 2, unitPrice: 950 },
        ],
      },
      conditions: {
        threshold: 5000,
        requiresManagerApproval: true,
        requiresAccountantApproval: true,
      },
      status: APPROVAL_STATUSES.PENDING,
      priority: APPROVAL_PRIORITIES.HIGH,
      requestedBy: users.find((u) => u.email === 'warehouse@flowtech.com')!.id,
      assignedTo: users.find((u) => u.email === 'manager@flowtech.com')!.id,
      companyId: company.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  })

  // Demo Stock Adjustment Approval
  const stockAdjustmentApproval = await prisma.approvalRequest.create({
    data: {
      entityType: APPROVAL_ENTITY_TYPES.STOCK_ADJUSTMENT,
      entityId: 'demo-adj-001',
      requestType: APPROVAL_REQUEST_TYPES.APPROVE,
      title: 'Stock Adjustment ADJ-000001',
      description: 'Stock adjustment for damaged items',
      data: {
        reason: 'DamagedItems',
        products: [
          { sku: 'ELEC001', name: 'MacBook Pro 16"', adjustedQuantity: -2, reason: 'Écran cassé' },
          {
            sku: 'ELEC002',
            name: 'iPhone 15 Pro',
            adjustedQuantity: -1,
            reason: 'Défaut batterie',
          },
        ],
      },
      status: APPROVAL_STATUSES.PENDING,
      priority: APPROVAL_PRIORITIES.MEDIUM,
      requestedBy: users.find((u) => u.email === 'warehouse@flowtech.com')!.id,
      assignedTo: users.find((u) => u.email === 'manager@flowtech.com')!.id,
      companyId: company.id,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },
  })

  // Demo Customer Creation Approval
  const customerApproval = await prisma.approvalRequest.create({
    data: {
      entityType: APPROVAL_ENTITY_TYPES.CUSTOMER,
      entityId: 'demo-cust-001',
      requestType: APPROVAL_REQUEST_TYPES.CREATE,
      title: 'Nouveau Client - Entreprise Durand & Fils',
      description: "Demande de création d'un nouveau compte client",
      data: {
        companyName: 'Durand & Fils SARL',
        contactName: 'Pierre Durand',
        email: 'p.durand@durandfils.fr',
        phone: '+33 4 78 45 67 89',
        address: '42 Avenue de la Liberté, 69003 Lyon',
        creditLimit: 25000,
        paymentTerms: 'Net30',
      },
      status: APPROVAL_STATUSES.IN_REVIEW,
      priority: APPROVAL_PRIORITIES.MEDIUM,
      requestedBy: users.find((u) => u.email === 'sales@flowtech.com')!.id,
      assignedTo: users.find((u) => u.email === 'manager@flowtech.com')!.id,
      companyId: company.id,
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    },
  })

  // Demo Transfer Order Approval - using first transfer order from created ones
  const firstTransferOrder = transferOrders[0] // Use the first transfer order created earlier

  // Fetch the transfer order with site details for proper display
  const transferOrderWithSites = await prisma.transferOrder.findUnique({
    where: { id: firstTransferOrder.id },
    include: {
      siteFrom: true,
      siteTo: true,
    },
  })

  const transferOrderApproval = await prisma.approvalRequest.create({
    data: {
      entityType: APPROVAL_ENTITY_TYPES.TRANSFER_ORDER,
      entityId: firstTransferOrder.id, // Use real transfer order ID
      requestType: APPROVAL_REQUEST_TYPES.APPROVE,
      title: `Transfert ${firstTransferOrder.transferOrderReference}`,
      description: `Transfert de stock entre ${transferOrderWithSites?.siteFrom?.name || 'entrepôt source'} et ${transferOrderWithSites?.siteTo?.name || 'site destination'}`,
      data: {
        transferOrderReference: firstTransferOrder.transferOrderReference,
        fromSite: transferOrderWithSites?.siteFrom?.name || 'Site source',
        toSite: transferOrderWithSites?.siteTo?.name || 'Site destination',
        urgency: 'Standard',
        expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      },
      status: APPROVAL_STATUSES.PENDING,
      priority: APPROVAL_PRIORITIES.LOW,
      requestedBy: users.find((u) => u.email === 'warehouse@flowtech.com')!.id,
      assignedRole: warehouseRole!.id,
      companyId: company.id,
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    },
  })

  // Create a workflow instance and step execution for the transfer order to demonstrate step indicators
  const transferOrderWorkflowWithSteps = await prisma.workflowTemplate.findUnique({
    where: { id: transferOrderWorkflow.id },
    include: { steps: { orderBy: { stepNumber: 'asc' } } },
  })

  const transferOrderWorkflowInstance = await prisma.workflowInstance.create({
    data: {
      workflowTemplateId: transferOrderWorkflow.id,
      entityType: 'transfer_order',
      entityId: firstTransferOrder.id,
      status: 'in_progress',
      currentStepNumber: 1,
      triggeredBy: users.find((u) => u.email === 'warehouse@flowtech.com')!.id,
      data: {
        transferOrderReference: firstTransferOrder.transferOrderReference,
        fromSite: transferOrderWithSites?.siteFrom?.name || 'Site source',
        toSite: transferOrderWithSites?.siteTo?.name || 'Site destination',
      },
      metadata: {},
      startedAt: new Date(),
    },
  })

  // Create step execution for the first step (warehouse validation)
  const transferOrderStepExecution = await prisma.workflowStepExecution.create({
    data: {
      workflowInstanceId: transferOrderWorkflowInstance.id,
      workflowStepId: transferOrderWorkflowWithSteps!.steps[0].id, // First step
      status: 'pending',
      assignedTo: users.find((u) => u.email === 'warehouse@flowtech.com')!.id,
      startedAt: new Date(),
      metadata: {},
    },
  })

  // Update the approval request to link it to the workflow step execution
  await prisma.approvalRequest.update({
    where: { id: transferOrderApproval.id },
    data: {
      workflowInstanceId: transferOrderWorkflowInstance.id,
      stepExecutionId: transferOrderStepExecution.id,
    },
  })

  // Create a second example: a transfer order that has already progressed to step 2
  const secondTransferOrder = transferOrders[1] // Use the second transfer order if available
  if (secondTransferOrder) {
    const secondTransferOrderWorkflowInstance = await prisma.workflowInstance.create({
      data: {
        workflowTemplateId: transferOrderWorkflow.id,
        entityType: 'transfer_order',
        entityId: secondTransferOrder.id,
        status: 'in_progress',
        currentStepNumber: 2, // Already at step 2
        triggeredBy: users.find((u) => u.email === 'warehouse@flowtech.com')!.id,
        data: {
          transferOrderReference: secondTransferOrder.transferOrderReference,
          fromSite: 'Entrepôt Principal',
          toSite: 'Magasin Centre-ville',
        },
        metadata: {},
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Started 2 hours ago
      },
    })

    // Create step execution for step 1 (completed)
    await prisma.workflowStepExecution.create({
      data: {
        workflowInstanceId: secondTransferOrderWorkflowInstance.id,
        workflowStepId: transferOrderWorkflowWithSteps!.steps[0].id,
        status: 'completed',
        assignedTo: users.find((u) => u.email === 'warehouse@flowtech.com')!.id,
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // Completed 1 hour ago
        decision: 'approved',
        metadata: {},
      },
    })

    // Create step execution for step 2 (current - pending)
    const currentStepExecution = await prisma.workflowStepExecution.create({
      data: {
        workflowInstanceId: secondTransferOrderWorkflowInstance.id,
        workflowStepId: transferOrderWorkflowWithSteps!.steps[1].id,
        status: 'pending',
        assignedTo: users.find((u) => u.email === 'manager@flowtech.com')!.id,
        startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // Started 1 hour ago
        metadata: {},
      },
    })

    // Create ONE approval request that is now at step 2
    const progressedTransferOrderApproval = await prisma.approvalRequest.create({
      data: {
        entityType: APPROVAL_ENTITY_TYPES.TRANSFER_ORDER,
        entityId: secondTransferOrder.id,
        workflowInstanceId: secondTransferOrderWorkflowInstance.id,
        stepExecutionId: currentStepExecution.id, // Points to current step (step 2)
        requestType: APPROVAL_REQUEST_TYPES.APPROVE,
        title: `Transfert ${secondTransferOrder.transferOrderReference}`,
        description: `Transfert de stock entre Entrepôt Principal et Magasin Centre-ville - En attente d'approbation managériale`,
        data: {
          transferOrderReference: secondTransferOrder.transferOrderReference,
          fromSite: 'Entrepôt Principal',
          toSite: 'Magasin Centre-ville',
          urgency: 'High',
          expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        },
        status: APPROVAL_STATUSES.IN_REVIEW, // Already in review at step 2
        priority: APPROVAL_PRIORITIES.HIGH,
        requestedBy: users.find((u) => u.email === 'warehouse@flowtech.com')!.id,
        assignedTo: users.find((u) => u.email === 'manager@flowtech.com')!.id, // Now assigned to manager
        companyId: company.id,
        expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      },
    })

    approvalRequests.push(progressedTransferOrderApproval)
  }

  approvalRequests.push(
    purchaseOrderApproval,
    stockAdjustmentApproval,
    customerApproval,
    transferOrderApproval
  )

  // Add approval comments to demonstrate the comment system
  await prisma.approvalComment.create({
    data: {
      approvalRequestId: purchaseOrderApproval.id,
      authorId: users.find((u) => u.email === 'manager@flowtech.com')!.id,
      comment:
        'Je révise cette commande. Le montant est élevé mais justifié par nos besoins actuels en équipement.',
      isInternal: true,
    },
  })

  await prisma.approvalComment.create({
    data: {
      approvalRequestId: customerApproval.id,
      authorId: users.find((u) => u.email === 'sales@flowtech.com')!.id,
      comment:
        'Client recommandé par un partenaire de confiance. Historique de paiement excellent.',
      isInternal: false,
    },
  })

  await prisma.approvalComment.create({
    data: {
      approvalRequestId: customerApproval.id,
      authorId: users.find((u) => u.email === 'manager@flowtech.com')!.id,
      comment: 'Merci pour ces informations. Je valide la création du compte client.',
      isInternal: false,
    },
  })

  return { workflowTemplates, approvalRequests }
}

async function createUnitOfMeasures(companyId: string) {
  console.log('📏 Creating unit of measures...')

  const units = [
    { name: 'Pieces', favorite: true },
    { name: 'Box', favorite: true },
    { name: 'Pack', favorite: true },
    { name: 'Dozen', favorite: false },
    { name: 'Kilogram', favorite: false },
    { name: 'Pound', favorite: false },
    { name: 'Meter', favorite: false },
    { name: 'Liter', favorite: false },
  ]

  const unitOfMeasures = await Promise.all(
    units.map((unit) =>
      prisma.unitOfMeasure.create({
        data: {
          name: unit.name,
          favorite: unit.favorite,
          companyId: companyId,
        },
      })
    )
  )

  return unitOfMeasures
}

async function createStripeProducts() {
  console.log('🏭 Creating Stripe products...')

  const stripeProducts = []

  for (const [planKey, planData] of Object.entries(PRICING_PLANS)) {
    try {
      // Check if product already exists in Stripe
      let product
      try {
        product = await stripe.products.retrieve(planData.stripeProductId)
        console.log(`   📦 Product already exists: ${planData.name} (${product.id})`)
      } catch (error) {
        // Product doesn't exist, create it
        product = await stripe.products.create({
          id: planData.stripeProductId,
          name: planData.name,
          description: planData.description,
          type: 'service',
        })
        console.log(`   ✅ Created Stripe product: ${planData.name} (${product.id})`)
      }

      // Create prices for each interval and currency
      const stripePrices = []
      for (const [interval, currencyPrices] of Object.entries(planData.prices)) {
        for (const [currency, amount] of Object.entries(currencyPrices)) {
          const priceId =
            planData.stripePriceIds[interval as keyof typeof planData.stripePriceIds][
              currency as keyof typeof currencyPrices
            ]

          try {
            // Check if price already exists
            const existingPrice = await stripe.prices.retrieve(priceId)
            console.log(
              `   💰 Price already exists: ${planData.name} ${interval} ${currency} (${existingPrice.id})`
            )
            stripePrices.push(existingPrice)
          } catch (error) {
            // Price doesn't exist, create it
            const price = await stripe.prices.create({
              product: product.id,
              unit_amount: amount,
              currency: currency.toLowerCase(),
              recurring: {
                interval: interval as 'month' | 'year',
              },
            })
            console.log(
              `   ✅ Created Stripe price: ${planData.name} ${interval} ${currency} $${amount / 100} (${price.id})`
            )
            stripePrices.push(price)

            // Note: We'll use the generated Stripe price ID, not the predefined one
            console.log(`   ℹ️  Price ID generated: ${price.id} (instead of predefined ${priceId})`)
          }
        }
      }

      stripeProducts.push({ product, prices: stripePrices })
    } catch (error) {
      console.error(`❌ Failed to create Stripe product ${planData.name}:`, error)
    }
  }

  console.log(`✅ Created/verified ${stripeProducts.length} Stripe products with prices`)
  return stripeProducts
}

async function createStripeCustomers(users: any[]) {
  console.log('👥 Creating Stripe customer for admin user only...')

  const stripeCustomers = []

  // Find only the admin user
  const adminUser = users.find((u) => u.email === 'admin@flowtech.com')
  if (!adminUser) {
    console.log('⚠️  Admin user not found, skipping Stripe customer creation')
    return []
  }

  try {
    // Check if admin user already has a Stripe customer ID
    if (adminUser.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(adminUser.stripeCustomerId)
        console.log(`   👤 Admin customer already exists: ${adminUser.email} (${customer.id})`)
        stripeCustomers.push(customer)
        return stripeCustomers
      } catch (error) {
        console.log(
          `   ⚠️  Stripe customer ${adminUser.stripeCustomerId} not found for ${adminUser.email}, creating new one`
        )
      }
    }

    // Create new Stripe customer for admin only
    const customer = await stripe.customers.create({
      email: adminUser.email,
      name: adminUser.profile
        ? `${adminUser.profile.firstName} ${adminUser.profile.lastName}`
        : undefined,
      metadata: {
        userId: adminUser.id,
      },
    })

    // Update admin user with Stripe customer ID
    const updatedUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { stripeCustomerId: customer.id },
    })

    // Update the user object in the array
    adminUser.stripeCustomerId = customer.id

    console.log(`   ✅ Created Stripe customer for admin: ${adminUser.email} (${customer.id})`)
    stripeCustomers.push(customer)
  } catch (error) {
    console.error(`❌ Failed to create Stripe customer for admin ${adminUser.email}:`, error)
  }

  console.log(`✅ Created/verified ${stripeCustomers.length} Stripe customer (admin only)`)
  return stripeCustomers
}

async function createSubscriptionPlans(stripeProducts: any[]) {
  console.log('💳 Creating subscription plans in database...')

  const plans = []

  for (const [planKey, planData] of Object.entries(PRICING_PLANS)) {
    // Find the corresponding Stripe product
    const stripeProduct = stripeProducts.find((sp) => sp.product.id === planData.stripeProductId)
    if (!stripeProduct) {
      console.log(`⚠️  Stripe product not found for ${planData.name}, skipping`)
      continue
    }

    // Create the plan in database
    const plan = await prisma.plan.create({
      data: {
        id: planData.id,
        name: planData.name,
        description: planData.description,
      },
    })

    // Create prices in database using actual Stripe price IDs
    const prices = []
    for (const stripePrice of stripeProduct.prices) {
      const price = await prisma.price.create({
        data: {
          id: stripePrice.id, // Use actual Stripe price ID
          planId: plan.id,
          amount: stripePrice.unit_amount,
          currency: stripePrice.currency.toUpperCase(),
          interval: stripePrice.recurring?.interval || 'month',
        },
      })
      prices.push(price)
    }

    plans.push({ plan, prices })
    console.log(`   ✅ Created plan: ${planData.name} with ${prices.length} prices`)
  }

  console.log(`✅ Created ${plans.length} subscription plans in database`)
  return plans
}

async function createDemoSubscription(users: any[], subscriptionPlans: any[]) {
  console.log('💳 Creating Stripe trial subscription for admin user...')

  const adminUser = users.find((u) => u.email === 'admin@flowtech.com')
  if (!adminUser) {
    console.log('⚠️  Admin user not found, skipping subscription creation')
    return
  }

  if (!adminUser.stripeCustomerId) {
    console.log('⚠️  Admin user has no Stripe customer ID, skipping subscription creation')
    return
  }

  // Find the Standard plan monthly USD price
  const standardPlan = subscriptionPlans.find((sp) => sp.plan.id === PRICING_PLANS.standard.id)
  if (!standardPlan) {
    console.log('⚠️  Standard plan not found, skipping subscription creation')
    console.log(
      'Available plans:',
      subscriptionPlans.map((sp) => sp.plan.id)
    )
    return
  }

  const monthlyUSDPrice = standardPlan.prices.find(
    (p: { interval: string; currency: string }) =>
      p.interval === 'month' && p.currency.toUpperCase() === 'USD'
  )

  if (!monthlyUSDPrice) {
    console.log('⚠️  Monthly USD price for Standard plan not found, skipping subscription creation')
    return
  }

  try {
    // Create trial subscription in Stripe
    const now = Math.floor(Date.now() / 1000) // Current time in Unix timestamp
    const trialEnd = now + 14 * 24 * 60 * 60 // 14 days from now

    const stripeSubscription = await stripe.subscriptions.create({
      customer: adminUser.stripeCustomerId,
      items: [
        {
          price: monthlyUSDPrice.id,
        },
      ],
      trial_end: trialEnd,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      metadata: {
        userId: adminUser.id,
        planId: standardPlan.plan.id,
      },
    })

    // Log the subscription to debug the structure
    console.log('   🔍 Stripe subscription:', JSON.stringify(stripeSubscription, null, 2))

    // Create subscription in database using Stripe subscription data
    const subData = stripeSubscription as unknown as {
      id: string
      status: string
      current_period_start: number
      current_period_end: number
      trial_start: number | null
      trial_end: number | null
      cancel_at_period_end: boolean
    }

    const subscription = await prisma.subscription.create({
      data: {
        id: subData.id,
        userId: adminUser.id,
        planId: standardPlan.plan.id,
        priceId: monthlyUSDPrice.id,
        status: subData.status,
        currentPeriodStart: subData.current_period_start || 0,
        currentPeriodEnd: subData.current_period_end || 0,
        trialStart: subData.trial_start || 0,
        trialEnd: subData.trial_end || 0,
        interval: 'month',
        cancelAtPeriodEnd: subData.cancel_at_period_end,
      },
      include: {
        price: true,
      },
    })

    console.log(
      `✅ Created Stripe trial subscription for admin: ${subscription.planId} (${subscription.status})`
    )
    console.log(`   Subscription ID: ${subscription.id}`)
    console.log(
      `   Trial ends: ${new Date((subscription.trialEnd || 0) * 1000).toLocaleDateString()}`
    )
    return subscription
  } catch (error) {
    console.error('❌ Failed to create Stripe trial subscription:', error)
    throw error
  }
}

async function seed() {
  console.log('🌱 Starting comprehensive seed process...')

  try {
    // 1. Cleanup existing data
    await cleanupDatabase()

    // 2. Create company structure
    const { company, currencies, locations } = await createCompanyStructure()

    // 3. Create Stripe products and prices
    const stripeProducts = await createStripeProducts()

    // 4. Create subscription plans (dependent on Stripe products)
    const subscriptionPlans = await createSubscriptionPlans(stripeProducts)

    // 5. Create agencies and sites
    const { agencies, sites } = await createAgenciesAndSites(company, currencies, locations)

    // 6. Create roles
    const roles = await createRoles(company.id)

    // 7. Create users manually since better-auth can't handle custom fields
    const users = await createUsers(company, roles, agencies, sites)

    // 8. Create Stripe customers for users
    await createStripeCustomers(users)

    // 9. Create demo subscription for admin user
    await createDemoSubscription(users, subscriptionPlans)

    // 8. Create categories
    const categories = await createCategories(company.id)

    // 8. Create suppliers
    const suppliers = await createSuppliers(company, currencies, locations)

    // 9. Create unit of measures
    const unitOfMeasures = await createUnitOfMeasures(company.id)

    // 10. Create products
    const products = await createProducts(company, categories, agencies, sites, users)

    // 11. Create customers
    const customers = await createCustomers(company, agencies, sites, locations)

    // 12. Create purchase orders
    const purchaseOrders = await createPurchaseOrders(company, suppliers, agencies, sites, products)

    // 13. Create sales orders
    const salesOrders = await createSalesOrders(company, customers, agencies, sites, products)

    // 14. Create backorders
    const backorders = await createBackorders(company, customers, agencies, sites, products)

    // 15. Create invoices and payments
    const { invoices, paymentsReceived } = await createInvoicesAndPayments(
      company,
      salesOrders,
      users
    )

    // 16. Create bills and payments
    const { bills, paymentsMade } = await createBillsAndPayments(company, purchaseOrders, users)

    // 17. Create stock adjustments
    const stockAdjustments = await createStockAdjustments(company, products, sites, users)

    // 18. Create transfer orders
    const transferOrders = await createTransferOrders(company, sites, products)

    // 19. Create notifications
    const notifications = await createNotifications(company, products, users)

    // 20. Create workflow templates and approvals
    const { workflowTemplates, approvalRequests } = await createWorkflowTemplatesAndApprovals(
      company,
      roles,
      users,
      transferOrders
    )

    console.log('✅ Seed completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   Company: ${company.name}`)
    console.log(`   Subscription Plans: ${subscriptionPlans.length}`)
    console.log(`   Users: ${users.length}`)
    console.log(`   Agencies: ${agencies.length}`)
    console.log(`   Sites: ${sites.length}`)
    console.log(`   Categories: ${categories.length}`)
    console.log(`   Products: ${products.length}`)
    console.log(`   Suppliers: ${suppliers.length}`)
    console.log(`   Customers: ${customers.length}`)
    console.log(`   Purchase Orders: ${purchaseOrders.length}`)
    console.log(`   Sales Orders: ${salesOrders.length}`)
    console.log(`   Invoices: ${invoices.length}`)
    console.log(`   Bills: ${bills.length}`)
    console.log(`   Payments Received: ${paymentsReceived.length}`)
    console.log(`   Payments Made: ${paymentsMade.length}`)
    console.log(`   Stock Adjustments: ${stockAdjustments.length}`)
    console.log(`   Transfer Orders: ${transferOrders.length}`)
    console.log(`   Notifications: ${notifications.length}`)
    console.log(`   Workflow Templates: ${workflowTemplates.length}`)
    console.log(`   Approval Requests: ${approvalRequests.length}`)

    console.log('\n🔑 Demo Login Credentials:')
    console.log('   Admin: admin@flowtech.com / password123')
    console.log('   Inventory Manager: manager@flowtech.com / password123')
    console.log('   Warehouse: warehouse@flowtech.com / password123')
    console.log('   Sales: sales@flowtech.com / password123')
    console.log('   Accountant: accountant@flowtech.com / password123')
    console.log('   Customer Service: customerservice@flowtech.com / password123')
    console.log('   Quality Control: quality@flowtech.com / password123')
    console.log('   Store Manager: storemanager@flowtech.com / password123')

    console.log('\n⚡ Workflow & Approval System:')
    console.log('   - 15 comprehensive workflow templates covering all trigger types')
    console.log('   - Manual workflows for on-demand processes')
    console.log('   - Purchase order workflows (standard + high-value >€5,000)')
    console.log('   - Sales order workflows (standard + large amount >€10,000)')
    console.log('   - Invoice and bill processing workflows')
    console.log('   - Customer and supplier onboarding workflows')
    console.log('   - Product creation and approval workflows')
    console.log('   - Low stock alerts and inventory workflows')
    console.log('   - High-value transaction workflows (>€50,000)')
    console.log('   - Bulk operation and scheduled maintenance workflows')
    console.log('   - Custom condition workflows for special business rules')
    console.log('   - Advanced trigger conditions with thresholds and field validation')
    console.log('   - Multi-step approval chains with role-based assignments')
    console.log('   - 4 demo approval requests with different statuses')
    console.log('   - Automatic timeout and escalation support')

    console.log('\n💳 Subscription Plans:')
    console.log('   - Standard Plan: $29/month, $19/year (500 orders, 3 users, 1 agency, 2 sites)')
    console.log(
      '   - Professional Plan: $39/month, $29/year (1,000 orders, 10 users, 2 agencies, 4 sites)'
    )
    console.log(
      '   - Premium Plan: $99/month, $79/year (unlimited orders, 20 users, 4 agencies, 8 sites)'
    )
    console.log('   - All plans include 14-day free trial')
    console.log('   - Integrated with Stripe for secure payment processing')
    console.log('   - Automatic subscription management and billing')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run seed if this file is executed directly
seed().catch((error) => {
  console.error(error)
  process.exit(1)
})

export default seed
