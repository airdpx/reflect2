import { AppFooter } from "../../src/components/Footer";
import { ContactForm } from "../../src/components/ContactForm";
import { loadSiteContactEmail } from "../../src/server/site-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactsPage() {
  const contactEmail = await loadSiteContactEmail();
  return (
    <main className="static-page">
      <div className="static-page-card panel contact-page-card">
        <div className="static-page-hero-copy">
          <span className="auth-kicker">PractWay 2026</span>
          <h1>Контакты</h1>
          <p className="muted">Напиши нам прямо из формы. Адрес получателя задаётся администратором в настройках сайта.</p>
        </div>
        <ContactForm recipientEmail={contactEmail} />
      </div>
      <AppFooter />
    </main>
  );
}
