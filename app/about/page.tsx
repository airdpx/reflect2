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
          <section className="content-page-section about-side-section i18n-ru">
            <h2>План развития</h2>
            <p>
              Дальше проект будет развиваться в сторону более глубокого самонаблюдения и более умной поддержки
              пользователя. Ближайшие шаги — расширение аналитики, улучшение календарных сценариев, развитие
              уведомлений и запуск мобильного приложения с теми же принципами спокойного интерфейса.
            </p>
            <div className="about-feature-grid">
              <div>
                <b>AI-анализ дневника и календаря</b>
                <span>Система сможет анализировать записи и ритм дня, а затем предлагать выводы и идеи для действий.</span>
              </div>
              <div>
                <b>Только по согласию</b>
                <span>Анализ запускается только после согласия пользователя. По умолчанию данные никуда не передаются.</span>
              </div>
              <div>
                <b>Рекомендации и контекст</b>
                <span>AI сможет подсвечивать повторяющиеся закономерности, указывать на слабые места и предлагать варианты улучшений.</span>
              </div>
              <div>
                <b>Новые режимы и отчёты</b>
                <span>В планах — дальше развивать таблицы, графики, прогнозирование, выявление закономерностей и компактные отчётные блоки.</span>
              </div>
            </div>
          </section>
          <section className="content-page-section about-side-section i18n-en">
            <h2>Roadmap</h2>
            <p>
              Next, the project will move toward deeper self-observation and smarter user support. The next steps
              include richer analytics, better calendar workflows, stronger notifications and a mobile app that keeps
              the same calm interface principles.
            </p>
            <div className="about-feature-grid">
              <div>
                <b>AI analysis of diary and calendar</b>
                <span>The system will analyze notes and daily rhythm, then offer insights and ideas for action.</span>
              </div>
              <div>
                <b>Consent first</b>
                <span>Analysis starts only after the user consents. By default, no data is sent anywhere.</span>
              </div>
              <div>
                <b>Suggestions and context</b>
                <span>AI can highlight recurring patterns, point to weak spots and suggest ways to improve them.</span>
              </div>
              <div>
                <b>New modes and reports</b>
                <span>Planned work includes more table modes, charts, forecasting, pattern detection and compact report blocks.</span>
              </div>
            </div>
          </section>
          <section className="content-page-section about-side-section i18n-ru">
            <h2>Отказ от ответственности</h2>
            <p>
              Информация в проекте предоставляется только в ознакомительных целях и не является рекомендацией к
              действию, медицинским советом, юридическим заключением или финансовым прогнозом.
            </p>
            <p>
              Любое использование данных и выводов пользователь принимает на свой риск и самостоятельно оценивает
              уместность их применения, а также возможные последствия.
            </p>
            <p>
              Используя проект, пользователь соглашается с тем, что владельцы сервиса не несут претензий и
              ответственности за решения, принятые на основе предоставленной информации. Материалы используются
              как есть.
            </p>
          </section>
          <section className="content-page-section about-side-section i18n-en">
            <h2>Disclaimer</h2>
            <p>
              The information in this project is provided for informational purposes only and is not a recommendation,
              medical advice, legal opinion or financial forecast.
            </p>
            <p>
              Any use of the data and conclusions is at the user's own risk, and the user independently evaluates how
              appropriate it is to apply them and what consequences may follow.
            </p>
            <p>
              By using the project, the user agrees that the service owners are not liable for claims or for decisions
              made on the basis of the provided information. The material is used as is.
            </p>
          </section>
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
          <h2>Как это работает</h2>
          <p>
            Сначала добавьте привычку - вручную или из шаблона. После этого каждый день отмечайте её в календаре
            в выбранном ритме: каждый день, по дням недели, несколько раз в день, как числовую задачу или как
            привычку, которую важно не делать.
          </p>
          <p>
            Раздел привычек отвечает за создание, редактирование, категории, иконки, расписание и шаблоны. Здесь
            пользователь настраивает основу, с которой потом работает календарь.
          </p>
          <p>
            Раздел дневника заполнен несколькими блоками: короткая заметка, состояние, здоровье, финансы и история
            записей. Такая структура помогает последовательно фиксировать важные темы, не перегружая один большой
            текстовый блок.
          </p>
          <p>
            Календарь показывает, как привычки складываются во времени, а аналитика помогает заметить повторяющиеся
            паттерны, сильные серии и места, где привычкам нужна мягкая поддержка.
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
            Start by adding a habit, either manually or from a template. After that, check it in every day in the
            rhythm you chose: every day, on selected weekdays, several times a day, as a numeric goal or as a habit
            that should not happen.
          </p>
          <p>
            The Habits section is where you create, edit, categorize, assign icons, set schedules and keep templates.
            It is the starting point for the whole workflow, because the calendar uses that structure later.
          </p>
          <p>
            The Diary is split into several blocks: a short note, state, health, finances and note history. This makes
            it easier to fill in important topics step by step instead of putting everything into one large text field.
          </p>
          <p>
            The calendar shows how habits accumulate over time, and analytics helps spot recurring patterns, strong
            streaks and places where a habit needs gentle support.
          </p>
        </section>
      </div>
    </StaticPageShell>
  );
}
