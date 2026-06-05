import { ContactForm } from "../../src/components/ContactForm";
import { loadSiteContactEmail } from "../../src/server/site-settings";
import { StaticPageShell } from "../../src/components/StaticPageShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactsPage() {
  const contactEmail = await loadSiteContactEmail();
  return (
    <StaticPageShell
      kicker="Контакты"
      title="Контакты"
      intro="Напиши нам прямо из формы."
    >
      <ContactForm recipientEmail={contactEmail} />
    </StaticPageShell>
  );
}
