// Текущая версия приложения - обновляйте это значение при каждом релизе
const CURRENT_VERSION = "1.0.5";

// Получаем локальную версию с сервера
async function getLocalVersion() {
    try {
        const response = await fetch('/api/version', { cache: 'no-store' });
        if (!response.ok) throw new Error('Ошибка получения локальной версии');
        const data = await response.json();
        return data.version;
    } catch (e) {
        console.error('Ошибка при получении локальной версии:', e);
        return null;
    }
}

// Функция для проверки обновлений
async function checkForUpdates() {
    try {
        console.log('Проверка обновлений...');
        // Получаем локальную версию с сервера
        const currentVersion = await getLocalVersion();
        if (!currentVersion) return false;

        // Получаем последнюю версию напрямую с GitHub
        const response = await fetch('https://raw.githubusercontent.com/fyflo/SHUD/main/package.json', {
            cache: 'no-store',
            mode: 'cors'
        });
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        const data = await response.json();
        const latestVersion = data.version;

        console.log(`Текущая версия: ${currentVersion}`);
        console.log(`Последняя версия: ${latestVersion}`);

        // Сравниваем версии
        const needsUpdate = compareVersions(currentVersion, latestVersion) < 0;

        if (needsUpdate) {
            console.log('Доступно обновление!');
            showUpdateNotification(currentVersion, latestVersion);
            return true;
        } else {
            console.log('У вас установлена последняя версия.');
            return false;
        }
    } catch (error) {
        console.error('Ошибка при проверке обновлений:', error);
        return false;
    }
}

// Функция для сравнения версий
function compareVersions(v1, v2) {
    const v1parts = v1.split('.').map(Number);
    const v2parts = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
        const v1part = v1parts[i] || 0;
        const v2part = v2parts[i] || 0;
        
        if (v1part > v2part) return 1;
        if (v1part < v2part) return -1;
    }
    return 0;
}

// Функция для отображения уведомления об обновлении
function showUpdateNotification(currentVersion, latestVersion) {
    // Создаем элемент уведомления
    const notification = document.createElement("div");
    notification.style.position = "fixed";
    notification.style.bottom = "20px";
    notification.style.right = "20px";
    notification.style.backgroundColor = "#2a2a2a";
    notification.style.color = "white";
    notification.style.padding = "15px";
    notification.style.borderRadius = "5px";
    notification.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    notification.style.zIndex = "1000";
    notification.style.maxWidth = "350px";
    
    notification.innerHTML = `
        <div>
            <h3 style="margin-top: 0; color: #4CAF50;">Доступно обновление!</h3>
            <p>Текущая версия: ${currentVersion}</p>
            <p>Новая версия: ${latestVersion}</p>
            <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                <a href="https://github.com/fyflo/SHUD/releases/latest" target="_blank" 
                   style="background-color: #4CAF50; color: white; padding: 8px 16px; 
                   border-radius: 4px; text-decoration: none;">Скачать обновление</a>
                <button style="background-color: transparent; color: #aaa; border: 1px solid #aaa; 
                       padding: 8px 16px; border-radius: 4px; cursor: pointer;">Закрыть</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Обработчик для кнопки "Закрыть"
    notification.querySelector("button").addEventListener("click", () => {
        notification.style.display = "none";
    });
}

// Запускаем проверку обновлений при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    // Проверяем обновления с небольшой задержкой, чтобы страница успела загрузиться
    setTimeout(checkForUpdates, 2000);
});
