"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { STORAGE_KEY, parseImportedState } from "../lib/storage";

type Mode = "login" | "register" | "reset";

export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialResetToken = searchParams.get("reset") || "";
  const [mode, setMode] = useState<Mode>(initialResetToken ? "reset" : "register");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const title = useMemo(() => {
    if (mode === "login") return "Вход";
    if (mode === "reset") return "Сброс пароля";
    return "Регистрация";
  }, [mode]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : mode === "reset" ? "/api/auth/reset-confirm" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email, password }
          : mode === "reset"
            ? { token: resetToken, password }
            : { email, password, name, birthDate };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || data.ok === false) throw new Error(data.error || "Не удалось выполнить действие");
      try {
        const legacyRaw = window.localStorage.getItem(STORAGE_KEY);
        if (legacyRaw) {
          const imported = parseImportedState(legacyRaw);
          if (imported) {
            imported.profile = data.state?.profile || imported.profile;
            imported.settings.forecast.enabled = true;
            await fetch("/api/account/state", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ state: imported })
            });
            window.localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        // Guest cache migration is best-effort.
      }
      setMessage(mode === "reset" ? "Пароль обновлён. Сейчас перенаправлю." : "Готово. Сейчас открою приложение.");
      router.refresh();
      window.location.href = "/";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось выполнить действие");
    } finally {
      setBusy(false);
    }
  }

  async function requestReset() {
    if (!email.trim()) {
      setMessage("Сначала укажи email.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok || data.ok === false) throw new Error(data.error || "Не удалось создать ссылку");
      setMessage(data.resetUrl ? `Ссылка восстановления: ${data.resetUrl}` : "Если email существует, ссылка восстановления создана.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось создать ссылку");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card panel">
        <div className="section-head">
          <div>
            <h1>Дневник привычек</h1>
            <p className="muted">Аккаунт, собственная база и прогноз дня по дате рождения.</p>
          </div>
        </div>
        <div className="chips auth-tabs">
          <button className={`chip ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>Регистрация</button>
          <button className={`chip ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Вход</button>
          <button className={`chip ${mode === "reset" ? "active" : ""}`} onClick={() => setMode("reset")}>Сброс</button>
        </div>
        <form className="stack auth-form" onSubmit={submit}>
          <div className="settings-row">
            <span><b>{title}</b><br /><small className="muted">{mode === "register" ? "Дата рождения обязательна." : mode === "login" ? "Войди, чтобы открыть свои данные." : "Сначала запроси ссылку, затем задай новый пароль."}</small></span>
          </div>
          {mode !== "reset" && mode !== "login" ? (
            <div className="form-grid">
              <div className="field">
                <label>Имя</label>
                <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="field">
                <label>Дата рождения</label>
                <input className="input" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
              </div>
            </div>
          ) : null}
          <div className="form-grid">
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="field">
              <label>Пароль</label>
              <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
          </div>
          {mode === "reset" ? (
            <div className="field">
              <label>Токен восстановления</label>
              <input className="input" value={resetToken} onChange={(event) => setResetToken(event.target.value)} />
            </div>
          ) : null}
          <div className="toolbar auth-actions">
            <button className="btn primary" disabled={busy} type="submit">{busy ? "..." : mode === "reset" ? "Сменить пароль" : mode === "login" ? "Войти" : "Создать аккаунт"}</button>
            {mode === "login" ? <button className="btn ghost" type="button" onClick={requestReset} disabled={busy}>Запросить сброс</button> : null}
          </div>
          <p className="muted">{message || "Все данные останутся в твоей собственной базе PostgreSQL."}</p>
        </form>
      </section>
    </main>
  );
}
