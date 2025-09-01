// Глобальные переменные для локализации с уникальными именами
let i18nCurrentLang = localStorage.getItem('i18nPreferredLanguage') || 'ru';
let i18nTranslations = {};

// Загрузить переводы для указанного языка
async function loadLanguage(lang) {
  try {
    const response = await fetch(`/locales/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load language ${lang}`);
    }
    
    i18nTranslations = await response.json();
    i18nCurrentLang = lang;
    localStorage.setItem('i18nPreferredLanguage', lang);
    
    // Обновить все элементы с атрибутом data-i18n
    translatePage();
    
    console.log(`Язык изменен на ${lang}`);
    return true;
  } catch (error) {
    console.error('Ошибка при загрузке языка:', error);
    // Если загрузка не удалась, попробуем загрузить русский язык как резервный
    if (lang !== 'ru') {
      return loadLanguage('ru');
    }
    return false;
  }
}

// Получить перевод для ключа
function i18n(key) {
  return i18nTranslations[key] || key;
}

// Перевести всю страницу
function translatePage() {
    // Находим все элементы с атрибутом data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && i18nTranslations[key]) {
        // Для input с placeholder обрабатываем placeholder, а не textContent
        if (el.tagName === 'INPUT') {
          // Обновляем placeholder, даже если атрибут placeholder не существует изначально
          el.setAttribute('placeholder', i18nTranslations[key]);
          //console.log('Обновлен placeholder для', key, 'на', i18nTranslations[key]);
        } 
        // Особая обработка для опций select
        else if (el.tagName === 'OPTION') {
          el.text = i18nTranslations[key];
        }
        else {
          el.textContent = i18nTranslations[key];
        }
      } else {
        //console.log('Нет перевода для ключа:', key);
      }
    });
    
    // Обновляем title страницы
    if (i18nTranslations.appTitle) {
      document.title = i18nTranslations.appTitle;
    }
    
    // Особая обработка для селекторов команд
    updateTeamSelectors();
}

// Обновить селекторы команд с переводами
function updateTeamSelectors() {
  // Находим все селекторы команд
  const teamSelectors = document.querySelectorAll('.team-selector');
  
  // Если нет селекторов команд, просто выходим из функции
  if (!teamSelectors.length) {
    return;
  }
  
  // Обрабатываем каждый селектор
  teamSelectors.forEach(selector => {
    const options = selector.querySelectorAll('option');
    options.forEach(option => {
      // Если у опции есть атрибут data-i18n-team, используем его для перевода
      const teamKey = option.getAttribute('data-i18n-team');
      if (teamKey && i18nTranslations[teamKey]) {
        option.text = i18nTranslations[teamKey];
      }
    });
  });
}

// Инициализировать выбор языка
function initializeLanguage() {
  // Загрузить сохраненный язык
  loadLanguage(i18nCurrentLang);
  
  // Настроить селектор языка, если он существует
  const langSelector = document.getElementById('language-selector');
  if (langSelector) {
    langSelector.value = i18nCurrentLang;
    langSelector.addEventListener('change', (e) => {
      loadLanguage(e.target.value);
    });
  }
}

// Запустить инициализацию языка при загрузке страницы
document.addEventListener('DOMContentLoaded', initializeLanguage);