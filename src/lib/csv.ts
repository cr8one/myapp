// CSVの1行を正しくパースする共通関数。
// ダブルクォートで囲まれたフィールド内のカンマ・エスケープされた""（連続する2つの引用符）に対応する。
// 例: `"10001","abc""def",foo` -> ["10001", 'abc"def', "foo"]
export function parseCsvLine(line: string): string[] {
  const cols: string[] = []
  let current = ""
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuote = !inQuote
      }
    } else if (ch === "," && !inQuote) {
      cols.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  cols.push(current.trim())
  return cols
}
