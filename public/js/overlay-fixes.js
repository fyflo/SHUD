/**
 * ИСПРАВЛЕНИЯ ДЛЯ ОВЕРЛЕЯ SHUD
 * Автоматически исправляет проблемы с разрешением монитора и скроллбарами
 */

class OverlayFixes {
    constructor() {
        this.screenWidth = window.screen.width;
        this.screenHeight = window.screen.height;
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        
        console.log('🔧 OverlayFixes: Инициализация');
        console.log('📱 Разрешение экрана:', this.screenWidth + 'x' + this.screenHeight);
        console.log('🖥️  Размер окна:', this.windowWidth + 'x' + this.windowHeight);
        console.log('📐 Pixel Ratio:', this.devicePixelRatio);
        
        this.init();
    }
    
    init() {
        // Запускаем исправления после загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.applyFixes());
        } else {
            this.applyFixes();
        }
        
        // Применяем исправления при изменении размера окна
        window.addEventListener('resize', () => this.applyFixes());
        
        // Применяем исправления при изменении ориентации
        window.addEventListener('orientationchange', () => this.applyFixes());
        
        // Применяем исправления каждые 5 секунд (на случай динамического контента)
        setInterval(() => this.applyFixes(), 5000);
    }
    
    applyFixes() {
        this.fixScrollbars();
        this.fixResolution();
        this.fixHUDElements();
        this.fixOverflow();
        this.fixIframes();
        this.fixTables();
        this.fixForms();
        this.fixModals();
        
        console.log('✅ OverlayFixes: Все исправления применены');
    }
    
    /**
     * Исправление скроллбаров
     */
    fixScrollbars() {
        // Скрываем скроллбары для всех элементов
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
            if (element.style) {
                element.style.overflow = 'hidden';
                element.style.scrollbarWidth = 'none';
                element.style.msOverflowStyle = 'none';
            }
        });
        
        // Добавляем CSS для скрытия скроллбаров
        this.addCSS(`
            * {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
            }
            *::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
            }
        `);
    }
    
    /**
     * Исправление разрешения монитора
     */
    fixResolution() {
        // Определяем текущее разрешение
        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;
        
        // Устанавливаем правильные размеры для оверлея
        const overlayContainer = document.querySelector('.overlay-container') || document.body;
        
        if (overlayContainer) {
            overlayContainer.style.width = currentWidth + 'px';
            overlayContainer.style.height = currentHeight + 'px';
            overlayContainer.style.overflow = 'hidden';
            overlayContainer.style.position = 'fixed';
            overlayContainer.style.top = '0';
            overlayContainer.style.left = '0';
            overlayContainer.style.zIndex = '9999';
        }
        
        // Исправляем размеры HUD элементов
        this.fixHUDSizes(currentWidth, currentHeight);
    }
    
    /**
     * Исправление размеров HUD элементов
     */
    fixHUDSizes(width, height) {
        // Адаптивные размеры для разных разрешений
        const hudElements = {
            '#top_panel': { width: Math.min(width * 0.8, 1600), height: 70 },
            '#left_team': { width: Math.min(width * 0.2, 400), height: 70 },
            '#right_team': { width: Math.min(width * 0.2, 400), height: 70 },
            '#center_section': { width: Math.min(width * 0.4, 600), height: 70 },
            '#radar-container': { width: Math.min(width * 0.15, 200), height: Math.min(height * 0.15, 200) }
        };
        
        Object.entries(hudElements).forEach(([selector, sizes]) => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.width = sizes.width + 'px';
                element.style.height = sizes.height + 'px';
                element.style.overflow = 'hidden';
            }
        });
    }
    
    /**
     * Исправление HUD элементов
     */
    fixHUDElements() {
        const hudSelectors = [
            '#top_panel', '#left_team', '#right_team', '#center_section',
            '#radar-container', '#players_alive', '#timers', '#bomb_bar',
            '#defuse_bar', '#alert_middle_holder'
        ];
        
        hudSelectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.overflow = 'hidden';
                element.style.scrollbarWidth = 'none';
                element.style.msOverflowStyle = 'none';
            }
        });
    }
    
    /**
     * Исправление overflow
     */
    fixOverflow() {
        // Находим все элементы с overflow
        const overflowElements = document.querySelectorAll('[style*="overflow"], [class*="scroll"], [class*="overflow"]');
        
        overflowElements.forEach(element => {
            element.style.overflow = 'hidden';
            element.style.scrollbarWidth = 'none';
            element.style.msOverflowStyle = 'none';
        });
    }
    
    /**
     * Исправление iframe
     */
    fixIframes() {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            iframe.style.overflow = 'hidden';
            iframe.style.scrollbarWidth = 'none';
            iframe.style.msOverflowStyle = 'none';
        });
    }
    
    /**
     * Исправление таблиц
     */
    fixTables() {
        const tables = document.querySelectorAll('table, .players-table, .player-stats-table');
        tables.forEach(table => {
            table.style.overflow = 'hidden';
            table.style.scrollbarWidth = 'none';
            table.style.msOverflowStyle = 'none';
        });
    }
    
    /**
     * Исправление форм
     */
    fixForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.style.overflow = 'hidden';
            form.style.scrollbarWidth = 'none';
            form.style.msOverflowStyle = 'none';
        });
    }
    
    /**
     * Исправление модальных окон
     */
    fixModals() {
        const modals = document.querySelectorAll('.modal, .popup, .overlay');
        modals.forEach(modal => {
            modal.style.overflow = 'hidden';
            modal.style.scrollbarWidth = 'none';
            modal.style.msOverflowStyle = 'none';
        });
    }
    
    /**
     * Добавление CSS стилей
     */
    addCSS(css) {
        const style = document.createElement('style');
        style.textContent = css;
        style.id = 'overlay-fixes-styles';
        
        // Удаляем старые стили если есть
        const oldStyle = document.getElementById('overlay-fixes-styles');
        if (oldStyle) {
            oldStyle.remove();
        }
        
        document.head.appendChild(style);
    }
    
    /**
     * Получение информации о системе
     */
    getSystemInfo() {
        return {
            screenWidth: this.screenWidth,
            screenHeight: this.screenHeight,
            windowWidth: this.windowWidth,
            windowHeight: this.windowHeight,
            devicePixelRatio: this.devicePixelRatio,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
        };
    }
    
    /**
     * Принудительное применение исправлений
     */
    forceApply() {
        console.log('🚀 OverlayFixes: Принудительное применение исправлений');
        this.applyFixes();
        
        // Повторно применяем через небольшую задержку
        setTimeout(() => this.applyFixes(), 100);
        setTimeout(() => this.applyFixes(), 500);
        setTimeout(() => this.applyFixes(), 1000);
    }
}

// Автоматический запуск исправлений
let overlayFixes;

// Запускаем после загрузки страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        overlayFixes = new OverlayFixes();
    });
} else {
    overlayFixes = new OverlayFixes();
}

// Делаем доступным глобально
window.overlayFixes = overlayFixes;

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OverlayFixes;
}
