import type { PaperStd, WasteTier } from "./paper"
import type { PlateMakingStd, PlateStd } from "./plate"
import type { PrintStd } from "./print"
import type { PriceCell, ProcStd } from "./proc"
import type { PriceTier } from "./tiers"
import type { EstimateStd } from "./estimate"

// デジパック抜き貼り代を選ぶときの名前（新システムで共通）
export const DIGIPAK_LABEL = "デジパック抜き貼り代"
// 表面加工の名前（現行の見積書のままの名前。計算が、この名前で表面加工と判断する）
export const SURFACE_LABELS = ["PP貼り", "マットPP貼り", "サック貼り用PP貼り", "サック貼り用マットPP貼り"]

type Entries<T> = [string, T][]

// 画面とサーバーの間で送る形（Map を配列にする）
export interface EstimateStdJson {
  paperKg: Entries<number>
  waste: WasteTier[]
  plate: PlateStd
  plateMakingSize: Entries<number>
  plateMakingSpec: Entries<number>
  print: PrintStd
  proc: {
    matrix: Entries<PriceTier[]>
    outer: Entries<PriceTier[]>
    single: Entries<PriceCell>
    split: Entries<{ below: PriceCell; above: PriceCell }>
    digipak: Entries<PriceTier[]>
    surface: Entries<PriceTier[]>
    digipakLabel: string
  }
  salesRateNew: number | null
  salesRateOld: number | null
  digiTrayPrice: number | null
  // 画面の選択肢
  catalog: {
    paperNames: string[]
    procLabels: { label: string; source: string }[]
    plateLabels: string[]
  }
}

const toEntries = <T>(m: Map<string, T>): Entries<T> => Array.from(m.entries())

export function serializeStd(std: EstimateStd, catalog: EstimateStdJson["catalog"]): EstimateStdJson {
  return {
    paperKg: toEntries(std.paper.paperKg),
    waste: std.paper.waste,
    plate: std.plate,
    plateMakingSize: toEntries(std.plateMaking.size),
    plateMakingSpec: toEntries(std.plateMaking.spec),
    print: std.print,
    proc: {
      matrix: toEntries(std.proc.matrix),
      outer: toEntries(std.proc.outer),
      single: toEntries(std.proc.single),
      split: toEntries(std.proc.split),
      digipak: toEntries(std.proc.digipak),
      surface: toEntries(std.proc.surface),
      digipakLabel: std.proc.digipakLabel,
    },
    salesRateNew: std.salesRateNew,
    salesRateOld: std.salesRateOld,
    digiTrayPrice: std.digiTrayPrice,
    catalog,
  }
}

export function reviveStd(j: EstimateStdJson): EstimateStd {
  const paper: PaperStd = { paperKg: new Map(j.paperKg), waste: j.waste }
  const plateMaking: PlateMakingStd = { size: new Map(j.plateMakingSize), spec: new Map(j.plateMakingSpec) }
  const proc: ProcStd = {
    matrix: new Map(j.proc.matrix),
    outer: new Map(j.proc.outer),
    single: new Map(j.proc.single),
    split: new Map(j.proc.split),
    digipak: new Map(j.proc.digipak),
    surface: new Map(j.proc.surface),
    digipakLabel: j.proc.digipakLabel,
  }
  return {
    paper,
    plate: j.plate,
    plateMaking,
    print: j.print,
    proc,
    salesRateNew: j.salesRateNew,
    salesRateOld: j.salesRateOld,
    digiTrayPrice: j.digiTrayPrice,
  }
}