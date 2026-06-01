import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="static-page">
      <div className="static-page-card panel">
        <span className="auth-kicker">PractWay 2026</span>
        <h1>О проекте</h1>
        <p className="muted">
          PractWay — спокойный трекер привычек, календарь самонаблюдения, дневник и мягкая аналитика.
          Мы собираем привычки, заметки, биоритмы, транзиты и настройки в одном интерфейсе без лишнего шума.
        </p>
        <p className="muted">
          Главная цель — помочь видеть ритм дня, не давя на пользователя и не превращая жизнь в таблицу ради таблицы.
        </p>
        <Link className="btn primary" href="/">Вернуться в приложение</Link>
      </div>
    </main>
  );
}
