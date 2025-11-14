import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Admin workflow permissions migration...')

  const adminRoles = await prisma.role.findMany({
    where: { name: 'Admin' },
  })

  console.log(`Found ${adminRoles.length} Admin roles`)

  const workflowPermissions = [
    'read:workflows',
    'create:workflows',
    'update:workflows',
    'delete:workflows',
  ]

  let updatedCount = 0
  let skippedCount = 0

  for (const role of adminRoles) {
    const currentPerms = role.permissions as string[]
    const hasAllPerms = workflowPermissions.every((p) => currentPerms.includes(p))

    if (hasAllPerms) {
      console.log(`✓ Role ${role.name} (${role.id}) already has workflow permissions`)
      skippedCount++
      continue
    }

    const updatedPermissions = [...new Set([...currentPerms, ...workflowPermissions])]

    await prisma.role.update({
      where: { id: role.id },
      data: { permissions: updatedPermissions },
    })

    console.log(
      `✓ Updated role ${role.name} (${role.id}) - Added ${workflowPermissions.filter((p) => !currentPerms.includes(p)).length} permissions`
    )
    updatedCount++
  }

  console.log(`\n===== Migration Summary =====`)
  console.log(`Total Admin roles found: ${adminRoles.length}`)
  console.log(`Roles updated: ${updatedCount}`)
  console.log(`Roles skipped (already had permissions): ${skippedCount}`)
  console.log(`===========================\n`)

  if (updatedCount > 0) {
    console.log('✅ Migration completed successfully!')
  } else {
    console.log('ℹ️  No updates needed - all Admin roles already have workflow permissions')
  }
}

main()
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
