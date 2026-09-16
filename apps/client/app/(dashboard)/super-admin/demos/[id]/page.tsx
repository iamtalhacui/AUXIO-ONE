import { DemoRequestDetailContent } from "@/components/super-admin/demos/DemoRequestDetailContent";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DemoRequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <DemoRequestDetailContent requestId={id} />;
}
