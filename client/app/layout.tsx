import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gestion-stock.demo"),
  title: {
    default: "Gestionnaire de stock scolaire",
    template: "%s | Gestionnaire de stock scolaire",
  },
  description:
    "Interface Next.js + Tailwind pour piloter inventaires, demandes et rapports d'un parc matériel scolaire en multi-établissement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${jetbrains.variable} min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 antialiased text-slate-900`}
      >
        {children}
      </body>
    </html>
  );
}
