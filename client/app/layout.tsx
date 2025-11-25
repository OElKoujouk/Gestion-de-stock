import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
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
    "Interface Next.js + Tailwind pour piloter inventaires, demandes et rapports d'un parc matériel scolaire.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${jetbrains.variable} bg-slate-100 antialiased text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
