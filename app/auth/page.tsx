import { headers } from "next/headers";
import { Suspense } from "react";
import { AuthScreen } from "../../src/components/AuthScreen";
import { detectPreferredLanguage } from "../../src/lib/i18n";

export default async function AuthPage() {
  const requestHeaders = await headers();
  const preferredLanguage = detectPreferredLanguage(requestHeaders.get("accept-language"));
  return <Suspense fallback={null}><AuthScreen initialLanguage={preferredLanguage} /></Suspense>;
}
