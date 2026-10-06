import { CheckPage, checkMetadata } from "@/components/CheckPage";

export const revalidate = 10;
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return checkMetadata((await params).id, "demo");
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <CheckPage idRaw={(await params).id} dep="demo" />;
}

export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}
