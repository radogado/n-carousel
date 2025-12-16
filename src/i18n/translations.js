/**
 * Internationalization module
 * Handles translation loading and management
 */

let translations = {};
let translationsLoaded = false;

/**
 * Built-in English translations
 */
const DEFAULT_TRANSLATIONS = {
  en: {
    carousel: 'Carousel',
    previous: 'Previous slide',
    next: 'Next slide',
    navigation: 'Navigation',
    item: 'Go to item {current} of {total}',
    current_item: 'Item {current} of {total}',
    close: 'Close',
    fullscreen: 'Full screen'
  }
};

/**
 * Initialize translations with custom data
 * @param {Object} customTranslations - Custom translation object
 */
export const initWithTranslations = (customTranslations) => {
  if (customTranslations) {
    Object.keys(customTranslations).forEach(lang => {
      translations[lang] = {
        ...translations[lang],
        ...customTranslations[lang]
      };
    });
  }
};

/**
 * Load translations from JSON file
 * @param {string} lang - Language code
 * @returns {Promise<void>}
 */
export const loadTranslations = async (lang = 'en') => {
  if (lang === 'en') {
    translations = DEFAULT_TRANSLATIONS;
    translationsLoaded = true;
    return;
  }

  try {
    const response = await fetch('translations.json');
    if (response.ok) {
      const data = await response.json();
      translations = { ...DEFAULT_TRANSLATIONS, ...data };
      translationsLoaded = true;
    } else {
      throw new Error(`Failed to load translations: ${response.status}`);
    }
  } catch (error) {
    console.warn('Failed to load translations:', error);
    translations = DEFAULT_TRANSLATIONS;
    translationsLoaded = true; // Mark as loaded to prevent infinite waiting
  }
};

/**
 * Translate a key with optional parameters
 * @param {string} key - Translation key
 * @param {Object} params - Parameters to replace in translation
 * @returns {string} Translated string
 */
export const translate = (key, params = {}) => {
  if (!translationsLoaded) {
    return key; // Return key if translations aren't loaded yet
  }

  const htmlLang = document.documentElement.lang;
  const lang = htmlLang || 'en';
  const translation = translations[lang]?.[key] || translations.en?.[key] || key;

  // Replace parameters in translation string
  return translation.replace(/\{(\w+)\}/g, (match, param) => {
    return params[param] !== undefined ? params[param] : match;
  });
};

/**
 * Check if translations are loaded
 * @returns {boolean} True if loaded
 */
export const areTranslationsLoaded = () => translationsLoaded;

// Expose to window for backward compatibility
if (typeof window !== 'undefined') {
  window.initWithTranslations = initWithTranslations;
}

