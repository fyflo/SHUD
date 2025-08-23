const fs = require("fs");
const path = require("path");

class HUDManager {
  constructor() {
    this.hudsPath = path.join(__dirname, "../../public/huds");
    this.availableHUDs = [];
    this.activeHUD = null;
  }

  scanHUDs() {
    try {
      if (!fs.existsSync(this.hudsPath)) {
        console.log("Папка HUDs не найдена:", this.hudsPath);
        return [];
      }

      const huds = fs.readdirSync(this.hudsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      this.availableHUDs = huds;
      console.log(`Найдено HUD: ${huds.length}`);
      return huds;
    } catch (error) {
      console.error("Ошибка при сканировании HUD:", error);
      return [];
    }
  }

  getHUDInfo(hudName) {
    const hudPath = path.join(this.hudsPath, hudName);
    
    try {
      if (!fs.existsSync(hudPath)) {
        return null;
      }

      const files = fs.readdirSync(hudPath);
      const hasIndex = files.includes("index.js") || files.includes("index.pug");
      const hasStyle = files.includes("style.css") || files.includes("animate.css");
      const hasConfig = files.includes("config.json");

      return {
        name: hudName,
        path: hudPath,
        hasIndex,
        hasStyle,
        hasConfig,
        files: files
      };
    } catch (error) {
      console.error(`Ошибка при получении информации о HUD ${hudName}:`, error);
      return null;
    }
  }

  getAllHUDsInfo() {
    return this.availableHUDs.map(hudName => this.getHUDInfo(hudName)).filter(Boolean);
  }

  setActiveHUD(hudName) {
    if (this.availableHUDs.includes(hudName)) {
      this.activeHUD = hudName;
      console.log(`Активный HUD установлен: ${hudName}`);
      return true;
    }
    return false;
  }

  getActiveHUD() {
    return this.activeHUD;
  }

  getHUDConfig(hudName) {
    const hudInfo = this.getHUDInfo(hudName);
    if (!hudInfo || !hudInfo.hasConfig) {
      return null;
    }

    try {
      const configPath = path.join(hudInfo.path, "config.json");
      const configData = fs.readFileSync(configPath, "utf8");
      return JSON.parse(configData);
    } catch (error) {
      console.error(`Ошибка при чтении конфигурации HUD ${hudName}:`, error);
      return null;
    }
  }

  validateHUD(hudName) {
    const hudInfo = this.getHUDInfo(hudName);
    if (!hudInfo) {
      return { valid: false, error: "HUD не найден" };
    }

    const errors = [];
    
    if (!hudInfo.hasIndex) {
      errors.push("Отсутствует index.js или index.pug");
    }
    
    if (!hudInfo.hasStyle) {
      errors.push("Отсутствует style.css или animate.css");
    }

    return {
      valid: errors.length === 0,
      errors,
      info: hudInfo
    };
  }

  createHUD(name, template = "default") {
    const hudPath = path.join(this.hudsPath, name);
    
    try {
      if (fs.existsSync(hudPath)) {
        return { success: false, error: "HUD с таким именем уже существует" };
      }

      fs.mkdirSync(hudPath, { recursive: true });
      
      // Создаем базовые файлы
      const defaultFiles = {
        "index.js": `// HUD: ${name}\nconsole.log("HUD ${name} загружен");`,
        "style.css": `/* HUD: ${name} */\n.hud-${name} {\n  /* Стили для ${name} */\n}`,
        "config.json": JSON.stringify({
          name: name,
          version: "1.0.0",
          description: `HUD ${name}`,
          author: "System"
        }, null, 2)
      };

      Object.entries(defaultFiles).forEach(([filename, content]) => {
        fs.writeFileSync(path.join(hudPath, filename), content);
      });

      // Обновляем список HUD
      this.scanHUDs();
      
      return { success: true, path: hudPath };
    } catch (error) {
      console.error(`Ошибка при создании HUD ${name}:`, error);
      return { success: false, error: error.message };
    }
  }

  deleteHUD(name) {
    const hudPath = path.join(this.hudsPath, name);
    
    try {
      if (!fs.existsSync(hudPath)) {
        return { success: false, error: "HUD не найден" };
      }

      fs.rmSync(hudPath, { recursive: true, force: true });
      
      // Обновляем список HUD
      this.scanHUDs();
      
      if (this.activeHUD === name) {
        this.activeHUD = null;
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Ошибка при удалении HUD ${name}:`, error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = HUDManager; 