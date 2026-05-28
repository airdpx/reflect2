const STORAGE_KEY = "habit-calendar-mvp-v1";
let bulkUndo = null;

// State and defaults
const statusMeta = {
  done: { label: "Выполнено", short: "✓", className: "status-done" },
  partial: { label: "Частично", short: "◐", className: "status-partial" },
  skipped: { label: "Пропуск", short: "–", className: "status-skipped" },
  missed: { label: "Не выполнено", short: "×", className: "status-missed" },
  planned: { label: "Запланировано", short: "·", className: "status-planned" },
};

const defaults = {
  view: "today",
  selectedDate: todayKey(),
  habits: [
    {
      id: crypto.randomUUID(),
      title: "Прогулка",
      description: "Спокойное движение без давления",
      color: "#557b66",
      icon: "🌿",
      category: "Здоровье",
      type: "boolean",
      target: 1,
      schedule: [1, 2, 3, 4, 5, 6, 0],
      archived: false,
      warningThreshold: 4,
      createdAt: todayKey(),
    },
    {
      id: crypto.randomUUID(),
      title: "Дневник состояния",
      description: "Короткая заметка о дне",
      color: "#8b6f9f",
      icon: "✎",
      category: "Самонаблюдение",
      type: "reflection",
      target: 1,
      schedule: [1, 2, 3, 4, 5, 6, 0],
      archived: false,
      warningThreshold: 3,
      createdAt: todayKey(),
    },
    {
      id: crypto.randomUUID(),
      title: "Вода",
      description: "Несколько отметок в течение дня",
      color: "#52768d",
      icon: "◌",
      category: "Быт",
      type: "multiple",
      target: 5,
      schedule: [1, 2, 3, 4, 5, 6, 0],
      archived: false,
      warningThreshold: 2,
      createdAt: todayKey(),
    },
  ],
  logs: {},
  notes: {},
  settings: {
    preset: "Balanced",
    activeStatuses: ["done", "partial", "skipped"],
    defaultPeriod: { mode: "last", days: 30, start: todayKey(), end: todayKey() },
    visibleBlocks: {
      today: true,
      attention: true,
      diary: true,
      mood: true,
      energy: true,
      stress: true,
      analytics: true,
      streak: true,
      completion: true,
      lastDone: true,
    },
    visibleGrid: {
      color: true,
      icon: true,
      category: true,
      streak: true,
      completion: false,
      daysSince: true,
      noteMarker: true,
      moodMarker: true,
    },
    density: "standard",
    interfaceTheme: "light",
    gridTheme: "soft",
    focusMode: false,
    rightPanel: true,
    showWeekends: true,
    gridClickAction: "details",
    defaultView: "today",
    mobileGridDays: 14,
    customPresets: {},
  },
};

let state = loadState();
let editingHabitId = null;
let activeCell = null;

const app = document.querySelector("#app");

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaults);
    return mergeDeep(structuredClone(defaults), JSON.parse(raw));
  } catch {
    return structuredClone(defaults);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function mergeDeep(base, patch) {
  for (const key of Object.keys(patch || {})) {
    if (patch[key] && typeof patch[key] === "object" && !Array.isArray(patch[key])) {
      base[key] = mergeDeep(base[key] || {}, patch[key]);
    } else {
      base[key] = patch[key];
    }
  }
  return base;
}

// Date helpers
function todayKey() {
  return toKey(new Date());
}

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatDate(key, mode = "long") {
  const date = fromKey(key);
  return date.toLocaleDateString("ru-RU", mode === "short" ? { day: "2-digit", month: "2-digit" } : {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
}

function weekdayShort(key) {
  return fromKey(key).toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", "");
}

function habitLogKey(habitId, dateKey) {
  return `${habitId}:${dateKey}`;
}

function getLog(habitId, dateKey) {
  return state.logs[habitLogKey(habitId, dateKey)] || null;
}

function setLog(habitId, dateKey, patch) {
  const key = habitLogKey(habitId, dateKey);
  const current = state.logs[key] || { habitId, date: dateKey };
  state.logs[key] = { ...current, ...patch, updatedAt: new Date().toISOString() };
  saveState();
  render();
}

function isDue(habit, dateKey) {
  return habit.schedule.includes(fromKey(dateKey).getDay());
}

function activeHabits() {
  return state.habits.filter((habit) => !habit.archived);
}

function getPeriodDates() {
  const p = state.settings.defaultPeriod;
  const today = fromKey(todayKey());
  const visibleDates = (dates) => state.settings.showWeekends ? dates : dates.filter((date) => {
    const day = fromKey(date).getDay();
    return day !== 0 && day !== 6;
  });
  if (p.mode === "week") {
    const day = today.getDay() || 7;
    const start = addDays(today, 1 - day);
    return visibleDates(rangeDates(toKey(start), toKey(addDays(start, 6))));
  }
  if (p.mode === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return visibleDates(rangeDates(toKey(start), toKey(end)));
  }
  if (p.mode === "custom") return visibleDates(rangeDates(p.start, p.end));
  const days = Number(p.days || 30);
  return visibleDates(Array.from({ length: days }, (_, i) => toKey(addDays(today, i - days + 1))));
}

function getGridDates() {
  const dates = getPeriodDates();
  const isMobile = window.matchMedia?.("(max-width: 719px)").matches;
  return isMobile ? dates.slice(-Number(state.settings.mobileGridDays || 14)) : dates;
}

function rangeDates(startKey, endKey) {
  const start = fromKey(startKey);
  const end = fromKey(endKey);
  const dates = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    dates.push(toKey(d));
    if (dates.length > 370) break;
  }
  return dates;
}

// Analytics helpers
function calculateHabitStats(habit, dates = getPeriodDates()) {
  const dueDates = dates.filter((date) => isDue(habit, date));
  const doneDates = dueDates.filter((date) => isSuccessfulLog(habit, getLog(habit.id, date)));
  const partialDates = dueDates.filter((date) => getLog(habit.id, date)?.status === "partial");
  const lastDone = [...dueDates].reverse().find((date) => isSuccessfulLog(habit, getLog(habit.id, date)));
  const completion = dueDates.length ? Math.round(((doneDates.length + partialDates.length * 0.5) / dueDates.length) * 100) : 0;
  const streak = getStreak(habit);
  const bestStreak = getBestStreak(habit, rangeDates(toKey(addDays(fromKey(todayKey()), -180)), todayKey()));
  const daysSince = lastDone ? Math.max(0, Math.floor((fromKey(todayKey()) - fromKey(lastDone)) / 86400000)) : null;
  const missedPlanned = dueDates.filter((date) => date < todayKey() && !getLog(habit.id, date)).length;
  return { due: dueDates.length, done: doneDates.length, completion, streak, bestStreak, lastDone, daysSince, missedPlanned };
}

function getStreak(habit) {
  let streak = 0;
  for (let d = fromKey(todayKey()); streak < 370; d = addDays(d, -1)) {
    const key = toKey(d);
    if (!isDue(habit, key)) continue;
    if (isSuccessfulLog(habit, getLog(habit.id, key))) streak += 1;
    else break;
  }
  return streak;
}

function getBestStreak(habit, dates) {
  let best = 0;
  let current = 0;
  for (const date of dates) {
    if (!isDue(habit, date)) continue;
    if (isSuccessfulLog(habit, getLog(habit.id, date))) current += 1;
    else current = 0;
    best = Math.max(best, current);
  }
  return best;
}

function isSuccessfulLog(habit, log) {
  if (!log) return false;
  if (habit.type === "avoid") return log.status === "done" || log.status === "skipped";
  if (habit.type === "numeric") return Number(log.value || 0) >= habit.target || log.status === "done";
  if (habit.type === "multiple") return Number(log.completedCount || 0) >= habit.target || log.status === "done";
  if (habit.type === "reflection") return Boolean(log.note) || log.status === "done";
  return log.status === "done";
}

function attentionHabits() {
  return activeHabits()
    .map((habit) => ({ habit, stats: calculateHabitStats(habit) }))
    .filter(({ habit, stats }) => (stats.daysSince ?? 999) >= habit.warningThreshold || stats.missedPlanned >= habit.warningThreshold)
    .slice(0, 5);
}

// Rendering
function render() {
  const s = state.settings;
  app.className = `app density-${s.density} theme-${s.interfaceTheme} ${s.focusMode ? "focus" : ""}`;
  app.innerHTML = `
    ${renderSidebar()}
    <main class="main">
      ${renderTopbar()}
      ${renderView()}
    </main>
    ${s.rightPanel ? renderInspector() : ""}
    ${renderMobileNav()}
    ${renderHabitModal()}
    ${renderCellSheet()}
  `;
  bindEvents();
}

function renderSidebar() {
  return `
    <aside class="sidebar">
      <div class="brand">
        <h1>Дневник привычек</h1>
        <p>Календарь самонаблюдения без давления и лишнего шума.</p>
      </div>
      ${renderNav("nav")}
    </aside>
  `;
}

function renderNav(className) {
  const items = [
    ["today", "Сегодня", "☼"],
    ["grid", "Сетка", "▦"],
    ["diary", "Дневник", "✎"],
    ["analytics", "Аналитика", "⌁"],
    ["settings", "Настройки", "⚙"],
  ];
  return `<nav class="${className}">${items.map(([id, label, icon]) => `
    <button data-view="${id}" class="${state.view === id ? "active" : ""}" title="${label}">
      <b>${icon}</b><span>${label}</span>
    </button>`).join("")}</nav>`;
}

function renderMobileNav() {
  return renderNav("mobile-nav");
}

function renderTopbar() {
  const titles = {
    today: ["Сегодня", formatDate(state.selectedDate)],
    grid: ["Календарная сетка", periodLabel()],
    diary: ["Дневник", "Настроение, энергия и заметки за день"],
    analytics: ["Аналитика", "Мягкая история регулярности"],
    settings: ["Настройки", "Статусы, периоды, темы и видимость блоков"],
  };
  const [title, subtitle] = titles[state.view];
  return `
    <header class="topbar">
      <div>
        <h2>${title}</h2>
        <p>${subtitle}</p>
      </div>
      <div class="toolbar">
        <input class="input" style="width: 154px" type="date" value="${state.selectedDate}" data-selected-date />
        <button class="btn primary" data-add-habit>+ Привычка</button>
      </div>
    </header>
  `;
}

function renderView() {
  if (state.view === "grid") return renderGridView();
  if (state.view === "diary") return renderDiaryView();
  if (state.view === "analytics") return renderAnalyticsView();
  if (state.view === "settings") return renderSettingsView();
  return renderTodayView();
}

function renderTodayView() {
  const habits = activeHabits().filter((habit) => isDue(habit, state.selectedDate));
  const attention = attentionHabits();
  const attentionIds = new Set(attention.map(({ habit }) => habit.id));
  const completed = habits.filter((habit) => getLog(habit.id, state.selectedDate)?.status === "done");
  const open = habits.filter((habit) => getLog(habit.id, state.selectedDate)?.status !== "done" && !attentionIds.has(habit.id));
  const dueAttention = habits.filter((habit) => attentionIds.has(habit.id) && getLog(habit.id, state.selectedDate)?.status !== "done");
  return `
    <div class="grid-two">
      <section class="stack">
        ${state.settings.visibleBlocks.today ? `
          <div class="panel">
            <div class="section-head">
              <div>
                <h3>Привычки на день</h3>
                <p class="muted">Быстрая отметка без лишних шагов.</p>
              </div>
              <div class="section-actions">
                <span class="badge">${completed.length}/${habits.length} завершено</span>
                <button class="btn ghost" data-mark-all-done>✓ Всё</button>
                <button class="btn ghost" data-clear-day>Очистить</button>
                <button class="btn ghost" data-undo-bulk>↶ Undo</button>
              </div>
            </div>
            ${habits.length ? `
              ${renderHabitGroup("Сегодня", open)}
              ${renderHabitGroup("Требует внимания", dueAttention, "attention")}
              ${renderHabitGroup("Завершено", completed, "done")}
            ` : `<div class="empty">На этот день ничего не запланировано. Можно добавить привычку или выбрать другую дату.</div>`}
          </div>` : ""}
        ${state.settings.visibleBlocks.diary ? renderDiaryPanel(state.selectedDate) : ""}
      </section>
      <section class="stack">
        ${state.settings.visibleBlocks.attention ? `
          <div class="panel">
            <h3>Требует внимания</h3>
            ${attention.length ? attention.map(({ habit, stats }) => `
              <div class="settings-row">
                <span><b>${habit.icon} ${habit.title}</b><br><small class="muted">${stats.daysSince ?? "ещё нет"} дней без выполнения · ${stats.completion}% за период</small></span>
                <span class="badge">${habit.warningThreshold}+ дней</span>
              </div>`).join("") : `<div class="empty">Пока нет мягких сигналов. Хороший спокойный старт.</div>`}
          </div>` : ""}
        ${state.settings.visibleBlocks.analytics ? renderStatsPanel() : ""}
      </section>
    </div>
  `;
}

function renderHabitGroup(title, habits, tone = "") {
  if (!habits.length) return "";
  return `
    <div class="habit-group ${tone}">
      <div class="habit-group-title">${title}<span>${habits.length}</span></div>
      <div class="habit-list">${habits.map(renderHabitCard).join("")}</div>
    </div>
  `;
}

function renderHabitCard(habit) {
  const log = getLog(habit.id, state.selectedDate);
  const stats = calculateHabitStats(habit);
  const statusLabel = log?.status ? statusMeta[log.status]?.label : "нет отметки";
  const needsAttention = (stats.daysSince ?? 999) >= habit.warningThreshold || stats.missedPlanned >= habit.warningThreshold;
  const statusButtons = state.settings.activeStatuses.map((status) => `
    <button class="status-btn ${statusMeta[status].className} ${log?.status === status ? "active" : ""}" data-set-status="${status}" data-habit-id="${habit.id}" title="${statusMeta[status].label}">
      ${statusMeta[status].short}
    </button>`).join("");
  return `
    <article class="habit-card">
      <i class="habit-dot" style="background:${habit.color}"></i>
      <div>
        <div class="habit-title">
          ${state.settings.visibleGrid.icon ? `<span>${habit.icon}</span>` : ""}
          <strong>${escapeHtml(habit.title)}</strong>
          ${state.settings.visibleGrid.category && habit.category ? `<span class="badge">${escapeHtml(habit.category)}</span>` : ""}
        </div>
        <div class="habit-meta">
          <span>${habitTypeLabel(habit.type)}</span>
          <span>${statusLabel}</span>
          ${state.settings.visibleGrid.streak ? `<span>streak ${stats.streak}</span>` : ""}
          ${state.settings.visibleGrid.daysSince ? `<span>${stats.daysSince ?? "нет"} дней с выполнения</span>` : ""}
          ${needsAttention ? `<span class="signal">внимание</span>` : ""}
        </div>
      </div>
      <div class="quick-actions">
        ${statusButtons}
        <button class="status-btn" data-cell-open="${habit.id}" data-cell-date="${state.selectedDate}" title="Детали">⋯</button>
        <button class="status-btn" data-edit-habit-card="${habit.id}" title="Редактировать">⚙</button>
      </div>
    </article>
  `;
}

function renderDiaryPanel(dateKey) {
  const note = state.notes[dateKey] || {};
  return `
    <div class="panel">
      <h3>Дневник дня</h3>
      <div class="stack">
        <div class="form-grid">
          ${renderRange("mood", "Настроение", note.mood ?? 3)}
          ${renderRange("energy", "Энергия", note.energy ?? 3)}
          ${renderRange("stress", "Стресс", note.stress ?? 3)}
        </div>
        <div class="field">
          <label>Короткая заметка</label>
          <textarea class="textarea" data-note-field="text">${escapeHtml(note.text || "")}</textarea>
        </div>
        <div class="form-grid">
          <div class="field">
            <label>Что помогло</label>
            <textarea class="textarea" data-note-field="helped">${escapeHtml(note.helped || "")}</textarea>
          </div>
          <div class="field">
            <label>Что мешало</label>
            <textarea class="textarea" data-note-field="blocked">${escapeHtml(note.blocked || "")}</textarea>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderRange(key, label, value) {
  if (!state.settings.visibleBlocks[key]) return "";
  return `
    <div class="field">
      <label>${label}: <b>${value}</b></label>
      <input type="range" min="1" max="5" value="${value}" data-note-field="${key}" />
    </div>
  `;
}

function renderGridView() {
  const p = state.settings.defaultPeriod;
  return `
    <section class="stack">
      <div class="panel period-panel">
        <div class="section-head">
          <div>
            <h3>Период сетки</h3>
            <p class="muted">${periodLabel()} · ${getPeriodDates().length} дней</p>
          </div>
        </div>
        <div class="period-layout">
          <div class="chips">
            ${[7, 14, 30, 90].map((days) => `<button class="chip ${p.mode === "last" && Number(p.days) === days ? "active" : ""}" data-period-days="${days}">${days} дней</button>`).join("")}
            <button class="chip ${state.settings.defaultPeriod.mode === "week" ? "active" : ""}" data-period-mode="week">Неделя</button>
            <button class="chip ${state.settings.defaultPeriod.mode === "month" ? "active" : ""}" data-period-mode="month">Месяц</button>
          </div>
          <div class="period-custom">
            <label>Последние дни</label>
            <input class="input" type="number" min="1" max="365" value="${state.settings.defaultPeriod.days}" data-period-custom-days />
            <button class="btn" data-apply-custom-days>Последние N</button>
          </div>
          <div class="period-range">
            <label>Диапазон</label>
            <input class="input" type="date" value="${state.settings.defaultPeriod.start}" data-custom-start />
            <input class="input" type="date" value="${state.settings.defaultPeriod.end}" data-custom-end />
          <button class="btn" data-apply-range>Диапазон</button>
          </div>
        </div>
      </div>
      ${renderCalendarGrid()}
    </section>
  `;
}

function renderCalendarGrid() {
  const dates = getGridDates();
  const habits = activeHabits();
  const theme = state.settings.gridTheme;
  if (!habits.length) {
    return `<div class="empty">Сетка появится после добавления первой привычки.</div>`;
  }
  if (!dates.length) {
    return `<div class="empty">В выбранном периоде нет дат. Проверьте диапазон.</div>`;
  }
  return `
    <div>
      <div class="calendar-wrap">
        <div class="calendar-grid" style="--days:${dates.length}">
          <div class="grid-head">Привычка</div>
          ${dates.map((date) => `<div class="grid-head ${date === todayKey() ? "today" : ""}"><span>${weekdayShort(date)}</span><b>${formatDate(date, "short")}</b></div>`).join("")}
          ${habits.map((habit) => `
            <div class="grid-name">
              ${state.settings.visibleGrid.color ? `<i class="habit-dot" style="height:20px;background:${habit.color}"></i>` : ""}
              <div class="grid-habit-text">
                <strong>${state.settings.visibleGrid.icon ? habit.icon : ""} ${escapeHtml(habit.title)}</strong>
                <span>${gridHabitMeta(habit)}</span>
              </div>
            </div>
            ${dates.map((date) => renderGridCell(habit, date, theme)).join("")}
          `).join("")}
        </div>
      </div>
      <div class="legend">
        ${state.settings.activeStatuses.map((status) => `<span><i class="${statusMeta[status].className}"></i>${statusMeta[status].label}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderGridCell(habit, date, theme) {
  const log = getLog(habit.id, date);
  const status = log?.status || (isDue(habit, date) ? "planned" : "");
  const visibleStatus = state.settings.activeStatuses.includes(status) || status === "planned";
  const className = visibleStatus && statusMeta[status] ? statusMeta[status].className : "";
  const todayClass = date === todayKey() ? "today" : "";
  return `
    <div class="grid-cell ${todayClass} ${["classic", "journal", "minimal"].includes(theme) ? theme : ""}">
      <button class="${className}" data-cell-open="${habit.id}" data-cell-date="${date}" data-cell-mode="grid" title="${habit.title} · ${formatDate(date)} · ${state.settings.gridClickAction === "cycle" ? "быстрая смена статуса" : "детали"}">
        ${theme === "classic" && status === "done" ? "✓" : ""}
        ${state.settings.visibleGrid.noteMarker && log?.note ? `<i class="marker-note"></i>` : ""}
        ${state.settings.visibleGrid.moodMarker && (log?.mood || state.notes[date]?.mood) ? `<i class="marker-mood"></i>` : ""}
      </button>
    </div>
  `;
}

function gridHabitMeta(habit) {
  const stats = calculateHabitStats(habit);
  const parts = [];
  if (state.settings.visibleGrid.category && habit.category) parts.push(escapeHtml(habit.category));
  if (state.settings.visibleGrid.streak) parts.push(`streak ${stats.streak}`);
  if (state.settings.visibleGrid.completion) parts.push(`${stats.completion}%`);
  if (state.settings.visibleGrid.daysSince) parts.push(`${stats.daysSince ?? "нет"} дн.`);
  return parts.join(" · ");
}

function renderDiaryView() {
  return `<section class="stack">${renderDiaryPanel(state.selectedDate)}</section>`;
}

function renderAnalyticsView() {
  const rows = activeHabits().map((habit) => ({ habit, stats: calculateHabitStats(habit) }));
  return `
    <section class="stack">
      ${renderStatsPanel()}
      <div class="panel">
        <h3>История привычек</h3>
        ${rows.map(({ habit, stats }) => `
          <div class="settings-row">
            <span><b>${habit.icon} ${escapeHtml(habit.title)}</b><br><small class="muted">Лучший streak ${stats.bestStreak} · пропущено плановых ${stats.missedPlanned}</small></span>
            <span class="badge">${stats.completion}%</span>
          </div>`).join("")}
      </div>
    </section>
  `;
}

function renderStatsPanel() {
  const rows = activeHabits().map((habit) => calculateHabitStats(habit));
  const avg = rows.length ? Math.round(rows.reduce((sum, item) => sum + item.completion, 0) / rows.length) : 0;
  const streak = rows.reduce((max, item) => Math.max(max, item.streak), 0);
  const best = rows.reduce((max, item) => Math.max(max, item.bestStreak), 0);
  const attention = attentionHabits().length;
  return `
    <div class="panel">
      <h3>Краткая аналитика</h3>
      <div class="stats">
        <div class="stat"><strong>${avg}%</strong><span>выполнение</span></div>
        <div class="stat"><strong>${streak}</strong><span>текущий streak</span></div>
        <div class="stat"><strong>${best}</strong><span>лучший streak</span></div>
        <div class="stat"><strong>${attention}</strong><span>сигналы</span></div>
      </div>
    </div>
  `;
}

function renderSettingsView() {
  const s = state.settings;
  const blockLabels = {
    today: "Сегодня",
    attention: "Требует внимания",
    diary: "Дневник",
    mood: "Настроение",
    energy: "Энергия",
    stress: "Стресс",
    analytics: "Аналитика",
    streak: "Streak",
    completion: "Процент выполнения",
    lastDone: "Последнее выполнение",
  };
  const gridLabels = {
    color: "Цвет",
    icon: "Иконка",
    category: "Категория",
    streak: "Streak",
    completion: "Completion rate",
    daysSince: "Дней с выполнения",
    noteMarker: "Маркер заметки",
    moodMarker: "Маркер настроения",
  };
  return `
    <section class="grid-two">
      <div class="stack">
        <div class="panel settings-card">
          <div class="section-head">
            <div>
              <h3>Вид</h3>
              <p class="muted">Пресеты меняют только отображение, данные остаются на месте.</p>
            </div>
          </div>
          <div class="form-grid">
            ${renderSelect("preset", "Display preset", ["Simple", "Balanced", "Journal", "Analytical", "Focus"], s.preset)}
            ${renderSelect("density", "Плотность", ["compact", "standard", "comfortable"], s.density)}
            ${renderSelect("interfaceTheme", "Тема интерфейса", ["light", "blue", "dark", "warm", "sage"], s.interfaceTheme)}
            ${renderSelect("gridTheme", "Тема сетки", ["soft", "classic", "journal", "minimal"], s.gridTheme)}
            ${renderSelect("gridClickAction", "Клик по ячейке", ["details", "cycle"], s.gridClickAction)}
            ${renderSelect("defaultView", "Стартовый экран", ["today", "grid", "diary", "analytics", "settings"], s.defaultView)}
            ${renderSelect("mobileGridDays", "Дней сетки на мобильном", ["7", "14", "30"], String(s.mobileGridDays))}
          </div>
          <div class="check-row"><span>Focus mode</span><input type="checkbox" ${s.focusMode ? "checked" : ""} data-setting-check="focusMode" /></div>
          <div class="check-row"><span>Правая панель на ПК</span><input type="checkbox" ${s.rightPanel ? "checked" : ""} data-setting-check="rightPanel" /></div>
          <div class="check-row"><span>Показывать выходные в сетке</span><input type="checkbox" ${s.showWeekends ? "checked" : ""} data-setting-check="showWeekends" /></div>
        </div>
        <div class="panel settings-card">
          <h3>Превью тем</h3>
          <div class="theme-preview-grid">
            ${[
              ["dark", "Dark Calm", "вечерний спокойный режим"],
              ["light", "Light Neutral", "чистый базовый вид"],
              ["warm", "Warm Journal", "мягкий дневниковый тон"],
              ["sage", "Sage Natural", "природный спокойный тон"],
              ["blue", "Calm Blue", "нейтральный digital"]
            ].map(([theme, title, text]) => `
              <button class="theme-preview theme-preview-${theme} ${s.interfaceTheme === theme ? "active" : ""}" data-theme-preview="${theme}">
                <span class="theme-preview-swatches"><i></i><i></i><i></i></span>
                <b>${title}</b>
                <small>${text}</small>
              </button>`).join("")}
          </div>
          <div class="theme-preview-grid grid-theme-previews">
            ${[
              ["soft", "Soft Grid"],
              ["classic", "Classic Check"],
              ["journal", "Journal Mood"],
              ["minimal", "Minimal Mono"]
            ].map(([theme, title]) => `
              <button class="grid-theme-preview ${s.gridTheme === theme ? "active" : ""}" data-grid-theme-preview="${theme}">
                <b>${title}</b>
                <span><i></i><i></i><i></i><i></i><i></i></span>
              </button>`).join("")}
          </div>
        </div>
        <div class="panel settings-card">
          <h3>Мои пресеты</h3>
          <p class="muted">Сохраняет текущие статусы, темы, плотность, блоки и поведение сетки.</p>
          <div class="toolbar preset-toolbar">
            <input class="input" data-custom-preset-name placeholder="Название пресета" />
            <button class="btn" data-save-custom-preset>Сохранить</button>
          </div>
          <div class="chips">
            ${Object.keys(s.customPresets || {}).length
              ? Object.keys(s.customPresets).map((name) => `<button class="chip" data-apply-custom-preset="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join("")
              : `<span class="muted">Пока нет сохранённых пресетов.</span>`}
          </div>
        </div>
        <div class="panel settings-card">
          <div class="section-head">
            <div>
              <h3>Статусы</h3>
              <p class="muted">“Выполнено” всегда включено, остальные можно скрыть из быстрых действий.</p>
            </div>
          </div>
          ${Object.entries(statusMeta).map(([key, meta]) => `
            <div class="check-row">
              <span>${meta.short} ${meta.label}${key === "done" ? `<br><small class="muted">обязательный статус</small>` : ""}</span>
              <input type="checkbox" ${s.activeStatuses.includes(key) ? "checked" : ""} ${key === "done" ? "disabled" : ""} data-status-toggle="${key}" />
            </div>`).join("")}
        </div>
      </div>
      <div class="stack">
        <div class="panel settings-card">
          <h3>Блоки</h3>
          ${Object.entries(blockLabels).map(([key, label]) => `
            <div class="check-row"><span>${label}</span><input type="checkbox" ${s.visibleBlocks[key] ? "checked" : ""} data-visible-block="${key}" /></div>`).join("")}
        </div>
        <div class="panel settings-card">
          <h3>Сетка</h3>
          ${Object.entries(gridLabels).map(([key, label]) => `
            <div class="check-row"><span>${label}</span><input type="checkbox" ${s.visibleGrid[key] ? "checked" : ""} data-visible-grid="${key}" /></div>`).join("")}
          <div class="danger-zone">
            <button class="btn ghost" data-reset-settings>Сбросить только настройки</button>
            <button class="btn danger" data-reset>Сбросить все данные</button>
          </div>
        </div>
        <div class="panel settings-card">
          <h3>Экспорт / импорт</h3>
          <div class="toolbar preset-toolbar">
            <button class="btn" data-export-json>Подготовить экспорт</button>
            <button class="btn" data-import-json>Импортировать JSON</button>
          </div>
          <textarea class="textarea export-box" data-json-box placeholder="JSON для экспорта или импорта"></textarea>
        </div>
      </div>
    </section>
  `;
}

function renderSelect(key, label, options, value) {
  return `
    <div class="field">
      <label>${label}</label>
      <select class="select" data-setting="${key}">
        ${options.map((option) => `<option value="${option}" ${option === value ? "selected" : ""}>${option}</option>`).join("")}
      </select>
    </div>
  `;
}

function renderInspector() {
  const selectedLogs = activeHabits().map((habit) => ({ habit, log: getLog(habit.id, state.selectedDate) }));
  const note = state.notes[state.selectedDate] || {};
  const complete = selectedLogs.filter(({ log }) => log?.status === "done").length;
  return `
    <aside class="inspector">
      <div class="panel inspector-panel">
        <h3>${formatDate(state.selectedDate)}</h3>
        <div class="inspector-summary">
          <strong>${complete}/${selectedLogs.length}</strong>
          <span>привычек выполнено</span>
        </div>
        ${selectedLogs.map(({ habit, log }) => `
          <div class="settings-row">
            <span>${habit.icon} ${escapeHtml(habit.title)}</span>
            <span class="badge">${log?.status ? statusMeta[log.status]?.label : "нет отметки"}</span>
          </div>`).join("")}
      </div>
      <div class="panel inspector-panel">
        <h3>Дневник</h3>
        <div class="mini-metrics">
          <span>Настроение <b>${note.mood ?? "—"}</b></span>
          <span>Энергия <b>${note.energy ?? "—"}</b></span>
          <span>Стресс <b>${note.stress ?? "—"}</b></span>
        </div>
        <p class="muted">${escapeHtml(note.text || "Заметки на этот день пока нет.")}</p>
      </div>
    </aside>
  `;
}

function renderHabitModal() {
  return `
    <div class="modal" id="habit-modal">
      <div class="modal-card">
        <div class="modal-head">
          <h3>${editingHabitId ? "Редактировать привычку" : "Новая привычка"}</h3>
          <button class="icon-btn" data-close-modal>×</button>
        </div>
        <form id="habit-form" class="stack">
          ${habitFormFields(editingHabitId ? state.habits.find((h) => h.id === editingHabitId) : null)}
        </form>
      </div>
    </div>
  `;
}

function habitFormFields(habit) {
  const h = habit || {
    title: "",
    description: "",
    color: "#557b66",
    icon: "✓",
    category: "",
    type: "boolean",
    target: 1,
    schedule: [1, 2, 3, 4, 5, 6, 0],
    warningThreshold: 4,
  };
  return `
    <div class="form-grid">
      <div class="field"><label>Название</label><input class="input" name="title" required value="${escapeHtml(h.title)}" /></div>
      <div class="field"><label>Категория</label><input class="input" name="category" value="${escapeHtml(h.category || "")}" /></div>
      <div class="field"><label>Иконка</label><input class="input" name="icon" value="${escapeHtml(h.icon)}" /></div>
      <div class="field"><label>Цвет</label><input class="input" type="color" name="color" value="${h.color}" /></div>
      <div class="field">
        <label>Тип</label>
        <select class="select" name="type">
          ${["boolean", "numeric", "multiple", "avoid", "reflection"].map((type) => `<option value="${type}" ${h.type === type ? "selected" : ""}>${habitTypeLabel(type)}</option>`).join("")}
        </select>
      </div>
      <div class="field"><label>Цель / количество</label><input class="input" type="number" min="1" name="target" value="${h.target || 1}" /></div>
      <div class="field"><label>Порог внимания, дней</label><input class="input" type="number" min="1" name="warningThreshold" value="${h.warningThreshold || 4}" /></div>
    </div>
    <div class="field"><label>Описание</label><textarea class="textarea" name="description">${escapeHtml(h.description || "")}</textarea></div>
    <div class="field">
      <label>Дни недели</label>
      <div class="weekdays">
        ${["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"].map((label, day) => `<button type="button" class="chip ${h.schedule.includes(day) ? "active" : ""}" data-weekday="${day}">${label}</button>`).join("")}
      </div>
    </div>
    <div class="toolbar">
      <button class="btn primary" type="submit">Сохранить</button>
      ${habit ? `<button class="btn" type="button" data-archive-habit>${habit.archived ? "Вернуть" : "Архивировать"}</button><button class="btn danger" type="button" data-delete-habit>Удалить</button>` : ""}
    </div>
  `;
}

function renderCellSheet() {
  const habit = activeCell ? state.habits.find((h) => h.id === activeCell.habitId) : null;
  const log = activeCell ? getLog(activeCell.habitId, activeCell.date) : null;
  const numericProgress = habit ? Math.min(100, Math.round(((log?.value || 0) / Math.max(1, habit.target)) * 100)) : 0;
  const countProgress = habit ? Math.min(100, Math.round(((log?.completedCount || 0) / Math.max(1, habit.target)) * 100)) : 0;
  return `
    <div class="sheet ${activeCell ? "open" : ""}" id="cell-sheet">
      <div class="sheet-card">
        ${habit ? `
          <div class="modal-head">
            <h3>${habit.icon} ${escapeHtml(habit.title)}</h3>
            <button class="icon-btn" data-close-sheet>×</button>
          </div>
          <p class="muted">${formatDate(activeCell.date)}</p>
          <div class="quick-actions" style="justify-content:flex-start;margin-bottom:12px">
            ${state.settings.activeStatuses.map((status) => `<button class="btn ${log?.status === status ? "primary" : ""}" data-sheet-status="${status}">${statusMeta[status].short} ${statusMeta[status].label}</button>`).join("")}
          </div>
          <div class="cell-summary">
            <span>Тип: <b>${habitTypeLabel(habit.type)}</b></span>
            <span>Цель: <b>${habit.target}</b></span>
            <span>Статус: <b>${log?.status ? statusMeta[log.status].label : "нет"}</b></span>
          </div>
          ${habit.type === "numeric" ? `
            <div class="type-control">
              <div class="progress-line"><span style="width:${numericProgress}%"></span></div>
              <div class="field">
                <label>Значение / цель ${habit.target}</label>
                <input class="input" type="number" min="0" value="${log?.value || 0}" data-log-value />
              </div>
              <div class="quick-actions detail-actions">
                ${[25, 50, 100].map((percent) => {
                  const value = Math.round((habit.target * percent) / 100);
                  return `<button class="btn ghost" data-log-value-preset="${value}">${percent}%</button>`;
                }).join("")}
              </div>
            </div>` : ""}
          ${habit.type === "multiple" ? `
            <div class="type-control">
              <div class="progress-line"><span style="width:${countProgress}%"></span></div>
              <div class="field">
                <label>Повторы / цель ${habit.target}</label>
                <input class="input" type="number" min="0" max="${habit.target}" value="${log?.completedCount || 0}" data-log-count />
              </div>
              <div class="stepper">
                <button class="btn ghost" data-log-count-step="-1">−</button>
                <strong>${log?.completedCount || 0}/${habit.target}</strong>
                <button class="btn ghost" data-log-count-step="1">+</button>
              </div>
            </div>` : ""}
          ${habit.type === "avoid" ? `<p class="muted">Для avoid-привычки “Выполнено” означает, что нежелательное действие не произошло.</p>` : ""}
          ${habit.type === "reflection" ? `<p class="muted">Для reflection-привычки запись сама считается выполнением.</p>` : ""}
          <div class="field">
            <label>Заметка к отметке</label>
            <textarea class="textarea" data-log-note>${escapeHtml(log?.note || "")}</textarea>
          </div>
          <div class="field">
            <label>Настроение в этой отметке</label>
            <input type="range" min="1" max="5" value="${log?.mood || 3}" data-log-mood />
          </div>
          <button class="btn ghost" data-edit-habit="${habit.id}">Редактировать привычку</button>
        ` : ""}
      </div>
    </div>
  `;
}

// Events
function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      saveState();
      render();
    });
  });
  document.querySelector("[data-selected-date]")?.addEventListener("change", (event) => {
    state.selectedDate = event.target.value || todayKey();
    saveState();
    render();
  });
  document.querySelector("[data-add-habit]")?.addEventListener("click", () => {
    editingHabitId = null;
    openHabitModal();
  });
  document.querySelectorAll("[data-set-status]").forEach((button) => {
    button.addEventListener("click", () => setLog(button.dataset.habitId, state.selectedDate, { status: button.dataset.setStatus }));
  });
  document.querySelector("[data-mark-all-done]")?.addEventListener("click", markDayDone);
  document.querySelector("[data-clear-day]")?.addEventListener("click", clearDay);
  document.querySelector("[data-undo-bulk]")?.addEventListener("click", undoLastBulkAction);
  document.querySelectorAll("[data-cell-open]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.cellMode === "grid" && state.settings.gridClickAction === "cycle") {
        cycleHabitStatus(button.dataset.cellOpen, button.dataset.cellDate);
        return;
      }
      activeCell = { habitId: button.dataset.cellOpen, date: button.dataset.cellDate };
      render();
    });
  });
  document.querySelectorAll("[data-edit-habit-card]").forEach((button) => {
    button.addEventListener("click", () => {
      editingHabitId = button.dataset.editHabitCard;
      render();
      openHabitModal();
    });
  });
  bindDiaryEvents();
  bindGridPeriodEvents();
  bindSettingsEvents();
  bindHabitModalEvents();
  bindCellSheetEvents();
}

function cycleHabitStatus(habitId, dateKey) {
  const enabled = state.settings.activeStatuses.length ? state.settings.activeStatuses : ["done"];
  const current = getLog(habitId, dateKey)?.status;
  const currentIndex = current ? enabled.indexOf(current) : -1;
  const nextStatus = enabled[(currentIndex + 1) % enabled.length];
  setLog(habitId, dateKey, { status: nextStatus });
}

function markDayDone() {
  const dateKey = state.selectedDate;
  const previous = {};
  activeHabits().filter((habit) => isDue(habit, dateKey)).forEach((habit) => {
    const key = habitLogKey(habit.id, dateKey);
    previous[key] = state.logs[key];
    state.logs[key] = { ...(state.logs[key] || { habitId: habit.id, date: dateKey }), status: "done", updatedAt: new Date().toISOString() };
  });
  bulkUndo = previous;
  saveState();
  render();
}

function clearDay() {
  const previous = {};
  Object.keys(state.logs).forEach((key) => {
    if (key.endsWith(`:${state.selectedDate}`)) {
      previous[key] = state.logs[key];
      delete state.logs[key];
    }
  });
  bulkUndo = previous;
  saveState();
  render();
}

function undoLastBulkAction() {
  if (!bulkUndo) return;
  Object.entries(bulkUndo).forEach(([key, value]) => {
    if (value) state.logs[key] = value;
    else delete state.logs[key];
  });
  bulkUndo = null;
  saveState();
  render();
}

function bindDiaryEvents() {
  document.querySelectorAll("[data-note-field]").forEach((input) => {
    input.addEventListener("input", () => {
      const note = state.notes[state.selectedDate] || {};
      note[input.dataset.noteField] = input.value;
      state.notes[state.selectedDate] = note;
      saveState();
    });
  });
}

function bindGridPeriodEvents() {
  document.querySelectorAll("[data-period-days]").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.defaultPeriod = { ...state.settings.defaultPeriod, mode: "last", days: Number(button.dataset.periodDays) };
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-period-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.defaultPeriod.mode = button.dataset.periodMode;
      saveState();
      render();
    });
  });
  document.querySelector("[data-apply-custom-days]")?.addEventListener("click", () => {
    const days = Number(document.querySelector("[data-period-custom-days]").value || 30);
    state.settings.defaultPeriod = { ...state.settings.defaultPeriod, mode: "last", days: Math.min(365, Math.max(1, days)) };
    saveState();
    render();
  });
  document.querySelector("[data-apply-range]")?.addEventListener("click", () => {
    const start = document.querySelector("[data-custom-start]").value;
    const end = document.querySelector("[data-custom-end]").value;
    if (start && end) state.settings.defaultPeriod = { ...state.settings.defaultPeriod, mode: "custom", start, end };
    saveState();
    render();
  });
}

function bindSettingsEvents() {
  document.querySelectorAll("[data-theme-preview]").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.interfaceTheme = button.dataset.themePreview;
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-grid-theme-preview]").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.gridTheme = button.dataset.gridThemePreview;
      saveState();
      render();
    });
  });
  document.querySelector("[data-save-custom-preset]")?.addEventListener("click", () => {
    const name = document.querySelector("[data-custom-preset-name]")?.value.trim();
    if (!name) return;
    state.settings.customPresets = state.settings.customPresets || {};
    state.settings.customPresets[name] = {
      activeStatuses: [...state.settings.activeStatuses],
      visibleBlocks: { ...state.settings.visibleBlocks },
      visibleGrid: { ...state.settings.visibleGrid },
      density: state.settings.density,
      interfaceTheme: state.settings.interfaceTheme,
      gridTheme: state.settings.gridTheme,
      focusMode: state.settings.focusMode,
      rightPanel: state.settings.rightPanel,
      showWeekends: state.settings.showWeekends,
      gridClickAction: state.settings.gridClickAction,
      defaultView: state.settings.defaultView,
      mobileGridDays: state.settings.mobileGridDays,
    };
    saveState();
    render();
  });
  document.querySelectorAll("[data-apply-custom-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = state.settings.customPresets?.[button.dataset.applyCustomPreset];
      if (!preset) return;
      state.settings = mergeDeep(state.settings, structuredClone(preset));
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-setting]").forEach((input) => {
    input.addEventListener("change", () => {
      state.settings[input.dataset.setting] = input.value;
      if (input.dataset.setting === "mobileGridDays") state.settings.mobileGridDays = Number(input.value);
      applyPreset(input.dataset.setting === "preset" ? input.value : null);
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-setting-check]").forEach((input) => {
    input.addEventListener("change", () => {
      state.settings[input.dataset.settingCheck] = input.checked;
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-status-toggle]").forEach((input) => {
    input.addEventListener("change", () => {
      const status = input.dataset.statusToggle;
      const set = new Set(state.settings.activeStatuses);
      input.checked ? set.add(status) : set.delete(status);
      set.add("done");
      state.settings.activeStatuses = [...set].filter((item) => statusMeta[item]);
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-visible-block]").forEach((input) => {
    input.addEventListener("change", () => {
      state.settings.visibleBlocks[input.dataset.visibleBlock] = input.checked;
      saveState();
    });
  });
  document.querySelectorAll("[data-visible-grid]").forEach((input) => {
    input.addEventListener("change", () => {
      state.settings.visibleGrid[input.dataset.visibleGrid] = input.checked;
      saveState();
    });
  });
  document.querySelector("[data-reset]")?.addEventListener("click", () => {
    if (confirm("Сбросить все данные прототипа?")) {
      localStorage.removeItem(STORAGE_KEY);
      state = loadState();
      render();
    }
  });
  document.querySelector("[data-reset-settings]")?.addEventListener("click", () => {
    if (confirm("Сбросить только настройки интерфейса? Привычки и дневник останутся.")) {
      state.settings = structuredClone(defaults.settings);
      saveState();
      render();
    }
  });
  document.querySelector("[data-export-json]")?.addEventListener("click", () => {
    const box = document.querySelector("[data-json-box]");
    if (box) box.value = JSON.stringify(state, null, 2);
  });
  document.querySelector("[data-import-json]")?.addEventListener("click", () => {
    const box = document.querySelector("[data-json-box]");
    if (!box?.value) return;
    try {
      state = mergeDeep(structuredClone(defaults), JSON.parse(box.value));
      saveState();
      render();
    } catch {
      alert("Не удалось импортировать JSON");
    }
  });
}

function applyPreset(preset) {
  if (!preset) return;
  state.settings.preset = preset;
  if (preset === "Simple") {
    state.settings.activeStatuses = ["done"];
    state.settings.visibleBlocks.analytics = false;
    state.settings.visibleBlocks.stress = false;
    state.settings.density = "comfortable";
  }
  if (preset === "Balanced") {
    state.settings.activeStatuses = ["done", "partial", "skipped"];
    state.settings.visibleBlocks.analytics = true;
    state.settings.visibleBlocks.diary = true;
    state.settings.density = "standard";
  }
  if (preset === "Journal") {
    state.settings.gridTheme = "journal";
    state.settings.visibleBlocks.mood = true;
    state.settings.visibleBlocks.energy = true;
    state.settings.visibleBlocks.stress = true;
    state.settings.visibleGrid.moodMarker = true;
  }
  if (preset === "Analytical") {
    state.settings.activeStatuses = ["done", "partial", "skipped", "missed"];
    state.settings.visibleGrid.completion = true;
    state.settings.visibleBlocks.analytics = true;
    state.settings.density = "compact";
  }
  if (preset === "Focus") {
    state.settings.focusMode = true;
    state.settings.visibleBlocks.diary = false;
    state.settings.visibleBlocks.analytics = false;
  }
}

function bindHabitModalEvents() {
  document.querySelector("[data-close-modal]")?.addEventListener("click", closeHabitModal);
  document.querySelectorAll("[data-weekday]").forEach((button) => {
    button.addEventListener("click", () => button.classList.toggle("active"));
  });
  document.querySelector("#habit-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const schedule = [...document.querySelectorAll("[data-weekday].active")].map((button) => Number(button.dataset.weekday));
    const habit = {
      id: editingHabitId || crypto.randomUUID(),
      title: String(form.get("title")).trim(),
      description: String(form.get("description") || ""),
      color: String(form.get("color")),
      icon: String(form.get("icon") || "✓"),
      category: String(form.get("category") || ""),
      type: String(form.get("type")),
      target: Number(form.get("target") || 1),
      schedule: schedule.length ? schedule : [1, 2, 3, 4, 5, 6, 0],
      archived: false,
      warningThreshold: Number(form.get("warningThreshold") || 4),
      createdAt: editingHabitId ? state.habits.find((h) => h.id === editingHabitId)?.createdAt : todayKey(),
    };
    if (!habit.title) return;
    if (editingHabitId) state.habits = state.habits.map((item) => item.id === editingHabitId ? { ...item, ...habit } : item);
    else state.habits.push(habit);
    editingHabitId = null;
    saveState();
    render();
  });
  document.querySelector("[data-archive-habit]")?.addEventListener("click", () => {
    state.habits = state.habits.map((habit) => habit.id === editingHabitId ? { ...habit, archived: !habit.archived } : habit);
    editingHabitId = null;
    saveState();
    render();
  });
  document.querySelector("[data-delete-habit]")?.addEventListener("click", () => {
    if (!confirm("Удалить привычку и её отметки?")) return;
    state.habits = state.habits.filter((habit) => habit.id !== editingHabitId);
    Object.keys(state.logs).forEach((key) => {
      if (key.startsWith(`${editingHabitId}:`)) delete state.logs[key];
    });
    editingHabitId = null;
    saveState();
    render();
  });
}

function bindCellSheetEvents() {
  document.querySelector("[data-close-sheet]")?.addEventListener("click", () => {
    activeCell = null;
    render();
  });
  document.querySelectorAll("[data-sheet-status]").forEach((button) => {
    button.addEventListener("click", () => {
      setLog(activeCell.habitId, activeCell.date, { status: button.dataset.sheetStatus });
      activeCell = null;
    });
  });
  document.querySelector("[data-log-note]")?.addEventListener("input", (event) => {
    if (!activeCell) return;
    const habit = state.habits.find((item) => item.id === activeCell.habitId);
    setLogSilently(activeCell.habitId, activeCell.date, { note: event.target.value, ...(habit?.type === "reflection" && event.target.value.trim() ? { status: "done" } : {}) });
  });
  document.querySelector("[data-log-mood]")?.addEventListener("input", (event) => {
    if (activeCell) setLogSilently(activeCell.habitId, activeCell.date, { mood: event.target.value });
  });
  document.querySelector("[data-log-value]")?.addEventListener("input", (event) => {
    if (!activeCell) return;
    const habit = state.habits.find((item) => item.id === activeCell.habitId);
    const value = Number(event.target.value);
    setLogSilently(activeCell.habitId, activeCell.date, { value, status: habit && value >= habit.target ? "done" : "partial" });
  });
  document.querySelectorAll("[data-log-value-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!activeCell) return;
      const habit = state.habits.find((item) => item.id === activeCell.habitId);
      const value = Number(button.dataset.logValuePreset);
      setLog(activeCell.habitId, activeCell.date, { value, status: habit && value >= habit.target ? "done" : "partial" });
    });
  });
  document.querySelector("[data-log-count]")?.addEventListener("input", (event) => {
    if (!activeCell) return;
    const habit = state.habits.find((item) => item.id === activeCell.habitId);
    const completedCount = Number(event.target.value);
    setLogSilently(activeCell.habitId, activeCell.date, { completedCount, status: habit && completedCount >= habit.target ? "done" : "partial" });
  });
  document.querySelectorAll("[data-log-count-step]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!activeCell) return;
      const habit = state.habits.find((item) => item.id === activeCell.habitId);
      if (!habit) return;
      const current = Number(getLog(activeCell.habitId, activeCell.date)?.completedCount || 0);
      const completedCount = Math.min(habit.target, Math.max(0, current + Number(button.dataset.logCountStep)));
      setLog(activeCell.habitId, activeCell.date, { completedCount, status: completedCount >= habit.target ? "done" : "partial" });
    });
  });
  document.querySelector("[data-edit-habit]")?.addEventListener("click", (event) => {
    editingHabitId = event.currentTarget.dataset.editHabit;
    activeCell = null;
    render();
    openHabitModal();
  });
}

function setLogSilently(habitId, dateKey, patch) {
  const key = habitLogKey(habitId, dateKey);
  const current = state.logs[key] || { habitId, date: dateKey };
  state.logs[key] = { ...current, ...patch, updatedAt: new Date().toISOString() };
  saveState();
}

function openHabitModal() {
  document.querySelector("#habit-modal")?.classList.add("open");
}

function closeHabitModal() {
  editingHabitId = null;
  render();
}

function habitTypeLabel(type) {
  return {
    boolean: "Обычная",
    numeric: "Числовая",
    multiple: "Несколько раз в день",
    avoid: "Не делать",
    reflection: "Самонаблюдение",
  }[type] || type;
}

function periodLabel() {
  const p = state.settings.defaultPeriod;
  if (p.mode === "week") return "Текущая неделя";
  if (p.mode === "month") return "Текущий месяц";
  if (p.mode === "custom") return `${formatDate(p.start, "short")} – ${formatDate(p.end, "short")}`;
  return `Последние ${p.days} дней`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

render();
