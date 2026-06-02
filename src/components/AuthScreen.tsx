"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppFooter } from "./Footer";
import { themeOptions } from "../lib/defaults";
import { STORAGE_KEY, parseImportedState } from "../lib/storage";
import type { InterfaceTheme } from "../types";

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
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState<InterfaceTheme>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("reflect2_auth_theme") as InterfaceTheme | null;
    return saved && themeOptions.some((item) => item.id === saved) ? saved : "dark";
  });
  const palette = themeOptions.find((item) => item.id === theme) || themeOptions[0];
  const shellStyle = useMemo(() => ({
    "--auth-bg": palette.colors[0],
    "--auth-surface": palette.colors[1],
    "--auth-accent": palette.colors[2],
    "--auth-text": palette.colors[3]
  } as React.CSSProperties), [palette]);

  useEffect(() => {
    window.localStorage.setItem("reflect2_auth_theme", theme);
  }, [theme]);

  const title = useMemo(() => {
    if (mode === "login") return "Вход";
    if (mode === "reset") return "Сброс пароля";
    return "Регистрация";
  }, [mode]);

  const featureCards = [
    { icon: "calendar", title: "Календарь", text: "Периоды, статусы, таблица и быстрые отметки", accent: "#40f1e6" },
    { icon: "diary", title: "Дневник", text: "Настроение, энергия, стресс и история по дням", accent: "#a855f7" },
    { icon: "analytics", title: "Аналитика", text: "Анализ привычек и состояния, визуальные отчёты и тренды", accent: "#a3e635" },
    { icon: "forecast", title: "Прогнозы", text: "Сопоставляйте данные с прогнозами и наблюдениями", accent: "#f6a800" }
  ];

  const benefitPoints = [
    { icon: "shield", label: "Конфиденциальность" },
    { icon: "bolt", label: "Быстро и удобно" },
    { icon: "check", label: "Без лишнего" }
  ];

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
      const accountState = data.state ? structuredClone(data.state) : null;
      if (accountState?.settings) {
        accountState.settings.interfaceTheme = theme;
      }
      try {
        const legacyRaw = window.localStorage.getItem(STORAGE_KEY);
        if (legacyRaw) {
          const imported = parseImportedState(legacyRaw);
          if (imported) {
            imported.profile = data.state?.profile || imported.profile;
            imported.settings.interfaceTheme = theme;
            imported.settings.forecast.enabled = true;
            await fetch("/api/account/state", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ state: imported })
            });
            window.localStorage.removeItem(STORAGE_KEY);
          }
        } else if (accountState) {
          await fetch("/api/account/state", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state: accountState })
          });
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
    <main className="auth-shell" style={shellStyle}>
      <div className="auth-theme-dock">
        <details className="quick-popover">
          <summary className="quick-icon" title="Тема">🎨</summary>
          <div className="quick-panel quick-panel-narrow">
            <div className="quick-panel-head">
              <b>Тема</b>
              <span>{palette.title}</span>
            </div>
            <div className="theme-dot-grid auth-theme-grid">
              {themeOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`theme-dot ${theme === item.id ? "active" : ""}`}
                  title={item.title}
                  onClick={() => setTheme(item.id as InterfaceTheme)}
                >
                  {item.colors.map((color) => <i key={color} style={{ background: color }} />)}
                </button>
              ))}
            </div>
          </div>
        </details>
      </div>
      <div className="auth-layout">
        <section className="auth-hero panel">
          <div className="auth-hero-top">
            <span className="auth-kicker auth-kicker-icon"><AuthMiniIcon name="user" />Самонаблюдение онлайн</span>
          </div>
          <h1>
            Привычки, дневник и<br />
            <span>календарь</span> для<br />
            ежедневного <span>ритма</span>
          </h1>
          <p className="muted">Ведите календарь привычек, фиксируйте состояние дня и анализируйте динамику личного ритма на основе данных, прогнозов и ежедневных наблюдений.</p>
          <div className="auth-feature-grid">
            {featureCards.map((card) => (
              <article key={card.title} className="auth-feature-card">
                <span className="auth-feature-icon" style={{ "--feature-accent": card.accent } as React.CSSProperties}>
                  <AuthMiniIcon name={card.icon} />
                </span>
                <div>
                  <b>{card.title}</b>
                  <span>{card.text}</span>
                </div>
              </article>
            ))}
          </div>
          <div className="auth-benefits">
            {benefitPoints.map((point) => (
              <span key={point.label}><i><AuthMiniIcon name={point.icon} /></i>{point.label}</span>
            ))}
          </div>
        </section>
        <section className="auth-card panel">
          <div className="section-head">
            <div>
              <h2>{title}</h2>
              <p className="muted">{mode === "register" ? "Дата рождения обязательна." : mode === "login" ? "Войди по email или по логину admin." : "Сначала запроси ссылку, затем задай новый пароль."}</p>
            </div>
          </div>
          <div className="auth-tabs">
            <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}><AuthMiniIcon name="user-plus" />Регистрация</button>
            <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}><AuthMiniIcon name="user" />Вход</button>
          </div>
          <form className="stack auth-form" onSubmit={submit}>
            {mode !== "reset" && mode !== "login" ? (
              <div className="form-grid">
                <div className="field">
                  <label>Имя</label>
                  <div className="auth-input-shell">
                    <span className="auth-field-icon"><AuthMiniIcon name="user" /></span>
                    <input className="input auth-input" placeholder="Введите ваше имя" value={name} onChange={(event) => setName(event.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>Дата рождения</label>
                  <div className="auth-input-shell">
                    <span className="auth-field-icon"><AuthMiniIcon name="calendar" /></span>
                    <input className="input auth-input" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
                  </div>
                </div>
              </div>
            ) : null}
            <div className="form-grid">
              <div className="field">
                <label>{mode === "login" ? "Email или логин" : "Email"}</label>
                <div className="auth-input-shell">
                  <span className="auth-field-icon"><AuthMiniIcon name="mail" /></span>
                  <input className="input auth-input" type={mode === "register" ? "email" : "text"} placeholder={mode === "login" ? "Введите email или логин" : "Введите email"} value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Пароль</label>
                <div className="auth-input-shell">
                  <span className="auth-field-icon"><AuthMiniIcon name="lock" /></span>
                  <input className="input auth-input" type={showPassword ? "text" : "password"} placeholder="Придумайте пароль" value={password} onChange={(event) => setPassword(event.target.value)} />
                  <button className="auth-eye" type="button" onClick={() => setShowPassword((current) => !current)} title={showPassword ? "Скрыть пароль" : "Показать пароль"}><AuthMiniIcon name={showPassword ? "eye-off" : "eye"} /></button>
                </div>
              </div>
            </div>
            {mode === "reset" ? (
              <div className="field">
                <label>Токен восстановления</label>
                <div className="auth-input-shell">
                  <span className="auth-field-icon"><AuthMiniIcon name="key" /></span>
                  <input className="input auth-input" value={resetToken} onChange={(event) => setResetToken(event.target.value)} />
                </div>
              </div>
            ) : null}
            <div className="toolbar auth-actions">
              <button className="btn primary" disabled={busy} type="submit">{busy ? "..." : mode === "reset" ? "Сменить пароль" : mode === "login" ? "Войти" : "Создать аккаунт"}</button>
              {mode === "login" ? <button className="btn ghost" type="button" onClick={requestReset} disabled={busy}>Запросить сброс</button> : null}
            </div>
            {mode === "register" ? (
              <p className="auth-switch">Уже есть аккаунт? <button type="button" onClick={() => setMode("login")}>Войти</button></p>
            ) : mode === "login" ? (
              <p className="auth-switch">Нет аккаунта? <button type="button" onClick={() => setMode("register")}>Создать</button></p>
            ) : null}
            <p className="muted auth-note">{message || "Все данные останутся в твоей собственной базе PostgreSQL."}</p>
          </form>
        </section>
      </div>
      <AppFooter />
    </main>
  );
}

function AuthMiniIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === "calendar" ? (
        <>
          <rect {...common} x="4" y="5" width="16" height="17" rx="3" />
          <path {...common} d="M8 3v4M16 3v4M4 10h16M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
        </>
      ) : name === "diary" ? (
        <>
          <path {...common} d="M6 4h11a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1Z" />
          <path {...common} d="M8 4v18M11 8h5M11 12h4M11 16h5" />
        </>
      ) : name === "analytics" ? (
        <>
          <path {...common} d="M4 20h18M6 17V9M11 17V5M16 17v-7M21 17V7" />
          <path {...common} d="M5 12l5-5 4 4 6-7" />
        </>
      ) : name === "forecast" ? (
        <>
          <path {...common} d="M3 17c3-6 6-8 10-4s6 2 8-3" />
          <circle {...common} cx="6" cy="15" r="1.5" />
          <circle {...common} cx="13" cy="13" r="1.5" />
          <circle {...common} cx="20" cy="9" r="1.5" />
          <path {...common} d="M4 21h18" />
        </>
      ) : name === "user-plus" ? (
        <>
          <path {...common} d="M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M16 11h6" />
        </>
      ) : name === "mail" ? (
        <>
          <rect {...common} x="3" y="5" width="18" height="14" rx="2" />
          <path {...common} d="m4 7 8 6 8-6" />
        </>
      ) : name === "lock" ? (
        <>
          <rect {...common} x="5" y="10" width="14" height="10" rx="2" />
          <path {...common} d="M8 10V7a4 4 0 0 1 8 0v3" />
        </>
      ) : name === "eye" ? (
        <>
          <path {...common} d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
          <circle {...common} cx="12" cy="12" r="3" />
        </>
      ) : name === "eye-off" ? (
        <>
          <path {...common} d="M3 3l18 18M10.6 10.6a3 3 0 0 0 3.8 3.8M8.5 5.6A10.8 10.8 0 0 1 12 5c6 0 10 7 10 7a17.7 17.7 0 0 1-3 3.8M6 6.8C3.5 8.5 2 12 2 12s4 7 10 7c1.3 0 2.5-.3 3.6-.8" />
        </>
      ) : name === "shield" ? (
        <>
          <path {...common} d="M12 3 5 6v5c0 4.6 2.9 7.9 7 10 4.1-2.1 7-5.4 7-10V6l-7-3Z" />
          <path {...common} d="M12 11h.01" />
        </>
      ) : name === "bolt" ? (
        <path {...common} d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z" />
      ) : name === "check" ? (
        <>
          <circle {...common} cx="12" cy="12" r="9" />
          <path {...common} d="m8 12 3 3 6-7" />
        </>
      ) : name === "key" ? (
        <>
          <circle {...common} cx="8" cy="14" r="4" />
          <path {...common} d="M11 11l8-8M15 7l3 3M17 5l2 2" />
        </>
      ) : (
        <>
          <circle {...common} cx="12" cy="8" r="4" />
          <path {...common} d="M4 21a8 8 0 0 1 16 0" />
        </>
      )}
    </svg>
  );
}
