import { Suspense } from "react";
import { headers } from "next/headers";
import { AuthScreen } from "../src/components/AuthScreen";
import HabitCalendarApp from "../src/HabitCalendarApp";
import { getCurrentAuthState } from "../src/server/auth";
import { loadRuntimeKnowledgeContent } from "../src/server/site-settings";
import { detectPreferredLanguage } from "../src/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Page() {
  const requestHeaders = await headers();
  const preferredLanguage = detectPreferredLanguage(requestHeaders.get("accept-language"));
  const state = await getCurrentAuthState();
  const runtimeContent = await loadRuntimeKnowledgeContent();
  if (!state) return <Suspense fallback={null}><AuthScreen initialLanguage={preferredLanguage} /></Suspense>;
  return <HabitCalendarApp initialState={state} runtimeContent={runtimeContent} />;
}
