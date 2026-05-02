import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const permission = await prisma.userPermission.upsert({
    where: { userId: id },
    create: {
      userId: id,
      productsView: body.productsView ?? true,
      productsEdit: body.productsEdit ?? false,
      partsView: body.partsView ?? true,
      partsEdit: body.partsEdit ?? false,
      devView: body.devView ?? true,
      devEdit: body.devEdit ?? false,
      ssssView: body.ssssView ?? true,
      ssssEdit: body.ssssEdit ?? false,
      ssssIsIssuer: body.ssssIsIssuer ?? false,
      ssssIsSupplier: body.ssssIsSupplier ?? false,
      ssssIsReceiver: body.ssssIsReceiver ?? false,
      ssssIsOutsourceReceiver: body.ssssIsOutsourceReceiver ?? false,
    },
    update: {
      ...(body.productsView !== undefined && { productsView: body.productsView }),
      ...(body.productsEdit !== undefined && { productsEdit: body.productsEdit }),
      ...(body.partsView !== undefined && { partsView: body.partsView }),
      ...(body.partsEdit !== undefined && { partsEdit: body.partsEdit }),
      ...(body.devView !== undefined && { devView: body.devView }),
      ...(body.devEdit !== undefined && { devEdit: body.devEdit }),
      ...(body.ssssView !== undefined && { ssssView: body.ssssView }),
      ...(body.ssssEdit !== undefined && { ssssEdit: body.ssssEdit }),
      ...(body.ssssIsIssuer !== undefined && { ssssIsIssuer: body.ssssIsIssuer }),
      ...(body.ssssIsSupplier !== undefined && { ssssIsSupplier: body.ssssIsSupplier }),
      ...(body.ssssIsReceiver !== undefined && { ssssIsReceiver: body.ssssIsReceiver }),
      ...(body.ssssIsOutsourceReceiver !== undefined && { ssssIsOutsourceReceiver: body.ssssIsOutsourceReceiver }),
    },
  })

  return NextResponse.json(permission)
}
