import { redirect } from "next/navigation";

export default async function LegacyEmployeeShiftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/my-shifts/${id}`);
}
