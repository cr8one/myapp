"use client"

type ApprovalStep = {
  id: string
  stage: string
  step_order: number
  position_name: string | null
  category?: string | null
  approver_name: string | null
  status: string
  approved_at: string | null
}
type Props = {
  title: string
  content: string
  destination: string | null
  cost: string | null
  requester_names: string
  requester_department: string | null
  reception_number: string | null
  reception_date: string | null
  decision_date: string | null
  decision_result: string | null
  created_at: string
  approval_steps: ApprovalStep[]
}

function formatDate(str: string | null) {
  if (!str) return ""
  const d = new Date(str)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function orderByApprovalRightToLeft(steps: ApprovalStep[]) {
  const pending = steps.filter(s => s.status !== "承認済み")
  const approved = steps.filter(s => s.status === "承認済み")
    .sort((a, b) => new Date(b.approved_at ?? 0).getTime() - new Date(a.approved_at ?? 0).getTime())
  return [...pending, ...approved]
}

const B = "1px solid #333"

function TableACell({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ flex: 1, borderRight: last ? undefined : B, padding: "1mm 1.5mm" }}>
      <div style={{ fontSize: "2.4mm", color: "#333" }}>{label}</div>
      <div style={{ fontSize: "2.8mm", textAlign: "center", marginTop: "2mm" }}>{value}</div>
    </div>
  )
}

function TableBApprovers({ steps }: { steps: ApprovalStep[] }) {
  const ordered = orderByApprovalRightToLeft(steps).filter(s => s.status === "承認済み")
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "1.5mm", padding: "0 1mm" }}>
      {ordered.map((s, i) => (
        <div key={i} style={{ fontSize: "2.5mm", border: "1px solid #999", borderRadius: "50%", width: "10.5mm", height: "10.5mm", display: "flex", alignItems: "center", justifyContent: "center", color: "#b00", textAlign: "center", lineHeight: 1.1 }}>
          {s.approver_name ?? ""}
        </div>
      ))}
    </div>
  )
}

export default function RingiPaperPreview(props: Props) {
  const draftSteps = props.approval_steps
    .filter(s => s.stage === "起案部")
    .sort((a, b) => b.step_order - a.step_order)
  const relatedAll = props.approval_steps.filter(s => s.stage === "関連部役員社長")
  const shachoSteps = relatedAll.filter(s => s.category === "社長")
  const yakuinSteps = relatedAll.filter(s => s.category === "役員")
  const kanrenSteps = relatedAll.filter(s => s.category === "関連部" || !s.category)

  return (
    <div style={{ width: "210mm", minWidth: "210mm", background: "#fff", boxShadow: "0 0 8px rgba(0,0,0,0.15)", padding: "12mm", fontFamily: "sans-serif", color: "#111" }}>
      <div style={{ height: "18mm", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "7mm", fontWeight: "bold", letterSpacing: "3mm" }}>稟　議　書</span>
      </div>

      <div style={{ display: "flex", flexDirection: "row", border: B, height: "14.35mm" }}>
        <TableACell label="決裁年月日" value={formatDate(props.decision_date)} />
        <TableACell label="決裁結果" value={props.decision_result ?? ""} />
        <TableACell label="受付番号" value={props.reception_number ?? ""} />
        <TableACell label="受付日" value={formatDate(props.reception_date)} />
        <TableACell label="起案日" value={formatDate(props.created_at)} last />
      </div>

      <div style={{ display: "flex", flexDirection: "row", borderLeft: B, borderRight: B, borderBottom: B, height: "25.3mm" }}>
        <div style={{ width: "22.3mm", display: "flex", flexDirection: "column", borderRight: B }}>
          <div style={{ height: "6.2mm", borderBottom: B, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3mm", fontWeight: "bold" }}>社　長</div>
          <TableBApprovers steps={shachoSteps} />
        </div>
        <div style={{ width: "67.1mm", display: "flex", flexDirection: "column", borderRight: B }}>
          <div style={{ height: "6.2mm", borderBottom: B, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3mm", fontWeight: "bold" }}>役　員</div>
          <TableBApprovers steps={yakuinSteps} />
        </div>
        <div style={{ width: "44.7mm", display: "flex", flexDirection: "column", borderRight: B }}>
          <div style={{ height: "6.2mm", borderBottom: B, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3mm", fontWeight: "bold" }}>関　連　部</div>
          <TableBApprovers steps={kanrenSteps} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ height: "6.2mm", borderBottom: B, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3mm", fontWeight: "bold" }}>受付　総務経理課</div>
          <div style={{ flex: 1 }} />
        </div>
      </div>

      <div style={{ height: "4.1mm" }} />

      <div style={{ border: B }}>
        <div style={{ height: "10.5mm", borderBottom: B, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: "0 3mm 1.5mm 3mm" }}>
          <span style={{ fontSize: "4mm" }}>{props.title}</span>
          <span style={{ fontSize: "3.3mm", marginLeft: "2mm" }}>の　件</span>
        </div>
        <div
          style={{
            minHeight: "163.5mm",
            padding: "0 3mm",
            fontSize: "3mm",
            lineHeight: "7.11mm",
            whiteSpace: "pre-wrap",
            backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent calc(7.11mm - 1px), #ccc calc(7.11mm - 1px), #ccc 7.11mm)",
          }}
        >
          {`${formatDate(props.created_at)}\n${props.requester_department ?? ""}　${props.requester_names ?? ""}\n\n記\n\n１．目的・内容\n${props.content ?? ""}\n\n２．依頼先\n${props.destination ?? ""}\n\n３．費用\n${props.cost ?? ""}`}
        </div>
      </div>

      <div style={{ height: "5.3mm" }} />

      <div style={{ display: "flex", flexDirection: "row", border: B, height: "26.7mm" }}>
        <div style={{ width: "6.2mm", borderRight: B, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.6mm", fontWeight: "bold", writingMode: "vertical-rl" }}>起案部</div>
        <div style={{ display: "flex", flexDirection: "row" }}>
          {draftSteps.map((s, i) => (
            <div key={i} style={{ width: "22.3mm", display: "flex", flexDirection: "column", borderRight: B }}>
              <div style={{ height: "6.2mm", borderBottom: B, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.6mm" }}>{s.position_name ?? ""}</div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.status === "承認済み" && (
                  <div style={{ fontSize: "2.5mm", border: "1px solid #999", borderRadius: "50%", width: "10.5mm", height: "10.5mm", display: "flex", alignItems: "center", justifyContent: "center", color: "#b00" }}>
                    {s.approver_name ?? ""}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ width: "6.2mm", borderRight: B, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.6mm", fontWeight: "bold", writingMode: "vertical-rl" }}>起案者</div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", paddingLeft: "3mm", fontSize: "3mm" }}>{props.requester_names ?? ""}</div>
      </div>
    </div>
  )
}
