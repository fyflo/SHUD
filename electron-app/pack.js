const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

// Пути для упаковки
const sourceDir = path.join(__dirname);
const buildDir = path.join(__dirname, 'simple-build');
const appDir = path.join(buildDir, 'CS2 HUD Manager');
const serverDir = path.join(appDir, 'server');
const publicDir = path.join(appDir, 'public');
const cfgDir = path.join(appDir, 'cfg');

// Очистка и создание директории сборки
console.log('Очистка директории сборки...');
fs.removeSync(buildDir);
fs.mkdirSync(appDir, { recursive: true });

// Копирование основных файлов приложения
console.log('Копирование основных файлов приложения...');
fs.copySync(path.join(sourceDir, 'main.js'), path.join(appDir, 'main.js'));
fs.copySync(path.join(sourceDir, 'index.html'), path.join(appDir, 'index.html'));
fs.copySync(path.join(sourceDir, 'preload.js'), path.join(appDir, 'preload.js'));
fs.copySync(path.join(sourceDir, 'server-wrapper.js'), path.join(appDir, 'server-wrapper.js'));
fs.copySync(path.join(sourceDir, 'db-fix.js'), path.join(appDir, 'db-fix.js'));

// Копирование node_modules
console.log('Копирование node_modules для electron...');
const electronModules = [
  'electron',
  'path',
  'fs',
  'net',
  'child_process',
  'events',
  'util',
  'stream',
  'buffer',
  'process'
];

// Создание package.json для дистрибутива
console.log('Создание package.json...');
const packageJson = {
  name: "cs2-hud-manager",
  version: "1.0.0",
  description: "CS2 HUD Manager Desktop Application",
  main: "main.js",
  author: "fyflo",
  license: "MIT",
  dependencies: {}
};
fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(packageJson, null, 2));

// Копирование server, public, cfg директорий
console.log('Копирование server директории...');
fs.copySync(path.join(sourceDir, '..', 'server'), serverDir);

console.log('Копирование public директории...');
fs.copySync(path.join(sourceDir, '..', 'public'), publicDir);

console.log('Копирование cfg директории...');
fs.copySync(path.join(sourceDir, '..', 'cfg'), cfgDir);

// Копирование database.db и favicon.ico
console.log('Копирование database.db...');
fs.copySync(path.join(sourceDir, '..', 'database.db'), path.join(appDir, 'database.db'));

console.log('Копирование favicon.ico...');
fs.copySync(path.join(sourceDir, '..', 'favicon.ico'), path.join(appDir, 'favicon.ico'));

// Создание запускающего .bat файла
console.log('Создание запускающего bat-файла...');
const batContent = `@echo off
echo Запуск CS2 HUD Manager...
start "" "%~dp0\\node_modules\\.bin\\electron.cmd" "%~dp0"
`;
fs.writeFileSync(path.join(appDir, 'CS2_HUD_Manager.bat'), batContent);

// Создаем shortcut
console.log('Сборка успешно завершена!');
console.log('Приложение готово в папке:', appDir);

// Создание zip архива
function createZipArchive() {
  return new Promise((resolve, reject) => {
    const zipPath = path.join(buildDir, 'CS2_HUD_Manager.zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Максимальное сжатие
    });
    
    output.on('close', () => {
      console.log('Создан ZIP-архив:', zipPath);
      console.log('Размер архива:', Math.round(archive.pointer() / 1024 / 1024 * 100) / 100, 'MB');
      resolve();
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    archive.directory(appDir, 'CS2 HUD Manager');
    archive.finalize();
  });
}

// Функция запуска
async function run() {
  try {
    // Установка необходимых зависимостей в директории приложения
    console.log('Установка electron и необходимых зависимостей...');
    process.chdir(appDir);
    execSync('npm install --no-save --no-package-lock electron@28.0.0', { stdio: 'inherit' });
    
    // Создание ZIP-архива
    console.log('Создание ZIP-архива...');
    await createZipArchive();
    
    console.log('Готово! Приложение упаковано и готово к использованию.');
  } catch (error) {
    console.error('Ошибка упаковки:', error);
    process.exit(1);
  }
}

run(); 