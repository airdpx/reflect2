import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Дневник привычек",
  description: "Календарь привычек и самонаблюдения"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
