import Link from "next/link";

export default function ContactsPage() {
  return (
    <main className="static-page">
      <div className="static-page-card panel">
        <span className="auth-kicker">PractWay 2026</span>
        <h1>Контакты</h1>
        <p className="muted">По вопросам продукта и обратной связи используй общий канал проекта.</p>
        <div className="contact-list">
          <div>
            <b>Email</b>
            <span>support@practway.app</span>
          </div>
          <div>
            <b>Telegram</b>
            <span>@practway</span>
          </div>
        </div>
        <Link className="btn primary" href="/">Вернуться в приложение</Link>
      </div>
    </main>
  );
}
