import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const A = (f: string) => readFile(join(process.cwd(), "src/assets", f));
export async function ogFonts() {
  const [serif, sans, sansB, mono] = await Promise.all([A("Newsreader-Medium.ttf"), A("InstrumentSans-Regular.ttf"), A("InstrumentSans-SemiBold.ttf"), A("IBMPlexMono-Medium.ttf")]);
  return [
    { name: "Newsreader", data: serif, weight: 500 as const, style: "normal" as const },
    { name: "Instrument", data: sans, weight: 400 as const, style: "normal" as const },
    { name: "Instrument", data: sansB, weight: 600 as const, style: "normal" as const },
    { name: "Plex", data: mono, weight: 500 as const, style: "normal" as const },
  ];
}

export const C = { paper: "#f1efe7", sheet: "#faf9f4", ink: "#1b1e22", ink2: "#4f555e", ink3: "#6f747c", rule: "#d6d1c3", grid: "rgba(27,30,34,0.05)",
  fixed: "#22663f", fixedBg: "#e1eee5", bad: "#a3322a", badBg: "#f5e2de", unsure: "#835708", unsureBg: "#f3e8cf" };

export function Mark({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect x="1" y="1" width="30" height="30" rx="7" fill={C.ink} />
      <circle cx="14" cy="14" r="7.25" fill="none" stroke={C.sheet} strokeWidth="2.2" />
      <path d="M19.4 19.4 25 25" stroke={C.sheet} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M10.6 14.2l2.3 2.3 4.3-4.6" fill="none" stroke={C.sheet} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export async function render(node: React.ReactElement) {
  return new ImageResponse(node, { width: 1200, height: 630, fonts: await ogFonts() });
}
