// 規定等の規則（画面とサーバーの両方で使う。サーバー専用の部品は含めない）
export const REG_MAX_BYTES = 20 * 1024 * 1024
export const isPdfName = (name: string) => /\.pdf$/i.test(name)
