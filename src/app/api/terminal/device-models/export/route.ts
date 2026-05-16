import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const records = await prisma.deviceModel.findMany({ orderBy: { modelId: "asc" } })
  const header = "model_id,vendor_name,device_type_id,model_name,model_number,os_name,cpu_info,memory_default,storage_default,eol_date,image_path,note"
  const rows = records.map(r => [
    r.modelId,
    r.vendorName ?? "",
    r.deviceType ?? "",
    r.modelName,
    r.modelNumber ?? "",
    r.osName ?? "",
    r.cpuInfo ?? "",
    r.memoryDefault ?? "",
    r.storageDefault ?? "",
    r.eolDate ? r.eolDate.toISOString().split("T")[0] : "",
    r.imagePath ?? "",
    r.note ?? "",
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
  const csv = [header, ...rows].join("\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="m_device_models_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}
