// Migration script to add entityType to existing WorkflowTemplate records
// Run this with: bun run ts-node prisma/migrations/add-entity-type-migration.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting migration: Adding entityType to WorkflowTemplate records...')

  // Fetch all workflow templates without entityType
  const templates = await prisma.workflowTemplate.findMany({
    select: {
      id: true,
      name: true,
      triggerType: true,
      triggerConditions: true,
      entityType: true,
    },
  })

  console.log(`Found ${templates.length} workflow template(s)`)

  // Update each template
  for (const template of templates) {
    if (!template.entityType) {
      // Infer entityType from triggerType or triggerConditions
      let entityType = 'custom'

      if (template.triggerType.includes('purchase_order')) {
        entityType = 'purchase_order'
      } else if (template.triggerType.includes('sales_order')) {
        entityType = 'sales_order'
      } else if (template.triggerType.includes('stock_adjustment')) {
        entityType = 'stock_adjustment'
      } else if (template.triggerType.includes('transfer_order')) {
        entityType = 'transfer_order'
      } else if (template.triggerType.includes('invoice')) {
        entityType = 'invoice'
      } else if (template.triggerType.includes('bill')) {
        entityType = 'bill'
      } else if (template.triggerType.includes('customer')) {
        entityType = 'customer'
      } else if (template.triggerType.includes('supplier')) {
        entityType = 'supplier'
      } else if (template.triggerType.includes('product')) {
        entityType = 'product'
      }

      // Check triggerConditions for entityType
      if (
        template.triggerConditions &&
        typeof template.triggerConditions === 'object' &&
        'entityType' in template.triggerConditions
      ) {
        entityType = (template.triggerConditions as any).entityType
      }

      console.log(
        `Updating template "${template.name}" (${template.id}) with entityType: ${entityType}`
      )

      await prisma.workflowTemplate.update({
        where: { id: template.id },
        data: { entityType: entityType as any },
      })
    } else {
      console.log(`Template "${template.name}" (${template.id}) already has entityType`)
    }
  }

  console.log('Migration complete!')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
