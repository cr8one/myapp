import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { readXlsxWorkbook } from "@/lib/xlsx-io"

function isChecked(v: unknown): boolean {
  return v === "1" || v === 1
}
function isDefaultTrueUnlessZero(v: unknown): boolean {
  return !(v === "0" || v === 0)
}
function str(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === "" ? null : s
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "権限がありません" }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "ファイルがありません" }, { status: 400 })

  const buf = Buffer.from(await file.arrayBuffer())
  const sheets = readXlsxWorkbook(buf)
  const userRows = sheets["Users"] ?? []
  const deptRows = sheets["UserDepartments"] ?? []
  const groupRows = sheets["UserGroups"] ?? []
  const apprRows = sheets["UserApproverSettings"] ?? []

  if (userRows.length === 0) return NextResponse.json({ error: "データがありません" }, { status: 400 })

  const results = { created: 0, updated: 0, errors: [] as string[] }

  for (const row of userRows) {
    const email = str(row["email"])
    if (!email) { results.errors.push("emailなし行をスキップ"); continue }
    const rowId = str(row["id"])

    const permissionData = {
      specView:     isDefaultTrueUnlessZero(row["specView"]),
      specEdit:     isChecked(row["specEdit"]),
      estimateView: isDefaultTrueUnlessZero(row["estimateView"]),
      estimateEdit: isChecked(row["estimateEdit"]),
      eappView:     isDefaultTrueUnlessZero(row["eappView"]),
      eappEdit:     isChecked(row["eappEdit"]),
      travelView:   isDefaultTrueUnlessZero(row["travelView"]),
      travelEdit:   isChecked(row["travelEdit"]),
      sopView:      isDefaultTrueUnlessZero(row["sopView"]),
      sopEdit:      isChecked(row["sopEdit"]),
      reportView:   isDefaultTrueUnlessZero(row["reportView"]),
      reportEdit:   isChecked(row["reportEdit"]),
      bpmsView:     isDefaultTrueUnlessZero(row["bpmsView"]),
      bpmsEdit:     isChecked(row["bpmsEdit"]),
      dlmsView:     isDefaultTrueUnlessZero(row["dlmsView"]),
      dlmsEdit:     isChecked(row["dlmsEdit"]),
      dppView:      isDefaultTrueUnlessZero(row["dppView"]),
      dppEdit:      isChecked(row["dppEdit"]),
      ssssView:     isDefaultTrueUnlessZero(row["ssssView"]),
      ssssEdit:     isChecked(row["ssssEdit"]),
      mastersView:  isChecked(row["mastersView"]),
      mastersEdit:  isChecked(row["mastersEdit"]),
      cadView:      isDefaultTrueUnlessZero(row["cadView"]),
      cadEdit:      isChecked(row["cadEdit"]),
    }

    const baseData = {
      email,
      lastName: str(row["lastName"]),
      firstName: str(row["firstName"]),
      furiganaLastName: str(row["furiganaLastName"]),
      furiganaFirstName: str(row["furiganaFirstName"]),
      positionId: str(row["positionId"]),
      phone: str(row["phone"]),
      employeeNo: str(row["employeeNo"]),
      gender: str(row["gender"]),
      employmentType: str(row["employmentType"]),
      role: row["role"] === "ADMIN" ? ("ADMIN" as const) : ("USER" as const),
      dppMember: isChecked(row["dppMember"]),
      shortName: str(row["shortName"]),
    }

    try {
      let finalUserId: string
      const existing = rowId ? await prisma.user.findUnique({ where: { id: rowId } }) : null

      if (existing) {
        await prisma.user.update({ where: { id: rowId! }, data: baseData })
        await prisma.userPermission.upsert({
          where: { userId: rowId! },
          update: permissionData,
          create: { userId: rowId!, ...permissionData },
        })
        finalUserId = rowId!
        results.updated++
      } else {
        const rawPassword = Math.random().toString(36).slice(-8)
        const hashedPassword = await bcrypt.hash(rawPassword, 10)
        const created = await prisma.user.create({
          data: {
            ...(rowId ? { id: rowId } : {}),
            password: hashedPassword,
            ...baseData,
            permission: { create: permissionData },
          },
        })
        finalUserId = created.id
        results.created++
      }

      const myDepts = deptRows.filter((r) => str(r["user_id"]) === finalUserId)
      await prisma.userDepartment.deleteMany({ where: { user_id: finalUserId } })
      if (myDepts.length > 0) {
        await prisma.userDepartment.createMany({
          data: myDepts.map((r) => ({
            user_id: finalUserId,
            department_id: String(r["department_id"]),
            is_primary: isChecked(r["is_primary"]),
          })),
        })
      }

      const myGroups = groupRows.filter((r) => str(r["user_id"]) === finalUserId)
      await prisma.userGroup.deleteMany({ where: { user_id: finalUserId } })
      if (myGroups.length > 0) {
        await prisma.userGroup.createMany({
          data: myGroups.map((r) => ({
            user_id: finalUserId,
            group_id: String(r["group_id"]),
            is_primary: isChecked(r["is_primary"]),
          })),
        })
      }

      const myAppr = apprRows.filter((r) => str(r["user_id"]) === finalUserId)
      await prisma.userApproverSetting.deleteMany({ where: { user_id: finalUserId } })
      if (myAppr.length > 0) {
        await prisma.userApproverSetting.createMany({
          data: myAppr.map((r) => ({
            user_id: finalUserId,
            service_type: str(r["service_type"]) ?? "tokui_credit",
            step_order: Number(r["step_order"]) || 0,
            position_id: str(r["position_id"]),
            approver_user_id: str(r["approver_user_id"]),
          })),
        })
      }
    } catch (e) {
      results.errors.push(`${email}: ${e}`)
    }
  }

  return NextResponse.json(results)
}
