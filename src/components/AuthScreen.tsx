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
    { icon: "📅", title: "Календарь", text: "Периоды, статусы, таблица и быстрые отметки", accent: "#38d9d8" },
    { icon: "✍️", title: "Дневник", text: "Настроение, энергия, стресс и история по дням", accent: "#b56cff" },
    { icon: "📈", title: "Аналитика", text: "Анализ привычек и состояния, визуальные отчёты и тренды", accent: "#c8e21b" },
    { icon: "🌤️", title: "Прогнозы", text: "Биоритмы, транзиты и мягкий контекст самонаблюдения", accent: "#ffb020" }
  ];

  const benefitPoints = [
    { icon: "🛡️", label: "Конфиденциальность" },
    { icon: "⚡", label: "Быстро и удобно" },
    { icon: "✓", label: "Без лишнего шума" }
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
            <span className="auth-kicker auth-kicker-icon"><span>👤</span>Самонаблюдение онлайн</span>
          </div>
          <h1>
            Привычки, дневник и <span>календарь</span> для
            <span>ежедневного ритма</span>
          </h1>
          <p className="muted">Вход по email, собственная база PostgreSQL, дата рождения для прогноза дня и темы, которые можно выбрать прямо здесь, до логина.</p>
          <div className="auth-feature-grid">
            {featureCards.map((card) => (
              <article key={card.title} className="auth-feature-card">
                <span className="auth-feature-icon" style={{ "--feature-accent": card.accent } as React.CSSProperties}>
                  {card.icon}
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
              <span key={point.label}><i>{point.icon}</i>{point.label}</span>
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
          <div className="chips auth-tabs">
            <button className={`chip ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>Регистрация</button>
            <button className={`chip ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Вход</button>
            <button className={`chip ${mode === "reset" ? "active" : ""}`} onClick={() => setMode("reset")}>Сброс</button>
          </div>
          <form className="stack auth-form" onSubmit={submit}>
            {mode !== "reset" && mode !== "login" ? (
              <div className="form-grid">
                <div className="field">
                  <label>Имя</label>
                  <div className="auth-input-shell">
                    <span className="auth-field-icon">👤</span>
                    <input className="input auth-input" placeholder="Введите ваше имя" value={name} onChange={(event) => setName(event.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>Дата рождения</label>
                  <div className="auth-input-shell">
                    <span className="auth-field-icon">📅</span>
                    <input className="input auth-input" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
                  </div>
                </div>
              </div>
            ) : null}
            <div className="form-grid">
              <div className="field">
                <label>{mode === "login" ? "Email или логин" : "Email"}</label>
                <div className="auth-input-shell">
                  <span className="auth-field-icon">✉️</span>
                  <input className="input auth-input" type={mode === "register" ? "email" : "text"} placeholder={mode === "login" ? "Введите email или логин" : "Введите email"} value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Пароль</label>
                <div className="auth-input-shell">
                  <span className="auth-field-icon">🔒</span>
                  <input className="input auth-input" type={showPassword ? "text" : "password"} placeholder="Придумайте пароль" value={password} onChange={(event) => setPassword(event.target.value)} />
                  <button className="auth-eye" type="button" onClick={() => setShowPassword((current) => !current)} title={showPassword ? "Скрыть пароль" : "Показать пароль"}>{showPassword ? "🙈" : "👁️"}</button>
                </div>
              </div>
            </div>
            {mode === "reset" ? (
              <div className="field">
                <label>Токен восстановления</label>
                <div className="auth-input-shell">
                  <span className="auth-field-icon">🔑</span>
                  <input className="input auth-input" value={resetToken} onChange={(event) => setResetToken(event.target.value)} />
                </div>
              </div>
            ) : null}
            <div className="toolbar auth-actions">
              <button className="btn primary" disabled={busy} type="submit">{busy ? "..." : mode === "reset" ? "Сменить пароль" : mode === "login" ? "Войти" : "Создать аккаунт"}</button>
              {mode === "login" ? <button className="btn ghost" type="button" onClick={requestReset} disabled={busy}>Запросить сброс</button> : null}
            </div>
            <p className="muted auth-note">{message || "Все данные останутся в твоей собственной базе PostgreSQL."}</p>
          </form>
        </section>
      </div>
      <AppFooter />
    </main>
  );
}
