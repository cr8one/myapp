import RingiDetailClient from "./RingiDetailClient"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RingiDetailClient id={id} />
}