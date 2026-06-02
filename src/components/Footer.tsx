import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="footer-copy">Projectway 2026</div>
      <nav className="footer-links">
        <Link href="/about">О проекте</Link>
        <Link href="/contacts">Контакты</Link>
      </nav>
    </footer>
  );
}
