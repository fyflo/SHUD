class OverlayManager {
    constructor() {
        this.activeOverlays = new Set();
        this.initializeEventListeners();
    }

// ... existing code ...

initializeEventListeners() {
    // Обработчик для кнопок закрытия
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-overlay-btn')) {
            const overlayId = e.target.closest('.overlay-container').dataset.overlayId;
            if (overlayId) {
                this.closeOverlay(overlayId);
            }
        }
    });

    // Обработчик клавиш Escape и Alt+Q
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            this.closeAllOverlays();
        }
        // Обновленная обработка Alt+Q
        if (e.key.toLowerCase() === 'q' && e.altKey) {
            e.preventDefault(); // Предотвращаем действие браузера по умолчанию
            e.stopPropagation(); // Останавливаем всплытие события
            this.closeAllOverlays();
            return false; // Дополнительная защита от всплытия
        }
    }, true); // Добавляем capture: true для перехвата события на этапе погружения
}

// ... existing code ...

// ... existing code ...

async startOverlay(hudId) {
    try {
        // Проверяем, не является ли событие результатом нажатия Alt+Q
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'BODY' && window.event && window.event.altKey) {
            return; // Прерываем создание оверлея если это Alt+Q
        }

        const response = await fetch('/api/start-overlay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ hudId })
        });

        // ... остальной код метода ...
    } catch (error) {
        console.error('Error starting overlay:', error);
        throw error;
    }
}

// ... existing code ...

    closeOverlay(overlayId) {
        const overlayContainer = document.querySelector(`.overlay-container[data-overlay-id="${overlayId}"]`);
        if (overlayContainer) {
            overlayContainer.remove();
            this.activeOverlays.delete(overlayId);
        }
    }

    closeAllOverlays() {
        this.activeOverlays.forEach(overlayId => this.closeOverlay(overlayId));
        this.activeOverlays.clear();
    }

    makeOverlayDraggable(overlayContainer) {
        const header = overlayContainer.querySelector('.overlay-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.addEventListener('mousedown', startDragging);

        function startDragging(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === header) {
                isDragging = true;
            }
        }

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDragging);

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, overlayContainer);
            }
        }

        function stopDragging() {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }
    }
}

// Создаем глобальный экземпляр OverlayManager
window.overlayManager = new OverlayManager();

// Обработка ошибок
window.addEventListener('error', (event) => {
    console.error('Необработанная ошибка:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Необработанная ошибка Promise:', event.reason);
});