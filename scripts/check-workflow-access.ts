#!/usr/bin/env bun
/**
 * Check workflow access for admin users
 */

import { prisma } from '../app/db.server'

async function checkWorkflowAccess() {
  console.log('\n🔍 Checking Workflow Access Configuration...\n')

  // Find admin user
  const adminUser = await prisma.user.findFirst({
    where: {
      email: 'admin@flowtech.com',
    },
    include: {
      role: true,
      profile: true,
    },
  })

  if (!adminUser) {
    console.log('❌ Admin user not found')
    return
  }

  console.log('✅ Admin user found:', adminUser.email)
  console.log('   User ID:', adminUser.id)
  console.log('   Role ID:', adminUser.roleId)
  console.log('   Role Name:', adminUser.role?.name || 'N/A')
  console.log('   Permissions:', adminUser.role?.permissions || [])

  // Check if user has workflow permissions
  const hasReadWorkflows = adminUser.role?.permissions.includes('read:workflows')
  const hasCreateWorkflows = adminUser.role?.permissions.includes('create:workflows')
  const hasUpdateWorkflows = adminUser.role?.permissions.includes('update:workflows')
  const hasDeleteWorkflows = adminUser.role?.permissions.includes('delete:workflows')

  console.log('\n📋 Workflow Permissions:')
  console.log('   read:workflows:', hasReadWorkflows ? '✅' : '❌')
  console.log('   create:workflows:', hasCreateWorkflows ? '✅' : '❌')
  console.log('   update:workflows:', hasUpdateWorkflows ? '✅' : '❌')
  console.log('   delete:workflows:', hasDeleteWorkflows ? '✅' : '❌')

  // Check better-auth Account link
  const account = await prisma.account.findFirst({
    where: {
      userId: adminUser.id,
    },
  })

  console.log('\n🔗 Better-Auth Account Link:')
  if (account) {
    console.log('   ✅ Account linked')
    console.log('   Account ID:', account.id)
    console.log('   Provider:', account.providerId)
  } else {
    console.log('   ❌ No account link found')
  }

  // Check if admin role exists with workflow permissions
  const adminRole = await prisma.role.findFirst({
    where: {
      name: 'Admin',
    },
  })

  console.log('\n👑 Admin Role Configuration:')
  if (adminRole) {
    console.log('   ✅ Admin role exists')
    console.log('   Role ID:', adminRole.id)
    console.log('   Permissions count:', adminRole.permissions.length)

    const workflowPerms = adminRole.permissions.filter((p: string) => p.includes('workflow'))
    console.log('   Workflow permissions:', workflowPerms)
  } else {
    console.log('   ❌ Admin role not found')
  }

  console.log('\n')
}

checkWorkflowAccess()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
