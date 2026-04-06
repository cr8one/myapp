import "dotenv/config"
import { PrismaClient } from '../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient() {
  const connectionString = process.env.DB_HOST
    ? `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD!)}@${process.env.DB_HOST}:5432/${process.env.DB_NAME}?sslmode=no-verify`
    : process.env.DATABASE_URL!

  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

const prisma = createPrismaClient()

async function main() {
  const types = [
    { name: 'OEM生産',      sortOrder: 1 },
    { name: 'ODM生産',      sortOrder: 2 },
    { name: '試作・サンプル', sortOrder: 3 },
    { name: '量産',         sortOrder: 4 },
    { name: 'デザイン提案',  sortOrder: 5 },
    { name: '資材調達',     sortOrder: 6 },
    { name: '輸出入',       sortOrder: 7 },
  ]

  for (const type of types) {
    await prisma.devCompanyTypeMaster.upsert({
      where: { name: type.name },
      update: {},
      create: type,
    })
  }

  console.log('✅ 種別マスタのシードデータを投入しました')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
