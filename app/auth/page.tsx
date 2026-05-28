import { Suspense } from "react";
import { AuthScreen } from "../../src/components/AuthScreen";

export default function AuthPage() {
  return <Suspense fallback={null}><AuthScreen /></Suspense>;
}
