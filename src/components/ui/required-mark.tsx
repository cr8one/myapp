export function RequiredMark({ kind }: { kind: "save" | "request" }) {
  if (kind === "save") {
    return <span className="text-red-500 ml-0.5" title="保存に必須">*</span>
  }
  return <span className="text-orange-500 ml-0.5" title="依頼するときに必須">※</span>
}

export function RequiredLegend() {
  return (
    <p className="text-xs text-gray-500">
      <span className="text-red-500">*</span> 保存に必須　
      <span className="text-orange-500">※</span> 依頼するときに必須
    </p>
  )
}