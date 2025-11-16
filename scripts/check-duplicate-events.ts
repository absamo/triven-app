import { prisma } from '../app/db.server'

async function main() {
  console.log('Starting check...')

  // First check if there are any duplicate events
  const count = await prisma.auditEvent.count({
    where: { eventType: 'duplicate' },
  })

  console.log(`Found ${count} duplicate events`)

  if (count === 0) {
    console.log('No duplicate events found. Need to run seed.')
    await prisma.$disconnect()
    return
  }

  const duplicateEvent = await prisma.auditEvent.findFirst({
    where: { eventType: 'duplicate' },
    select: {
      id: true,
      eventType: true,
      entityId: true,
      beforeSnapshot: true,
      afterSnapshot: true,
      changedFields: true,
    },
  })

  console.log('Duplicate Event:')
  console.log(JSON.stringify(duplicateEvent, null, 2))

  console.log('\nChecking beforeSnapshot keys:')
  if (duplicateEvent?.beforeSnapshot && typeof duplicateEvent.beforeSnapshot === 'object') {
    console.log(Object.keys(duplicateEvent.beforeSnapshot))
  }

  console.log('\nChecking afterSnapshot keys:')
  if (duplicateEvent?.afterSnapshot && typeof duplicateEvent.afterSnapshot === 'object') {
    console.log(Object.keys(duplicateEvent.afterSnapshot))
  }

  await prisma.$disconnect()
  console.log('Done!')
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
