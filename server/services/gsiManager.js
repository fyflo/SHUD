const path = require("path");
const fs = require("fs");

class GSIManager {
  constructor() {
    this.gameState = {};
    this.lastUpdate = null;
    this.updateCallbacks = [];
  }

  updateGameState(data) {
    this.gameState = data;
    this.lastUpdate = Date.now();
    
    // Уведомляем всех подписчиков
    this.updateCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error("Ошибка в GSI callback:", error);
      }
    });
  }

  getGameState() {
    return this.gameState;
  }

  getLastUpdate() {
    return this.lastUpdate;
  }

  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  findCS2Path() {
    const possiblePaths = [
      "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo",
      "C:\\Program Files\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo",
      "C:\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo",
      "D:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo",
      "D:\\Program Files\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo",
      "D:\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo",
      "E:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo",
      "E:\\Program Files\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo",
      "E:\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo",
      "F:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo",
      "F:\\Program Files\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo",
      "F:\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo",
    ];

    for (const csPath of possiblePaths) {
      if (fs.existsSync(csPath)) {
        console.log(`Найден CS2 по пути: ${csPath}`);
        return csPath;
      }
    }

    console.log("CS2 не найден в стандартных путях");
    return null;
  }

  createGSIConfig(cs2Path) {
    if (!cs2Path) {
      console.error("Путь к CS2 не найден");
      return false;
    }

    const cfgPath = path.join(cs2Path, "cfg");
    const gsiConfigPath = path.join(cfgPath, "gamestate_integration_fhud.cfg");

    const gsiConfig = `
// Game State Integration конфигурация для FHUD
// Автоматически создано

// Включаем GSI
sv_cheats 1

// Настройки GSI
sv_gamestate_integration 1
sv_gamestate_integration_port 3000
sv_gamestate_integration_host "localhost"

// Дополнительные настройки
sv_gamestate_integration_verbose 1
sv_gamestate_integration_auto_restart 1

// Сохраняем настройки
writecfg
`;

    try {
      if (!fs.existsSync(cfgPath)) {
        fs.mkdirSync(cfgPath, { recursive: true });
      }

      fs.writeFileSync(gsiConfigPath, gsiConfig);
      console.log(`GSI конфигурация создана: ${gsiConfigPath}`);
      return true;
    } catch (error) {
      console.error("Ошибка при создании GSI конфигурации:", error);
      return false;
    }
  }

  cleanupUnusedElements() {
    // Очистка неиспользуемых элементов из gameState
    if (this.gameState && this.gameState.player) {
      const player = this.gameState.player;
      
      // Удаляем пустые или неиспользуемые поля
      const fieldsToClean = ['weapons', 'match_stats', 'state'];
      
      fieldsToClean.forEach(field => {
        if (player[field] && Object.keys(player[field]).length === 0) {
          delete player[field];
        }
      });
    }
  }

  validateGameState(data) {
    // Базовая валидация GSI данных
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Проверяем обязательные поля
    const requiredFields = ['provider', 'map'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return false;
      }
    }

    return true;
  }
}

module.exports = GSIManager; 