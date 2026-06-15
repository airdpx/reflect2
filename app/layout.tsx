import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { detectPreferredLanguage } from "../src/lib/i18n";

export const metadata: Metadata = {
  title: "Дневник привычек",
  description: "Календарь привычек и самонаблюдения"
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const language = detectPreferredLanguage(requestHeaders.get("accept-language"));
  return (
    <html lang={language} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
