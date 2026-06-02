import { ContactForm } from "../../src/components/ContactForm";
import { loadSiteContactEmail } from "../../src/server/site-settings";
import { StaticPageShell } from "../../src/components/StaticPageShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactsPage() {
  const contactEmail = await loadSiteContactEmail();
  return (
    <StaticPageShell
      kicker="Связь"
      title="Контакты"
      intro="Напиши нам прямо из формы. Сообщение уйдёт через сервер на адрес, который администратор укажет в настройках сайта, и сохранится в базе."
      aside={(
        <div className="contact-list">
          <div>
            <b>Когда писать</b>
            <span>Если нужен отклик по продукту, идее, ошибке или предложению.</span>
          </div>
          <div>
            <b>Как это работает</b>
            <span>Форма отправляет письмо через сервер, а адрес получателя задаётся в админке.</span>
          </div>
        </div>
      )}
    >
      <ContactForm recipientEmail={contactEmail} />
    </StaticPageShell>
  );
}
