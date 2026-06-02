"use client";

import type React from "react";
import { useMemo, useState } from "react";

type Props = {
  recipientEmail: string;
};

export function ContactForm({ recipientEmail }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("Обратная связь");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const canSend = useMemo(() => Boolean(recipientEmail.trim() && message.trim()), [message, recipientEmail]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!recipientEmail.trim()) {
      setStatus("Адрес получателя ещё не задан в админке.");
      return;
    }
    if (!message.trim()) {
      setStatus("Добавь текст сообщения.");
      return;
    }
    const subject = encodeURIComponent(topic.trim() || "Обратная связь PractWay");
    const body = encodeURIComponent(
      [
        `Имя: ${name.trim() || "Не указано"}`,
        `Email: ${email.trim() || "Не указан"}`,
        "",
        message.trim()
      ].join("\n")
    );
    window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
    setStatus("Открою почтовый клиент с готовым письмом.");
  }

  return (
    <form className="stack contact-form" onSubmit={submit}>
      <div className="form-grid">
        <div className="field">
          <label>Имя</label>
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="field">
          <label>Ваш email</label>
          <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Тема</label>
        <input className="input" value={topic} onChange={(event) => setTopic(event.target.value)} />
      </div>
      <div className="field">
        <label>Сообщение</label>
        <textarea className="textarea contact-textarea" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Опиши вопрос или идею" />
      </div>
      <div className="toolbar preset-toolbar contact-actions">
        <button className="btn primary" type="submit" disabled={!canSend}>Отправить письмо</button>
        <span className="muted contact-hint">{recipientEmail ? `Письмо уйдёт на адрес, заданный администратором.` : "Адрес получателя задаётся в админке."}</span>
      </div>
      {status ? <p className="muted contact-status">{status}</p> : null}
    </form>
  );
}
