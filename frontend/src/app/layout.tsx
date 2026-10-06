import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WalletProvider } from "@/components/WalletProvider";
import { themeScript } from "@/components/Theme";

const serif = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap", weight: ["500", "600"] });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-plex-mono", display: "swap", weight: ["400", "500"] });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fixcheck-ledger.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "FixCheck — is the audit fix in the deployed code?", template: "%s · FixCheck" },
  description: "Audit reports say “Fixed”. FixCheck checks each finding against the code actually deployed on chain, with real reports and verified source.",
  openGraph: { type: "website", siteName: "FixCheck" },
  twitter: { card: "summary_large_image" },
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon.ico" }], apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f1efe7" }, { media: "(prefers-color-scheme: dark)", color: "#141619" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="skip btn btn-sm">Skip to content</a>
        <WalletProvider>
          <Header />
          <main id="main" className="mx-auto max-w-[1180px] px-4 sm:px-6">{children}</main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
