import { notFound } from "next/navigation";
import { StaticPageShell } from "../../../src/components/StaticPageShell";

type ArticleDraft = {
  title: string;
  intro: string;
  category: string;
  date: string;
  readingTime: string;
  summary: string;
  sections: Array<{ title: string; text: string }>;
};

const articleDrafts: Record<string, ArticleDraft> = {
  "how-to-build-a-rhythm": {
    title: "Как собрать ритм дня без давления",
    intro: "Черновик статьи для будущего раздела материалов. Здесь уже виден нужный формат: заголовок, мета, короткий лид, блоки текста и боковая колонка с фактами.",
    category: "Статья",
    date: "02.06.2026",
    readingTime: "4 мин",
    summary: "Шаблон страницы под редакционные материалы и заметки.",
    sections: [
      { title: "Вступление", text: "Короткий лид, который задаёт тему и не расползается на полэкрана." },
      { title: "Основной блок", text: "Несколько аккуратных секций с подзаголовками, списками и примерами." },
      { title: "Вывод", text: "Небольшой итог, который можно быстро дочитать на телефоне." }
    ]
  }
};

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articleDrafts[slug];
  if (!article) return notFound();

  return (
    <StaticPageShell
      kicker={article.category}
      title={article.title}
      intro={article.intro}
      aside={(
        <div className="about-note-list">
          <div>
            <b>Дата</b>
            <span>{article.date}</span>
          </div>
          <div>
            <b>Время чтения</b>
            <span>{article.readingTime}</span>
          </div>
          <div>
            <b>Кратко</b>
            <span>{article.summary}</span>
          </div>
        </div>
      )}
    >
      <div className="content-page-sections">
        {article.sections.map((section) => (
          <section key={section.title} className="content-page-section">
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </section>
        ))}
      </div>
    </StaticPageShell>
  );
}
