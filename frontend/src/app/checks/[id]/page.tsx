import { CheckPage, checkMetadata } from "@/components/CheckPage";

export const revalidate = 20;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return checkMetadata((await params).id, "canonical");
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <CheckPage idRaw={(await params).id} dep="canonical" />;
}
