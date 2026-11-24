"use client"
import { useParams } from "next/navigation"
import EstimateEditor from "@/components/estimates/estimate-form"

export default function NewEstimatePage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  return <EstimateEditor mode="new" categoryId={categoryId} />
}