import { state, updateState } from '..state.js';
import { matchModule } from '.match.js';

export const gsiModule = {
    initialize() {
        if (typeof window.gsiManager === 'undefined') {
            console.error('GSIManager не инициализирован');
            return;
        }

        window.gsiManager.subscribe((event) = {
            switch(event.type) {
                case 'connect'
                    console.log('Подключено к серверу GSI');
                    break;
                case 'disconnect'
                    console.log('Отключено от сервера GSI');
                    break;
                case 'update'
                    updateState('gsiDataBuffer', event.data);
                    matchModule.updateGameInfo();
                    break;
            }
        });
    }
};