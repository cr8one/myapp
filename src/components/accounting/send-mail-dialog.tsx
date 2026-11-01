"use client"

// メールを送る操作の確認ダイアログ（送信して実行する／送信せず実行する／キャンセル）
export default function SendMailDialog({
  title, message, actionLabel, busy, onSelect, onCancel,
}: {
  title: string
  message: string
  actionLabel: string
  busy?: boolean
  onSelect: (sendMail: boolean) => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{message}</p>
        <div className="flex flex-col gap-2">
          <button disabled={busy} onClick={() => onSelect(true)}
            className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50">送信して{actionLabel}</button>
          <button disabled={busy} onClick={() => onSelect(false)}
            className="px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50">送信せず{actionLabel}</button>
          <button disabled={busy} onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50">キャンセル</button>
        </div>
      </div>
    </div>
  )
}
