import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/japan_sleeve_db"
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  // ADMIN ユーザー
  const adminPassword = await bcrypt.hash("password123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@example.com",
      password: adminPassword,
      name: "管理者",
      role: "ADMIN",
    },
  })
  console.log("✅ ADMIN:", admin.email)

  // 一般ユーザー
  const userPassword = await bcrypt.hash("password123", 10)
  const user = await prisma.user.upsert({
    where: { email: "test@test.com" },
    update: {},
    create: {
      email: "test@test.com",
      password: userPassword,
      name: "テストユーザー",
      role: "USER",
      permission: {
        create: {
          productsView: true,
          productsEdit: false,
          partsView: true,
          partsEdit: false,
          devView: true,
          devEdit: false,
        },
      },
    },
  })
  console.log("✅ USER:", user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
