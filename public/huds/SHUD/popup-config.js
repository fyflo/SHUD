// Конфигурация всплывающего слова для HUD fyflo_CS2_Dacha
window.popupWordConfig = {
  // Текст по умолчанию
  defaultText: 'POPUP!',
  
  // Длительность показа в миллисекундах
  duration: 3000,
  
  // Включить/выключить анимации
  animation: true,
  
  // Цвета (CSS переменные)
  colors: {
    background: 'linear-gradient(45deg, #ff6b6b, #ff8e53)',
    text: '#ffffff',
    shadow: 'rgba(0, 0, 0, 0.5)'
  },
  
  // Размеры
  size: {
    fontSize: '48px',
    padding: '20px 40px',
    minWidth: '200px'
  },
  
  // Позиционирование
  position: {
    top: '50%',
    left: '50%',
    zIndex: 9999
  },
  
  // Анимации
  animations: {
    showDuration: 600,
    hideDuration: 300,
    bounce: true
  },
  
  // Звуки (опционально)
  sounds: {
    enabled: false,
    showSound: '',
    hideSound: ''
  }
};

// Функция для обновления конфигурации
window.updatePopupConfig = function(newConfig) {
  Object.assign(window.popupWordConfig, newConfig);
  console.log('Popup word config updated:', window.popupWordConfig);
};

// Функция для получения конфигурации
window.getPopupConfig = function() {
  return window.popupWordConfig;
};
