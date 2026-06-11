import type {
  AppSelectors,
  AppState,
  NotificationItem,
  NotificationPriority,
  NotificationStateEntry,
  NotificationDeliveryStatus,
  NotificationTopic,
  RuntimeKnowledgeContent
} from "../types";
import { formatDate } from "./date";
import { forecastTone, getForecast } from "./forecast";
import { createDefaultRuntimeContent } from "./runtime-content";
import { normalizeLanguage } from "./i18n";

const channelOrder: Array<NotificationItem["channels"][number]> = ["inApp", "browser", "email", "telegram", "push"];

export function buildNotificationFeed(state: AppState, selectors: AppSelectors, content: RuntimeKnowledgeContent = createDefaultRuntimeContent()) {
  const items: NotificationItem[] = [];
  const notifications = state.settings.notifications;
  if (!notifications.enabled) return items;
  const language = normalizeLanguage(state.settings.language);
  const enabledChannels = channelOrder.filter((channel) => notifications.channels[channel]);
  const note = state.notes[state.selectedDate] || {};
  const dueHabits = selectors.activeHabits.filter((habit) => selectors.isDue(habit, state.selectedDate));
  const attention = selectors.getAttentionHabits();
  const pushItem = (item: NotificationItem) => {
    if (notifications.priorityOnly && item.priority === "low") return;
    items.push(item);
  };

  if (notifications.topics.habits) {
    for (const habit of dueHabits) {
      const log = selectors.getLog(habit.id, state.selectedDate);
      const stats = selectors.calculateStats(habit);
      const done = log?.status === "done";
      if (done) continue;
      pushItem(makeItem({
        id: `habit:${habit.id}:${state.selectedDate}`,
        topic: "habits",
        title: habit.title,
        message: language === "en"
          ? `${habit.icon} habit is waiting for a check-in on ${formatDate(state.selectedDate, "short")}`
          : `${habit.icon} привычка ждёт отметку на ${formatDate(state.selectedDate, "short")}`,
        detail: stats.daysSince !== null
          ? language === "en"
            ? `Last streak: ${stats.streak} · without completion: ${stats.daysSince} d.`
            : `Последняя серия: ${stats.streak} · без выполнения: ${stats.daysSince} дн.`
          : language === "en"
            ? "No completion history yet."
            : "Пока нет истории выполнения.",
        targetView: "today",
        targetDate: state.selectedDate,
        actionLabel: language === "en" ? "Open today" : "Открыть сегодня",
        priority: stats.daysSince !== null && habit.warningThreshold <= stats.daysSince ? "high" : "medium",
        channels: enabledChannels,
        icon: habit.icon || "🔔",
        accent: habit.color,
        isDue: true
      }));
    }
  }

  if (notifications.topics.diary && !note.text && (!note.helped && !note.blocked)) {
    pushItem(makeItem({
      id: `diary:${state.selectedDate}`,
      topic: "diary",
      title: language === "en" ? "Short note" : "Короткая заметка",
      message: language === "en"
        ? `Add a note for ${formatDate(state.selectedDate, "short")}.`
        : `Добавьте запись за ${formatDate(state.selectedDate, "short")}.`,
      detail: language === "en"
        ? "This helps preserve the day's context without clutter."
        : "Это поможет сохранить контекст дня без перегруза.",
      targetView: "diary",
      targetDate: state.selectedDate,
      actionLabel: language === "en" ? "Open diary" : "Открыть дневник",
      priority: "medium",
      channels: enabledChannels,
      icon: "📝",
      accent: "#e879f9",
      isDue: false
    }));
  }

  if (notifications.topics.forecast && notifications.enabled && state.settings.forecast.enabled && state.settings.forecast.showInToday) {
    const forecast = getForecast(state.selectedDate, state.settings.forecast, state.profile?.birthDate || "", language, content);
    if (forecast) {
      pushItem(makeItem({
        id: `forecast:${state.selectedDate}`,
        topic: "forecast",
        title: language === "en" ? "Day Forecast" : "Прогноз дня",
        message: `${forecast.summaryScore}% · ${forecast.summaryLabel}`,
        detail: forecast.scales.map((scale) => `${scale.label} ${scale.value}%`).join(" · "),
        targetView: "today",
        targetDate: state.selectedDate,
        actionLabel: language === "en" ? "View biorhythms" : "Посмотреть биоритмы",
        priority: forecastTone(forecast.summaryScore) === "high" ? "high" : forecastTone(forecast.summaryScore) === "low" ? "medium" : "low",
        channels: enabledChannels,
        icon: "🌗",
        accent: "#60a5fa",
        isDue: false
      }));
    }
  }

  if (notifications.topics.analytics && attention.length) {
    pushItem(makeItem({
      id: `analytics:${state.selectedDate}`,
      topic: "analytics",
      title: language === "en" ? "Needs attention" : "Требует внимания",
      message: language === "en"
        ? `${attention.length} habits ask for a gentle look.`
        : `${attention.length} привычек просят мягкий взгляд.`,
      detail: attention.slice(0, 3).map(({ habit }) => habit.title).join(" · "),
      targetView: "today",
      targetDate: state.selectedDate,
      actionLabel: language === "en" ? "Open overview" : "Открыть обзор",
      priority: attention.some(({ stats }) => (stats.daysSince ?? 0) >= 4) ? "high" : "medium",
      channels: enabledChannels,
      icon: "📊",
      accent: "#f59e0b",
      isDue: false
    }));
  }

  if (notifications.topics.reminders && notifications.channels.browser) {
    pushItem(makeItem({
      id: `browser:${state.profile?.id || "guest"}`,
      topic: "reminders",
      title: language === "en" ? "Browser alerts" : "Браузерные оповещения",
      message: language === "en"
        ? "You can enable Web Notifications for quick reminders."
        : "Можно включить Web Notifications для быстрых напоминаний.",
      detail: language === "en"
        ? "Permission is requested only in the browser and can be turned off at any time."
        : "Разрешение запрашивается только в браузере и может быть отключено в любой момент.",
      targetView: "notifications",
      actionLabel: language === "en" ? "Check browser" : "Проверить браузер",
      priority: "low",
      channels: enabledChannels,
      icon: "🔔",
      accent: "#22c55e",
      isDue: false
    }));
  }

  return items.sort((a, b) => {
    const priorityRank: Record<NotificationPriority, number> = { high: 0, medium: 1, low: 2 };
    return priorityRank[a.priority] - priorityRank[b.priority] || a.title.localeCompare(b.title);
  });
}

export function resolveNotificationState(state: AppState, item: NotificationItem): NotificationStateEntry {
  return state.notificationStates[item.id] || { status: "new", updatedAt: new Date().toISOString() };
}

export function notificationStatusLabel(status: NotificationDeliveryStatus, language: "ru" | "en" = "ru") {
  switch (status) {
    case "new":
      return language === "en" ? "New" : "Новое";
    case "read":
      return language === "en" ? "Read" : "Прочитано";
    case "hidden":
      return language === "en" ? "Hidden" : "Скрыто";
    case "snoozed":
      return language === "en" ? "Snoozed" : "Отложено";
  }
}

export function notificationTopicLabel(topic: NotificationTopic, language: "ru" | "en" = "ru") {
  switch (topic) {
    case "habits":
      return language === "en" ? "Habits" : "Привычки";
    case "diary":
      return language === "en" ? "Diary" : "Дневник";
    case "forecast":
      return language === "en" ? "Biorhythms" : "Биоритмы";
    case "transit":
      return language === "en" ? "Transit" : "Транзит";
    case "analytics":
      return language === "en" ? "Analytics" : "Аналитика";
    case "reminders":
      return language === "en" ? "Alerts" : "Оповещения";
  }
}

export function notificationTone(priority: NotificationPriority) {
  return priority === "high" ? "warn" : priority === "medium" ? "steady" : "low";
}

function makeItem(item: NotificationItem) {
  return item;
}
