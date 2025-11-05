import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestFeature() {
  try {
    // Find admin user
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@flowtech.com' },
    })

    if (!admin) {
      console.log('❌ Admin user not found')
      return
    }

    console.log('✅ Found admin user:', admin.email)

    // Check if feature already exists
    const existing = await prisma.featureRequest.findFirst({
      where: { title: 'Mobile App for Inventory Management' },
    })

    if (existing) {
      console.log('✅ Feature already exists:', existing.title)
      return
    }

    // Create feature
    const feature = await prisma.featureRequest.create({
      data: {
        title: 'Mobile App for Inventory Management',
        description:
          'Build a mobile app for iOS and Android to manage inventory on the go, with barcode scanning and offline support.',
        status: 'TODO',
        voteCount: 15,
        createdById: admin.id,
      },
    })

    console.log('✅ Created feature:', feature.title)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestFeature()
