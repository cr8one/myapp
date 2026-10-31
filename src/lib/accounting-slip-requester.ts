import { prisma } from "@/lib/prisma"

// 起案者の氏名・メールと、伝票に載せる部署の表示（例：「541 総務部 システム課」）を作る。
// 部署の表示は「部門コード＋主たる部署名＋主たるグループ名」。未設定の項目は飛ばしてつなぐ。
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
  const departmentText = [u.divisionCode, dep?.department.name, grp?.group.name].filter(Boolean).join(" ")
  return { name: u.name ?? u.email, email: u.email, departmentText }
}
