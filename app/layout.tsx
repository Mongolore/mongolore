import type { Metadata, Viewport } from "next";
import { Literata, Noto_Sans_Mongolian, Onest } from "next/font/google";
import "./globals.css";

// Mongolian Cyrillic letters (Ө, Ү) live in the cyrillic-ext subset.
const onest = Onest({
  variable: "--font-onest",
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  style: ["normal", "italic"],
});

const mongolScript = Noto_Sans_Mongolian({
  variable: "--font-mongol-script",
  subsets: ["mongolian"],
  weight: "400",
  preload: false,
});

const title = "ТҮҮХ MAP — Монголын интерактив түүхэн газрын зураг";
const description =
  "Одоо үеийн залууст зориулсан Монголын интерактив түүхэн газрын зургийн веб платформ. Аймаг бүрийн түүх, дурсгалт газар, түүхэн хүмүүсийг газрын зураг дээрээс судлаарай.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "ТҮҮХ MAP",
  keywords: ["Монголын түүх", "газрын зураг", "аймаг", "боловсрол", "ТҮҮХ MAP"],
  openGraph: {
    type: "website",
    locale: "mn_MN",
    siteName: "ТҮҮХ MAP",
    title,
    description,
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#16213E",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="mn"
      className={`${onest.variable} ${literata.variable} ${mongolScript.variable} antialiased`}
    >
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
