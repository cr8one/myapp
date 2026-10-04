// ユーザーの組織順ソート（拠点・部署・グループ・雇用区分・役職・社員番号の複合順）
// ユーザーマスタの一覧と、各画面のユーザー選択肢で共通して使う

export type OrgSortable = {
  employmentType: string | null
  employeeNo: string | null
  positionRef: { sort_order: number } | null
  departments: { is_primary: boolean; department: { sort_order: number } }[]
  groups: { is_primary: boolean; group: { sort_order: number } }[]
}

const LATE_EMPLOYMENT_TYPES = ["嘱託", "業務委託", "派遣", "パート"]

export function orgSortKey(u: OrgSortable) {
  const noOrg = u.departments.length === 0 && u.groups.length === 0 ? 0 : 1
  const primaryDept = u.departments.find(d => d.is_primary) ?? u.departments[0]
  const primaryGroup = u.groups.find(g => g.is_primary) ?? u.groups[0]
  const deptOrder = primaryDept?.department.sort_order ?? Infinity
  const hasGroup = primaryGroup ? 1 : 0
  const groupOrder = primaryGroup?.group.sort_order ?? 0
  const employmentRank = u.employmentType && LATE_EMPLOYMENT_TYPES.includes(u.employmentType) ? 1 : 0
  const positionOrder = u.positionRef?.sort_order ?? Infinity
  const employeeNoNum = u.employeeNo && /^\d+$/.test(u.employeeNo) ? Number(u.employeeNo) : Infinity
  return [noOrg, deptOrder, hasGroup, groupOrder, employmentRank, positionOrder, employeeNoNum, u.employeeNo ?? ""] as const
}

export function compareOrgKey(a: ReturnType<typeof orgSortKey>, b: ReturnType<typeof orgSortKey>) {
  for (let i = 0; i < a.length - 1; i++) {
    const av = a[i] as number, bv = b[i] as number
    if (av !== bv) return av - bv
  }
  return String(a[a.length - 1]).localeCompare(String(b[b.length - 1]))
}

// 配列を組織順に並べ替える（元の配列は変更しない）
export function sortByOrg<T extends OrgSortable>(users: T[]): T[] {
  return [...users].sort((a, b) => compareOrgKey(orgSortKey(a), orgSortKey(b)))
}
