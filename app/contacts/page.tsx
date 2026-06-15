import { headers } from "next/headers";
import { ContactForm } from "../../src/components/ContactForm";
import { loadSiteContactEmail } from "../../src/server/site-settings";
import { StaticPageShell } from "../../src/components/StaticPageShell";
import { detectPreferredLanguage } from "../../src/lib/i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactsPage() {
  const requestHeaders = await headers();
  const preferredLanguage = detectPreferredLanguage(requestHeaders.get("accept-language"));
  const contactEmail = await loadSiteContactEmail();
  return (
    <StaticPageShell
      initialLanguage={preferredLanguage}
      kicker={{ ru: "Контакты", en: "Contacts" }}
      title={{ ru: "Контакты", en: "Contacts" }}
      intro={{ ru: "", en: "" }}
    >
      <ContactForm recipientEmail={contactEmail} />
    </StaticPageShell>
  );
}
