// WebSocket сервер для получения данных от HLAE (LHM стиль)
const WebSocket = require('ws');

class HLAEWebSocketServer {
    constructor(port = 31337) {
        this.port = port;
        this.wss = null;
        this.clients = new Set();
        this.gameState = null;
    }

    init(gameState) {
        this.gameState = gameState;
        console.log('HLAE WebSocket Server: Инициализирован с gameState');
    }

    start() {
        this.wss = new WebSocket.Server({ port: this.port });
        
        console.log(`HLAE WebSocket Server: Запущен на порту ${this.port} (LHM стиль)`);
        console.log(`HLAE WebSocket Server: Ожидаем подключения от HLAE...`);
        
        this.wss.on('connection', (ws, req) => {
            console.log(`HLAE WebSocket: НОВОЕ ПОДКЛЮЧЕНИЕ от ${req.socket.remoteAddress}:${req.socket.remotePort}`);
            console.log(`HLAE WebSocket: Headers:`, req.headers);
            this.clients.add(ws);
            
            // Отправляем приветственное сообщение
            ws.send(JSON.stringify({ 
                type: 'welcome', 
                message: 'HLAE WebSocket Server connected',
                timestamp: Date.now()
            }));
            
            ws.on('message', (message) => {
                console.log(`HLAE WebSocket: Получено сообщение длиной ${message.length} байт`);
                
                try {
                    const data = JSON.parse(message);
                    console.log('HLAE WebSocket: Получены JSON данные:', data);
                    
                    // Обрабатываем данные от HLAE
                    this.processHLAEData(data);
                    
                } catch (error) {
                    console.log('HLAE WebSocket: Получены текстовые данные:', message.toString());
                    
                    // Проверяем текстовые данные на наличие информации о смерти
                    const text = message.toString();
                    if (text.includes('player_death') || text.includes('death') || text.includes('kill')) {
                        console.log('HLAE WebSocket: НАЙДЕНЫ ТЕКСТОВЫЕ ДАННЫЕ О СМЕРТИ!');
                        console.log('HLAE WebSocket: Текст:', text);
                        this.parseTextDeathData(text);
                    }
                }
            });
            
            ws.on('close', () => {
                console.log('HLAE WebSocket: Клиент отключился');
                this.clients.delete(ws);
            });
            
            ws.on('error', (error) => {
                console.error('HLAE WebSocket: Ошибка:', error);
            });
        });
        
        this.wss.on('error', (error) => {
            console.error('HLAE WebSocket Server: Ошибка сервера:', error);
        });
        
        // Периодически проверяем подключения (убрали логи для уменьшения спама)
        setInterval(() => {
            // console.log(`HLAE WebSocket Server: Активных подключений: ${this.clients.size}`);
        }, 10000);
    }

    processHLAEData(data) {
        console.log('HLAE WebSocket: Обработка данных от HLAE:', data);
        
        // Проверяем данные о смерти
        if (data.player_death) {
            console.log('HLAE WebSocket: НАЙДЕНЫ ДАННЫЕ О СМЕРТИ!', data.player_death);
            this.processDeathData(data.player_death);
        }
        
        // Проверяем события
        if (data.events) {
            console.log('HLAE WebSocket: Получены события:', data.events);
            this.processEvents(data.events);
        }
        
        // Проверяем mirv_pgl данные
        if (data.mirv_pgl) {
            console.log('HLAE WebSocket: Получены mirv_pgl данные:', data.mirv_pgl);
            this.processMirvPglData(data.mirv_pgl);
        }
        
        // Проверяем killfeed данные
        if (data.killfeed) {
            console.log('HLAE WebSocket: Получены killfeed данные:', data.killfeed);
            this.processKillfeedData(data.killfeed);
        }
    }

    parseTextDeathData(text) {
        // Парсим текстовые данные о смерти
        const lines = text.split('\n');
        
        for (const line of lines) {
            if (line.includes('player_death')) {
                // Пропускаем заголовок
                if (line.includes('weapon | attackerName')) {
                    continue;
                }
                
                // Парсим данные
                const parts = line.split('|');
                if (parts.length >= 7) {
                    const deathData = {
                        weapon: parts[0].trim(),
                        attackerName: parts[1].trim(),
                        attackerUserId: parseInt(parts[2].trim()) || 0,
                        victimName: parts[3].trim(),
                        victimUserId: parseInt(parts[4].trim()) || 0,
                        assisterName: parts[5].trim() === 'null' ? null : parts[5].trim(),
                        assisterUserId: parseInt(parts[6].trim()) || -1,
                        timestamp: Date.now()
                    };
                    
                    console.log('HLAE WebSocket: Парсинг текстовых данных о смерти:', deathData);
                    this.processDeathData(deathData);
                }
            }
        }
    }

    processDeathData(deathData) {
        console.log('HLAE WebSocket: Обработка данных о смерти:', deathData);
        
        // Создаем запись киллфида
        const killEntry = {
            id: `ws_death_${Date.now()}_${Math.random()}`,
            killer: {
                name: deathData.attackerName,
                userId: deathData.attackerUserId,
                team: 'Unknown'
            },
            victim: {
                name: deathData.victimName,
                userId: deathData.victimUserId,
                team: 'Unknown'
            },
            assister: deathData.assisterName ? {
                name: deathData.assisterName,
                userId: deathData.assisterUserId,
                team: 'Unknown'
            } : null,
            weapon: deathData.weapon,
            headshot: false,
            timestamp: deathData.timestamp,
            source: 'websocket'
        };

        console.log('HLAE WebSocket: Создана запись киллфида:', killEntry);
        
        // Добавляем в killfeed если есть функция
        if (global.addKillToKillfeed) {
            global.addKillToKillfeed(killEntry);
        }
        
        // Сохраняем в gameState
        if (this.gameState) {
            if (!this.gameState.websocketDeaths) {
                this.gameState.websocketDeaths = [];
            }
            this.gameState.websocketDeaths.push(deathData);
        }
    }

    processEvents(events) {
        console.log('HLAE WebSocket: Обработка событий:', events);
        
        // Обрабатываем различные типы событий
        if (Array.isArray(events)) {
            events.forEach(event => {
                if (event.type === 'player_death') {
                    this.processDeathData(event.data);
                }
            });
        }
    }

    processMirvPglData(mirvData) {
        console.log('HLAE WebSocket: Обработка mirv_pgl данных:', mirvData);
        
        // Обрабатываем данные mirv_pgl
        if (mirvData.events) {
            this.processEvents(mirvData.events);
        }
    }

    processKillfeedData(killfeedData) {
        console.log('HLAE WebSocket: Обработка killfeed данных:', killfeedData);
        
        // Обрабатываем данные killfeed
        if (Array.isArray(killfeedData)) {
            killfeedData.forEach(kill => {
                this.processDeathData(kill);
            });
        }
    }

    broadcast(data) {
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }

    stop() {
        if (this.wss) {
            this.wss.close();
            console.log('HLAE WebSocket Server: Остановлен');
        }
    }
}

module.exports = HLAEWebSocketServer; 