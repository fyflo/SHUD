// modules/server.js - Модуль для работы с сервером
import { fetchAPI } from '../utils.js';
import { state, updateState } from '../state.js';

export const serverModule = {
    async initialize() {
        try {
            const serverInfo = await fetchAPI('/api/server-info');
            updateState('serverInfo', serverInfo);
            console.log(`Сервер обнаружен на http://${serverInfo.ip}:${serverInfo.port}`);
        } catch (error) {
            console.error('Ошибка инициализации сервера:', error);
        }
    }
};