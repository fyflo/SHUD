const fs = require('fs');
const path = require('path');

// Функция для патча server.js
function patchServerFile() {
  console.log('Запуск функции патча server.js...');
  
  // Определяем путь к server.js
  const serverPath = path.join(process.cwd(), '..', 'server', 'server.js');
  console.log('Путь к server.js:', serverPath);
  
  // Проверяем существование файла
  if (!fs.existsSync(serverPath)) {
    console.error('Файл server.js не найден:', serverPath);
    return false;
  }
  
  // Читаем содержимое файла
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Проверяем, содержит ли файл уже наш патч
  if (serverContent.includes('// PATCH_APPLIED_FOR_ELECTRON')) {
    console.log('Патч уже применен к server.js');
    return true;
  }
  
  // Патч для исправления проблемы с модулем open
  const openPattern = /const\s+open\s*=\s*require\(['"]open['"]\);/;
  if (openPattern.test(serverContent)) {
    console.log('Найден импорт модуля open, применяем патч...');
    
    // Заменяем импорт open на условный импорт
    const patchedContent = serverContent.replace(
      openPattern,
      `// PATCH_APPLIED_FOR_ELECTRON
// Условный импорт модуля open для совместимости с Electron
let open;
try {
  open = require('open');
} catch (error) {
  console.log('Модуль open не найден, используем заглушку');
  open = (url) => console.log('Открытие URL в браузере:', url);
}`
    );
    
    // Сохраняем изменения
    fs.writeFileSync(serverPath, patchedContent);
    console.log('Патч успешно применен к server.js');
    return true;
  }
  
  console.log('Импорт модуля open не найден в server.js');
  return false;
}

module.exports = { patchServerFile };
