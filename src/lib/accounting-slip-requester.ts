import { prisma } from "@/lib/prisma"

// 起案者の氏名・メールと、伝票に載せる部署を作る。
// 部門コード：ユーザーマスタの部門コード（例：541）
// 部署名：主たる部署の名前と、主たるグループの名前（例：総務部 システム課）。未設定の項目は飛ばしてつなぐ
export async function getRequesterInfo(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      departments: { include: { department: true } },
      groups: { include: { group: true } },
    },
  })
  if (!u) return null
  const dep = u.departments.find(d => d.is_primary) ?? u.departments[0]
  const grp = u.groups.find(g => g.is_primary) ?? u.groups[0]
  const departmentCode = u.divisionCode ?? ""
  const departmentName = [dep?.department.name, grp?.group.name].filter(Boolean).join(" ")
  return {
    name: u.name ?? u.email,
    email: u.email,
    departmentCode,
    departmentName,
    departmentText: [departmentCode, departmentName].filter(Boolean).join(" "),
  }
}
