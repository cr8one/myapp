import "dotenv/config"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10)

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "管理者",
    },
  })

  console.log("シードデータ作成完了！")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())