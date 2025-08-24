const { app, BrowserWindow, globalShortcut, screen } = require('electron');
const path = require('path');

let mainWindow;
let isVisible = true;

function createWindow() {
    // Получаем размеры основного экрана с учетом панели задач
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size; // Используем полный размер экрана
    const { x, y } = primaryDisplay.bounds; // Получаем координаты экрана
    
    // Получаем размеры рабочей области (без панели задач)
    const { width: workWidth, height: workHeight } = primaryDisplay.workAreaSize;
    
    // Вычисляем размеры панели задач
    const taskbarWidth = width - workWidth;
    const taskbarHeight = height - workHeight;
    
    // Определяем позицию панели задач
    let taskbarPosition = 'unknown';
    if (taskbarHeight > 0 && taskbarHeight < 100) {
        taskbarPosition = 'bottom'; // Панель задач снизу
    } else if (taskbarWidth > 0 && taskbarWidth < 100) {
        taskbarPosition = 'right'; // Панель задач справа
    } else if (workWidth < width && workHeight === height) {
        taskbarPosition = 'left'; // Панель задач слева
    }
    
    console.log(`[DISPLAY] Полный экран: ${width}x${height}`);
    console.log(`[DISPLAY] Рабочая область: ${workWidth}x${workHeight}`);
    console.log(`[DISPLAY] Панель задач: ${taskbarWidth}x${taskbarHeight} (позиция: ${taskbarPosition})`);
    console.log(`[DISPLAY] Координаты экрана: x=${x}, y=${y}`);
    
    // Автоматически выбираем оптимальный размер окна
    let optimalWidth, optimalHeight, optimalX, optimalY;
    
    if (taskbarPosition === 'bottom') {
        // Панель задач снизу - покрываем весь экран
        optimalWidth = width;
        optimalHeight = height;
        optimalX = x;
        optimalY = y;
        console.log(`[DISPLAY] Панель задач снизу - используем полный экран`);
    } else if (taskbarPosition === 'right' || taskbarPosition === 'left') {
        // Панель задач справа или слева - используем рабочую область
        optimalWidth = workWidth;
        optimalHeight = workHeight;
        optimalX = workWidth === width ? x : (taskbarPosition === 'right' ? x : x + taskbarWidth);
        optimalY = y;
        console.log(`[DISPLAY] Панель задач ${taskbarPosition} - используем рабочую область`);
    } else {
        // Неизвестная позиция - используем полный экран
        optimalWidth = width;
        optimalHeight = height;
        optimalX = x;
        optimalY = y;
        console.log(`[DISPLAY] Неизвестная позиция панели задач - используем полный экран`);
    }

    mainWindow = new BrowserWindow({
        width: optimalWidth,        // Оптимальная ширина
        height: optimalHeight,      // Оптимальная высота
        x: optimalX,               // Оптимальная X координата
        y: optimalY,               // Оптимальная Y координата
        transparent: true,
        frame: false,
        titleBarOverlay: false,
        fullscreen: true,           // ✅ Полноэкранный режим для заполнения всего экрана
        alwaysOnTop: true,
        skipTaskbar: false,
        type: 'normal',
        resizable: false,           // ✅ Запрещаем изменение размера
        maximizable: false,         // ✅ Запрещаем максимизацию
        minimizable: false,         // ✅ Запрещаем минимизацию
        closable: false,            // ✅ Запрещаем закрытие
        webPreferences: {
            // devTools: true,
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            allowRunningInsecureContent: true,
            enableRemoteModule: true,
            // Добавляем задержку перед загрузкой скриптов
            preload: path.join(__dirname, 'preload.js')
        }
    });
    
    console.log(`[DISPLAY] Создано окно: ${optimalWidth}x${optimalHeight} (x=${optimalX}, y=${optimalY})`);

    // Принудительно устанавливаем размер и позицию окна
    mainWindow.setBounds({ x: optimalX, y: optimalY, width: optimalWidth, height: optimalHeight });
    mainWindow.setFullScreen(true); // Принудительно включаем полноэкранный режим
    
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
    
    // Логируем информацию о всех мониторах
    const displays = screen.getAllDisplays();
    console.log(`[DISPLAY] Всего мониторов: ${displays.length}`);
    displays.forEach((display, index) => {
        console.log(`[DISPLAY] Монитор ${index}:`);
        console.log(`  - Полный размер: ${display.size.width}x${display.size.height}`);
        console.log(`  - Рабочая область: ${display.workAreaSize.width}x${display.workAreaSize.height}`);
        console.log(`  - Координаты: x=${display.bounds.x}, y=${display.bounds.y}`);
        console.log(`  - Масштаб: ${display.scaleFactor}`);
        console.log(`  - Основной: ${display.id === primaryDisplay.id ? 'ДА' : 'НЕТ'}`);
    });
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
    
    // Alt+O для переключения режима отображения (с панелью задач / без)
    globalShortcut.register('Alt+O', () => {
        const currentBounds = mainWindow.getBounds();
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.size;
        const { width: workWidth, height: workHeight } = primaryDisplay.workAreaSize;
        const { x, y } = primaryDisplay.bounds;
        
        // Определяем позицию панели задач
        const taskbarHeight = height - workHeight;
        const taskbarWidth = width - workWidth;
        let taskbarPosition = 'unknown';
        
        if (taskbarHeight > 0 && taskbarHeight < 100) {
            taskbarPosition = 'bottom';
        } else if (taskbarWidth > 0 && taskbarWidth < 100) {
            taskbarPosition = 'right';
        } else if (workWidth < width && workHeight === height) {
            taskbarPosition = 'left';
        }
        
        if (currentBounds.width === width && currentBounds.height === height) {
            // Сейчас полный экран - переключаемся на рабочую область
            let newX = x, newY = y;
            if (taskbarPosition === 'right') {
                newX = x;
            } else if (taskbarPosition === 'left') {
                newX = x + taskbarWidth;
            }
            
            mainWindow.setFullScreen(false); // Отключаем полноэкранный режим
            mainWindow.setBounds({ x: newX, y: newY, width: workWidth, height: workHeight });
            console.log(`[DISPLAY] Переключились на рабочую область: ${workWidth}x${workHeight} (x=${newX}, y=${newY})`);
        } else {
            // Сейчас рабочая область - переключаемся на полный экран
            mainWindow.setBounds({ x, y, width, height });
            mainWindow.setFullScreen(true); // Включаем полноэкранный режим
            console.log(`[DISPLAY] Переключились на полный экран: ${width}x${height} (x=${x}, y=${y})`);
        }
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