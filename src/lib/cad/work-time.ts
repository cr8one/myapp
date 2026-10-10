import { prisma } from "@/lib/prisma"

export const STANDARD_COUNT = 4
export const OVER_COUNT_MIN_PER_PIECE = 5
export const MISHIN_MIN_PER_PIECE = 2
export const PREP_MIN = 10
export const EXTRA_PART_MIN = 10

export type BaseColumn = "min_kosei" | "min_yugata" | "min_shinki"

export function contentToColumn(content: string | null | undefined): BaseColumn | null {
  if (!content) return null
  const s = content.replace(/\s+/g, "").replace(/[（(]修正[）)]/, "")
  if (s === "校正カット") return "min_kosei"
  if (s === "有型白ダミー") return "min_yugata"
  if (s === "新規形白ダミー" || s === "新規型白ダミー") return "min_shinki"
  return null
}

export type WorkTimeInput = {
  baseMinutes: number | null
  finishCount: number | null
  hasMishin: boolean
  needsPrep: boolean
  extraParts: number
}

export type WorkTimeResult = {
  total: number | null
  base: number | null
  over: number
  mishin: number
  prep: number
  extra: number
  warnings: string[]
}

export function calcWorkTime(input: WorkTimeInput): WorkTimeResult {
  const warnings: string[] = []
  const count = input.finishCount

  let over = 0
  if (count !== null && count > STANDARD_COUNT) {
    over = (count - STANDARD_COUNT) * OVER_COUNT_MIN_PER_PIECE
  }

  let mishin = 0
  if (input.hasMishin) {
    if (count === null) {
      warnings.push("仕上げ個数が未入力のため、ミシン罫の加算を計算できません")
    } else {
      mishin = count * MISHIN_MIN_PER_PIECE
    }
  }

  const prep = input.needsPrep ? PREP_MIN : 0
  const extra = Math.max(0, Math.floor(input.extraParts)) * EXTRA_PART_MIN

  if (count === null) {
    warnings.push("仕上げ個数が未入力のため、5個目以降の加算を計算していません")
  }

  let total: number | null = null
  if (input.baseMinutes === null) {
    warnings.push("基本時間が決まらないため、合計を計算できません")
  } else {
    total = input.baseMinutes + over + mishin + prep + extra
  }

  return { total, base: input.baseMinutes, over, mishin, prep, extra, warnings }
}

export async function lookupBaseMinutes(
  hinmoku: string | null | undefined,
  content: string | null | undefined,
): Promise<{ minutes: number | null; warning: string | null }> {
  const column = contentToColumn(content)
  if (column === null) {
    return { minutes: null, warning: "依頼内容から標準時間の列を判別できません" }
  }
  const name = (hinmoku ?? "").trim()
  if (name === "") {
    return { minutes: null, warning: "品目名が未入力です" }
  }
  const option = await prisma.mCadOption.findFirst({
    where: { category: "hinmoku", value: name },
    include: { standard_time: true },
  })
  if (option === null) {
    return { minutes: null, warning: `品目名「${name}」が入力候補に見つかりません` }
  }
  const minutes = option.standard_time ? option.standard_time[column] : null
  if (minutes === null || minutes === undefined) {
    return { minutes: null, warning: `品目名「${name}」の標準時間がマスタに登録されていません` }
  }
  return { minutes, warning: null }
}