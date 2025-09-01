// Создаем единый объект gsiManager
window.gsiManager = {
    socket: null,
    callbacks: new Set(),

    init: function() {
        this.socket = io(window.location.origin, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity
        });

        this.socket.on('connect', () => {
            console.log('Подключено к серверу Socket.IO');
            this.notifySubscribers({ type: 'connect' });
            this.socket.emit('ready');
        });

        this.socket.on('disconnect', () => {
            console.log('Отключено от сервера Socket.IO');
            this.notifySubscribers({ type: 'disconnect' });
        });

        this.socket.on('gsi', (data) => {
            this.notifySubscribers({ type: 'update', data });
        });
    },

    subscribe: function(callback) {
        this.callbacks.add(callback);
    },

    unsubscribe: function(callback) {
        this.callbacks.delete(callback);
    },

    notifySubscribers: function(event) {
        this.callbacks.forEach(callback => callback(event));
    },

    sendToHUD: function(data) {
        if (this.socket) {
            console.log('Отправка данных в HUD:', data);
            this.socket.emit('match_data', data);
        } else {
            console.error('Socket.IO соединение не установлено');
        }
    },

    updateHUD: function(data) {
        console.log('Получены данные GSI:', data);
    },

    // Функция для отправки данных матча в HUD
    sendMatchDataToHUD: async function(matchId) {
        try {
            const response = await fetch(`/api/matches/${matchId}`);
            const match = await response.json();

            if (!match) {
                console.error('Матч не найден');
                return;
            }

            const matchData = {
                teams: {
                    team_1: {
                        team: {
                            name: match.team1_name,
                            score: match.score_team1 || 0
                        }
                    },
                    team_2: {
                        team: {
                            name: match.team2_name,
                            score: match.score_team2 || 0
                        }
                    }
                },
                format: match.format,
                maps: match.maps
            };

            console.log('Отправка данных матча:', matchData);
            if (this.socket) {
                this.socket.emit('match_data', matchData);
            } else {
                console.error('Socket.IO соединение не установлено');
            }

        } catch (error) {
            console.error('Ошибка при отправке данных в HUD:', error);
        }
    },

    // Функция запуска матча
    startMatch: async function(matchId) {
        try {
            const response = await fetch(`/api/matches/${matchId}/start`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error('Ошибка при запуске матча');
            }

            await this.sendMatchDataToHUD(matchId);
            console.log('Матч успешно запущен');

        } catch (error) {
            console.error('Ошибка при запуске матча:', error);
        }
    },

    // Функция обновления счета
    updateMatchScore: async function(matchId, teamNumber, change) {
        try {
            console.log('Обновление счета:', { matchId, teamNumber, change });
            
            const response = await fetch('/api/matches/update-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ matchId, teamNumber, change })
            });

            const result = await response.json();
            console.log('Ответ сервера:', result);

            if (result.success) {
                // Отправляем обновленные данные в HUD
                await this.sendMatchDataToHUD(matchId);
                return result;
            } else {
                throw new Error(result.error || 'Ошибка при обновлении счета');
            }
        } catch (error) {
            console.error('Ошибка при обновлении счета:', error);
            throw error;
        }
    },

    // Функция обновления статуса матча
    updateMatchStatus: async function(matchId, status) {
        try {
            const response = await fetch(`/api/matches/${matchId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            const result = await response.json();
            if (result.success) {
                await this.sendMatchDataToHUD(matchId);
                return result;
            } else {
                throw new Error(result.error || 'Ошибка при обновлении статуса');
            }
        } catch (error) {
            console.error('Ошибка при обновлении статуса матча:', error);
            throw error;
        }
    }
};

// Инициализируем gsiManager при загрузке страницы
window.gsiManager.init();

// Глобальные функции-обертки
window.startMatch = function(matchId) {
    return window.gsiManager.startMatch(matchId);
};

window.updateMatchScore = function(matchId, teamNumber, change) {
    return window.gsiManager.updateMatchScore(matchId, teamNumber, change);
};

window.sendMatchDataToHUD = function(matchId) {
    return window.gsiManager.sendMatchDataToHUD(matchId);
};

window.updateMatchStatus = function(matchId, status) {
    return window.gsiManager.updateMatchStatus(matchId, status);
};

window.gsiManager.sendToHUD({
    type: 'camera_link',
    steamid,
    link
});