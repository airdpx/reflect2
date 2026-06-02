import { AppFooter } from "../../src/components/Footer";
import { ContactForm } from "../../src/components/ContactForm";
import { loadSiteContactEmail } from "../../src/server/site-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactsPage() {
  const contactEmail = await loadSiteContactEmail();
  return (
    <main className="static-page">
      <div className="static-page-grid">
        <section className="panel static-page-card contact-page-card contact-hero-card">
          <div className="static-page-hero-copy">
            <span className="static-page-kicker">Связь</span>
            <h1>Контакты</h1>
            <p className="muted">
              Напиши нам прямо из формы. Сообщение отправится на адрес, который администратор
              укажет в настройках сайта.
            </p>
          </div>
          <div className="contact-list">
            <div>
              <b>Когда писать</b>
              <span>Если нужен отклик по продукту, идее, ошибке или предложению.</span>
            </div>
            <div>
              <b>Как это работает</b>
              <span>Форма собирает письмо и открывает почтовый клиент с готовым текстом.</span>
            </div>
          </div>
        </section>
        <section className="panel static-page-card contact-page-card contact-form-card">
          <ContactForm recipientEmail={contactEmail} />
        </section>
      </div>
      <AppFooter />
    </main>
  );
}
