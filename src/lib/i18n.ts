import type { Language, View } from "../types";

export const languageOptions: Array<{ id: Language; label: string; title: string }> = [
  { id: "ru", label: "RU", title: "Русский" },
  { id: "en", label: "EN", title: "English" }
];

export const viewText: Record<Language, Record<View, { label: string; title: string; subtitle: string }>> = {
  ru: {
    today: { label: "Сегодня", title: "Сегодня", subtitle: "Календарь для ежедневного ритма" },
    grid: { label: "Календарь", title: "Календарь", subtitle: "Периоды, режимы сетки и мягкие статусы" },
    habits: { label: "Привычки", title: "Привычки", subtitle: "Шаблоны, категории, иконки и расписание" },
    diary: { label: "Дневник", title: "Дневник", subtitle: "Настроение, энергия и заметки за день" },
    notifications: { label: "Оповещения", title: "Оповещения", subtitle: "Интерфейсные и внешние каналы доставки" },
    analytics: { label: "Аналитика", title: "Аналитика", subtitle: "История выполнения и мягкие сигналы" },
    settings: { label: "Настройки", title: "Настройки", subtitle: "Профиль, статусы, прогноз и видимость блоков" },
    management: { label: "Управление", title: "Управление", subtitle: "Пользователи, экспорт и глобальные настройки" }
  },
  en: {
    today: { label: "Today", title: "Today", subtitle: "A calendar for your daily rhythm" },
    grid: { label: "Calendar", title: "Calendar", subtitle: "Periods, grid modes and soft statuses" },
    habits: { label: "Habits", title: "Habits", subtitle: "Templates, categories, icons and schedule" },
    diary: { label: "Diary", title: "Diary", subtitle: "Mood, energy and notes for the day" },
    notifications: { label: "Alerts", title: "Alerts", subtitle: "In-app and external delivery channels" },
    analytics: { label: "Analytics", title: "Analytics", subtitle: "Completion history and soft signals" },
    settings: { label: "Settings", title: "Settings", subtitle: "Profile, statuses, forecast and visible blocks" },
    management: { label: "Admin", title: "Admin", subtitle: "Users, export and global settings" }
  }
};

export const commonText = {
  ru: {
    brand: "Дневник привычек",
    brandSubtitle: "Самонаблюдение онлайн.",
    addHabit: "+ Привычка",
    theme: "Тема",
    language: "Язык",
    signOut: "Выйти из аккаунта",
    footerAbout: "О проекте",
    footerContacts: "Контакты",
    copyright: "© Practway 2026"
  },
  en: {
    brand: "Habit Diary",
    brandSubtitle: "Self-observation online.",
    addHabit: "+ Habit",
    theme: "Theme",
    language: "Language",
    signOut: "Sign out",
    footerAbout: "About",
    footerContacts: "Contacts",
    copyright: "© Practway 2026"
  }
} satisfies Record<Language, Record<string, string>>;

export const authText = {
  ru: {
    online: "Самонаблюдение онлайн",
    heroTitlePrefix: "Привычки, дневник и",
    heroTitleAccent1: "календарь",
    heroTitleMiddle: "для ежедневного",
    heroTitleAccent2: "ритма",
    heroIntro: "Ведите календарь привычек, фиксируйте состояние дня и анализируйте динамику личного ритма на основе данных, прогнозов и ежедневных наблюдений.",
    login: "Вход",
    register: "Регистрация",
    reset: "Сброс пароля",
    loginSubtitle: "Войдите по email или по логину admin.",
    resetSubtitle: "Сначала запросите ссылку, затем задайте новый пароль.",
    name: "Имя",
    namePlaceholder: "Введите ваше имя",
    birthDate: "Дата рождения",
    email: "Email",
    emailOrLogin: "Email или логин",
    emailPlaceholder: "Введите email",
    loginPlaceholder: "Введите email или логин",
    password: "Пароль",
    passwordPlaceholder: "Придумайте пароль",
    createAccount: "Создать аккаунт",
    signIn: "Войти",
    changePassword: "Сменить пароль",
    requestReset: "Запросить сброс",
    hasAccount: "Уже есть аккаунт?",
    noAccount: "Нет аккаунта?",
    create: "Создать",
    features: {
      calendar: ["Календарь", "Периоды, статусы, таблица и быстрые отметки"],
      diary: ["Дневник", "Настроение, энергия, стресс и история по дням"],
      analytics: ["Аналитика", "Анализ привычек и состояния, визуальные отчёты и тренды"],
      forecast: ["Прогнозы", "Сопоставляйте данные с прогнозами и наблюдениями"]
    },
    benefits: ["Конфиденциальность", "Быстро и удобно", "Без лишнего"]
  },
  en: {
    online: "Self-observation online",
    heroTitlePrefix: "Habits, diary and",
    heroTitleAccent1: "calendar",
    heroTitleMiddle: "for your daily",
    heroTitleAccent2: "rhythm",
    heroIntro: "Keep a habit calendar, capture your daily state and analyze your personal rhythm through data, forecasts and daily observations.",
    login: "Sign in",
    register: "Registration",
    reset: "Password reset",
    loginSubtitle: "Sign in with email or the admin login.",
    resetSubtitle: "Request a link first, then set a new password.",
    name: "Name",
    namePlaceholder: "Enter your name",
    birthDate: "Birth date",
    email: "Email",
    emailOrLogin: "Email or login",
    emailPlaceholder: "Enter email",
    loginPlaceholder: "Enter email or login",
    password: "Password",
    passwordPlaceholder: "Create a password",
    createAccount: "Create account",
    signIn: "Sign in",
    changePassword: "Change password",
    requestReset: "Request reset",
    hasAccount: "Already have an account?",
    noAccount: "No account?",
    create: "Create",
    features: {
      calendar: ["Calendar", "Periods, statuses, table and fast check-ins"],
      diary: ["Diary", "Mood, energy, stress and daily history"],
      analytics: ["Analytics", "Habit and state analysis, visual reports and trends"],
      forecast: ["Forecasts", "Compare your data with forecasts and observations"]
    },
    benefits: ["Privacy", "Fast and convenient", "No clutter"]
  }
} satisfies Record<Language, any>;

export function normalizeLanguage(language?: string): Language {
  return language === "en" ? "en" : "ru";
}
