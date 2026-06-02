"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { AppIcon } from "./AppIcons";

type Props = {
  recipientEmail: string;
};

export function ContactForm({ recipientEmail }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("Обратная связь");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const canSend = useMemo(() => Boolean(recipientEmail.trim() && message.trim() && !loading), [loading, message, recipientEmail]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!recipientEmail.trim()) {
      setStatus("Адрес получателя ещё не задан в админке.");
      return;
    }
    if (!message.trim()) {
      setStatus("Добавь текст сообщения.");
      return;
    }

    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          topic,
          message,
          website
        })
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "Не удалось отправить сообщение");
      }
      setName("");
      setEmail("");
      setTopic("Обратная связь");
      setMessage("");
      setWebsite("");
      setStatus("Сообщение отправлено через сервер и сохранено в базе.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Не удалось отправить сообщение");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack contact-form" onSubmit={submit}>
      <input
        aria-hidden="true"
        autoComplete="off"
        className="contact-honeypot"
        tabIndex={-1}
        type="text"
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
      />
      <div className="form-grid">
        <div className="field">
          <label>Имя</label>
          <div className="auth-input-shell">
            <span className="auth-field-icon"><AppIcon name="user" /></span>
            <input className="input auth-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Как к вам обращаться" />
          </div>
        </div>
        <div className="field">
          <label>Ваш email</label>
          <div className="auth-input-shell">
            <span className="auth-field-icon"><AppIcon name="mail" /></span>
            <input className="input auth-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
          </div>
        </div>
      </div>
      <div className="field">
        <label>Тема</label>
        <div className="auth-input-shell">
          <span className="auth-field-icon"><AppIcon name="diary" /></span>
          <input className="input auth-input" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Обратная связь PractWay" />
        </div>
      </div>
      <div className="field">
        <label>Сообщение</label>
        <textarea className="textarea contact-textarea" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Опиши вопрос или идею" />
      </div>
      <div className="toolbar preset-toolbar contact-actions">
        <button className="btn primary" type="submit" disabled={!canSend}>{loading ? "Отправляю..." : "Отправить"}</button>
        <span className="muted contact-hint">{recipientEmail ? "Письмо уйдёт на адрес, заданный администратором." : "Адрес получателя задаётся в админке."}</span>
      </div>
      {status ? <p className="muted contact-status">{status}</p> : null}
    </form>
  );
}
