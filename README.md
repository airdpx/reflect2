# Дневник привычек / календарь самонаблюдения

Next.js + TypeScript версия MVP трекера привычек.

Сейчас проект уже умеет авторизацию и регистрацию через собственную PostgreSQL-базу, а дата рождения пользователя хранится в профиле аккаунта и используется для прогноза дня.

## Что реализовано

- Экран “Сегодня” с группами привычек.
- Календарная сетка с периодами 7 / 14 / 30 / 90 дней, неделя, месяц, диапазон.
- Дневник самонаблюдения: настроение, энергия, стресс, заметки.
- Базовая аналитика: streak, best streak, completion rate, сигналы внимания.
- Настройки статусов, блоков, плотности, темы интерфейса и темы сетки.
- Тёмная минималистичная тема по умолчанию.
- Локальное хранение через `localStorage` как кеш текущего аккаунта и для мягкой миграции старых данных.
- Авторизация, регистрация, вход, выход и сброс пароля.
- Профиль пользователя с обязательной датой рождения.
- Server-side state в собственной PostgreSQL базе через Prisma.

## Запуск

В обычном окружении с системным package manager:

```bash
npm install
npx prisma db push
npm run dev
```

В этой Codex-сессии `npm` установлен локально в проект:

```bash
PATH="$PWD/.tools/bin:$PATH" node .tools/npm/package/bin/npm-cli.js run dev
PATH="$PWD/.tools/bin:$PATH" node .tools/npm/package/bin/npm-cli.js run build
PATH="$PWD/.tools/bin:$PATH" node .tools/npm/package/bin/npm-cli.js run wipe:auth
```

Затем открыть:

```text
http://localhost:3000
```

## Основная структура

- `app/page.tsx` — тонкая точка входа Next.js.
- `src/HabitCalendarApp.tsx` — состояние приложения, actions и selectors.
- `src/types.ts` — типы домена.
- `src/lib/` — даты, аналитика, defaults, forecast и localStorage.
- `src/server/` — auth, password hashing и Prisma client.
- `src/components/` — общие UI-компоненты, модалки, навигация, карточки.
- `src/views/` — экраны Сегодня, Сетка, Дневник, Аналитика, Настройки.
- `app/globals.css` — подключение текущей дизайн-системы.
- `styles.css` — основная CSS-база, перенесённая из статического прототипа.
- `package.json` — зависимости Next.js, React и TypeScript.
- `prisma/schema.prisma` — схема PostgreSQL для пользователей, сессий и состояния аккаунта.

## Переменные окружения

- `DATABASE_URL` — строка подключения к вашей PostgreSQL базе.
