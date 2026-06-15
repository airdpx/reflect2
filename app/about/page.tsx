import { headers } from "next/headers";
import { StaticPageShell } from "../../src/components/StaticPageShell";
import { detectPreferredLanguage } from "../../src/lib/i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AboutPage() {
  const requestHeaders = await headers();
  const preferredLanguage = detectPreferredLanguage(requestHeaders.get("accept-language"));
  return (
    <StaticPageShell
      initialLanguage={preferredLanguage}
      kicker={{ ru: "О проекте", en: "About" }}
      title="PractWay"
      intro={{
        ru: "PractWay помогает вести привычки, дневник и календарь самонаблюдения в одном месте: быстро отмечать день, видеть историю, настраивать экран под себя и получать мягкий контекст без лишнего шума.",
        en: "PractWay brings habits, diary and self-observation calendar into one workspace: check in quickly, see history, tune the interface and get soft context without clutter."
      }}
      aside={(
        <div className="about-note-list">
          <div className="i18n-ru">
            <b>Для чего проект</b>
            <span>Чтобы собрать привычки, дневник, прогнозы и историю наблюдений в едином рабочем пространстве.</span>
          </div>
          <div className="i18n-ru">
            <b>Что он решает</b>
            <span>Убирает ручной хаос, даёт быстрые отметки, наглядную историю и мягкие сигналы внимания без давления.</span>
          </div>
          <div className="i18n-ru">
            <b>Кому подходит</b>
            <span>Тем, кто хочет спокойно отслеживать режим, состояние, нагрузку, повторы и закономерности в течение дня.</span>
          </div>
          <div className="i18n-en">
            <b>Purpose</b>
            <span>To keep habits, diary, forecasts and observation history in one focused workspace.</span>
          </div>
          <div className="i18n-en">
            <b>What it solves</b>
            <span>It removes manual chaos, gives fast check-ins, clear history and soft attention signals without pressure.</span>
          </div>
          <div className="i18n-en">
            <b>Who it is for</b>
            <span>For people who want to track rhythm, state, workload, repetition and daily patterns with less noise.</span>
          </div>
        </div>
      )}
    >
      <div className="content-page-sections i18n-ru">
        <section className="content-page-section">
          <h2>Основные задачи</h2>
          <p>
            Проект предназначен для ежедневного самонаблюдения и мягкой организации рутины. Он не пытается заменить
            календарь, заметки и аналитику отдельными инструментами, а объединяет их в одном интерфейсе, где
            пользователь видит и текущий день, и накопленную историю.
          </p>
          <div className="about-feature-grid">
            <div>
              <b>Календарь</b>
              <span>Показывает историю привычек, периоды, формы отметок и быстрые действия по датам.</span>
            </div>
            <div>
              <b>Привычки</b>
              <span>Позволяют добавлять, редактировать, группировать и архивировать привычки, шаблоны и категории.</span>
            </div>
            <div>
              <b>Дневник</b>
              <span>Собирает заметки, настроение, энергию, стресс и историю состояний по выбранным датам.</span>
            </div>
            <div>
              <b>Аналитика</b>
              <span>Показывает динамику выполнения, сигналы внимания, графики и повторы по каждой привычке.</span>
            </div>
            <div>
              <b>Биоритмы, цифры и транзиты</b>
              <span>Добавляют контекст для самонаблюдения и помогают смотреть на день шире, чем просто по списку дел.</span>
            </div>
            <div>
              <b>Настройки и темы</b>
              <span>Позволяют менять плотность, видимость блоков, оформление таблицы, формы отметок и цвета.</span>
            </div>
          </div>
        </section>
        <section className="content-page-section">
          <h2>Как устроен проект</h2>
          <p>
            Практика строится вокруг личного ритма дня. Пользователь отмечает привычки, пишет короткие наблюдения,
            смотрит историю по датам и видит не только текущий день, но и контекст вокруг него.
          </p>
          <p>
            В проекте уже заложены гибкие темы, разные режимы календаря, управление блоками интерфейса,
            оповещения, экспорт данных, админский раздел и отдельные страницы для справочной информации.
          </p>
          <p>
            Это не жёсткий трекер с красными провалами, а спокойная среда для наблюдения за собой: с календарём,
            дневником, прогнозами, цифрами и аккуратной аналитикой, которая помогает видеть повторяющиеся паттерны.
          </p>
        </section>
      </div>
      <div className="content-page-sections i18n-en">
        <section className="content-page-section">
          <h2>Main Tasks</h2>
          <p>
            PractWay is designed for daily self-observation and light routine management. It does not try to turn life
            into a rigid task manager. Instead, it combines a habit calendar, diary notes, analytics and contextual
            forecasts in one interface where the current day and accumulated history stay visible together.
          </p>
          <div className="about-feature-grid">
            <div>
              <b>Calendar</b>
              <span>Shows habit history, periods, check-in shapes and fast actions by date.</span>
            </div>
            <div>
              <b>Habits</b>
              <span>Lets you add, edit, group and archive habits, templates and categories.</span>
            </div>
            <div>
              <b>Diary</b>
              <span>Collects notes, mood, energy, stress and state history for selected dates.</span>
            </div>
            <div>
              <b>Analytics</b>
              <span>Shows completion dynamics, attention signals, charts and repetitions for every habit.</span>
            </div>
            <div>
              <b>Biorhythms, Numbers and Transits</b>
              <span>Add context for self-observation and help look at the day beyond a simple checklist.</span>
            </div>
            <div>
              <b>Settings and Themes</b>
              <span>Control density, visible blocks, table style, check-in shapes and colors.</span>
            </div>
          </div>
        </section>
        <section className="content-page-section">
          <h2>How It Works</h2>
          <p>
            The product is built around the personal rhythm of the day. You mark habits, write short observations,
            review notes by date and compare your actual state with the surrounding context.
          </p>
          <p>
            The project includes flexible themes, multiple calendar modes, interface block settings, notifications,
            data export, an admin area and public information pages.
          </p>
          <p>
            PractWay is a personal observation environment with a calendar, diary, forecasts, numbers and compact
            analytics that help reveal recurring patterns.
          </p>
        </section>
      </div>
    </StaticPageShell>
  );
}
