// utils.js - Утилиты и вспомогательные функции
export const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

export const fetchAPI = async (endpoint, options = {}) => {
    try {
        const response = await fetch(endpoint, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            // Проверяем тип содержимого ответа
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                // Если это JSON, обрабатываем как обычно
                const error = await response.json();
                throw new Error(error.message || 'API request failed');
            } else {
                // Если это не JSON (например, HTML), получаем текст и выводим более информативную ошибку
                const errorText = await response.text();
                console.error('Сервер вернул не JSON:', errorText.substring(0, 100) + '...');
                throw new Error(`Сервер вернул ошибку: ${response.status} ${response.statusText}`);
            }
        }
        
        // Проверяем тип содержимого успешного ответа
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('Ответ не является JSON:', contentType);
            // Пытаемся распарсить как JSON, но готовимся к ошибке
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('Не удалось распарсить ответ как JSON:', text.substring(0, 100) + '...');
                throw new Error('Сервер вернул некорректный формат данных');
            }
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};