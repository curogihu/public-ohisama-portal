import { redirect } from "next/navigation"

type LegacyTypeMemberPageProps = {
  params: Promise<{ type: string; member: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function LegacyTypeMemberPage({ params, searchParams }: LegacyTypeMemberPageProps) {
  const { type, member } = await params
  const resolvedSearchParams = await searchParams
  const qs = new URLSearchParams()

  if (resolvedSearchParams.q?.trim()) {
    qs.set("q", resolvedSearchParams.q)
  }

  if (resolvedSearchParams.page?.trim()) {
    qs.set("page", resolvedSearchParams.page)
  }

  const query = qs.toString()
  const destination = query
    ? `/${type}/member/${member}?${query}`
    : `/${type}/member/${member}`

  redirect(destination)
}
