import { AppFooter } from "../../src/components/Footer";

export default function AboutPage() {
  return (
    <main className="static-page">
      <div className="static-page-grid">
        <section className="panel static-page-card about-page-card about-hero-card">
          <div className="static-page-hero-copy">
            <span className="static-page-kicker">О проекте</span>
            <h1>PractWay</h1>
            <p className="muted">
              Практичный трекер привычек, календарь самонаблюдения и дневник состояния в одном
              спокойном интерфейсе. Мы собираем ритм дня, мягкую аналитику, заметки и контекст,
              чтобы видеть динамику без давления и лишнего шума.
            </p>
          </div>
          <div className="about-feature-grid">
            <div>
              <b>Календарь</b>
              <span>Гибкие периоды, разные режимы сетки и быстрые отметки.</span>
            </div>
            <div>
              <b>Дневник</b>
              <span>Записи по датам, настроение, энергия и история заметок.</span>
            </div>
            <div>
              <b>Аналитика</b>
              <span>Плавные графики, сигналы внимания и понятная динамика.</span>
            </div>
            <div>
              <b>Биоритмы</b>
              <span>Лёгкий контекст для самонаблюдения и ритма дня.</span>
            </div>
          </div>
        </section>
        <aside className="panel static-page-card about-side-card">
          <div className="side-summary">
            <span className="static-page-kicker">Что внутри</span>
            <h2>Без лишней тяжести</h2>
            <p className="muted">
              Интерфейс собран как рабочий журнал: минимум отвлечений, аккуратные панели,
              цветовые темы и настройка того, что именно вы видите.
            </p>
          </div>
          <div className="about-note-list">
            <div>
              <b>Настройки</b>
              <span>Видимость блоков, статусы, темы и плотность интерфейса.</span>
            </div>
            <div>
              <b>Приватность</b>
              <span>Данные остаются в аккаунте и не смешиваются между пользователями.</span>
            </div>
            <div>
              <b>Развитие</b>
              <span>Оповещения, экспорт и аналитика растут вместе с продуктом.</span>
            </div>
          </div>
        </aside>
      </div>
      <AppFooter />
    </main>
  );
}
