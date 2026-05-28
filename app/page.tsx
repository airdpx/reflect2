import { Suspense } from "react";
import { AuthScreen } from "../src/components/AuthScreen";
import HabitCalendarApp from "../src/HabitCalendarApp";
import { getCurrentAuthState } from "../src/server/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const state = await getCurrentAuthState();
  if (!state) return <Suspense fallback={null}><AuthScreen /></Suspense>;
  return <HabitCalendarApp initialState={state} />;
}
