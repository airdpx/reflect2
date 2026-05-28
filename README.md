# Дневник привычек / календарь самонаблюдения

Next.js + TypeScript версия MVP трекера привычек.

## Что реализовано

- Экран “Сегодня” с группами привычек.
- Календарная сетка с периодами 7 / 14 / 30 / 90 дней, неделя, месяц, диапазон.
- Дневник самонаблюдения: настроение, энергия, стресс, заметки.
- Базовая аналитика: streak, best streak, completion rate, сигналы внимания.
- Настройки статусов, блоков, плотности, темы интерфейса и темы сетки.
- Тёмная минималистичная тема по умолчанию.
- Локальное хранение через `localStorage`.

## Запуск

В обычном окружении с системным package manager:

```bash
npm install
npm run dev
```

В этой Codex-сессии `npm` установлен локально в проект:

```bash
PATH="$PWD/.tools/bin:$PATH" .tools/bin/npm run dev
PATH="$PWD/.tools/bin:$PATH" .tools/bin/npm run build
```

Затем открыть:

```text
http://localhost:3000
```

## Основная структура

- `app/page.tsx` — тонкая точка входа Next.js.
- `src/HabitCalendarApp.tsx` — состояние приложения, actions и selectors.
- `src/types.ts` — типы домена.
- `src/lib/` — даты, аналитика, defaults и localStorage.
- `src/components/` — общие UI-компоненты, модалки, навигация, карточки.
- `src/views/` — экраны Сегодня, Сетка, Дневник, Аналитика, Настройки.
- `app/globals.css` — подключение текущей дизайн-системы.
- `styles.css` — основная CSS-база, перенесённая из статического прототипа.
- `package.json` — зависимости Next.js, React и TypeScript.
