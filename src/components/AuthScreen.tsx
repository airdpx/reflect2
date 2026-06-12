"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppFooter } from "./Footer";
import { clearStoredState } from "../lib/storage";
import type { InterfaceTheme, Language } from "../types";
import { AppIcon, type AppIconName } from "./AppIcons";
import { loadPublicThemeState, savePublicThemeState } from "../lib/public-theme";
import { ThemePicker } from "./ThemePicker";
import { themeOptions } from "../lib/defaults";
import { LanguagePicker } from "./LanguagePicker";
import { authText, commonText, normalizeLanguage } from "../lib/i18n";
import { RuntimeTranslator } from "./RuntimeTranslator";

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
  const [themeState, setThemeState] = useState(() => loadPublicThemeState("dark"));
  const theme = themeState.theme;
  const language = normalizeLanguage(themeState.language);
  const text = authText[language];
  const common = commonText[language];
  const palette = useMemo(() => themeOptions.find((item) => item.id === theme) || themeOptions[0], [theme]);
  const shellStyle = useMemo(() => ({
    "--auth-bg": theme === "custom" && themeState.customTheme ? themeState.customTheme.bg : palette.colors[0],
    "--auth-surface": theme === "custom" && themeState.customTheme ? themeState.customTheme.surface : palette.colors[1],
    "--auth-text": theme === "custom" && themeState.customTheme ? themeState.customTheme.text : palette.colors[3],
    "--auth-border": theme === "custom" && themeState.customTheme
      ? `color-mix(in srgb, ${themeState.customTheme.accent} 24%, ${themeState.customTheme.surface})`
      : `color-mix(in srgb, ${palette.colors[2]} 24%, ${palette.colors[1]})`,
    "--auth-muted": theme === "custom" && themeState.customTheme
      ? `color-mix(in srgb, ${themeState.customTheme.text} 68%, ${themeState.customTheme.surface})`
      : `color-mix(in srgb, ${palette.colors[3]} 64%, ${palette.colors[1]})`,
    "--auth-accent": theme === "custom" && themeState.customTheme ? themeState.customTheme.accent : palette.colors[2]
  } as React.CSSProperties), [palette, theme, themeState.customTheme]);

  useEffect(() => {
    savePublicThemeState({ theme, language, customTheme: themeState.customTheme });
  }, [theme, language, themeState.customTheme]);

  const title = useMemo(() => {
    if (mode === "login") return text.login;
    if (mode === "reset") return text.reset;
    return text.register;
  }, [mode, text]);
  const subtitle = mode === "login"
    ? text.loginSubtitle
    : mode === "reset"
      ? text.resetSubtitle
      : "";

  const featureCards = [
    { icon: "calendar" as AppIconName, title: text.features.calendar[0], text: text.features.calendar[1], accent: "#40f1e6" },
    { icon: "diary" as AppIconName, title: text.features.diary[0], text: text.features.diary[1], accent: "#a855f7" },
    { icon: "analytics" as AppIconName, title: text.features.analytics[0], text: text.features.analytics[1], accent: "#a3e635" },
    { icon: "forecast" as AppIconName, title: text.features.forecast[0], text: text.features.forecast[1], accent: "#f6a800" }
  ];

  const benefitPoints = [
    { icon: "shield" as AppIconName, label: text.benefits[0] },
    { icon: "bolt" as AppIconName, label: text.benefits[1] },
    { icon: "check" as AppIconName, label: text.benefits[2] }
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
        accountState.settings.language = language;
      }
      try {
        clearStoredState();
        if (accountState) {
          await fetch("/api/account/state", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state: accountState })
          });
        }
        savePublicThemeState({ theme, language, customTheme: theme === "custom" ? accountState?.settings?.customTheme : undefined });
      } catch {
        // Best-effort sync of the freshly authorized state.
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
      <RuntimeTranslator language={language} selector=".auth-shell" />
      <div className="auth-theme-dock">
        <LanguagePicker
          language={language}
          onLanguageChange={(nextLanguage: Language) => setThemeState((current) => ({ ...current, language: nextLanguage }))}
          title={common.language}
        />
        <ThemePicker
          className="auth-theme-picker"
          panelClassName="quick-panel-narrow"
          gridClassName="auth-theme-grid"
          theme={theme}
          customTheme={themeState.customTheme}
          onThemeChange={(nextTheme) => setThemeState((current) => ({ ...current, theme: nextTheme }))}
          title={common.theme}
          language={language}
        />
      </div>
      <div className="auth-layout">
        <section className="auth-hero panel">
          <div className="auth-hero-top">
            <span className="auth-kicker auth-kicker-icon"><AppIcon name="user" />{text.online}</span>
          </div>
          <h1>
            {text.heroTitlePrefix} <span>{text.heroTitleAccent1}</span> {text.heroTitleMiddle} <span>{text.heroTitleAccent2}</span>
          </h1>
          <p className="muted">{text.heroIntro}</p>
          <div className="auth-feature-grid">
            {featureCards.map((card) => (
              <article key={card.title} className="auth-feature-card">
                <span className="auth-feature-icon" style={{ "--feature-accent": card.accent } as React.CSSProperties}>
                  <AppIcon name={card.icon} />
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
              <span key={point.label}><i><AppIcon name={point.icon} /></i>{point.label}</span>
            ))}
          </div>
        </section>
        <section className="auth-card panel">
          <div className="section-head">
            <div>
              <h2>{title}</h2>
              {subtitle ? <p className="muted">{subtitle}</p> : null}
            </div>
          </div>
          <div className="auth-tabs">
            <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}><AppIcon name="user-plus" />{text.register}</button>
            <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}><AppIcon name="user" />{text.login}</button>
          </div>
          <form className="stack auth-form" onSubmit={submit}>
            {mode !== "reset" && mode !== "login" ? (
              <div className="form-grid">
                <div className="field">
                  <label>{text.name}</label>
                  <div className="auth-input-shell">
                    <span className="auth-field-icon"><AppIcon name="user" /></span>
                    <input className="input auth-input" placeholder={text.namePlaceholder} value={name} onChange={(event) => setName(event.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>{text.birthDate}</label>
                  <div className="auth-input-shell">
                    <span className="auth-field-icon"><AppIcon name="calendar" /></span>
                    <input className="input auth-input" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
                  </div>
                </div>
              </div>
            ) : null}
            <div className="form-grid">
              <div className="field">
                <label>{mode === "login" ? text.emailOrLogin : text.email}</label>
                <div className="auth-input-shell">
                  <span className="auth-field-icon"><AppIcon name="mail" /></span>
                  <input className="input auth-input" type={mode === "register" ? "email" : "text"} placeholder={mode === "login" ? text.loginPlaceholder : text.emailPlaceholder} value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>{text.password}</label>
                <div className="auth-input-shell">
                  <span className="auth-field-icon"><AppIcon name="lock" /></span>
                  <input className="input auth-input" type={showPassword ? "text" : "password"} placeholder={text.passwordPlaceholder} value={password} onChange={(event) => setPassword(event.target.value)} />
                  <button className="auth-eye" type="button" onClick={() => setShowPassword((current) => !current)} title={showPassword ? "Скрыть пароль" : "Показать пароль"}><AppIcon name={showPassword ? "eye-off" : "eye"} /></button>
                </div>
              </div>
            </div>
            {mode === "reset" ? (
              <div className="field">
                <label>Токен восстановления</label>
                <div className="auth-input-shell">
                  <span className="auth-field-icon"><AppIcon name="key" /></span>
                  <input className="input auth-input" value={resetToken} onChange={(event) => setResetToken(event.target.value)} />
                </div>
              </div>
            ) : null}
            <div className="toolbar auth-actions">
              <button className="btn primary" disabled={busy} type="submit">{busy ? "..." : mode === "reset" ? text.changePassword : mode === "login" ? text.signIn : text.createAccount}</button>
              {mode === "login" ? <button className="btn ghost" type="button" onClick={requestReset} disabled={busy}>{text.requestReset}</button> : null}
            </div>
            {mode === "register" ? (
              <p className="auth-switch">{text.hasAccount} <button type="button" onClick={() => setMode("login")}>{text.signIn}</button></p>
            ) : mode === "login" ? (
              <p className="auth-switch">{text.noAccount} <button type="button" onClick={() => setMode("register")}>{text.create}</button></p>
            ) : null}
            {message ? <p className="muted auth-note">{message}</p> : null}
          </form>
        </section>
      </div>
      <AppFooter language={language} />
    </main>
  );
}
