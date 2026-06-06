"use client";

import { useEffect } from "react";
import type { Language } from "../types";
import { normalizeLanguage } from "../lib/i18n";

const uiTranslations: Record<string, string> = {
  "Создать привычку": "Create habit",
  "Привычки на день": "Daily habits",
  "Быстрая отметка без лишних шагов.": "Quick check-ins without extra steps.",
  "Сегодня": "Today",
  "Завершено": "Completed",
  "Требует внимания": "Needs attention",
  "Настроить экран Сегодня": "Customize Today screen",
  "Дневник дня": "Daily diary",
  "Дневник": "Diary",
  "Календарь": "Calendar",
  "Привычки": "Habits",
  "Оповещения": "Alerts",
  "Аналитика": "Analytics",
  "Настройки": "Settings",
  "Управление": "Admin",
  "Биоритмы": "Biorhythms",
  "Цифры": "Numbers",
  "Транзит": "Transit",
  "Прогноз дня": "Day forecast",
  "Запись дня": "Day note",
  "Состояние": "State",
  "Настроение": "Mood",
  "Энергия": "Energy",
  "Стресс": "Stress",
  "Короткая заметка": "Short note",
  "Что помогло": "What helped",
  "Что мешало": "What got in the way",
  "История заметок": "Note history",
  "Период сетки": "Grid period",
  "Настроить календарь и таблицу": "Customize calendar and table",
  "Оформление таблицы": "Table style",
  "Фильтр и видимость": "Filter and visibility",
  "Видимые элементы": "Visible elements",
  "Иконки отметок": "Check-in icons",
  "Показывать выходные": "Show weekends",
  "Все категории": "All categories",
  "Выполнено": "Done",
  "Частично": "Partial",
  "Пропуск": "Skip",
  "Не выполнено": "Missed",
  "Запланировано": "Planned",
  "Плотность сетки": "Grid density",
  "Клик по ячейке": "Cell click",
  "Активные": "Active",
  "Шаблоны": "Templates",
  "Изменить": "Edit",
  "В архив": "Archive",
  "Добавить привычку": "Add habit",
  "Библиотека привычек": "Habit library",
  "Отправить": "Send",
  "Отправляю...": "Sending...",
  "Сохранить": "Save",
  "Отмена": "Cancel",
  "Удалить": "Delete",
  "Очистить": "Clear",
  "Всё": "All",
  "Undo": "Undo",
  "Профиль": "Profile",
  "Блоки": "Blocks",
  "Вид": "View",
  "Статусы": "Statuses",
  "Прогноз": "Forecast",
  "Управление пользователями": "User management",
  "Пользователи, экспорт и глобальные настройки": "Users, export and global settings",
  "Список аккаунтов, полные email, привычки и отметки в календаре.": "Account list, full email, habits and calendar check-ins.",
  "Глобальные настройки": "Global settings",
  "Контакты": "Contacts",
  "О проекте": "About"
};

const translatedNodes = new WeakMap<Text, string>();
const translatedAttributes = new WeakMap<Element, Record<string, string>>();
const attributes = ["placeholder", "title", "aria-label"];

function translateRoot(root: ParentNode, language: Language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  for (const node of textNodes) {
    const original = translatedNodes.get(node) || node.nodeValue || "";
    if (!translatedNodes.has(node)) translatedNodes.set(node, original);
    const trimmed = original.trim();
    if (!trimmed) continue;
    if (language === "en" && uiTranslations[trimmed]) {
      const nextValue = original.replace(trimmed, uiTranslations[trimmed]);
      if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
    } else if (language === "ru") {
      if (node.nodeValue !== original) node.nodeValue = original;
    }
  }

  const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll("*"))] : Array.from(root.querySelectorAll("*"));
  for (const element of elements) {
    const originalAttrs = translatedAttributes.get(element) || {};
    for (const attr of attributes) {
      const current = element.getAttribute(attr);
      if (!current) continue;
      if (!originalAttrs[attr]) originalAttrs[attr] = current;
      const original = originalAttrs[attr];
      if (language === "en" && uiTranslations[original] && current !== uiTranslations[original]) element.setAttribute(attr, uiTranslations[original]);
      if (language === "ru" && current !== original) element.setAttribute(attr, original);
    }
    if (Object.keys(originalAttrs).length) translatedAttributes.set(element, originalAttrs);
  }
}

export function RuntimeTranslator({ language, selector = ".app" }: { language: Language; selector?: string }) {
  useEffect(() => {
    const normalized = normalizeLanguage(language);
    const root = document.querySelector(selector);
    if (!root) return;
    translateRoot(root, normalized);
    const observer = new MutationObserver(() => translateRoot(root, normalized));
    observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true });
    return () => observer.disconnect();
  }, [language, selector]);

  return null;
}
