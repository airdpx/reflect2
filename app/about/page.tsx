import { AppFooter } from "../../src/components/Footer";

export default function AboutPage() {
  return (
    <main className="static-page">
      <div className="static-page-card panel about-page-card">
        <div className="static-page-hero-copy">
          <span className="auth-kicker">PractWay 2026</span>
          <h1>О проекте</h1>
          <p className="muted">
            PractWay — трекер привычек, календарь самонаблюдения, дневник и мягкая аналитика.
            Мы собираем привычки, заметки, биоритмы, транзиты и настройки в одном интерфейсе без лишнего шума.
          </p>
        </div>
        <div className="about-feature-grid">
          <div>
            <b>Календарь</b>
            <span>Быстрые отметки, гибкие периоды и несколько режимов отображения.</span>
          </div>
          <div>
            <b>Дневник</b>
            <span>Записи по датам, настроение, энергия и история заметок.</span>
          </div>
          <div>
            <b>Аналитика</b>
            <span>Плавные графики, сигналы внимания и наглядная динамика.</span>
          </div>
          <div>
            <b>Транзиты и биоритмы</b>
            <span>Мягкий контекст для самонаблюдения и ритма дня.</span>
          </div>
        </div>
      </div>
      <AppFooter />
    </main>
  );
}
