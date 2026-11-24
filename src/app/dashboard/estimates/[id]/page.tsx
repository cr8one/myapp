"use client"
import { useParams } from "next/navigation"
import EstimateEditor from "@/components/estimates/estimate-form"

export default function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>()
  return <EstimateEditor mode="edit" id={id} />
}