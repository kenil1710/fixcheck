import { ogForCheck } from "@/components/OgCheck";
export const alt = "FixCheck verdict for one audit finding";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  return ogForCheck((await params).id, "demo");
}
