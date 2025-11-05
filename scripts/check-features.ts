import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const features = await prisma.featureRequest.findMany()
  console.log(`Features found: ${features.length}`)
  features.forEach((f) => {
    console.log(`- ${f.title} (${f.status}, ${f.voteCount} votes)`)
  })
}

main().finally(() => prisma.$disconnect())
