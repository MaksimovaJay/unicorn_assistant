import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Unicorn Assistant",
  description: "Рабочее пространство",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Unicorn",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={nunito.variable}>
      <body className="font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
