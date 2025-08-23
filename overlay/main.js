const { app, BrowserWindow, globalShortcut, screen } = require('electron');
const path = require('path');

let mainWindow;
let isVisible = true;

function createWindow() {
    // Получаем размеры основного экрана
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        x: 0,
        y: 0,
        transparent: true,
        frame: false,
        titleBarOverlay: false,
        fullscreen: false,
        alwaysOnTop: true,
        skipTaskbar: false,
        type: 'normal',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            allowRunningInsecureContent: true,
            enableRemoteModule: true,
            // Добавляем задержку перед загрузкой скриптов
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Делаем окно кликпрозрачным, но с возможностью переключения
    let isClickThrough = true;
    mainWindow.setIgnoreMouseEvents(isClickThrough, { forward: true });

    // Добавляем горячую клавишу для переключения режима кликпрозрачности
    globalShortcut.register('Alt+C', () => {
        isClickThrough = !isClickThrough;
        mainWindow.setIgnoreMouseEvents(isClickThrough, { forward: true });
        console.log(`Кликпрозрачность ${isClickThrough ? 'включена' : 'выключена'}`);
    });

    // Получаем HUD ID из аргументов командной строки
    const hudArg = process.argv.find(arg => arg.startsWith('--hud='));
    const hudId = hudArg ? hudArg.split('=')[1] : 'Default HUD';

    // Загружаем наш HUD
    mainWindow.loadURL(`http://localhost:2626/hud/${hudId}`);

    // Добавляем обработчик ошибок загрузки ресурсов
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Ошибка загрузки:', errorCode, errorDescription);
        // Пробуем перезагрузить страницу через небольшую задержку
        setTimeout(() => mainWindow.reload(), 1000);
    });

    // Показываем окно после загрузки контента
    mainWindow.webContents.on('did-finish-load', () => {
        // Выполняем скрипт для проверки загрузки jQuery
        mainWindow.webContents.executeJavaScript(`
            if (typeof jQuery === 'undefined') {
                console.error('jQuery не загружен!');
                // Пробуем загрузить jQuery вручную
                const script = document.createElement('script');
                script.src = '/js/jquery-3.7.1.min.js';
                document.head.appendChild(script);
            } else {
                console.log('jQuery успешно загружен');
            }
        `);
        
        mainWindow.show();
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
        mainWindow.focus();
    });

    // Регистрируем горячие клавиши
    registerShortcuts();

    // Отключаем кнопки управления окном
    mainWindow.setWindowButtonVisibility(false);
}

function registerShortcuts() {
    // Alt+X для показа/скрытия HUD
    globalShortcut.register('Alt+X', () => {
        if (isVisible) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.setAlwaysOnTop(true, 'screen-saver');
        }
        isVisible = !isVisible;
    });

    // Alt+Q для закрытия
    globalShortcut.register('Alt+Q', () => {
        app.quit();
    });

    // Numpad + для увеличения прозрачности
    globalShortcut.register('Num+', () => {
        const opacity = Math.min(mainWindow.getOpacity() + 0.1, 1.0);
        mainWindow.setOpacity(opacity);
    });

    // Numpad - для уменьшения прозрачности
    globalShortcut.register('Num-', () => {
        const opacity = Math.max(mainWindow.getOpacity() - 0.1, 0.1);
        mainWindow.setOpacity(opacity);
    });

    // Ctrl+Shift+I для открытия DevTools
    globalShortcut.register('Ctrl+Shift+I', () => {
        mainWindow.webContents.openDevTools();
    });
    // Ctrl+R для обновления страницы
    globalShortcut.register('CommandOrControl+R', () => {
        mainWindow.reload();
        console.log('Перезагрузка страницы');
    });
}

// Запускаем создание окна после готовности приложения
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Очистка горячих клавиш при выходе
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// Предотвращаем закрытие приложения при закрытии окна
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Обработка ошибок
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});