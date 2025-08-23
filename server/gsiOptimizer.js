const EventEmitter = require('events');

class GSIOptimizer extends EventEmitter {
    constructor() {
        super();
        this.updateQueue = [];
        this.processing = false;
        this.lastUpdate = null;
        this.updateInterval = 100; // Минимальный интервал между обновлениями (мс)
        this.batchSize = 10; // Максимальное количество обновлений в пакете
    }

    // Добавление обновления в очередь
    queueUpdate(data) {
        this.updateQueue.push(data);
        
        if (!this.processing) {
            this.processQueue();
        }
    }

    // Обработка очереди обновлений
    async processQueue() {
        if (this.processing || this.updateQueue.length === 0) {
            return;
        }

        this.processing = true;

        try {
            // Группируем обновления в пакеты
            const batch = this.updateQueue.splice(0, this.batchSize);
            
            // Объединяем данные из пакета
            const mergedData = this.mergeUpdates(batch);
            
            // Проверяем, прошло ли достаточно времени с последнего обновления
            const now = Date.now();
            if (this.lastUpdate && now - this.lastUpdate < this.updateInterval) {
                await new Promise(resolve => 
                    setTimeout(resolve, this.updateInterval - (now - this.lastUpdate))
                );
            }

            // Отправляем объединенные данные
            this.emit('update', mergedData);
            this.lastUpdate = Date.now();

        } catch (error) {
            console.error('Ошибка при обработке очереди GSI:', error);
        } finally {
            this.processing = false;
            
            // Если в очереди остались обновления, продолжаем обработку
            if (this.updateQueue.length > 0) {
                this.processQueue();
            }
        }
    }

    // Объединение нескольких обновлений в одно
    mergeUpdates(updates) {
        if (updates.length === 1) {
            return updates[0];
        }

        // Создаем глубокую копию первого обновления
        const merged = JSON.parse(JSON.stringify(updates[0]));

        // Объединяем последующие обновления
        for (let i = 1; i < updates.length; i++) {
            this.deepMerge(merged, updates[i]);
        }

        return merged;
    }

    // Глубокое объединение объектов
    deepMerge(target, source) {
        for (const key in source) {
            if (source[key] instanceof Object && !Array.isArray(source[key])) {
                if (!target[key]) {
                    target[key] = {};
                }
                this.deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }

    // Очистка очереди
    clearQueue() {
        this.updateQueue = [];
        this.processing = false;
        this.lastUpdate = null;
    }
}

module.exports = new GSIOptimizer(); 