#!/usr/bin/env bun
/**
 * Debug Workflow Template UI
 * Checks:
 * 1. Admin user has workflow permissions
 * 2. Navigation visibility
 * 3. Route access
 * 4. Data loading
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugWorkflowUI() {
  console.log('\n🔍 Debugging Workflow Template UI\n')
  console.log('='.repeat(50))

  // 1. Check admin user and permissions
  console.log('\n1️⃣  CHECKING ADMIN USER PERMISSIONS')
  console.log('-'.repeat(50))

  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@flowtech.com' },
    include: { role: true, profile: true },
  })

  if (!adminUser) {
    console.log('❌ Admin user not found!')
    console.log('   Please run: bun run db:seed')
    return
  }

  console.log('✅ Admin user found')
  console.log(`   Email: ${adminUser.email}`)
  console.log(`   Role: ${adminUser.role?.name || 'No role'}`)
  console.log(`   Role ID: ${adminUser.roleId}`)

  const permissions = (adminUser.role?.permissions as string[]) || []
  console.log(`\n   Total permissions: ${permissions.length}`)

  const workflowPermissions = permissions.filter((p) => p.includes('workflow'))
  console.log(`   Workflow permissions: ${workflowPermissions.length}`)
  workflowPermissions.forEach((p) => {
    console.log(`      - ${p}`)
  })

  const hasReadWorkflows = permissions.includes('read:workflows')
  const hasCreateWorkflows = permissions.includes('create:workflows')
  const hasUpdateWorkflows = permissions.includes('update:workflows')
  const hasDeleteWorkflows = permissions.includes('delete:workflows')

  console.log('\n   Permission Status:')
  console.log(`      read:workflows:   ${hasReadWorkflows ? '✅' : '❌ MISSING'}`)
  console.log(`      create:workflows: ${hasCreateWorkflows ? '✅' : '❌ MISSING'}`)
  console.log(`      update:workflows: ${hasUpdateWorkflows ? '✅' : '❌ MISSING'}`)
  console.log(`      delete:workflows: ${hasDeleteWorkflows ? '✅' : '❌ MISSING'}`)

  if (!hasReadWorkflows) {
    console.log('\n   ⚠️  Admin lacks read:workflows permission!')
    console.log('   Fix: Run migration script:')
    console.log('   bun run scripts/migrations/add-admin-workflow-permissions.ts')
  }

  // 2. Check workflow templates exist
  console.log('\n2️⃣  CHECKING WORKFLOW TEMPLATES')
  console.log('-'.repeat(50))

  const templateCount = await prisma.workflowTemplate.count({
    where: { companyId: adminUser.companyId || '' },
  })

  console.log(`   Total templates: ${templateCount}`)

  if (templateCount === 0) {
    console.log('   ⚠️  No workflow templates found')
    console.log('   Fix: Run seed script:')
    console.log('   bun run db:seed')
  } else {
    const activeTemplates = await prisma.workflowTemplate.count({
      where: { companyId: adminUser.companyId || '', isActive: true },
    })
    console.log(`   Active templates: ${activeTemplates}`)
    console.log(`   Inactive templates: ${templateCount - activeTemplates}`)

    const sampleTemplates = await prisma.workflowTemplate.findMany({
      where: { companyId: adminUser.companyId || '' },
      take: 3,
      select: {
        id: true,
        name: true,
        triggerType: true,
        isActive: true,
      },
    })

    console.log('\n   Sample templates:')
    sampleTemplates.forEach((t) => {
      console.log(`      - ${t.name} (${t.triggerType}) ${t.isActive ? '🟢' : '🔴'}`)
    })
  }

  // 3. Check workflow instances
  console.log('\n3️⃣  CHECKING WORKFLOW INSTANCES')
  console.log('-'.repeat(50))

  const instanceCount = await prisma.workflowInstance.count()
  console.log(`   Total instances: ${instanceCount}`)

  if (instanceCount > 0) {
    const statusGroups = await prisma.workflowInstance.groupBy({
      by: ['status'],
      _count: true,
    })
    console.log('\n   By status:')
    statusGroups.forEach((g) => {
      console.log(`      - ${g.status}: ${g._count}`)
    })
  }

  // 4. Check better-auth account link
  console.log('\n4️⃣  CHECKING BETTER-AUTH ACCOUNT LINK')
  console.log('-'.repeat(50))

  const account = await prisma.account.findFirst({
    where: { userId: adminUser.id },
  })

  if (account) {
    console.log('✅ Account linked')
    console.log(`   Provider: ${account.providerId}`)
  } else {
    console.log('❌ No account link found')
    console.log('   This might cause authentication issues')
  }

  // 5. Summary and recommendations
  console.log('\n5️⃣  SUMMARY & RECOMMENDATIONS')
  console.log('-'.repeat(50))

  const issues = []
  const fixes = []

  if (!hasReadWorkflows || !hasCreateWorkflows || !hasUpdateWorkflows || !hasDeleteWorkflows) {
    issues.push('Missing workflow permissions')
    fixes.push('bun run scripts/migrations/add-admin-workflow-permissions.ts')
  }

  if (templateCount === 0) {
    issues.push('No workflow templates in database')
    fixes.push('bun run db:seed')
  }

  if (!account) {
    issues.push('No better-auth account link')
    fixes.push('Re-login to create account link')
  }

  if (issues.length === 0) {
    console.log('✅ All checks passed!')
    console.log('\n   Next steps:')
    console.log('   1. Open http://localhost:3000/login')
    console.log('   2. Login as admin@flowtech.com / password123')
    console.log('   3. Navigate to Workflows > Workflow Templates')
    console.log('   4. You should see the templates list')
  } else {
    console.log('⚠️  Issues found:')
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`)
    })
    console.log('\n   Fixes:')
    fixes.forEach((fix, i) => {
      console.log(`   ${i + 1}. ${fix}`)
    })
  }

  console.log('\n' + '='.repeat(50))
  console.log('Debug complete!\n')
}

debugWorkflowUI()
  .catch((error) => {
    console.error('\n❌ Error during debug:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
