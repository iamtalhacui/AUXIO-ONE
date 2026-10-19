import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyEmployeeReportIncidentPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const shiftId = params.shiftId;
  const q =
    typeof shiftId === "string" && shiftId
      ? `?shiftId=${encodeURIComponent(shiftId)}`
      : "";
  redirect(`/my-incidents/report${q}`);
}