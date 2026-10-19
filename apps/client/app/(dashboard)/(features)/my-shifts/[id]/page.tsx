import { EmployeeShiftDetailContent } from "@/components/rostering/EmployeeShiftDetailContent";

export default async function MyShiftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EmployeeShiftDetailContent shiftId={id} />;
}
