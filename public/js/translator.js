(() => {
  "use strict";

  // =========================================================
  // NOIRÉ UNIVERSAL TRANSLATOR
  // Safe isolated translation layer.
  //
  // ВАЖНО:
  // - не изменяет существующие функции сайта;
  // - не переопределяет fetch;
  // - не переопределяет DOM prototypes;
  // - не меняет id/class/data-*;
  // - не вмешивается в обработчики событий;
  // - не содержит API-ключей.
  // =========================================================

  const SUPPORTED_LANGUAGES = new Set(["ru", "en", "hy"]);
  const DEFAULT_LANGUAGE = "ru";

  const CONFIG = Object.freeze({
    endpoint: "/api/translate",
    cacheKey: "noireTranslatorCacheV1",
    requestTimeout: 10000,
    maxCacheEntries: 1500,
  });

  // Runtime cache.
  const memoryCache = new Map();

  function normalizeLanguage(language) {
    const value = String(language || "")
      .trim()
      .toLowerCase()
      .split("-")[0];

    return SUPPORTED_LANGUAGES.has(value)
      ? value
      : DEFAULT_LANGUAGE;
  }

  function getCurrentLanguage() {
    // Используем существующую языковую систему NOIRÉ,
    // если она уже загружена.
    try {
      if (typeof window.noireGetLanguage === "function") {
        return normalizeLanguage(window.noireGetLanguage());
      }
    } catch (error) {
      console.warn("[NOIRÉ Translator] Language read failed:", error);
    }

    return DEFAULT_LANGUAGE;
  }
function shouldTranslateText(text) {
  const value = String(text ?? "").trim();

  if (!value) return false;

  // Слишком короткие технические значения.
  if (value.length < 2) return false;

  // URL, email, пути и технические адреса.
  if (
    /^(https?:\/\/|www\.|mailto:|tel:|\/api\/|\/js\/|\/css\/)/i.test(value)
  ) {
    return false;
  }

  // Только числа / цены / проценты / знаки валют.
  if (/^[\d\s.,:+\-–—/%₽$€£֏₾₸¥]+$/.test(value)) {
    return false;
  }

  // HEX-цвет.
  if (/^#[0-9a-f]{3,8}$/i.test(value)) {
    return false;
  }

  // Похоже на технический идентификатор:
  // menu_item, order-status, dataValue и т.п.
  if (
    /^[a-z0-9_.:/-]+$/i.test(value) &&
    !/\s/.test(value)
  ) {
    return false;
  }

  // Для нашего проекта исходный пользовательский текст
  // в основном русский. Переводим только строки,
  // содержащие кириллицу.
  if (!/[А-Яа-яЁё]/.test(value)) {
    return false;
  }

  return true;
}

function collectTranslatableTexts(root = document.body) {
  const texts = new Set();

  if (!root) {
    return [];
  }

  // Элементы, содержимое которых переводить нельзя.
  const ignoredTags = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "CODE",
    "PRE",
    "TEXTAREA",
  ]);

  // 1. Обычные текстовые узлы.
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
  );

  let node;

  while ((node = walker.nextNode())) {
    const parent = node.parentElement;

    if (!parent) continue;
    if (ignoredTags.has(parent.tagName)) continue;
    if (parent.closest("[data-no-translate]")) continue;

    const text = node.nodeValue?.trim();

    if (shouldTranslateText(text)) {
      texts.add(text);
    }
  }

  // 2. Пользовательские текстовые атрибуты.
  const attributes = [
    "placeholder",
    "title",
    "aria-label",
    "alt",
  ];

  root.querySelectorAll("*").forEach((element) => {
    if (ignoredTags.has(element.tagName)) return;
    if (element.closest("[data-no-translate]")) return;

    attributes.forEach((attribute) => {
      const value = element.getAttribute(attribute);

      if (shouldTranslateText(value)) {
        texts.add(value.trim());
      }
    });
  });

  return [...texts];
}


  function createCacheKey(text, sourceLanguage, targetLanguage) {
    return `${sourceLanguage}:${targetLanguage}:${text}`;
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(CONFIG.cacheKey);

      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (!parsed || typeof parsed !== "object") return;

      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "string") {
          memoryCache.set(key, value);
        }
      }
    } catch (error) {
      console.warn("[NOIRÉ Translator] Cache load failed:", error);
    }
  }

  function saveCache() {
    try {
      // Не позволяем кэшу бесконечно расти.
      while (memoryCache.size > CONFIG.maxCacheEntries) {
        const firstKey = memoryCache.keys().next().value;

        if (!firstKey) break;

        memoryCache.delete(firstKey);
      }

      localStorage.setItem(
        CONFIG.cacheKey,
        JSON.stringify(Object.fromEntries(memoryCache)),
      );
    } catch (error) {
      // Ошибка кэша никогда не должна ломать сайт.
      console.warn("[NOIRÉ Translator] Cache save failed:", error);
    }
  }

  function getCachedTranslation(
    text,
    sourceLanguage = "ru",
    targetLanguage = getCurrentLanguage(),
  ) {
    const source = normalizeLanguage(sourceLanguage);
    const target = normalizeLanguage(targetLanguage);

    const key = createCacheKey(text, source, target);

    return memoryCache.get(key) || null;
  }

  function setCachedTranslation(
    text,
    translatedText,
    sourceLanguage = "ru",
    targetLanguage = getCurrentLanguage(),
  ) {
    if (!text || !translatedText) return;

    const source = normalizeLanguage(sourceLanguage);
    const target = normalizeLanguage(targetLanguage);

    const key = createCacheKey(text, source, target);

    memoryCache.set(key, translatedText);

    saveCache();
  }

  async function translateText(
    text,
    sourceLanguage = "ru",
    targetLanguage = getCurrentLanguage(),
  ) {
    const original = String(text ?? "");
    const trimmed = original.trim();

    if (!trimmed) {
      return original;
    }


if (!shouldTranslateText(trimmed)) {
  return original;
}

    const source = normalizeLanguage(sourceLanguage);
    const target = normalizeLanguage(targetLanguage);

    // Перевод не нужен.
    if (source === target) {
      return original;
    }

   const cached = getCachedTranslation(trimmed, source, target);

if (cached) {
  return cached;
}

// =========================================================
// 1. Существующий основной словарь site-language.js
// =========================================================

if (
  window.NoireSiteI18n &&
  typeof window.NoireSiteI18n.has === "function" &&
  typeof window.NoireSiteI18n.get === "function" &&
  window.NoireSiteI18n.has(trimmed, target)
) {
  const translated = window.NoireSiteI18n.get(
    trimmed,
    target
  );

  setCachedTranslation(
    trimmed,
    translated,
    source,
    target
  );

  return translated;
}

// =========================================================
// 2. Дополнительный словарь translations.js
// =========================================================

if (
  window.NoireTranslations &&
  typeof window.NoireTranslations.has === "function" &&
  typeof window.NoireTranslations.get === "function" &&
  window.NoireTranslations.has(trimmed, target)
) {
  const translated = window.NoireTranslations.get(
    trimmed,
    target
  );

  setCachedTranslation(
    trimmed,
    translated,
    source,
    target
  );

  return translated;
}

// Перевода пока нет ни в одном словаре.
return original;
  }

  async function translatePage(
  targetLanguage = getCurrentLanguage(),
  root = document.body,
) {
  const target = normalizeLanguage(targetLanguage);

  if (!root) {
    return;
  }

  const ignoredTags = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "CODE",
    "PRE",
    "TEXTAREA",
  ]);

  const attributes = [
    "placeholder",
    "title",
    "aria-label",
    "alt",
  ];

  // =========================================================
  // ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ
  // Ищет перевод сначала в site-language.js,
  // затем в translations.js.
  // =========================================================

  function getLocalTranslation(original, language) {
    const sourceText = String(original ?? "").trim();

    if (!sourceText) {
      return original;
    }

    if (language === "ru") {
      return original;
    }

    if (
      window.NoireSiteI18n &&
      typeof window.NoireSiteI18n.has === "function" &&
      typeof window.NoireSiteI18n.get === "function" &&
      window.NoireSiteI18n.has(sourceText, language)
    ) {
      return window.NoireSiteI18n.get(
        sourceText,
        language
      );
    }

    if (
      window.NoireTranslations &&
      typeof window.NoireTranslations.has === "function" &&
      typeof window.NoireTranslations.get === "function" &&
      window.NoireTranslations.has(sourceText, language)
    ) {
      return window.NoireTranslations.get(
        sourceText,
        language
      );
    }

    return original;
  }

  // =========================================================
  // 1. ОБЫЧНЫЙ ТЕКСТ
  // =========================================================

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
  );

  const textNodes = [];
  let node;

  while ((node = walker.nextNode())) {
    const parent = node.parentElement;

    if (!parent) continue;
    if (ignoredTags.has(parent.tagName)) continue;
    if (parent.closest("[data-no-translate]")) continue;

    textNodes.push(node);
  }

  for (const textNode of textNodes) {
    const parent = textNode.parentElement;

    if (!parent) continue;

    const currentRaw = textNode.nodeValue || "";
    const currentText = currentRaw.trim();

    if (!currentText) continue;

    // -------------------------------------------------------
    // Определяем исходный русский текст.
    //
    // Храним его на ЭЛЕМЕНТЕ, а не только на TextNode.
    // Это устойчивее для элементов, которые перерисовывает
    // app.js / menu.js.
    // -------------------------------------------------------

    let originalText =
      parent.dataset.noireOriginalText || "";

    if (!originalText) {
      // Если текущий текст русский — он является оригиналом.
      if (shouldTranslateText(currentText)) {
        originalText = currentText;

        parent.dataset.noireOriginalText =
          originalText;
      } else {
        // Это уже может быть EN/HY после предыдущего перевода.
        // Без известного русского оригинала не трогаем.
        continue;
      }
    }

    let outputText;

    if (target === "ru") {
      outputText = originalText;
    } else {
      outputText = getLocalTranslation(
        originalText,
        target
      );
    }

    // Сохраняем пробелы вокруг текста.
    const leadingWhitespace =
      currentRaw.match(/^\s*/)?.[0] || "";

    const trailingWhitespace =
      currentRaw.match(/\s*$/)?.[0] || "";

    textNode.nodeValue =
      leadingWhitespace +
      outputText +
      trailingWhitespace;
  }

  // =========================================================
// Категории меню
// У некоторых кнопок emoji и название находятся
// в разных текстовых узлах, поэтому переводим
// отображаемый текст кнопки целиком.
// =========================================================

root.querySelectorAll(".category").forEach((button) => {
  const original =
    button.dataset.noireOriginalText ||
    button.textContent.trim();

  if (!original) {
    return;
  }

  if (!button.dataset.noireOriginalText) {
    button.dataset.noireOriginalText = original;
  }

  const translated =
    target === "ru"
      ? original
      : getLocalTranslation(original, target);

  // Меняем только текстовые узлы.
  // Сам BUTTON, его class/data-* и обработчики
  // остаются нетронутыми.
  const childTextNodes = [...button.childNodes].filter(
    (child) => child.nodeType === Node.TEXT_NODE
  );

  if (childTextNodes.length === 1) {
    childTextNodes[0].nodeValue = translated;
  } else if (childTextNodes.length > 1) {
    childTextNodes[0].nodeValue = translated;

    childTextNodes.slice(1).forEach((child) => {
      child.nodeValue = "";
    });
  }
});

  // =========================================================
  // 2. PLACEHOLDER / TITLE / ARIA-LABEL / ALT
  // =========================================================

  root.querySelectorAll("*").forEach((element) => {
    if (ignoredTags.has(element.tagName)) {
      return;
    }

    if (element.closest("[data-no-translate]")) {
      return;
    }

    attributes.forEach((attribute) => {
      const currentValue =
        element.getAttribute(attribute);

      if (!currentValue) {
        return;
      }

      const storageName =
        "noireOriginal" +
        attribute
          .replace(/-([a-z])/g, (_, letter) =>
            letter.toUpperCase()
          )
          .replace(/^./, (letter) =>
            letter.toUpperCase()
          );

      let originalValue =
        element.dataset[storageName] || "";

      if (!originalValue) {
        if (!shouldTranslateText(currentValue)) {
          return;
        }

        originalValue = currentValue;

        element.dataset[storageName] =
          originalValue;
      }

      const outputValue =
        target === "ru"
          ? originalValue
          : getLocalTranslation(
              originalValue,
              target
            );

      element.setAttribute(
        attribute,
        outputValue
      );
    });
  });

  // =========================================================
  // 3. ЯЗЫК HTML
  // =========================================================

  document.documentElement.lang = target;

  console.info(
    `[NOIRÉ Translator] Page translated → ${target}`
  );
}

  function clearCache() {
    memoryCache.clear();

    try {
      localStorage.removeItem(CONFIG.cacheKey);
    } catch {}

    console.info("[NOIRÉ Translator] Cache cleared");
  }

  function getStatus() {
    return {
      ready: true,
      language: getCurrentLanguage(),
      cacheSize: memoryCache.size,
      endpoint: CONFIG.endpoint,
    };
  }

  function init() {
    loadCache();

    console.info(
      `[NOIRÉ Translator] Ready (${getCurrentLanguage()})`,
    );
  }

  // =========================================================
  // PUBLIC API
  // Единственный глобальный объект нового переводчика.
  // =========================================================

  window.NoireTranslator = Object.freeze({
    translateText,
    translatePage,
    collectTranslatableTexts,
    getCurrentLanguage,
    getCachedTranslation,
    setCachedTranslation,
    clearCache,
    getStatus,
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true,
    });
  } else {
    init();
  }
})();