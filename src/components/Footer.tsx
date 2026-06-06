import Link from "next/link";
import type { Language } from "../types";
import { commonText, normalizeLanguage } from "../lib/i18n";

export function AppFooter({ language = "ru" }: { language?: Language }) {
  const text = commonText[normalizeLanguage(language)];
  return (
    <footer className="app-footer">
      <div className="footer-copy">{text.copyright}</div>
      <nav className="footer-links">
        <Link href="/about">{text.footerAbout}</Link>
        <Link href="/contacts">{text.footerContacts}</Link>
      </nav>
    </footer>
  );
}
