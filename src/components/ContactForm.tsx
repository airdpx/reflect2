"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { AppIcon } from "./AppIcons";
import type { Language } from "../types";
import { normalizeLanguage } from "../lib/i18n";

type Props = {
  recipientEmail: string;
};

export function ContactForm({ recipientEmail }: Props) {
  const [language, setLanguage] = useState<Language>("ru");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const text = language === "en" ? {
    name: "Name",
    namePlaceholder: "How should we address you?",
    email: "Your email",
    topic: "Topic",
    topicPlaceholder: "PractWay feedback",
    defaultTopic: "Feedback",
    message: "Message",
    messagePlaceholder: "Describe your question or idea",
    sending: "Sending...",
    send: "Send",
    missingRecipient: "The recipient address is not configured yet.",
    missingMessage: "Add a message first.",
    sent: "Message sent.",
    failed: "Could not send the message"
  } : {
    name: "Имя",
    namePlaceholder: "Как к вам обращаться",
    email: "Ваш email",
    topic: "Тема",
    topicPlaceholder: "Обратная связь PractWay",
    defaultTopic: "Обратная связь",
    message: "Сообщение",
    messagePlaceholder: "Опиши вопрос или идею",
    sending: "Отправляю...",
    send: "Отправить",
    missingRecipient: "Адрес получателя ещё не задан.",
    missingMessage: "Добавь текст сообщения.",
    sent: "Сообщение отправлено.",
    failed: "Не удалось отправить сообщение"
  };

  useEffect(() => {
    const root = document.querySelector(".static-page");
    if (!root) return;
    const sync = () => {
      const nextLanguage = normalizeLanguage(root.getAttribute("data-language") || "ru");
      setLanguage(nextLanguage);
      setTopic((current) => {
        const defaultTopics = ["Обратная связь", "Feedback"];
        if (current && !defaultTopics.includes(current)) return current;
        return nextLanguage === "en" ? "Feedback" : "Обратная связь";
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-language"] });
    return () => observer.disconnect();
  }, []);

  const canSend = useMemo(() => Boolean(recipientEmail.trim() && message.trim() && !loading), [loading, message, recipientEmail]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!recipientEmail.trim()) {
      setStatus(text.missingRecipient);
      return;
    }
    if (!message.trim()) {
      setStatus(text.missingMessage);
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
          website,
          language
        })
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || text.failed);
      }
      setName("");
      setEmail("");
      setTopic(text.defaultTopic);
      setMessage("");
      setWebsite("");
      setStatus(text.sent);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : text.failed);
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
          <label>{text.name}</label>
          <div className="auth-input-shell">
            <span className="auth-field-icon"><AppIcon name="user" /></span>
            <input className="input auth-input" value={name} onChange={(event) => setName(event.target.value)} placeholder={text.namePlaceholder} />
          </div>
        </div>
        <div className="field">
          <label>{text.email}</label>
          <div className="auth-input-shell">
            <span className="auth-field-icon"><AppIcon name="mail" /></span>
            <input className="input auth-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
          </div>
        </div>
      </div>
      <div className="field">
        <label>{text.topic}</label>
        <div className="auth-input-shell">
          <span className="auth-field-icon"><AppIcon name="diary" /></span>
          <input className="input auth-input" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder={text.topicPlaceholder} />
        </div>
      </div>
      <div className="field">
        <label>{text.message}</label>
        <textarea className="textarea contact-textarea" value={message} onChange={(event) => setMessage(event.target.value)} placeholder={text.messagePlaceholder} />
      </div>
      <div className="toolbar preset-toolbar contact-actions">
        <button className="btn primary" type="submit" disabled={!canSend}>{loading ? text.sending : text.send}</button>
      </div>
      {status ? <p className="muted contact-status">{status}</p> : null}
    </form>
  );
}
