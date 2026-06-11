import { Suspense } from "react";
import { AuthScreen } from "../src/components/AuthScreen";
import HabitCalendarApp from "../src/HabitCalendarApp";
import { getCurrentAuthState } from "../src/server/auth";
import { loadRuntimeKnowledgeContent } from "../src/server/site-settings";

export const dynamic = "force-dynamic";

export default async function Page() {
  const state = await getCurrentAuthState();
  const runtimeContent = await loadRuntimeKnowledgeContent();
  if (!state) return <Suspense fallback={null}><AuthScreen /></Suspense>;
  return <HabitCalendarApp initialState={state} runtimeContent={runtimeContent} />;
}
