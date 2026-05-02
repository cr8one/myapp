import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get("role")
  const all = searchParams.get("all") === "1"

  const where: Record<string, unknown> = {}
  if (role === "issuer") where.ssssIsIssuer = true
  if (role === "supplier") where.ssssIsSupplier = true
  if (role === "receiver") where.ssssIsReceiver = true
  if (role === "outsourceReceiver") where.ssssIsOutsourceReceiver = true

  const orderByRole = role === "issuer" ? "ssssIssuerOrder"
    : role === "supplier" ? "ssssSupplierOrder"
    : role === "receiver" ? "ssssReceiverOrder"
    : role === "outsourceReceiver" ? "ssssOutsourceReceiverOrder"
    : null

  const users = await prisma.user.findMany({
    where: all ? {} : {
      permission: Object.keys(where).length > 0 ? { ...where } : undefined,
    },
    include: { permission: true },
    orderBy: orderByRole
      ? { permission: { [orderByRole]: "asc" } }
      : { name: "asc" },
  })

  return NextResponse.json(users.map(u => ({
    id: u.id,
    name: u.name ?? u.email,
    isIssuer: u.permission?.ssssIsIssuer ?? false,
    isSupplier: u.permission?.ssssIsSupplier ?? false,
    isReceiver: u.permission?.ssssIsReceiver ?? false,
    isOutsourceReceiver: u.permission?.ssssIsOutsourceReceiver ?? false,
    issuerOrder: u.permission?.ssssIssuerOrder ?? 0,
    supplierOrder: u.permission?.ssssSupplierOrder ?? 0,
    receiverOrder: u.permission?.ssssReceiverOrder ?? 0,
    outsourceReceiverOrder: u.permission?.ssssOutsourceReceiverOrder ?? 0,
  })))
}
