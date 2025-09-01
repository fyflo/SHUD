// Этот скрипт выполняется перед загрузкой страницы
window.addEventListener('DOMContentLoaded', () => {
  // Проверяем, загружен ли jQuery
  if (typeof window.jQuery === 'undefined') {
      console.log('Загружаем jQuery...');
      // Если jQuery не загружен, добавляем его вручную
      const script = document.createElement('script');
      script.src = '/js/jquery-3.7.1.min.js';
      script.onload = () => {
          console.log('jQuery загружен успешно');
      };
      script.onerror = (error) => {
          console.error('Ошибка загрузки jQuery:', error);
      };
      document.head.appendChild(script);
  }
});