import { ContactForm } from "../../src/components/ContactForm";
import { loadSiteContactEmail } from "../../src/server/site-settings";
import { StaticPageShell } from "../../src/components/StaticPageShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactsPage() {
  const contactEmail = await loadSiteContactEmail();
  return (
    <StaticPageShell
      kicker={{ ru: "Контакты", en: "Contacts" }}
      title={{ ru: "Контакты", en: "Contacts" }}
      intro={{ ru: "Напиши нам прямо из формы.", en: "Send us a message directly from the form." }}
    >
      <ContactForm recipientEmail={contactEmail} />
    </StaticPageShell>
  );
}
