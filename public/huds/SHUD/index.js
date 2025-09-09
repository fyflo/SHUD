(function setTeamColorsFromConstants() {
  try {
    const root = document.documentElement;
    const container = document.querySelector(".shud-layout-container");
    const normalize = (c) =>
      typeof c === "string" ? c.replace(/\s+/g, " ").trim() : "";
    const extractFirstColor = (val) => {
      const v = normalize(val);
      if (!v) return v;
      // try rgba()/rgb()
      const m = v.match(/rgba?\([^\)]+\)/i);
      if (m) return m[0];
      // try hex #rrggbb
      const mh = v.match(/#([0-9a-f]{6})/i);
      if (mh) return `#${mh[1]}`;
      return v; // fallback
    };
    const toRgbaWithAlpha = (color, alpha) => {
      const c = normalize(color);
      if (!c) return "";
      const m = c.match(
        /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)/i
      );
      if (m) {
        const r = +m[1],
          g = +m[2],
          b = +m[3];
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      const mh = c.match(/^#?([0-9a-f]{6})$/i);
      if (mh) {
        const hex = mh[1];
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      return c;
    };

    if (typeof COLOR_NEW_CT === "string") {
      const ct = normalize(COLOR_NEW_CT);
      const ctBase = extractFirstColor(ct);
      root.style.setProperty("--color-ct", ctBase);
      root.style.setProperty("--color-blob-ct", "var(--color-ct)");
      root.style.setProperty("--color-eco-ct-first", "var(--color-ct)");
      root.style.setProperty("--color-ct-2", toRgbaWithAlpha(ctBase, 0.7));
      root.style.setProperty("--color-spec-ct", ctBase);
      root.style.setProperty("--color-ct-shape", toRgbaWithAlpha(ctBase, 0.22));
      root.style.setProperty(
        "--gradient-ct-inner",
        `linear-gradient(to right, ${toRgbaWithAlpha(
          ctBase,
          0.3
        )}, ${toRgbaWithAlpha(ctBase, 0)})`
      );
      if (container) {
        container.style.setProperty("--color-ct", ctBase);
        container.style.setProperty("--color-blob-ct", "var(--color-ct)");
        container.style.setProperty("--color-eco-ct-first", "var(--color-ct)");
        container.style.setProperty("--color-eco-ct-last", ctBase);
        container.style.setProperty(
          "--color-ct-2",
          toRgbaWithAlpha(ctBase, 0.7)
        );
        container.style.setProperty("--color-spec-ct", ctBase);
        container.style.setProperty(
          "--color-ct-shape",
          toRgbaWithAlpha(ctBase, 0.22)
        );
        container.style.setProperty(
          "--gradient-ct-inner",
          `linear-gradient(to right, ${toRgbaWithAlpha(
            ctBase,
            0.3
          )}, ${toRgbaWithAlpha(ctBase, 0)})`
        );
      }
    }
    if (typeof COLOR_NEW_T === "string") {
      const t = normalize(COLOR_NEW_T);
      const tBase = extractFirstColor(t);
      root.style.setProperty("--color-t", tBase);
      root.style.setProperty("--color-blob-t", "var(--color-t)");
      root.style.setProperty("--color-eco-t-first", "var(--color-t)");
      root.style.setProperty("--color-eco-t-last", "var(--color-t)");
      root.style.setProperty("--color-t-2", toRgbaWithAlpha(tBase, 0.7));
      root.style.setProperty("--color-spec-t", tBase);
      root.style.setProperty("--color-t-shape", toRgbaWithAlpha(tBase, 0.22));

      if (container) {
        container.style.setProperty("--color-t", tBase);
        container.style.setProperty("--color-blob-t", "var(--color-t)");
        container.style.setProperty("--color-eco-t-first", "var(--color-t)");
        container.style.setProperty("--color-eco-t-last", tBase);
        container.style.setProperty("--color-t-2", toRgbaWithAlpha(tBase, 0.7));
        container.style.setProperty("--color-spec-t", tBase);
        container.style.setProperty(
          "--color-t-shape",
          toRgbaWithAlpha(tBase, 0.22)
        );
        container.style.setProperty(
          "--gradient-t-inner",
          `linear-gradient(to left, ${toRgbaWithAlpha(
            tBase,
            0.3
          )}, ${toRgbaWithAlpha(tBase, 0)})`
        );
      }
    }
    // HP bar gradients (CT/T) unify into vars
    // Градиенты HP: приоритет 1) явные HP-константы, 2) COLOR_NEW_CT/T, 3) var(--color-ct/t)
    const mask = "linear-gradient(rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.25))";
    const ctConst =
      typeof COLOR_NEW_CT === "string" ? normalize(COLOR_NEW_CT) : "";
    const tConst =
      typeof COLOR_NEW_T === "string" ? normalize(COLOR_NEW_T) : "";

    const deriveHp = (explicit, fromNew, fromVar) => {
      if (typeof explicit === "string" && explicit.trim())
        return explicit.trim();
      if (fromNew) {
        const v = fromNew;
        if (/gradient/i.test(v)) return `${mask}, ${v}`;
        return `${mask}, linear-gradient(${v}, ${v})`;
      }
      return `${mask}, linear-gradient(${fromVar}, ${fromVar})`;
    };

    const ctHp = deriveHp(
      typeof COLOR_CT_HP_BAR === "string" && COLOR_CT_HP_BAR,
      ctConst,
      "var(--color-ct)"
    );
    const tHp = deriveHp(
      typeof COLOR_T_HP_BAR === "string" && COLOR_T_HP_BAR,
      tConst,
      "var(--color-t)"
    );
    root.style.setProperty("--gradient-ct-hp", ctHp);
    root.style.setProperty("--gradient-t-hp", tHp);
    if (container) {
      container.style.setProperty("--gradient-ct-hp", ctHp);
      container.style.setProperty("--gradient-t-hp", tHp);
    }
  } catch (_) {}
})();
// Объявляем константы в глобальной области видимости
let COLOR_CT,
  COLOR_T,
  COLOR_NEW_CT,
  COLOR_NEW_T,
  COLOR_CT_HP_BAR,
  COLOR_T_HP_BAR,
  COLOR_NEW_CT_TOPPANEL,
  COLOR_NEW_T_TOPPANEL,
  COLOR_NEW_CT_Baground,
  COLOR_NEW_T_Baground,
  COLOR_RED,
  COLOR_CT_SPECTATOR,
  COLOR_T_SPECTATOR,
  COLOR_MAIN_PANEL,
  COLOR_SUB_PANEL,
  COLOR_GRAY,
  COLOR_WHITE,
  COLOR_WHITE_HALF,
  COLOR_WHITE_DULL,
  PLAYER_ORANGE,
  PLAYER_BOMB,
  PLAYER_GREEN,
  PLAYER_BLUE,
  PLAYER_YELLOW,
  PLAYER_PURPLE,
  DEV_PURPLE,
  BG_DEAD_CT,
  BG_DEAD_T,
  HEALTH_BAR_FON;

// Вспомогательные функции для цветов (для inline-стилей без CSS-переменных)
function _extractFirstColor(val) {
  if (!val) return "";
  const v = String(val).trim();
  const m = v.match(/rgba?\([^\)]+\)/i);
  if (m) return m[0];
  const mh = v.match(/#([0-9a-f]{6})/i);
  if (mh) return `#${mh[1]}`;
  return v;
}

function _toRgbaWithAlpha(color, alpha) {
  if (!color) return "";
  const c = String(color).trim();
  const m = c.match(
    /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)/i
  );
  if (m) {
    const r = +m[1],
      g = +m[2],
      b = +m[3];
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const mh = c.match(/^#?([0-9a-f]{6})$/i);
  if (mh) {
    const hex = mh[1];
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return c;
}

function _computeInnerBackground(team) {
  const teamLower = String(team || "").toLowerCase();
  const base =
    teamLower === "ct" ? COLOR_NEW_CT || COLOR_CT : COLOR_NEW_T || COLOR_T;
  // Всегда строим собственный градиент: слева направо, цвет→прозрачность
  const first = _extractFirstColor(base);
  const a = _toRgbaWithAlpha(first, 0.3);
  const b = _toRgbaWithAlpha(first, 0.0);
  return `linear-gradient(to right, ${a}, ${b})`;
}

function _asGradientFromColor(val) {
  if (!val) return "";
  const v = String(val);
  // Игнорируем готовые градиенты — строим свой
  const c = _extractFirstColor(v);
  return `linear-gradient(${c}, ${c})`;
}

function _withHpMask(gradient) {
  const mask = "linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25))";
  return `${mask}, ${gradient}`;
}

function _computeHpBackground(team, healthValue) {
  const teamLower = String(team || "").toLowerCase();
  const base =
    teamLower === "ct"
      ? COLOR_CT_HP_BAR || COLOR_NEW_CT || COLOR_CT
      : COLOR_T_HP_BAR || COLOR_NEW_T || COLOR_T;
  const low =
    (typeof COLOR_RED === "string" && COLOR_RED) || "rgba(229, 11, 11, 1.0)";
  const selected = healthValue <= 20 ? low : base;
  // Строим градиент слева направо: цвет→прозрачность, затем маска
  const c = _extractFirstColor(selected);
  const a = _toRgbaWithAlpha(c, 0.3);
  const b = _toRgbaWithAlpha(c, 0.0);
  const grad = `linear-gradient(to right, ${a}, ${b})`;
  return _withHpMask(grad);
}

// Инъекция CSS для .shud-teambox .player.(CT|T) .player-inner на основе констант
function applyTeamboxInnerStyles() {
  try {
    const ctBase = _extractFirstColor(
      COLOR_NEW_CT || COLOR_CT || "rgba(40,120,240,1)"
    );
    const tBase = _extractFirstColor(
      COLOR_NEW_T || COLOR_T || "rgba(229,11,11,1)"
    );
    const ctA = _toRgbaWithAlpha(ctBase, 0.3);
    const ctB = _toRgbaWithAlpha(ctBase, 0.0);
    const tA = _toRgbaWithAlpha(tBase, 0.3);
    const tB = _toRgbaWithAlpha(tBase, 0.0);
    const css = `
.shud-teambox .player.CT .player-inner { background: linear-gradient(to right, ${ctA}, ${ctB}); }
.shud-teambox .player.T .player-inner { background: linear-gradient(to right, ${tA}, ${tB}); }
`;
    let styleEl = document.getElementById("shud-teambox-inner-style");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "shud-teambox-inner-style";
      document.head && document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  } catch (_) {}
}

// Добавим безопасный fallback для requestAnimationFrame
const raf =
  (window.requestAnimationFrame && window.requestAnimationFrame.bind(window)) ||
  ((cb) => setTimeout(() => cb(performance.now()), 16));

// Глобальный флаг отладки HUD
window.DEBUG_HUD = window.DEBUG_HUD || false;

// Инициализируем переменную для хранения скрытых Steam64 ID
window.gsiHiddenSteamIds = [];

// Добавляем функцию для фильтрации игроков по Steam64 ID
function filterHiddenPlayers(allplayers) {
  if (!allplayers) return {};

  // Получаем скрываемые Steam64 ID из localStorage
  const hiddenSteamId1 = localStorage.getItem("hiddenSteamId1") || "";
  const hiddenSteamId2 = localStorage.getItem("hiddenSteamId2") || "";

  // Создаем массив ID для скрытия
  const hideIds = [hiddenSteamId1, hiddenSteamId2].filter((id) => id);

  // Проверяем наличие GSI данных для скрытия игроков
  if (window.gsiHiddenSteamIds && window.gsiHiddenSteamIds.length > 0) {
    // Добавляем GSI ID в массив для скрытия
    window.gsiHiddenSteamIds.forEach((id) => {
      if (id && !hideIds.includes(id)) {
        hideIds.push(id);
      }
    });
  }

  if (hideIds.length === 0) return allplayers;

  //console.log("Скрываем игроков с ID:", hideIds);

  // Создаем копию объекта allplayers без скрытых игроков
  const filteredPlayers = {};
  Object.keys(allplayers).forEach((steamid) => {
    if (!hideIds.includes(steamid)) {
      filteredPlayers[steamid] = allplayers[steamid];
    } else {
      //console.log(`Скрыт игрок с Steam ID: ${steamid}`);
    }
  });

  //console.log(`Отображаем ${Object.keys(filteredPlayers).length} из ${Object.keys(allplayers).length} игроков`);
  return filteredPlayers;
}

// Функция для определения, является ли игрок тренером
function isCoach(player) {
  // Проверяем только имя на наличие ключевых слов
  const name = (player.name || "").toLowerCase();
  const nameInGame = (player.name_ingame || "").toLowerCase();
  return (
    name.includes("coach|") ||
    nameInGame.includes("coach|") ||
    name.includes("тренер|") ||
    nameInGame.includes("тренер|")
  );
}

/*function loadColorsConfig(callback) {
    $.getJSON("../../js/colors_config.json", function (data) {
    // Обновляем константы с данными из JSON
    const {
      COLOR_CT: jsonColorCT,
      COLOR_T: jsonColorT,
      COLOR_NEW_CT: jsonColorNewCT,
      COLOR_NEW_T: jsonColorNewT,
      COLOR_RED: jsonColorRed,
      COLOR_CT_SPECTATOR: jsonColorCTSpectator,
      COLOR_T_SPECTATOR: jsonColorTSpectator,
      COLOR_MAIN_PANEL: jsonColorMainPanel,
      COLOR_SUB_PANEL: jsonColorSubPanel,
      COLOR_GRAY: jsonColorGray,
      COLOR_WHITE: jsonColorWhite,
      COLOR_WHITE_HALF: jsonColorWhiteHalf,
      COLOR_WHITE_DULL: jsonColorWhiteDull,
      PLAYER_ORANGE: jsonPlayerOrange,
      PLAYER_GREEN: jsonPlayerGreen,
      PLAYER_BLUE: jsonPlayerBlue,
      PLAYER_YELLOW: jsonPlayerYellow,
      PLAYER_PURPLE: jsonPlayerPurple,
      DEV_PURPLE: jsonDevPurple,
      BG_DEAD_CT: jsonBgDeadCT,
      BG_DEAD_T: jsonBgDeadT,
    } = data;*/

// Присваиваем значения константам

COLOR_NEW_CT =
  "linear-gradient(90deg, rgb(2, 135, 243) 7%, rgba(0, 0, 0, 0) 70%)";
COLOR_NEW_T =
  "linear-gradient(280deg, rgb(245, 202, 12) 7%, rgba(0, 0, 0, 0) 70%)";
COLOR_CT_HP_BAR = "rgb(2, 135, 243)";
COLOR_T_HP_BAR = "rgb(245, 202, 12)";
COLOR_NEW_CT_TOPPANEL = "rgb(2, 135, 243)";
COLOR_NEW_T_TOPPANEL = "rgb(245, 202, 12)";
COLOR_RED = "rgba(229, 11, 11, 1)";
COLOR_CT_SPECTATOR =
  "linear-gradient(0deg, rgb(2, 135, 243) 0%, rgb(2, 135, 243) 0.623) 100%)";
COLOR_T_SPECTATOR =
  "linear-gradient(0deg, rgb(245, 202, 12) 0%, rgb(245, 202, 12) 0.623) 100%)";
COLOR_MAIN_PANEL = "rgba(12, 15, 18, 0.75)";
COLOR_SUB_PANEL = "rgba(12, 15, 18, 0.6)";
COLOR_GRAY = "rgba(191, 191, 191, 1.0)";
COLOR_WHITE = "rgba(250, 250, 250, 1.0)";
COLOR_WHITE_HALF = "rgba(250, 250, 250, 0.5)";
COLOR_WHITE_DULL = "rgba(250, 250, 250, 0.25)";
PLAYER_BOMB = "rgba(229, 11, 11, 1)";
PLAYER_ORANGE = "rgba(237, 163, 56, 1.0)";
PLAYER_GREEN = "rgba(16, 152, 86, 1.0)";
PLAYER_BLUE = "rgba(104, 163, 229, 1.0)";
PLAYER_YELLOW = "rgba(230, 241, 61, 1.0)";
PLAYER_PURPLE = "rgba(128, 60, 161, 1.0)";
DEV_PURPLE = "rgba(200, 0, 255, 1.0)";
BG_DEAD_CT = "rgba(107, 105, 254, 0.6)";
BG_DEAD_T = "rgba(254, 97, 0, 0.6)";
HEALTH_BAR_FON = "rgba(255, 230, 0, 0.6)";

/* callback(data);
  }).fail(function () {
    console.error("Ошибка загрузки конфигурации оружия.");
    callback({});
  });
}*/

// Вызов функции загрузки конфигурации
//loadColorsConfig(() => {
// Теперь вы можете вызывать функции, которые используют константы
//});

// Переопределение цветов из конфигурационного файла HUD (если есть)
(function applyHudColorOverrides() {
  try {
    const hudName = "SHUD";
    const tryPaths = [
      `/hud/${hudName}/colors.config.json`,
      `/huds/${hudName}/colors.config.json`,
      // fallback to legacy folder name for compatibility
      `/hud/LHM/colors.config.json`,
      `/huds/LHM/colors.config.json`,
    ];
    const load = (idx) => {
      if (idx >= tryPaths.length) return Promise.resolve(null);
      return fetch(tryPaths[idx], { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
        .then((j) => (j ? j : load(idx + 1)));
    };
    load(0)
      .then((cfg) => {
        if (!cfg || typeof cfg !== "object") return;
        Object.keys(cfg).forEach((k) => {
          const val = cfg[k];
          if (typeof val === "string" && val.trim()) {
            try {
              // eslint-disable-next-line no-eval
              eval(`${k} = ${JSON.stringify(val)}`);
            } catch {}
          }
        });
      })
      .catch(() => {});
  } catch {}
})();

// Подписываемся на события скрытия игроков и киллфида
document.addEventListener("DOMContentLoaded", function () {
  // Глобальные горячие клавиши теперь обрабатываются через Electron
  applyTeamboxInnerStyles();

  // Проверяем наличие Socket.IO
  if (window.io) {
    //console.log("Socket.IO found, connecting to server...");
    // Подключаемся к серверу Socket.IO
    const socket = io();

    socket.on("connect", function () {
      //console.log("Socket.IO connected successfully!");
      //console.log("Socket ID:", socket.id);
    });

    socket.on("disconnect", function () {
      //console.log("Socket.IO disconnected!");
    });

    socket.on("connect_error", function (error) {
      //console.log("Socket.IO connection error:", error);
    });

    // Подписываемся на события hud_data
    socket.on("hud_data", function (data) {
      if (data.type === "hide_players" && Array.isArray(data.steamids)) {
        // Сохраняем steamid в localStorage
        localStorage.setItem("hiddenSteamId1", data.steamids[0] || "");
        localStorage.setItem("hiddenSteamId2", data.steamids[1] || "");

        // Обновляем глобальную переменную для хранения скрытых Steam64 ID
        window.gsiHiddenSteamIds = data.steamids.filter((id) => id);

        //  console.log('Получены ID для скрытия через Socket.IO:', window.gsiHiddenSteamIds);

        // Если есть данные GSI в буфере, обновляем отображение
        if (window.pendingDataUpdate && window.pendingDataUpdate.allplayers) {
          // Фильтруем игроков и обновляем HUD
          window.pendingDataUpdate.allplayers = filterHiddenPlayers(
            window.pendingDataUpdate.allplayers
          );
          actuallyUpdateHUD(window.pendingDataUpdate);
        }
      }
    });

    // Подписываемся на события киллфида (используем только основной канал)
    // Примечание: сервер также может отправлять 'killfeed_update' для совместимости,
    // но здесь избегаем двойной обработки, слушаем только 'killfeed' ниже.

    // Подписываемся на события popup word
    socket.on("popup_word", function (data) {
      //console.log("=== POPUP WORD EVENT RECEIVED ===");
      //console.log("Event data:", data);
      //console.log("Socket connected:", socket.connected);
      //console.log("Event type:", data.type);
      //console.log("Event action:", data.action);

      if (data.type === "popup_word" && data.action === "show") {
        //console.log("Showing popup word:", data.word);
        showPopupWord(data.word);
      } else {
        //console.log("Invalid popup word event format");
      }
      //console.log("=== END POPUP WORD EVENT ===");
    });

    // Подписываемся на события kills-leaderboard
    socket.on("kills_leaderboard", function (data) {
      //console.log("=== KILLS LEADERBOARD EVENT RECEIVED ===");
      //console.log("Event data:", data);
      //console.log("Socket connected:", socket.connected);
      //console.log("Event type:", data.type);
      //console.log("Event action:", data.action);

      if (data.type === "kills_leaderboard") {
        if (data.action === "show") {
          //console.log("Showing kills-leaderboard");
          showKillsLeaderboard();
        } else if (data.action === "hide") {
          //console.log("Hiding kills-leaderboard");
          hideKillsLeaderboard();
        }
      } else {
        //console.log("Invalid kills-leaderboard event format");
      }
      //console.log("=== END KILLS LEADERBOARD EVENT ===");
    });

    // Проверяем наличие элементов popup word
    const popupElement = document.getElementById("popup-word");
    const popupText = document.getElementById("popup-word-text");
    //console.log("=== POPUP WORD ELEMENTS CHECK ===");
    //console.log("popup-word element found:", !!popupElement);
    //console.log("popup-word-text element found:", !!popupText);
    if (popupElement) {
      //console.log("popup-word classes:", popupElement.className);
      //console.log("popup-word styles:", window.getComputedStyle(popupElement));
    }

    // Проверяем конфигурацию
    //console.log("=== POPUP WORD CONFIG CHECK ===");
    //console.log("window.popupWordConfig:", window.popupWordConfig);
    //console.log("local popupWordConfig:", popupWordConfig);
    //console.log("=== END POPUP WORD CONFIG CHECK ===");

    // Активация фокуса при клике
    document.addEventListener("click", function () {
      window.focus();
    });

    //console.log("=== END POPUP WORD ELEMENTS CHECK ===");

    // Убираем логику скрытия игроков, так как тренер уже скрыт автоматически
    // и второго игрока для скрытия нет
    // Если в будущем понадобится скрывать игроков, можно будет добавить логику здесь
  }
});

// Объявляем константу для имени HUD
const HUD_NAME = "SHUD";

// Конфигурация всплывающего слова (берется из popup-config.js)
const popupWordConfig = window.popupWordConfig || {
  defaultText: "POPUP!",
  duration: 3000, // 3 секунды
  animation: true,
};

// Функция для показа всплывающего слова
function showPopupWord(word = null) {
  //console.log("=== SHOW POPUP WORD FUNCTION CALLED ===");
  //console.log("Word parameter:", word);
  //console.log("Config:", popupWordConfig);

  const popupElement = document.getElementById("popup-word");
  const popupText = document.getElementById("popup-word-text");

  //console.log("Popup element found:", !!popupElement);
  //console.log("Popup text element found:", !!popupText);

  if (popupElement && popupText) {
    // Используем переданное слово или текст по умолчанию
    const displayText = word || popupWordConfig.defaultText;
    popupText.textContent = displayText;

    //console.log("Setting text to:", displayText);
    //console.log("Current classes:", popupElement.className);

    // Показываем всплывающее слово
    popupElement.classList.remove("hide");
    popupElement.classList.add("show");

    //console.log("Classes after show:", popupElement.className);

    // Скрываем через заданное время
    setTimeout(() => {
      //console.log("Hiding popup word after timeout");
      popupElement.classList.remove("show");
      popupElement.classList.add("hide");
    }, popupWordConfig.duration);

    //console.log(`Popup word shown: ${displayText}`);
  } else {
    //console.log("ERROR: Popup elements not found!");
    //console.log("popupElement:", popupElement);
    //console.log("popupText:", popupText);
  }
  //console.log("=== END SHOW POPUP WORD FUNCTION ===");
}

// Функция для скрытия всплывающего слова
function hidePopupWord() {
  const popupElement = document.getElementById("popup-word");

  if (popupElement) {
    popupElement.classList.remove("show");
    popupElement.classList.add("hide");
  }
}

// Функция для показа таблицы лидеров по киллам
function showKillsLeaderboard() {
  //console.log("=== SHOW KILLS LEADERBOARD ===");
  const leaderboardElement = document.getElementById("kills-leaderboard");

  if (leaderboardElement) {
    //console.log("Element found:", !!leaderboardElement);
    //console.log("Current classes:", leaderboardElement.className);

    leaderboardElement.classList.remove("hide");
    leaderboardElement.classList.add("show");

    //console.log("Classes after show:", leaderboardElement.className);
    //console.log("Kills leaderboard shown");
  } else {
    //console.log("ERROR: kills-leaderboard element not found!");
  }
  //console.log("=== END SHOW KILLS LEADERBOARD ===");
}

// Функция для скрытия таблицы лидеров по киллам
function hideKillsLeaderboard() {
  //console.log("=== HIDE KILLS LEADERBOARD ===");
  const leaderboardElement = document.getElementById("kills-leaderboard");

  if (leaderboardElement) {
    //console.log("Element found:", !!leaderboardElement);
    //console.log("Current classes:", leaderboardElement.className);

    leaderboardElement.classList.remove("show");
    leaderboardElement.classList.add("hide");

    //console.log("Classes after hide:", leaderboardElement.className);
    //console.log("Kills leaderboard hidden");
  } else {
    //console.log("ERROR: kills-leaderboard element not found!");
  }
  //console.log("=== END HIDE KILLS LEADERBOARD ===");
}

let currentPhaseState = {
  phase: null,
  round: null,
};

// Добавляем переменную для отслеживания начального времени разминирования
let initialDefuseTime = null;

// Добавить в глобальную область
let lastFrameTime = 0;
const targetFPS = 30;
const frameDuration = 1000 / targetFPS;
let pendingDataUpdate = null;

// Заменить текущую функцию updateHUD на эту
function updateHUD(data) {
  console.log(data);
  // Сохраняем данные для следующего обновления
  pendingDataUpdate = data && typeof data === "object" ? data : {};

  // Сохраняем текущие данные GSI для использования в диаграмме сравнения
  window.currentGSIData = pendingDataUpdate;

  // Если обновление не запланировано, планируем его
  if (!window.pendingUpdate) {
    window.pendingUpdate = true;
    raf(frameRateControlledUpdate);
  }

  // FPS counter - оставляем как есть
  if (!window._fpsData) {
    window._fpsData = {
      frames: 0,
      lastSecond: performance.now(),
      lastUpdate: performance.now(),
      fps: 0,
      fpsHistory: [],
    };
  }

  const now = performance.now();
  window._fpsData.frames++;
  if (now - window._fpsData.lastSecond >= 1000) {
    window._fpsData.fps = window._fpsData.frames;
    window._fpsData.fpsHistory.push(window._fpsData.fps);
    if (window._fpsData.fpsHistory.length > 60)
      window._fpsData.fpsHistory.shift();
    /*if (window.DEBUG_HUD) {
          const avgFps = (window._fpsData.fpsHistory.reduce((a, b) => a + b, 0) / window._fpsData.fpsHistory.length).toFixed(1);
        const minFps = Math.min(...window._fpsData.fpsHistory);
        const maxFps = Math.max(...window._fpsData.fpsHistory);
          console.log(`HUD FPS: ${window._fpsData.fps} (Avg: ${avgFps}, Min: ${minFps}, Max: ${maxFps}) [Target: ${targetFPS}]`);
        }*/
    window._fpsData.frames = 0;
    window._fpsData.lastSecond = now;
  }
}

// Функция для контроля частоты кадров
function frameRateControlledUpdate(timestamp) {
  window.pendingUpdate = false;

  if (!pendingDataUpdate) return;

  const elapsed = timestamp - lastFrameTime;

  // Если прошло достаточно времени с последнего кадра или это первый кадр
  if (elapsed >= frameDuration || lastFrameTime === 0) {
    // Обновляем время последнего кадра
    lastFrameTime = timestamp - (elapsed % frameDuration);

    // Выполняем фактическое обновление
    actuallyUpdateHUD(pendingDataUpdate);

    // Отмечаем, что данные обработаны
    pendingDataUpdate = null;
  } else {
    // Если не прошло достаточно времени, планируем следующую проверку
    window.pendingUpdate = true;
    raf(frameRateControlledUpdate);
  }
}
function actuallyUpdateHUD(data) {
  if (window.DEBUG_HUD) {
    // console.log('GSI data', data);
  }

  // Нормализуем входные данные, чтобы избежать ошибок при отсутствии полей
  const map = data?.map || {};
  const allplayers = data?.allplayers || {};
  const player = data?.player || {};
  const phase_countdowns = data?.phase_countdowns || {};
  const bomb = data?.bomb ?? null;
  const match = data?.match ?? null;
  const matchup = data?.matchup ?? null;
  const match_maps = data?.match_maps ?? null;
  const matchupis = data?.matchupis ?? null;
  const grenades = data?.grenades ?? null;
  const teams = data?.teams ?? null;
  const round_now = data?.round_now ?? null;
  const roundData = data?.round || {};
  const hlae_status = data?.hlae_status || {};

  // Проверяем, есть ли команда на скрытие игроков
  if (data.type === "hide_players" && Array.isArray(data.steamids)) {
    // Сохраняем steamid в localStorage
    localStorage.setItem("hiddenSteamId1", data.steamids[0] || "");
    localStorage.setItem("hiddenSteamId2", data.steamids[1] || "");

    // Обновляем глобальную переменную для хранения скрытых Steam64 ID
    window.gsiHiddenSteamIds = data.steamids.filter((id) => id);

    //console.log('Получены ID для скрытия через GSI:', window.gsiHiddenSteamIds);
    return; // Прерываем выполнение, так как это команда, а не обновление HUD
  }

  // Фильтруем игроков, которых нужно скрыть
  const filteredPlayers = filterHiddenPlayers(allplayers);

  const left = Object.values(filteredPlayers).filter((p) => p?.team === "CT");
  const right = Object.values(filteredPlayers).filter((p) => p?.team === "T");
  const round = map?.round ?? 0;
  const slot = player?.slot ?? null;

  // Проверяем изменение фазы раунда
  if (
    data.round &&
    (data.round.phase === "over" || data.round.phase === "freezetime")
  ) {
    clearAllGrenades();
  }

  // Находим активного игрока по slot
  let activePlayer = null;

  if (player.slot !== undefined) {
    for (let steamid in filteredPlayers) {
      const currentPlayer = filteredPlayers[steamid];
      if (currentPlayer.observer_slot === player.slot) {
        activePlayer = currentPlayer;
        break;
      }
    }
  }

  // console.log(
  //   `player.slot: ${player.slot}, Found active player: ${activePlayer?.name}, observer_slot: ${activePlayer?.observer_slot}`
  // );

  // Обновления с защитой от отсутствия данных
  if (filteredPlayers && left && right)
    updateTeams(filteredPlayers, left, right);
  if (player) updateSpectator(player);
  if (player) updateObservedPanel(player);
  if (filteredPlayers && map) updateUtility(filteredPlayers, map);
  if (left && right && map && phase_countdowns)
    updateTopPanel(left, right, map, phase_countdowns, bomb, match, round_now);
  if (phase_countdowns && filteredPlayers && map)
    updateAnimation(phase_countdowns, filteredPlayers, map);
  if (map && teams)
    updateWinnerTeam(map, teams, roundData, phase_countdowns, left, right);
  if (left && right) updateLivePlayer(left, right);
  if (map && phase_countdowns) updateHistory(map, phase_countdowns);
  if (filteredPlayers && map)
    updateRadar(filteredPlayers, map, data, player, bomb, player, grenades);
  // Всегда вызываем updateMapPick при наличии карты; остальные параметры могут быть пустыми — функция сама выставит дефолты
  if (map)
    updateMapPick(
      map,
      matchup,
      match,
      match_maps,
      matchupis,
      teams,
      phase_countdowns
    );
  if (bomb && phase_countdowns && roundData && filteredPlayers && player)
    updateBombDefusePlanting(
      bomb,
      phase_countdowns,
      roundData,
      filteredPlayers,
      player
    );
  if (bomb && roundData) updateCircleBombTimer(bomb, roundData);
  // Управление видимостью #round_now в зависимости от состояния
  try {
    setRoundNowVisibility(map, phase_countdowns, bomb, roundData);
  } catch (e) {}

  // Обновляем circular timer и дефуз-бар
  try {
    // Linear planted bar (center shrinking) in #bomb_container .bombtimer
    const bombFill = document.querySelector("#bomb_container .bombtimer .fill");
    const bombBar = document.querySelector("#bomb_container .bombtimer");
    if (
      bombFill &&
      bombBar &&
      bomb &&
      (bomb.state === "planted" || bomb.state === "defusing")
    ) {
      const start = 40; // planted timer default
      const remaining = Math.max(0, Number(bomb.countdown) || 0);
      if (bomb.state === "planted") {
        const scale = Math.max(0, Math.min(1, remaining / start));
        // set transform scaleX via CSS variable
        bombFill.style.setProperty("--bomb-scale", String(scale));
      }
      bombBar.style.display = "block";
      // show timers container
      document
        .querySelectorAll("#timers_bg")
        .forEach((el) => (el.style.opacity = "1"));
      // defuse UI is controlled separately below
    } else {
      // hide planted UI
      if (bombBar) bombBar.style.display = "none";
      document
        .querySelectorAll("#timers_bg")
        .forEach((el) => (el.style.opacity = "0"));
    }

    // defuse bar: если defusing -> растёт в зависимости от countdown
    const defbar = document.querySelector("#defuse_planting_bar");
    const defbarFill = defbar ? defbar.querySelector(".defuse_fill") : null;
    if (defbar && bomb && bomb.state === "defusing") {
      const remaining = Math.max(0, Number(bomb.countdown) || 0);
      const total = remaining > 5.1 ? 10 : 5; // эвристика: 10s без кита, 5s с китом
      const scale = Math.max(0, Math.min(1, remaining / total));
      // scale from center using COLOR_NEW_CT_TOPPANEL if доступен
      try {
        const ctColor =
          typeof COLOR_NEW_CT_TOPPANEL === "string" && COLOR_NEW_CT_TOPPANEL
            ? COLOR_NEW_CT_TOPPANEL
            : "linear-gradient(90deg, rgba(2,135,243,1), rgba(4,120,220,1))";
        if (defbarFill) defbarFill.style.setProperty("--defuse-color", ctColor);
        else defbar.style.setProperty("--defuse-color", ctColor);
      } catch {}
      if (defbarFill)
        defbarFill.style.setProperty("--defuse-scale", String(scale));
      else defbar.style.setProperty("--defuse-scale", String(scale));
      document
        .querySelectorAll(".defuse_plant_container")
        .forEach((el) => (el.style.opacity = "1"));
    } else {
      document
        .querySelectorAll(".defuse_plant_container")
        .forEach((el) => (el.style.opacity = "0"));
      if (defbarFill) defbarFill.style.setProperty("--defuse-scale", `0`);
      else if (defbar) defbar.style.setProperty("--defuse-scale", `0`);
    }
  } catch (e) {}
  if (map && phase_countdowns)
    updateWinnerTeam(map, teams, roundData, phase_countdowns);
  if (filteredPlayers && activePlayer)
    updateActivePlayer(filteredPlayers, activePlayer);

  // Обновляем диаграмму сравнения команд
  if (filteredPlayers && map) updateTeamComparisonChart(filteredPlayers, map);

  // Обновляем таблицу лидеров по киллам
  if (filteredPlayers) updateKillsLeaderboard(filteredPlayers);
  if (hlae_status) updateHlaeKillfeed(hlae_status);
}

function updateHlaeKillfeed(hlae_status) {
  if (hlae_status.killfeed_on === true) {
    $("#killfeed-container").hide();
    $("#killfeed-HLAE").show();
  } else {
    $("#killfeed-container").show();
    $("#killfeed-HLAE").hide();
  }
}

function updateActivePlayer(allplayers, player) {
  // Проверяем, что player существует
  if (!player) return;

  // Фильтруем тренеров из списка игроков
  const filteredPlayers = {};
  let coachCount = 0;
  Object.keys(allplayers).forEach((steamid) => {
    if (!isCoach(allplayers[steamid])) {
      filteredPlayers[steamid] = allplayers[steamid];
    } else {
      coachCount++;
      const player = allplayers[steamid];
      //console.log(
      //  `updateActivePlayer: Скрыт тренер: ${player.name} (${player.team}) - slot: ${player.observer_slot}`
      //);
    }
  });
  if (coachCount > 0) {
    //console.log(`updateActivePlayer: Всего скрыто тренеров: ${coachCount}`);
  }

  // Используем ту же логику нумерации, что и в updateTeams
  const ctList = [];
  const tList = [];
  for (let steamid in filteredPlayers) {
    const p = filteredPlayers[steamid];
    if (!p) continue;
    const teamStr = String(p.team || "").toLowerCase();
    if (teamStr === "ct") ctList.push({ steamid, slot: p.observer_slot });
    else if (teamStr === "t") tList.push({ steamid, slot: p.observer_slot });
  }
  ctList.sort((a, b) => (a.slot || 0) - (b.slot || 0));
  tList.sort((a, b) => (a.slot || 0) - (b.slot || 0));
  const targetIndexBySteam = {};
  ctList.forEach((p, idx) => (targetIndexBySteam[p.steamid] = idx + 1));
  tList.forEach((p, idx) => (targetIndexBySteam[p.steamid] = idx + 1));

  for (let steamid in filteredPlayers) {
    const currentPlayer = filteredPlayers[steamid];
    const side = currentPlayer.team.toLowerCase() === "ct" ? "left" : "right";
    const playerNumber = targetIndexBySteam[steamid] || 1;

    // Основной селектор (как в updateTeams)
    let playerContainer = document.querySelector(
      `.shud-teambox.${side}.normal .player.${side}:nth-child(${playerNumber})`
    );
    // Фоллбэк на старую разметку
    if (!playerContainer) {
      playerContainer = document.querySelector(
        `#team_${side} .player_${playerNumber}`
      );
    }
    if (playerContainer) {
      if (currentPlayer.observer === true) {
        playerContainer.classList.add("active_spectated_player");
      } else {
        playerContainer.classList.remove("active_spectated_player");
      }
    }
  }
}

// ... existing code ...
function updateWinnerTeam(map, teams, round, phase_countdowns, left, right) {
  // show/hide winner announcement block when match state is over
  try {
    if (phase_countdowns && phase_countdowns.phase == "over") {
      $(".winner-announcement").css("opacity", 1);
    } else {
      $(".winner-announcement").css("opacity", 0);
    }
  } catch (e) {}
  const winnerContainer = document.querySelector(".winner_logo");

  if (!round.win_team) {
    if (winnerContainer) {
      /*winnerContainer.style.display = 'none';*/
    }
    return;
  }

  // Получаем информацию о последнем выигранном раунде
  let currentRound = map.round.toString();
  let lastWinType;

  // Проверяем, находимся ли мы в овертайме (раунд >= 24)

  if (map.round >= 24) {
    // Вычисляем номер раунда в текущем овертайме (1-6)
    const overtimeRound = (map.round - 24) % 6;
    // Используем номер раунда в овертайме для получения результата
    lastWinType = map.round_wins[overtimeRound.toString()];
  } else {
    // Для обычных раундов используем стандартную логику
    lastWinType = map.round_wins[currentRound];
  }

  if (!lastWinType) return;

  // Определяем, какая команда выиграла раунд
  let winnerTeam;
  let winnerLogo;

  if (lastWinType.startsWith("ct_")) {
    winnerTeam = map.team_ct;
    winnerLogo = winnerTeam.logo
      ? `/uploads/${winnerTeam.logo}`
      : "/images/logo_ct_default.png";
  } else if (lastWinType.startsWith("t_")) {
    winnerTeam = map.team_t;
    winnerLogo = winnerTeam.logo
      ? `/uploads/${winnerTeam.logo}`
      : "/images/logo_t_default.png";
  }

  if (winnerTeam && winnerContainer) {
    // Отображаем логотип победившей команды
    winnerContainer.innerHTML = `<img src="${winnerLogo}" alt="${winnerTeam.name}" class="winner_logo_size">`;

    // Отображаем название команды - ищем элемент вне контейнера логотипа
    const nameElement = document.querySelector(".winner_team");
    if (nameElement) {
      nameElement.textContent = winnerTeam.name;
    }

    winnerContainer.style.display = "block";
  }
}

// ... existing code ...
function updateBombDefusePlanting(bomb, phase, round, allplayers, player) {
  //console.log(bomb);
  if (bomb.state === "planting") {
    // Показываем элементы с анимацией
    $("#timers").css("opacity", 1).addClass("animated fadeInDown2");
    $("#timers_bg").css("opacity", 1);
    $("#defuse_planting_bar").css("opacity", 1);
    // ensure defuse container visible
    try {
      document
        .querySelectorAll(".defuse_plant_container")
        .forEach((el) => (el.style.opacity = "1"));
    } catch (e) {}

    const defuseBarEl = document.getElementById("defuse_planting_bar");
    const defuseFillEl = defuseBarEl
      ? defuseBarEl.querySelector(".defuse_fill")
      : null;

    const planter = Object.values(allplayers).find(
      (player) => player.steamid === bomb.player && player.team === "T"
    );

    // Константы для установки бомбы
    const plantTime = 3.0;
    const startCountdown = 3.0;

    // Показываем имя игрока с анимацией
    if (planter && planter.name) {
      $("#timers_bg #defuse_planting_bar_name")
        .text("Planting" + " " + planter.name)
        .css("opacity", 1)
        .animate({ opacity: 1 }, 300);
    }

    const progress = (startCountdown - bomb.countdown) / startCountdown;
    const clamped = Math.max(0, Math.min(1, progress));

    if (defuseFillEl) {
      defuseFillEl.style.setProperty("--defuse-scale", String(clamped));
      defuseFillEl.style.backgroundColor = COLOR_NEW_T;
      defuseFillEl.style.opacity = "1";
    } else {
      // fallback to old behaviour
      const initialWidth = 220;
      const currentWidth = Math.min(initialWidth * clamped, initialWidth);
      $("#timers_bg #defuse_planting_bar").css({
        width: `${currentWidth}px`,
        backgroundColor: COLOR_NEW_T,
      });
    }
  } else if (bomb.state === "defusing") {
    // Показываем элементы с анимацией
    $("#timers").css("opacity", 1).addClass("animated fadeInDown2");
    $("#timers_bg").css("opacity", 1);
    $("#defuse_planting_bar").css("opacity", 1);
    // ensure defuse container visible
    try {
      document
        .querySelectorAll(".defuse_plant_container")
        .forEach((el) => (el.style.opacity = "1"));
    } catch (e) {}

    // Use a requestAnimationFrame loop to smoothly decrease the defuse bar
    // immediately from the current remaining fraction to zero (no initial grow)
    const defuseBarEl = document.getElementById("defuse_planting_bar");
    const defuseFillEl = defuseBarEl
      ? defuseBarEl.querySelector(".defuse_fill")
      : null;
    // determine defuse total time (kit or no-kit)
    const defuser = Object.values(allplayers).find(
      (player) => player.steamid === bomb.player && player.team === "CT"
    );

    if (initialDefuseTime === null) {
      initialDefuseTime = bomb.countdown;
    }
    const hasKit = initialDefuseTime <= 5.1;
    const totalDefuseTime = hasKit ? 5 : 10;

    // show name
    if (defuser && defuser.name) {
      $("#timers_bg #defuse_planting_bar_name")
        .text("Defusing" + " " + defuser.name)
        .css("opacity", 1)
        .animate({ opacity: 1 }, 300);
    }

    // cancel previous RAF if any
    if (window._defuseRafId) {
      cancelAnimationFrame(window._defuseRafId);
      window._defuseRafId = null;
    }

    const remainingFractionStart = Math.max(
      0,
      Math.min(1, bomb.countdown / totalDefuseTime)
    );
    const durationMs = Math.max(0, bomb.countdown * 1000);
    const startTs = performance.now();

    // set initial scale immediately (avoid any grow)
    if (defuseBarEl) {
      // ensure element width is full and cancel any jQuery width animations on the fill
      try {
        $("#timers_bg #defuse_planting_bar .defuse_fill")
          .stop(true, true)
          .css({});
      } catch (e) {
        // fallback to vanilla
        defuseBarEl.style.width = "220px";
        defuseBarEl.style.transition = "none";
      }
      if (defuseFillEl) {
        defuseFillEl.style.setProperty(
          "--defuse-scale",
          remainingFractionStart
        );
        defuseFillEl.style.backgroundColor = COLOR_NEW_CT;
        defuseFillEl.style.opacity = "1";
      } else {
        defuseBarEl.style.setProperty("--defuse-scale", remainingFractionStart);
        defuseBarEl.style.backgroundColor = COLOR_NEW_CT;
        defuseBarEl.style.opacity = "1";
      }
    }

    function defuseStep(ts) {
      const elapsed = ts - startTs;
      const t = durationMs <= 0 ? 1 : Math.min(1, elapsed / durationMs);
      const scale = Math.max(0, remainingFractionStart * (1 - t));
      if (defuseFillEl) defuseFillEl.style.setProperty("--defuse-scale", scale);
      else if (defuseBarEl)
        defuseBarEl.style.setProperty("--defuse-scale", scale);
      if (t < 1) {
        window._defuseRafId = requestAnimationFrame(defuseStep);
      } else {
        // finished
        if (defuseFillEl) {
          defuseFillEl.style.setProperty("--defuse-scale", 0);
        } else if (defuseBarEl) {
          defuseBarEl.style.setProperty("--defuse-scale", 0);
        }
        window._defuseRafId = null;
      }
    }

    window._defuseRafId = requestAnimationFrame(defuseStep);
  } else {
    // Скрываем элементы с анимацией
    $("#timers_bg").css("opacity", 0).removeClass("animated fadeInDown2");
    $("#timers_bg #defuse_planting_bar").text("").css("opacity", 0);
    $("#timers_bg #defuse_planting_bar_name").text("").css("opacity", 0);
    try {
      document
        .querySelectorAll(".defuse_plant_container")
        .forEach((el) => (el.style.opacity = "0"));
    } catch (e) {}
    $("#timers_bg #defuse_bar").stop(true, true).css({
      width: "0px",
      backgroundColor: COLOR_NEW_CT,
    });

    // clear any inline width/scale and restore transition for the fill
    try {
      $("#defuse_planting_bar").css("width", "");
    } catch (e) {
      const container = document.getElementById("defuse_planting_bar");
      if (container) {
        const fill = container.querySelector(".defuse_fill");
        if (fill) {
          fill.style.width = "";
          fill.style.removeProperty("--defuse-scale");
          fill.style.opacity = "";
        } else {
          container.style.width = "";
          container.style.removeProperty("--defuse-scale");
          container.style.opacity = "";
        }
      }
    }

    initialDefuseTime = null;
  }
}
// ... existing code ...

function updateCircleBombTimer(bomb, round) {
  if (!bomb) return;

  const $bombTimer = $(".test2");
  const $bombContainer = $(".super-bomb");
  const strokeDasharray = "156.8"; // 2πr (где r=25)

  if (bomb.state === "planted") {
    // Показываем контейнер бомбы
    if ($bombContainer.css("opacity") === "0") {
      $bombContainer.css({ opacity: 1 });
    }

    $("#round_now").css("opacity", 0);

    if (bomb.countdown <= 40 && bomb.countdown > 0) {
      $("#round_timer_text").addClass("bomb_active");
      $("#round_timer_text").css("color", COLOR_RED);
      if (bomb.countdown >= 39.9) {
        // Начальное состояние - полный круг
        $bombTimer.stop(true, true).css({
          "stroke-dashoffset": "0",
          opacity: 1,
        });

        // Анимация уменьшения круга
        $bombTimer.animate(
          {
            "stroke-dashoffset": strokeDasharray,
          },
          {
            duration: 40000,
            easing: "linear",
            queue: false,
            complete: function () {
              // Скрываем контейнер только если бомба не разминируется
              if (bomb.state !== "defusing") {
                $bombContainer.css("opacity", 0);
              }
            },
          }
        );
      } else {
        // Если мы подключились в середине таймера, рассчитываем текущий прогресс
        const progress = (40 - bomb.countdown) / 40;
        $bombTimer.css({
          "stroke-dashoffset": progress * strokeDasharray,
        });
      }
    }
  } else if (bomb.state === "exploded") {
    // Останавливаем анимацию и скрываем таймер при взрыве
    $bombTimer.stop(true, true);
    $bombContainer.css("opacity", 0);
  } else if (bomb.state === "defused") {
    // Останавливаем анимацию и скрываем таймер при разминировании
    $bombTimer.stop(true, true);
    $bombContainer.css("opacity", 0);
  } else if (bomb.state !== "defusing") {
    // Скрываем таймер, если бомба не установлена и не разминируется
    $bombContainer.css("opacity", 0);
    $bombTimer.stop(true, true).css({
      "stroke-dashoffset": "0",
    });
    $("#round_timer_text").css("color", COLOR_GRAY);
  }

  // Сбрасываем таймер при завершении раунда
  if (round.win_team) {
    $bombTimer.stop(true, true);
    $bombContainer.css("opacity", 0);
    $("#round_now").css("opacity", 1);
    $("#round_timer_text").css("color", COLOR_GRAY);
  }
}

// Управление видимостью #round_now в зависимости от состояния: бомба, пауза, выигрыш раунда по элиминации, фризтайм
function setRoundNowVisibility(map, phase, bomb, roundData) {
  try {
    const $rn = $("#round_now");
    if (!$rn.length) return;

    // Показываем в freezetime
    if (phase?.phase === "freezetime") {
      $rn.css("opacity", 1);
      return;
    }

    // Скрываем при установке бомбы
    if (bomb && bomb.state === "planted") {
      $rn.css("opacity", 0);
      return;
    }

    // Скрываем при паузе (pause)
    if (phase?.phase === "paused") {
      $rn.css("opacity", 0);
      return;
    }

    // Скрывать если раунд завершён и тип завершения - элиминация (например ct_win_elimination / t_win_elimination)
    if (roundData && roundData.win_team) {
      const currentRound = String(map?.round || "");
      let lastWinType = map?.round_wins?.[currentRound];
      if (!lastWinType && map?.round >= 24) {
        // попробовать получить индекс для OT
        const overtimeRound = ((map.round - 24) % 6) + 1;
        lastWinType = map?.round_wins?.[String(overtimeRound)];
      }
      if (lastWinType && /elimination/i.test(lastWinType)) {
        $rn.css("opacity", 0);
        return;
      }
    }

    // По умолчанию показываем
    $rn.css("opacity", 1);
  } catch (e) {}
}
// ... existing code ...

function updateMapPick(
  map,
  matchup,
  match,
  match_maps,
  matchupis,
  teams,
  phase_countdowns
) {
  //console.log(match_maps);
  // Проверяем, активен ли матч
  const isMatchActive = match?.is_active === true;

  // Если матч неактивен, сбрасываем данные о победителе
  if (!isMatchActive) {
    // Очищаем логотипы победителей
    $(
      ".map_pick_team_1_win, .map_pick_team_2_win, .decider_win, .map_pick_team_3_win, .map_pick_team_4_win, .decider2_win"
    ).empty();

    // Сбрасываем классы и стили для счета
    $(
      ".map_pick_team_1_score, .map_pick_team_2_score, .decider_score, .map_pick_team_3_score, .map_pick_team_4_score, .decider2_score"
    )
      .removeClass("live-score")
      .css("color", COLOR_GRAY);
  }

  // Не переопределяем параметры, а дефолтим их только при отсутствии
  matchup = match?.format || matchup || "bo1";
  match_maps = Array.isArray(match_maps) ? match_maps : [];

  function formatMapName(mapName) {
    return (mapName || "").replace("de_", "").toUpperCase();
  }
  function formatMapLabel(mapName) {
    const cleaned = (mapName || "").replace("de_", "").toUpperCase();
    return cleaned.slice(0, 2);
  }

  function getMapImagePath(mapName) {
    return `/MAPS/pick/${formatMapName(mapName)}.png`;
  }

  function getMapBackgroundPath(mapName, isBlack) {
    return `/MAPS/pick/map_fon/${formatMapName(mapName)}${
      isBlack ? "_black" : ""
    }.png`;
  }

  if (matchupis === false) {
    // Add map image if map.name exists
    if (map?.name) {
      $(".map_pick_team_1_map").html(
        `<img src="${getMapImagePath(map.name)}" alt="${formatMapName(
          map.name
        )}">`
      );
    }

    // Add background image only if match_maps exists and has elements
    if (map.name) {
      $("#map_pick_team_1").css(
        "background",
        `url('${getMapBackgroundPath(map.name)}')`
      );
    }

    $(".map_pick_team_1_score").text("LIVE").addClass("live-score");
    $(".map_pick_team_1_pick").text("DECIDER").addClass("decider-text");
    //$('.map_pick_team_1_win').text('BO1');
  }

  function setMapVisibility() {
    const mapElements = $(
      "#map_pick_team_1, #map_pick_team_2, #map_pick_team_3, #map_pick_team_4, #decider, #decider2"
    );

    // Сначала скрываем все элементы
    mapElements.hide();

    // Показываем нужные элементы в зависимости от matchup и matchupis
    if (matchupis === true) {
      switch (matchup) {
        case "bo5":
          $(
            "#map_pick_team_1, #map_pick_team_2, #map_pick_team_3, #map_pick_team_4, #decider2"
          ).show();
          break;
        case "bo3":
          $("#map_pick_team_1, #map_pick_team_2, #decider").show();
          break;
        case "bo1":
          $("#map_pick_team_1").show();
          break;
        default:
          $("#map_pick_team_1").show();
          break;
      }
    } else {
      // Если matchupis === false, показываем только первую карту
      $("#map_pick_team_1").show();
    }
  }

  // Вызываем функцию для установки видимости элементов
  setMapVisibility();

  // Проверяем наличие match_maps и обрабатываем данные карт
  if (!match_maps || !Array.isArray(match_maps)) {
    return; // Выходим из функции, если match_maps не определен или не является массивом
  }

  // Обрабатываем карты в зависимости от формата матча
  if (matchup == "bo3") {
    $("#map_pick_team_1").removeClass("is-bo1");
    // Обрабатываем первую карту
    if (match_maps[0]) {
      // Исправленный код - используем HTML для создания изображения
      $(`.map_pick_team_1_map`).text(
        `${formatMapName(match_maps[0].map_name)}`
      );

      // Устанавливаем фон карты в зависимости от статуса
      if (match_maps[0].status === "active") {
        $("#map_pick_team_1").css(
          "background",
          `url('${getMapBackgroundPath(match_maps[0].map_name)}')`
        );
      } else {
        $("#map_pick_team_1").css(
          "background",
          `url('${getMapBackgroundPath(match_maps[0].map_name, true)}')`
        );
      }

      // Логотип команды, выбравшей карту
      if (match_maps[0].logo_team_pick) {
        $(".map_pick_team_1_pick").html(`
          <img src="/uploads/${match_maps[0].logo_team_pick}" alt="Team Logo" class="team-logo">
        `);
      }

      // Логотип победителя
      if (match_maps[0].winner_logo) {
        $(".map_pick_team_1_win").html(`
          <img src="/uploads/${match_maps[0].winner_logo}" alt="Winner Logo">
        `);
      }

      // Если карта активна, показываем статус LIVE
      if (match_maps[0].status === "active") {
        //console.log(match_maps[0].status);
        $(".map_pick_team_1_score").text("LIVE").addClass("live-score");
        //$('.map_pick_team_1_score').css('color', COLOR_GRAY);
      } else if (match_maps[0].status === "pending") {
        $(".map_pick_team_1_score").text("- : -");
        $(".map_pick_team_1_score").css("color", COLOR_GRAY);
      } else {
        // Иначе показываем счет
        const score = `${match_maps[0].score_team1} - ${match_maps[0].score_team2}`;
        $(".map_pick_team_1_score").text(score);
        $(".map_pick_team_1_score").css("color", COLOR_GRAY);
      }
    }

    // Обрабатываем вторую карту
    if (match_maps[1]) {
      // Исправленный код - используем HTML для создания изображения
      $(`.map_pick_team_2_map`).text(
        `${formatMapName(match_maps[1].map_name)}`
      );

      // Устанавливаем фон карты в зависимости от статуса
      if (match_maps[1].status === "active") {
        $("#map_pick_team_2").css(
          "background",
          `url('${getMapBackgroundPath(match_maps[1].map_name)}')`
        );
      } else {
        $("#map_pick_team_2").css(
          "background",
          `url('${getMapBackgroundPath(match_maps[1].map_name, true)}')`
        );
      }

      if (match_maps[1].logo_team_pick) {
        $(".map_pick_team_2_pick").html(`
          <img src="/uploads/${match_maps[1].logo_team_pick}" alt="Team Logo" class="team-logo">
        `);
      }
      if (match_maps[1].winner_logo) {
        $(".map_pick_team_2_win").html(`
          <img src="/uploads/${match_maps[1].winner_logo}" alt="Winner Logo">
        `);
      }

      if (match_maps[1].status === "active") {
        $(".map_pick_team_2_score").text("LIVE").addClass("live-score");
      } else if (match_maps[1].status === "pending") {
        $(".map_pick_team_2_score").text("- : -");
        $(".map_pick_team_2_score").css("color", COLOR_GRAY);
      } else {
        const score = `${match_maps[1].score_team1} - ${match_maps[1].score_team2}`;
        $(".map_pick_team_2_score").text(score);
        $(".map_pick_team_2_score").css("color", COLOR_GRAY);
      }
    }

    // Обрабатываем decider
    if (match_maps[2]) {
      $(`.decider_map`).text(`${formatMapName(match_maps[2].map_name)}`);

      if (match_maps[2].status === "active") {
        $("#decider").css(
          "background",
          `url('${getMapBackgroundPath(match_maps[2].map_name)}')`
        );
      } else {
        $("#decider").css(
          "background",
          `url('${getMapBackgroundPath(match_maps[2].map_name, true)}')`
        );
      }

      if (match_maps[2].winner_logo) {
        $(".decider_win").html(`
          <img src="/uploads/${match_maps[2].winner_logo}" alt="Winner Logo">
        `);
      }

      if (match_maps[2].status === "active") {
        $(".decider_score").text("LIVE").addClass("live-score");
      } else if (match_maps[2].status === "pending") {
        $(".decider_score").text("DECIDER").addClass("decider-text");
        $(".decider_score").css("color", COLOR_GRAY);
      } else {
        const score = `${match_maps[2].score_team1} - ${match_maps[2].score_team2}`;
        $(".decider_score").text(score);
        $(".decider_score").css("color", COLOR_GRAY);
      }
    }
  } else if (matchup == "bo5") {
    $("#map_pick_team_1").removeClass("is-bo1");
    // Обрабатываем все 5 карт (4 + decider2)
    for (let i = 0; i < Math.min(match_maps.length, 5); i++) {
      const mm = match_maps[i];
      if (!mm) continue;
      const isDecider2 = i === 4;
      const containerId = isDecider2 ? "decider2" : `map_pick_team_${i + 1}`;
      const mapClass = isDecider2 ? ".decider_map2" : `.${containerId}_map`;
      const scoreClass = isDecider2
        ? ".decider_score2"
        : `.${containerId}_score`;
      const pickClass = isDecider2 ? ".decider2_pick" : `.${containerId}_pick`;
      const winClass = isDecider2 ? ".decider2_win" : `.${containerId}_win`;

      // Картинка карты
      $(mapClass).text(`${formatMapLabel(mm.map_name)}`);
      // Фон
      if (mm.status === "active") {
        $(`#${containerId}`).css(
          "background",
          `url('${getMapBackgroundPath(mm.map_name)}')`
        );
      } else {
        $(`#${containerId}`).css(
          "background",
          `url('${getMapBackgroundPath(mm.map_name, true)}')`
        );
      }
      // Счет/статус
      if (mm.status === "active") {
        $(scoreClass).text("LIVE").addClass("live-score");
      } else if (mm.status === "pending") {
        if (isDecider2) {
          $(scoreClass).text("DECIDER").addClass("decider-text");
          $(scoreClass).css("color", COLOR_GRAY);
        } else {
          $(scoreClass).text("- : -");
          $(scoreClass).css("color", COLOR_GRAY);
        }
      } else {
        const score = `${mm.score_team1} - ${mm.score_team2}`;
        $(scoreClass).text(score);
        $(scoreClass).css("color", COLOR_GRAY);
      }
      // Пик логотип
      if (mm.logo_team_pick) {
        $(pickClass).html(`
          <img src="/uploads/${mm.logo_team_pick}" alt="Team Logo" class="team-logo">
        `);
      }
      // Победитель
      if (mm.winner_logo) {
        $(winClass).html(`
          <img src="/uploads/${mm.winner_logo}" alt="Winner Logo">
        `);
      }
    }
  } else {
    // bo1: показываем только первую карту
    if (match_maps[0]) {
      const mm = match_maps[0];
      $("#map_pick_team_1").addClass("is-bo1");
      $(".map_pick_team_1_map").text(`${formatMapName(mm.map_name)}`);
      $("#map_pick_team_1").css(
        "background",
        `url('${getMapBackgroundPath(mm.map_name)}')`
      );
      if (mm.status === "active") {
        $(".map_pick_team_1_score").text("LIVE").addClass("live-score");
      } else if (mm.status === "pending") {
        $(".map_pick_team_1_score").text("- : -");
        $(".map_pick_team_1_score").css("color", COLOR_GRAY);
      } else {
        const score = `${mm.score_team1} - ${mm.score_team2}`;
        $(".map_pick_team_1_score").text(score);
        $(".map_pick_team_1_score").css("color", COLOR_GRAY);
      }
      // В bo1 логотип команды, сделавшей пик, не отображаем
      $(".map_pick_team_1_pick").empty();
      if (matchupis === false) {
        // Если формат отображается как single decider без пиков
        $(".map_pick_team_1_pick").text("DECIDER").addClass("decider-text");
      }
      if (mm.winner_logo) {
        $(".map_pick_team_1_win").html(`
          <img src="/uploads/${mm.winner_logo}" alt="Winner Logo">
        `);
      }
    }
  }
}
function updateHistory(map, phase_countdowns) {
  // Проверяем, существует ли map.round_wins
  if (!map.round_wins) {
    map.round_wins = {};
  }

  const currentRound = map.round;
  const lastWinType = map.round_wins[currentRound];
  const isFirstOvertimeTransition =
    currentRound === 24 && map.team_ct.score === 12 && map.team_t.score === 12;
  const isOvertimeTransition =
    (currentRound === 30 &&
      map.team_ct.score === 15 &&
      map.team_t.score === 15) ||
    (currentRound === 36 &&
      map.team_ct.score === 21 &&
      map.team_t.score === 21) ||
    (currentRound === 42 &&
      map.team_ct.score === 27 &&
      map.team_t.score === 27);

  // Получаем все необходимые элементы DOM
  const historyBlock = document.querySelector("#history");
  const historyOtBlock = document.querySelector("#history_ot");
  const historyIcons = document.querySelectorAll(
    ".history_icon_round .history_icon"
  );
  const historyNumbers = document.querySelectorAll(".history_round .number");
  const historyIconsOt = document.querySelectorAll(
    ".history_icon_round_ot .history_icon_ot"
  );
  const historyNumbersOt = document.querySelectorAll(
    ".history_round_ot .number_ot"
  );
  /*
  // Управляем видимостью блоков истории
  if (currentRound <= 23) {
    historyBlock.style.display = "block";
    historyOtBlock.style.display = "none";
  } else {
    historyBlock.style.display = "none";
    historyOtBlock.style.display = "block";
  }*/

  const iconMapping = {
    ct_win_elimination: "icon_skull_CT.png",
    t_win_elimination: "icon_skull_T.png",
    ct_win_defuse: "defused_gr.png",
    t_win_bomb: "icon_bomb_explosion_red.png",
    ct_win_time: "time3.png",
  };

  // Обновляем основную историю (раунды 1-24)
  if (currentRound <= 24) {
    // Обновляем верхнюю полосу (CT)
    historyIcons.forEach((iconDiv, index) => {
      const roundNumber = index + 1;
      const result = map.round_wins[roundNumber];

      if (roundNumber <= 24) {
        const topBar = iconDiv.querySelector(".history_top");
        if (!topBar) return;

        if (result && result.startsWith("ct_")) {
          topBar.style.backgroundColor = COLOR_NEW_CT;
          topBar.style.height = "28px";

          // Используем iconMapping для получения правильного имени иконки
          const iconName = iconMapping[result];
          if (iconName) {
            topBar.innerHTML = `<img src="/huds/${HUD_NAME}/img/round/${iconName}" class="history_icon_img">`;
          }
        } else {
          topBar.style.backgroundColor = "transparent";
          topBar.style.height = "28px";
          topBar.innerHTML = "";
        }
      }
    });

    // Обновляем центральную полосу (номера раундов)
    historyNumbers.forEach((numberDiv, index) => {
      const roundNumber = index + 1;
      if (roundNumber <= 24) {
        numberDiv.style.display = "block";
        numberDiv.textContent = roundNumber;
        if (roundNumber === currentRound + 1) {
          numberDiv.classList.add("active_round");
        } else {
          numberDiv.classList.remove("active_round");
        }
      }
    });

    // Обновляем нижнюю полосу (T)
    historyIcons.forEach((iconDiv, index) => {
      const roundNumber = index + 1;
      const result = map.round_wins[roundNumber];

      if (roundNumber <= 24) {
        const bottomBar = iconDiv.querySelector(".history_bottom");
        if (!bottomBar) return;

        if (result && result.startsWith("t_")) {
          bottomBar.style.backgroundColor = COLOR_NEW_T;
          bottomBar.style.height = "28px";

          // Используем iconMapping для получения правильного имени иконки
          const iconName = iconMapping[result];
          if (iconName) {
            bottomBar.innerHTML = `<img src="/huds/${HUD_NAME}/img/round/${iconName}" class="history_icon_img">`;
          }
        } else {
          bottomBar.style.backgroundColor = "transparent";
          bottomBar.style.height = "28px";
          bottomBar.innerHTML = "";
        }
      }
    });
  }

  // Аналогично для овертайма
  if (currentRound >= 24) {
    const overtimeRound = ((currentRound - 24) % 6) + 1;

    // Обновляем верхнюю полосу овертайма (CT)
    historyIconsOt.forEach((iconDiv, index) => {
      const roundNumber = index + 1;
      const result = map.round_wins[roundNumber];

      const topBar = iconDiv.querySelector(".history_top_ot");
      if (!topBar) return;

      if (result && result.startsWith("ct_")) {
        topBar.style.backgroundColor = COLOR_NEW_CT;
        topBar.style.height = "28px";

        const iconName = iconMapping[result];
        if (iconName) {
          topBar.innerHTML = `<img src="/huds/${HUD_NAME}/img/round/${iconName}" class="history_icon_img">`;
        }
      } else {
        topBar.style.backgroundColor = "transparent";
        topBar.style.height = "28px";
        topBar.innerHTML = "";
      }
    });

    // ... existing code ...

    // Обновляем центральную полосу овертайма (номера)
    historyNumbersOt.forEach((numberDiv, index) => {
      const roundNumber = index + 1;
      const overtimeRound = ((currentRound - 24) % 6) + 1; // Вычисляем текущий раунд овертайма (1-6)

      numberDiv.style.display = "block";
      numberDiv.textContent = roundNumber; // Отображаем номера от 1 до 6 для каждого овертайма

      // Подсвечиваем активный раунд
      if (
        roundNumber === overtimeRound ||
        (isFirstOvertimeTransition && roundNumber === 1)
      ) {
        numberDiv.classList.add("active_round");
      } else {
        numberDiv.classList.remove("active_round");
      }
    });

    // ... existing code ...

    // Обновляем нижнюю полосу овертайма (T)
    // ... existing code ...

    // Обновляем нижнюю полосу овертайма (T)
    historyIconsOt.forEach((iconDiv, index) => {
      const roundNumber = index + 1;
      const result = map.round_wins[roundNumber];

      const bottomBar = iconDiv.querySelector(".history_bottom_ot");
      if (!bottomBar) return;

      if (result && result.startsWith("t_")) {
        bottomBar.style.backgroundColor = COLOR_NEW_T;
        bottomBar.style.height = "28px";

        const iconName = iconMapping[result];
        if (iconName) {
          bottomBar.innerHTML = `<img src="/huds/${HUD_NAME}/img/round/${iconName}" class="history_icon_img">`;
        }
      } else {
        bottomBar.style.backgroundColor = "transparent";
        bottomBar.style.height = "28px";
        bottomBar.innerHTML = "";
      }
    });

    // ... existing code ...
  }
}

function updateLivePlayer(left, right) {
  // Проверяем наличие необходимых данных
  if (!left || !right) {
    // Если данных нет, очищаем или скрываем элементы
    $(".team_counter_left, .team_counter_right").text("0");
    $(".vs_counter").text("");
    return;
  }

  //console.log(left, right);

  // Обновляем количество живых игроков с проверкой на существование данных

  const leftAlivePlayers =
    left?.filter((p) => p?.state?.health > 0)?.length || 0;
  const rightAlivePlayers =
    right?.filter((p) => p?.state?.health > 0)?.length || 0;

  // Определяем цвета на основе сторон команд с проверкой

  const leftColor =
    left[0]?.team?.toLowerCase() === "ct" ? COLOR_NEW_CT : COLOR_NEW_T;
  const rightColor =
    right[0]?.team?.toLowerCase() === "ct" ? COLOR_NEW_CT : COLOR_NEW_T;

  // Обновляем цвет текста количества игроков
  $(".team_counter_left").text(`${leftAlivePlayers}`).css("color", COLOR_WHITE);
  $(".team_counter_right")
    .text(`${rightAlivePlayers}`)
    .css("color", COLOR_WHITE);
  $(".team_counter_left").css("background", COLOR_NEW_CT_TOPPANEL);
  $(".team_counter_right").css("background", COLOR_NEW_T_TOPPANEL);

  // Обновляем текст ситуации (PLAYERS ALIVE / CLUTCH)
  if (leftAlivePlayers === 1 || rightAlivePlayers === 1) {
    $(".vs_counter").text("CLUTCH");
  } else {
    $(".vs_counter").text("PLAYERS ALIVE"); // Очищаем текст в других случаях
  }
}

function updateTopPanel(
  left,
  right,
  map,
  phase_countdowns,
  bomb,
  match,
  round_now
) {
  // left и right уже должны быть отфильтрованы в actuallyUpdateHUD, но на всякий случай проверяем

  // ... existing code ...
  // Add null check for match object
  var matchup = match?.format || "bo1";
  // ... existing code ...

  $("#info").text(matchup.toUpperCase());

  var phase = phase_countdowns;
  var round = map.round;
  //var round_wins = map.round_wins;

  // Добавляем определение переменной lastWinType

  // Проверяем наличие необходимых данных
  if (!map || !left || !right) {
    // Скрываем или очищаем элементы при отсутствии данных
    $(".team_left, .team_right, .score_left, .score_right").text("");
    $(".logo_left .logo, .logo_right .logo").attr("src", "");
    $(".border_left, .border_right, .map_left, .map_right").css(
      "background-color",
      ""
    );
    return; // Прерываем выполнение функции
  }

  const currentRound = map.round || 0;
  const teamsSelected = left?.name && right?.name;
  const matchFormat = match?.format; // Получаем формат матча или используем bo1 по умолчанию
  const isValidFormat = ["bo1", "bo3", "bo5"].includes(matchFormat); // Проверяем валидность формата

  // Базовые цвета текста
  $(
    ".team-name.left, .live_left, .team-score.left, .team-name.right, .live_right, .team-score.right"
  ).css("color", COLOR_WHITE);

  if (!teamsSelected) {
    // Используем имена команд напрямую из map объекта, с проверкой на существование
    const ctNameFull = map.team_ct?.name || "";
    const tNameFull = map.team_t?.name || "";
    const ctShort = map.team_ct?.short_name || ctNameFull;
    const tShort = map.team_t?.short_name || tNameFull;
    const formatName = (full, short) =>
      String(full).length > 10 ? short : full;

    $(".team-name.left").text(formatName(ctNameFull, ctShort));
    $(".team-name.right").text(formatName(tNameFull, tShort));

    // Обновляем счет с проверкой на существование
    $(".team-score.left .score").text(map.team_ct?.score || "0");
    $(".team-score.right .score").text(map.team_t?.score || "0");

    // Определяем цвета на основе сторон
    const leftBorderColor = COLOR_NEW_CT;
    const rightBorderColor = COLOR_NEW_T;
    const leftBgColor = COLOR_NEW_CT;
    const rightBgColor = COLOR_NEW_T;

    // Применяем цвета границ
    //$(".border_left").css("background-color", leftBorderColor);
    //$(".border_right").css("background-color", rightBorderColor);
    //$(".map_left").css("background-color", leftBorderColor);
    //$(".map_right").css("background-color", rightBorderColor);

    // Сначала удаляем все классы фона
    $(".team.left .background-shape").removeClass(COLOR_NEW_CT_TOPPANEL);
    $(".team.right .background-shape").removeClass(COLOR_NEW_T_TOPPANEL);
    // И синхронизируем классы CT/T на team-блоках топ-панели
    const $teamLeft = $(".team.left .background-shape");
    const $teamRight = $(".team.right .background-shape");

    // Определяем классы на основе сторон с проверкой на существование left[0]
    if (left && left.length > 0 && left[0].team === "CT") {
      $teamLeft.css("background", COLOR_NEW_CT_TOPPANEL);
      $teamRight.css("background", COLOR_NEW_T_TOPPANEL);
    } else {
      $teamLeft.css("background", COLOR_NEW_T_TOPPANEL);
      $teamRight.css("background", COLOR_NEW_CT_TOPPANEL);
    }

    if (map.team_ct.logo && map.team_t.logo !== null) {
      // Используем дефолтные логотипы на основе сторон
      $(".name_logo.left .logo img").attr(
        "src",
        "/uploads/" + map.team_ct.logo
      );
      $(".name_logo.right .logo img").attr(
        "src",
        "/uploads/" + map.team_t.logo
      );
    } else {
      // Используем дефолтные логотипы на основе сторон
      $(".name_logo.left .logo img").attr("src", "/images/logo_ct_default.png");
      $(".name_logo.right .logo img").attr("src", "/images/logo_t_default.png");
    }

    // Отображение серий (выигранных карт) в блоках над счётом
    const matchFormat = match?.format || "bo1";
    const barsCount = matchFormat === "bo5" ? 3 : matchFormat === "bo3" ? 2 : 1;
    const scoreTeam1 = map?.team_ct?.matches_won_this_series || 0;
    const scoreTeam2 = map?.team_t?.matches_won_this_series || 0;

    const $seriesLeft = $(".shud-matchbar .team.left .team-series");
    const $seriesRight = $(".shud-matchbar .team.right .team-series");
    $seriesLeft.empty();
    $seriesRight.empty();

    for (let i = 0; i < barsCount; i++) {
      const barL = $("<div>").addClass("map_bar");
      if (i < scoreTeam1) barL.addClass("map_bar_active");
      $seriesLeft.append(barL);
    }

    for (let i = 0; i < barsCount; i++) {
      const barR = $("<div>").addClass("map_bar");
      if (i < scoreTeam2) barR.addClass("map_bar_active");
      $seriesRight.append(barR);
    }

    // Меняем только названия команд, оставляя счет неизменным
    /*const leftTeam = teams.left;
      const rightTeam = teams.right;
              // Обновляем логотипы с проверкой на существование
        $(".logo_left .logo").attr("src", "/storage/" + (leftTeam.logo || `logo_${teams.left?.side?.toLowerCase()}_default.png`));
        $(".logo_right .logo").attr("src", "/storage/" + (rightTeam.logo || `logo_${teams.right?.side?.toLowerCase()}_default.png`));*/
  }

  const timerElement = $("#round_timer_text");
  const phase_time = phase.phase_ends_in || "0:00";

  // Проверяем текущее состояние
  let newContent = "";
  let shouldUpdate = false;

  if (phase.phase === "over" && map.round_wins) {
    const currentRound = map.round.toString();
    // Добавляем логику для овертайма
    let lastWinType;

    if (map.round >= 24) {
      // Вычисляем номер раунда в текущем овертайме (1-6)
      // Исправляем формулу для получения правильного индекса раунда в овертайме
      const overtimeRound = ((map.round - 24) % 6) + 1;

      // Пробуем получить результат по номеру раунда в текущем овертайме
      lastWinType = map.round_wins[overtimeRound.toString()];

      // Если не нашли результат, пробуем использовать абсолютный номер раунда
      if (!lastWinType) {
        lastWinType = map.round_wins[currentRound];
      }

      // Если все еще нет результата, пробуем другие варианты индексации
      if (!lastWinType) {
        // Некоторые API могут использовать индексацию с 0 для раундов овертайма
        const zeroBasedOvertimeRound = (map.round - 24) % 6;
        lastWinType = map.round_wins[zeroBasedOvertimeRound.toString()];
      }
    } else {
      // Для обычных раундов используем стандартную логику
      lastWinType = map.round_wins[currentRound];
    }

    const iconMapping = {
      ct_win_elimination: "icon_skull_CT.png",
      t_win_elimination: "icon_skull_T.png",
      ct_win_defuse: "defused_gr.png",
      t_win_bomb: "icon_bomb_explosion_red.png",
      ct_win_time: "time3.png",
      warmup_time: "icon_hourglass_default.png",
    };

    const iconName = iconMapping[lastWinType];
    if (iconName) {
      newContent = `<img src="/huds/${HUD_NAME}/img/round/${iconName}" style="height: 30px; width: auto;">`;
      shouldUpdate = timerElement.html() !== newContent;
      // Убираем класс bomb-blink при завершении раунда
      timerElement.removeClass("bomb-blink");
    }
  } else if (phase.phase === "warmup") {
    newContent = `<img src="/images/elements/icon_hourglass_default.png" style="height: 30px; width: auto;">`;
    shouldUpdate = timerElement.html() !== newContent;
  } else if (bomb.state === "planted") {
    newContent = `<img src="/huds/${HUD_NAME}/img/round/c4_w_red.webp" style="height: 30px; width: auto; top: 15px; background-repeat: no-repeat; background-size: contain; background-position: center;">`;
    shouldUpdate = timerElement.html() !== newContent;
  } else if (bomb.state === "defusing") {
    newContent = `<img src="/huds/${HUD_NAME}/img/round/c4_w_red.webp" style="height: 30px; width: auto; top: 15px; background-repeat: no-repeat; background-size: contain; background-position: center;">`;
    shouldUpdate = timerElement.html() !== newContent;
  } else if (phase.phase === "paused") {
    newContent = `<img src="/huds/${HUD_NAME}/img/round/lOBxb.png" style="height: 30px; width: auto;">`;
    shouldUpdate = timerElement.html() !== newContent;
  } else {
    const formattedTime = formatPhaseTime(phase_time);
    newContent = formattedTime;
    shouldUpdate = timerElement.text() !== formattedTime;
    // Убираем класс bomb-blink при других фазах
    timerElement.removeClass("bomb-blink");
  }

  // Обновляем содержимое только если оно изменилось
  if (shouldUpdate) {
    if (newContent.includes("<img")) {
      timerElement.html(newContent);
    } else {
      timerElement.text(newContent);
    }
  }

  // Обновляем состояние фазы и раунда
  if (
    currentPhaseState.phase !== phase.phase ||
    currentPhaseState.round !== map.round
  ) {
    currentPhaseState.phase = phase.phase;
    currentPhaseState.round = map.round;
  }

  function formatPhaseTime(time) {
    if (!time || time === "0:00") return "0:00";

    if (typeof time === "string" && time.includes(":")) return time;

    const seconds = Math.max(0, Math.ceil(parseFloat(time)));
    if (isNaN(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const formattedSeconds =
      remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;

    return `${minutes}:${formattedSeconds}`;
  }

  // Обновляем отображение текущего раунда
  const currentRound_live = round + 1; // Вычитаем 1 для получения текущего раунда
  if (currentRound_live < 25) {
    $("#round_now").text(`ROUND ${currentRound_live} / 24`);
  } else {
    const overtimeNumber = Math.floor((currentRound_live - 25) / 6); // Исправлено: 24 на 25
    const overtimeRound = ((currentRound_live - 25) % 6) + 1; // Исправлено: 24 на 25 и добавлено +1
    $("#round_now").text(`OT ${overtimeNumber + 1} (${overtimeRound}/6)`);
  }

  //Тайм ауты команды
  if (
    map.team_ct.timeouts_remaining >= 0 ||
    map.team_t.timeouts_remaining >= 0
  ) {
    // Показываем блок тайм-аутов
    $("#time_out_team").show();

    // Обновляем текст тайм-аута в зависимости от активной команды
    if (phase.phase === "timeout_t") {
      $("#time_out_text").text("TIMEOUT");
      $("#time_out_team_text").text(
        map.team_t.name + " use: " + map.team_t.timeouts_remaining
      );
      $("#time_out_team").css("opacity", "1");
    } else if (phase.phase === "timeout_ct") {
      $("#time_out_text").text("TIMEOUT");
      $("#time_out_team_text").text(
        map.team_ct.name + " use: " + map.team_ct.timeouts_remaining
      );
      $("#time_out_team").css("opacity", "1");
    } else if (
      phase.phase === "freezetime" ||
      phase.phase === "live" ||
      phase.phase === "over"
    ) {
      $("#time_out_team").css("opacity", "0");
    }
  } else {
    // Скрываем блок тайм-аутов если нет активных тайм-аутов
    $("#time_out_team").hide();
  }
}

function updateUtility(allplayers, map) {
  const left = Object.values(allplayers).filter(
    (player) => player.team === "CT"
  );
  const right = Object.values(allplayers).filter(
    (player) => player.team === "T"
  );

  const leftTeamUtility = countTeamUtility(
    Object.values(allplayers).filter((player) => player.team === "CT")
  );
  const rightTeamUtility = countTeamUtility(
    Object.values(allplayers).filter((player) => player.team === "T")
  );

  // Определяем стороны команд в начале функции
  const leftTeamSide = "ct"; // Так как мы фильтруем CT для левой команды
  const rightTeamSide = "t"; // Так как мы фильтруем T для правой команды

  // Проверяем наличие любых гранат или тазеров
  const leftNoUtility =
    leftTeamUtility.flashbang === 0 &&
    leftTeamUtility.hegrenade === 0 &&
    leftTeamUtility.smokegrenade === 0 &&
    leftTeamUtility.molotov === 0 &&
    leftTeamUtility.incgrenade === 0 &&
    leftTeamUtility.taser === 0 &&
    leftTeamUtility.defuse === 0;

  const rightNoUtility =
    rightTeamUtility.flashbang === 0 &&
    rightTeamUtility.hegrenade === 0 &&
    rightTeamUtility.smokegrenade === 0 &&
    rightTeamUtility.molotov === 0 &&
    rightTeamUtility.incgrenade === 0 &&
    rightTeamUtility.taser === 0 &&
    rightTeamUtility.defuse === 0;

  // Функция для подсчета предметов у команды
  function countTeamUtility(players) {
    const counts = {
      flashbang: 0,
      hegrenade: 0,
      smokegrenade: 0,
      molotov: 0,
      incgrenade: 0, // включает и molotov и incgrenade
      defuse: 0,
      taser: 0,
    };

    if (!players) return counts;

    players.forEach((player) => {
      if (!player?.weapons) return;

      Object.values(player.weapons).forEach((weapon) => {
        switch (weapon.name) {
          case "weapon_flashbang":
            counts.flashbang += weapon.ammo_reserve || 1;
            break;
          case "weapon_hegrenade":
            counts.hegrenade++;
            break;
          case "weapon_smokegrenade":
            counts.smokegrenade++;
            break;
          case "weapon_molotov":
            counts.molotov++;
            break;
          case "weapon_incgrenade":
            counts.incgrenade++;
            break;
          case "weapon_taser":
            counts.taser++;
            break;
        }
      });

      // Проверяем наличие дефузкита
      if (player.state?.defusekit) {
        counts.defuse++;
      }
      // Проверяем наличие taser
      if (player.state?.taser) {
        counts.taser++;
      }
    });

    return counts;
  }

  // Обновляем отображение для левой команды
  $("#utility_left .utility1_text").text(
    "x" + (leftTeamUtility.flashbang || 0)
  );
  $("#utility_left .utility2_text").text(
    "x" + (leftTeamUtility.hegrenade || 0)
  );
  $("#utility_left .utility3_text").text(
    "x" + (leftTeamUtility.smokegrenade || 0)
  );
  $("#utility_left .utility4_text").text("x" + (leftTeamUtility.molotov || 0));
  $("#utility_left .utility5_text").text(
    "x" + (leftTeamUtility.incgrenade || 0)
  );
  $("#utility_left .kit_text").text("x" + (leftTeamUtility.defuse || 0));
  $("#utility_left .taser_text").text("x" + (leftTeamUtility.taser || 0));

  // Обновляем отображение для правой команды
  $("#utility_right .utility1_text").text(
    "x" + (rightTeamUtility.flashbang || 0)
  );
  $("#utility_right .utility2_text").text(
    "x" + (rightTeamUtility.hegrenade || 0)
  );
  $("#utility_right .utility3_text").text(
    "x" + (rightTeamUtility.smokegrenade || 0)
  );
  $("#utility_right .utility4_text").text(
    "x" + (rightTeamUtility.molotov || 0)
  );
  $("#utility_right .utility5_text").text(
    "x" + (rightTeamUtility.incgrenade || 0)
  );
  $("#utility_right .kit_text").text("x" + (rightTeamUtility.defuse || 0));
  $("#utility_right .taser_text").text("x" + (rightTeamUtility.taser || 0));

  // Устанавливаем фоновые изображения для иконок
  const utilityImages = {
    utility1_img: "flashbang.png",
    utility2_img: "hegrenade.png",
    utility3_img: "smokegrenade.png",
    utility4_img: "molotov.png",
    utility5_img: "incgrenade.png",
    kit_img: "defuse.png",
    taser_img: "taser.png",
  };

  // Применяем фоновые изображения (точные селекторы по классам в шаблоне)
  Object.entries(utilityImages).forEach(([className, imageName]) => {
    $(`#utility_left .${className}, #utility_right .${className}`).css({
      "background-image": `url("/images/weapons/${imageName}")`,
    });
  });

  // Обновляем отображение для левой команды
  $("#utility_left .utility1_text").text("x" + leftTeamUtility.flashbang);
  $("#utility_left .utility2_text").text("x" + leftTeamUtility.hegrenade);
  $("#utility_left .utility3_text").text("x" + leftTeamUtility.smokegrenade);
  $("#utility_left .utility4_text").text("x" + leftTeamUtility.molotov);
  $("#utility_left .utility5_text").text("x" + leftTeamUtility.incgrenade);
  $("#utility_left .kit_text").text("x" + leftTeamUtility.defuse);
  $("#utility_left .taser_text").text("x" + leftTeamUtility.taser);

  // Обновляем отображение для правой команды
  $("#utility_right .utility1_text").text("x" + rightTeamUtility.flashbang);
  $("#utility_right .utility2_text").text("x" + rightTeamUtility.hegrenade);
  $("#utility_right .utility3_text").text("x" + rightTeamUtility.smokegrenade);
  $("#utility_right .utility4_text").text("x" + rightTeamUtility.molotov);
  $("#utility_right .utility5_text").text("x" + rightTeamUtility.incgrenade);
  $("#utility_right .kit_text").text("x" + rightTeamUtility.defuse);
  $("#utility_right .taser_text").text("x" + rightTeamUtility.taser);

  // Всегда показываем иконки и количество для всех типов гранат
  $("#utility_right .utility1_img, #utility_left .utility1_img").show();
  $("#utility_right .utility1_text, #utility_left .utility1_text").show();

  $("#utility_right .utility2_img, #utility_left .utility2_img").show();
  $("#utility_right .utility2_text, #utility_left .utility2_text").show();

  $("#utility_right .utility3_img, #utility_left .utility3_img").show();
  $("#utility_right .utility3_text, #utility_left .utility3_text").show();

  $("#utility_right .utility4_img, #utility_left .utility4_img").show();
  $("#utility_right .utility4_text, #utility_left .utility4_text").show();

  $("#utility_right .utility5_img, #utility_left .utility5_img").show();
  $("#utility_right .utility5_text, #utility_left .utility5_text").show();

  // Тейзер всегда показываем
  $("#utility_right .taser_img, #utility_left .taser_img").show();
  $("#utility_right .taser_text, #utility_left .taser_text").show();

  // Для дефузкита сохраняем прежнюю логику (только для CT)
  $("#utility_left .kit_img, #utility_left .kit_text").toggle(
    leftTeamSide === "ct"
  );
  $("#utility_right .kit_img, #utility_right .kit_text").toggle(
    rightTeamSide === "ct"
  );

  // Показываем/скрываем элементы дефузкита в зависимости от стороны команды
  $("#utility_left .kit_img, #utility_left .kit_text").toggle(
    leftTeamSide === "ct" && leftTeamUtility.defuse > 0
  );
  $("#utility_right .kit_img, #utility_right .kit_text").toggle(
    rightTeamSide === "ct" && rightTeamUtility.defuse > 0
  );

  // Экономика команды
  function getTeamEconomyStatus(players) {
    if (!players || !Array.isArray(players)) return "FULL BUY";

    const totalEquipValue = players
      .filter((player) => player?.state?.health > 0)
      .reduce((sum, player) => sum + (player?.state?.equip_value || 0), 0);

    if (players.length === 0) return "FULL BUY";

    // Новая логика определения экономического статуса команды
    if (totalEquipValue <= 5000) {
      return "FULL ECO";
    } else if (totalEquipValue <= 10000) {
      return "SEMI ECO";
    } else if (totalEquipValue <= 20000) {
      return "SEMI BUY";
    } else {
      return "FULL BUY";
    }
  }

  const leftTeamEco = getTeamEconomyStatus(left);
  const rightTeamEco = getTeamEconomyStatus(right);

  // Исправленные селекторы
  $("#utility_left #info_team .eco_left .eco_text").text(leftTeamEco);
  $("#utility_right #info_team .eco_right .eco_text").text(rightTeamEco);

  function getTeamLossBonus(players, map) {
    // Определяем, какая это команда (CT или T) по первому игроку
    if (!players || !players.length || !map) return 1400;

    const teamSide = players[0]?.team;
    let losses = 0;

    if (teamSide === "CT") {
      losses = map.team_ct?.consecutive_round_losses || 0;
    } else if (teamSide === "T") {
      losses = map.team_t?.consecutive_round_losses || 0;
    }

    // Правильные значения loss bonus
    switch (losses) {
      case 0:
        return 1400;
      case 1:
        return 1900;
      case 2:
        return 2400;
      case 3:
        return 2900;
      default:
        return losses >= 4 ? 3400 : 1400;
    }
  }

  const leftTeamLossBonus = getTeamLossBonus(left, map);
  const rightTeamLossBonus = getTeamLossBonus(right, map);

  // Обновляем текст loss bonus
  $("#utility_left #info_team .loss_bonus_left_text").text(
    `LB: +${leftTeamLossBonus}$`
  );
  $("#utility_right #info_team .loss_bonus_right_text").text(
    `LB: +${rightTeamLossBonus}$`
  );
}
function updateSpectator(player) {
  var observed = player;
  // Если нет данных наблюдателя, скрываем элемент и выходим
  /*if (!observed) {
        $('#spectator').css('opacity', 0);
        return;
      }
    
      $('#spectator').css('opacity', 1);*/

  // Добавляем аватар наблюдаемого игрока
  const avatarElement = document.querySelector(".spectator_avatar");
  if (avatarElement) {
    const avatarUrl = observed.avatar
      ? `/uploads/${observed.avatar}`
      : "/images/player_silhouette.webp";
    avatarElement.style.backgroundImage = `url("${avatarUrl}")`;
  }

  const spectatorElement = document.querySelector(".spectator_info");
  if (spectatorElement) {
    spectatorElement.classList.remove("spectator_team_t", "spectator_team_ct");
    if (observed.team === "T") {
      spectatorElement.classList.add("spectator_team_t");
      spectatorElement.style.backgroundImage = COLOR_T_SPECTATOR;
    } else if (observed.team === "CT") {
      spectatorElement.classList.add("spectator_team_ct");
      spectatorElement.style.backgroundImage = COLOR_CT_SPECTATOR;
    }
  }

  // Обновляем имя наблюдателя
  const spectatorNameElement = document.querySelector(".spectator_name");
  if (spectatorNameElement && observed.name) {
    spectatorNameElement.textContent = observed.name;
  }

  // Добавляем статистику игрока
  const stats = observed.match_stats || {};

  // Обновляем убийства
  const killsElement = document.querySelector(".spectator_kills");
  if (killsElement) {
    killsElement.textContent = stats.kills || "0";
  }

  // Обновляем ассисты
  const assistsElement = document.querySelector(".spectator_assists");
  if (assistsElement) {
    assistsElement.textContent = stats.assists || "0";
  }

  // Обновляем смерти
  const deathsElement = document.querySelector(".spectator_deaths");
  if (deathsElement) {
    deathsElement.textContent = stats.deaths || "0";
  }

  // Обновляем раунд убийств
  const roundKillsElement = document.querySelector(".spectator_kills_round");
  const roundKillsImgElement = document.querySelector(
    ".spectator_kills_round_img"
  );
  if (roundKillsElement && roundKillsImgElement && observed && observed.state) {
    // Добавляем проверку observed и observed.state
    const roundKills = observed.state.round_kills || 0;
    if (roundKills > 0) {
      roundKillsElement.textContent = roundKills;
      roundKillsElement.style.opacity = "1";
      roundKillsImgElement.style.opacity = "1";
    } else {
      roundKillsElement.style.opacity = "0";
      roundKillsImgElement.style.opacity = "0";
    }
  }

  // Обработка основного оружия
  const weaponElement = document.querySelector(".spectator_weapon");
  if (weaponElement) {
    let activeWeapon = null;
    const weapons = Object.values(observed.weapons || {});
    const priorityTypes = [
      "Rifle",
      "SniperRifle",
      "Submachine Gun",
      "Machine Gun",
      "Shotgun",
      "Pistol",
      "Taser",
      "Knife",
    ];

    // Ищем активное оружие приоритетных типов
    activeWeapon = weapons.find(
      (weapon) =>
        weapon.state === "active" && priorityTypes.includes(weapon.type)
    );

    // Если активное не найдено, ищем любое приоритетное
    if (!activeWeapon) {
      activeWeapon = weapons.find((weapon) =>
        priorityTypes.includes(weapon.type)
      );
    }

    if (activeWeapon) {
      const weaponName = activeWeapon.name.replace("weapon_", "");
      weaponElement.style.backgroundImage = `url("/images/weapons/${weaponName}.png")`;
      // Убираем background-size для пистолетов
      if (activeWeapon.type == "Pistol") {
        weaponElement.style.backgroundSize = "35%";
      } else if (activeWeapon.type == "Submachine Gun") {
        weaponElement.style.backgroundSize = "35%";
      } else if (activeWeapon.type == "Knife") {
        weaponElement.style.backgroundSize = "65%";
      } else {
        weaponElement.style.backgroundSize = "";
      }
      weaponElement.style.display = "";

      // Добавляем отображение патронов
      const ammoElement = document.querySelector(".spectator_ammo_clip_text");
      if (ammoElement) {
        const currentAmmo = activeWeapon.ammo_clip || 0;
        const reserveAmmo = activeWeapon.ammo_reserve || 0;
        ammoElement.textContent = `${currentAmmo}/${reserveAmmo}`;
        ammoElement.style.display = "";

        // Добавляем красный цвет при малом количестве патронов
        if (currentAmmo <= 5 && activeWeapon.type !== "Knife") {
          ammoElement.style.color = COLOR_WHITE;
        } else {
          ammoElement.style.color = COLOR_WHITE;
        }
      }
    } else {
      weaponElement.style.display = "none";
      // Скрываем счетчик патронов если нет оружия
      const ammoElement = document.querySelector(".spectator_ammo_clip_text");
      if (ammoElement) {
        ammoElement.style.display = "none";
      }
    }
  }

  // Обработка гранат
  for (let i = 1; i <= 4; i++) {
    const grenadeElement = document.querySelector(`.spectator_grenade_${i}`);
    if (grenadeElement) {
      grenadeElement.style.display = "none";
    }
  }

  let grenadeCount = 1;
  const weapons = Object.values(observed.weapons || {});

  // Сначала отображаем все гранаты кроме флешек
  weapons.forEach((weapon) => {
    if (
      weapon.type === "Grenade" &&
      weapon.name !== "weapon_flashbang" &&
      grenadeCount <= 4
    ) {
      const grenadeElement = document.querySelector(
        `.spectator_grenade_${grenadeCount}`
      );
      if (grenadeElement) {
        const grenadeName = weapon.name.replace("weapon_", "");
        grenadeElement.style.backgroundImage = `url("/images/weapons/${grenadeName}.png")`;
        grenadeElement.style.display = "";
        grenadeCount++;
      }
    }
  });

  // Затем отображаем флешки
  weapons.forEach((weapon) => {
    if (
      weapon.type === "Grenade" &&
      weapon.name === "weapon_flashbang" &&
      grenadeCount <= 4
    ) {
      const flashCount = weapon.ammo_reserve || 1;
      for (let i = 0; i < flashCount && grenadeCount <= 4; i++) {
        const grenadeElement = document.querySelector(
          `.spectator_grenade_${grenadeCount}`
        );
        if (grenadeElement) {
          grenadeElement.style.backgroundImage =
            'url("/images/weapons/flashbang.png")';
          grenadeElement.style.display = "";
          grenadeCount++;
        }
      }
    }
  });

  // Обработка C4 и дефузкита
  const bombKitElement = document.querySelector(".spectator_bomb_kit");
  if (bombKitElement) {
    const hasBomb = weapons.some((weapon) => {
      if (weapon.type === "C4") {
        bombKitElement.style.backgroundImage = 'url("/images/weapons/c4.png")';
        bombKitElement.style.display = "";
        return true;
      }
      return false;
    });

    // Показываем дефузкит только если он есть в state и игрок за CT
    if (!hasBomb && observed.state?.defusekit && observed.team === "CT") {
      bombKitElement.style.backgroundImage =
        'url("/images/weapons/defuse.png")';
      bombKitElement.style.display = "";
    } else if (!hasBomb) {
      // Скрываем элемент если нет ни бомбы, ни дефузкита
      bombKitElement.style.display = "none";
    }
  }

  // Обработка Zeus
  const zeusElement = document.querySelector(".spectator_zeus");
  if (zeusElement) {
    const hasZeus = weapons.some((weapon) => weapon.type === "Taser");
    zeusElement.style.display = hasZeus ? "" : "none";
    if (hasZeus) {
      zeusElement.style.backgroundImage = 'url("/images/weapons/taser.png")';
    }
  }

  // Обработка брони и здоровья
  const hpElement = document.querySelector(".spectator_hp_text");
  const armorElement = document.querySelector(".spectator_armor_text");
  if (hpElement && armorElement && observed && observed.state) {
    hpElement.textContent = observed.state.health || "0";
    armorElement.textContent = observed.state.armor || "0";
  }
}

function updateObservedPanel(player) {
  try {
    const observedRoot = document.querySelector(".shud-observed");
    if (!observedRoot) return;

    // Hide if no player
    if (!player) {
      observedRoot.classList.add("hide");
      return;
    }

    observedRoot.classList.remove("hide");

    // Team styling classes
    observedRoot.classList.remove("CT", "T");
    const team = String(player.team || player.teamid || "").toUpperCase();
    if (team === "CT" || team === "T") observedRoot.classList.add(team);

    // Apply blob backgrounds from constants (no CSS vars)
    try {
      const colorForTeam = team === "CT" ? COLOR_NEW_CT : COLOR_NEW_T;
      const smallBlob = observedRoot.querySelector(".player_data .small-blob");
      const bigBlob = observedRoot.querySelector(".player_data .big-blob");
      if (smallBlob) smallBlob.style.background = colorForTeam;
      if (bigBlob) bigBlob.style.background = colorForTeam;

      const usernameContainer = observedRoot.querySelector(
        ".player_data .username_container"
      );
      if (usernameContainer) {
        usernameContainer.style.background =
          team === "CT" ? COLOR_NEW_CT_TOPPANEL : COLOR_NEW_T_TOPPANEL;
      }
    } catch (_) {}

    // Avatar
    const avatarImg = observedRoot.querySelector(".avatar img");
    if (avatarImg) {
      const avatarUrl = player.avatar
        ? `/uploads/${player.avatar}`
        : "/images/player_silhouette.webp";
      if (avatarImg.src !== location.origin + avatarUrl)
        avatarImg.src = avatarUrl;
    }

    // Basic texts
    const usernameEl = observedRoot.querySelector(".username");
    if (usernameEl) usernameEl.textContent = player.name || "";

    const killsEl = observedRoot.querySelector(".stats-row .kills, .kills");
    const deathsEl = observedRoot.querySelector(".stats-row .deaths, .deaths");
    const roundKillsEl = observedRoot.querySelector(".stats-row .round_kills");
    const adrEl = observedRoot.querySelector(".stats-row .adr");
    const ms = player.match_stats || {};
    const st = player.state || {};
    if (killsEl) killsEl.textContent = String(ms.kills ?? 0);
    if (deathsEl) deathsEl.textContent = String(ms.deaths ?? 0);
    if (roundKillsEl) roundKillsEl.textContent = String(st.round_kills ?? 0);
    if (adrEl) adrEl.textContent = String(st.adr ?? 0);

    const healthEl = observedRoot.querySelector(".state .health");
    if (healthEl) healthEl.textContent = String(st.health ?? 0);

    // Grenades
    const grenadesEl = observedRoot.querySelector(".grenades");
    if (grenadesEl) {
      grenadesEl.innerHTML = "";
      const weapons = Object.values(player.weapons || {});

      const pushIcon = (name) => {
        const el = document.createElement("div");
        el.className = "grenade-item";
        const imgName = name.replace("weapon_", "");
        el.style.cssText = `
          width: 20px; height: 16px; background-size: contain;
          background-position: center; background-repeat: no-repeat;
          background-image: url("/images/weapons/${imgName}.png");
          margin: 0 2px; display: inline-block;
        `;
        grenadesEl.appendChild(el);
      };

      // non-flash first
      weapons.forEach((w) => {
        if (w.type === "Grenade" && w.name !== "weapon_flashbang")
          pushIcon(w.name);
      });
      // then flashbang(s)
      weapons.forEach((w) => {
        if (w.type === "Grenade" && w.name === "weapon_flashbang")
          pushIcon(w.name);
      });

      // bomb for T
      if (player.team === "T") {
        const bomb = weapons.find((w) => w.name === "weapon_c4");
        if (bomb) {
          const el = document.createElement("div");
          el.className = "bomb-item";
          el.style.cssText = `
            width: 20px; height: 16px; background-size: contain;
            background-position: center; background-repeat: no-repeat;
            background-image: url("/images/weapons/c4.png");
            margin: 0 2px; display: inline-block;
          `;
          grenadesEl.appendChild(el);
        }
      }

      // defuse kit for CT
      if (player.team === "CT") {
        const kit = weapons.find((w) => w.name === "weapon_defuser");
        if (kit || player.state?.defusekit) {
          const el = document.createElement("div");
          el.className = "kit-item";
          el.style.cssText = `
            width: 20px; height: 16px; background-size: contain;
            background-position: center; background-repeat: no-repeat;
            background-image: url("/images/weapons/defuse.png");
            margin: 0 2px; display: inline-block;
          `;
          grenadesEl.appendChild(el);
        }
      }

      // placeholders to total 4 items
      const current = grenadesEl.querySelectorAll(
        ".grenade-item, .bomb-item, .kit-item"
      ).length;
      for (let i = current; i < 4; i++) {
        const slot = document.createElement("div");
        slot.className = "grenade-slot";
        grenadesEl.appendChild(slot);
      }
    }
  } catch (e) {
    // no-op
  }
}
function updateTeams(players, left, right) {
  // Фильтруем игроков, которых нужно скрыть (на всякий случай, если они не были отфильтрованы ранее)
  if (players) {
    players = filterHiddenPlayers(players);
  }

  // Фильтруем только скрытых игроков (как в радаре), но не тренеров
  if (players) {
    players = filterHiddenPlayers(players);
  }

  var allplayers = players;

  // Удаляем тренеров из расчёта и готовим упорядоченные списки для корректного распределения по слотам
  const playerEntries = Object.entries(allplayers || {}).filter(
    ([, p]) => p && !isCoach(p)
  );
  const ctPlayersOrdered = playerEntries
    .filter(([, p]) => String(p.team || "").toLowerCase() === "ct")
    .sort((a, b) => {
      const sa =
        typeof a[1].observer_slot === "number" ? a[1].observer_slot : 999;
      const sb =
        typeof b[1].observer_slot === "number" ? b[1].observer_slot : 999;
      return sa - sb;
    });
  const tPlayersOrdered = playerEntries
    .filter(([, p]) => String(p.team || "").toLowerCase() === "t")
    .sort((a, b) => {
      const sa =
        typeof a[1].observer_slot === "number" ? a[1].observer_slot : 999;
      const sb =
        typeof b[1].observer_slot === "number" ? b[1].observer_slot : 999;
      return sa - sb;
    });

  // Карты steamid → порядковый номер в своей команде начиная с 1
  const ctIndexBySteam = new Map();
  const tIndexBySteam = new Map();
  ctPlayersOrdered.forEach(([sid], idx) => ctIndexBySteam.set(sid, idx + 1));
  tPlayersOrdered.forEach(([sid], idx) => tIndexBySteam.set(sid, idx + 1));

  // Сначала очистим все значения и скроем все слоты
  for (let side of ["left", "right"]) {
    for (let i = 1; i <= 6; i++) {
      const playerContainer = document.querySelector(
        `.shud-teambox.${side}.normal .player.${side}:nth-child(${i})`
      );
      if (playerContainer) {
        playerContainer.style.display = "none";
        // Устанавливаем дефолтную аватарку
        const avatarElement = playerContainer.querySelector(
          ".player-inner .avatar"
        );
        const avatarElement2 = playerContainer.querySelector(".avatar");
        if (avatarElement) {
          avatarElement.style.backgroundImage =
            'url("/images/player_silhouette.webp")';
        }
        if (avatarElement2) {
          avatarElement2.style.backgroundImage =
            'url("/images/player_silhouette.webp")';
        }
      }
    }
  }

  // Теперь обновляем данные игроков
  //console.log("Всего игроков:", Object.keys(allplayers).length);
  //console.log("Игроки по слотам:");
  for (let steamid in allplayers) {
    const player = allplayers[steamid];
    //console.log(
    //  `  ${player.name}: slot=${player.observer_slot}, team=${player.team}`
    //);
  }

  for (let steamid in allplayers) {
    const player = allplayers[steamid];
    if (!player || isCoach(player)) continue;
    const side =
      String(player.team || "").toLowerCase() === "ct" ? "left" : "right";
    // Номер позиции — последовательный из предрассчитанных списков
    const playerNumber =
      side === "left"
        ? ctIndexBySteam.get(steamid)
        : tIndexBySteam.get(steamid);
    if (!playerNumber) continue;

    const playerContainer = document.querySelector(
      `.shud-teambox.${side}.normal .player.${side}:nth-child(${playerNumber})`
    );
    //console.log(
    //  `Поиск контейнера: #team_${side} .player_${playerNumber} - ${
    //    playerContainer ? "найден" : "НЕ НАЙДЕН"
    //  }`
    //);
    if (playerContainer) {
      // Показываем контейнер игрока
      playerContainer.style.display = "";

      // Добавляем плавные переходы
      playerContainer.style.transition = "opacity 0.3s ease-out";
      playerContainer.style.position = "relative";
      playerContainer.style.height = "60px";

      // Добавляем класс команды
      playerContainer.classList.remove("CT", "T");
      playerContainer.classList.add(player.team);

      // Применяем фон для .player-inner из JS-констант (без CSS-переменных)
      /*const inner = playerContainer.querySelector(".player-inner");
      if (inner) {
        try {
          const bg = _computeInnerBackground(player.team);
          inner.style.background = bg || "";
        } catch (_) {}
      }*/

      const inner = playerContainer.querySelector(".player.left .player-inner");
      if (player.team === "CT") {
        inner.style.background = COLOR_NEW_CT;
      }

      const inner2 = playerContainer.querySelector(
        ".player.right .player-inner"
      );
      if (player.team === "T") {
        inner2.style.background = COLOR_NEW_T;
      }

      // Оставляем элементы в исходных рядах:
      // weapon (.primary_container) — в верхней строке напротив ника
      // money (.money) — под ником
      // kills/deaths/grenades — на строке HP-бара

      // Обновляем HP бар с эффектом урона
      const hpBarContainer = playerContainer.querySelector(".hp_bar_outer");
      if (hpBarContainer) {
        // Создаем или получаем элемент бара урона
        let damageBar = hpBarContainer.querySelector(".hp_bar_damage");
        if (!damageBar) {
          damageBar = document.createElement("div");
          damageBar.className = "hp_bar_damage";
          hpBarContainer.insertBefore(damageBar, hpBarContainer.firstChild);
        }

        // Получаем основной HP бар
        const mainBar = hpBarContainer.querySelector(".hp_bar");

        if (mainBar && damageBar) {
          const currentHealth = parseInt(player.state.health, 10) || 0;
          const prevHealth = parseInt(
            damageBar.dataset.prevHealth || "100",
            10
          );
          const healthPercentage = currentHealth / 100;
          const isRightTeam = playerContainer.classList.contains("right");

          // Без фоновой заливки у контейнера HP-бара
          const isCT = String(player.team || "").toUpperCase() === "CT";
          hpBarContainer.style.background = "";

          // Настройка уровней слоя: damage (красный) снизу, основной сверху
          damageBar.style.position = "relative";
          mainBar.style.position = "relative";
          damageBar.style.zIndex = "0";
          mainBar.style.zIndex = "1";
          damageBar.style.opacity = "1";
          mainBar.style.opacity = "1";

          // Задаём фон полос hp_bar / hp_bar_damage
          const hpTeamColor = isCT ? COLOR_CT_HP_BAR : COLOR_T_HP_BAR;
          mainBar.style.background = hpTeamColor; // основная полоса = цвет команды
          damageBar.style.background = COLOR_RED; // полоса урона = красный

          // Ориентация полос (лево/право)
          if (isRightTeam) {
            // Для правой команды - уменьшаем слева направо (выравниваем к правому краю)
            mainBar.style.marginLeft = "auto";
            damageBar.style.marginLeft = "auto";
          } else {
            // Для левой команды - уменьшаем справа налево (выравниваем к левому краю)
            mainBar.style.marginLeft = "0";
            damageBar.style.marginLeft = "0";
          }

          // Мгновенно устанавливаем ширину основной полосы в цвете команды
          mainBar.style.width = `${healthPercentage * 100}%`;

          // Красная полоса снизу показывает полученный урон и догоняет основной бар
          const damagePercentage = prevHealth / 100;
          damageBar.style.width = `${damagePercentage * 100}%`;
          // Плавно уменьшаем красную полосу до текущего HP
          setTimeout(() => {
            damageBar.style.width = `${healthPercentage * 100}%`;
          }, 100);

          // Сохраняем текущее значение для следующего обновления
          damageBar.dataset.prevHealth = currentHealth;
        }
      }

      // Определяем, мертв ли игрок
      const isDead = player.state.health <= 0;

      // Плавный переход в статус мертвый
      if (isDead) {
        playerContainer.classList.add("dead");
        playerContainer.style.opacity = "0.6";
      } else {
        playerContainer.classList.remove("dead");
        playerContainer.style.opacity = "1";
      }

      // Добавляем/обновляем полосы здоровья
      let healthBar = playerContainer.querySelector(".health-bar");
      let healthBarFon = playerContainer.querySelector(".health-bar_fon");

      // Рассчитываем ширину полосы здоровья
      const healthPercentage = player.state.health / 100;
      const maxHeight = 135; // Максимальная ширина полосы в пикселях
      const currentHeight = maxHeight * healthPercentage;

      // Определяем цвет в зависимости от команды и количества здоровья
      // ... existing code ...

      // Определяем цвет в зависимости от команды и количества здоровья
      // ... existing code ...

      // Определяем цвет в зависимости от команды и количества здоровья — через константы, а не CSS-классы
      const setBg = (el, val) => {
        if (!el || !val) return;
        try {
          if (/gradient/i.test(val)) {
            el.style.background = String(val);
          } else {
            el.style.background = "";
            el.style.backgroundColor = String(val);
          }
        } catch {}
      };
      const teamStr = String(player.team || "").toLowerCase();
      const teamFillColor =
        teamStr === "ct"
          ? (typeof COLOR_NEW_CT === "string" && COLOR_NEW_CT) || COLOR_CT
          : (typeof COLOR_NEW_T === "string" && COLOR_NEW_T) || COLOR_T;
      const lowHpColor = COLOR_RED;
      const fonColor =
        (typeof HEALTH_BAR_FON === "string" && HEALTH_BAR_FON) ||
        (typeof PLAYER_BOMB === "string" && PLAYER_BOMB) ||
        COLOR_MAIN_PANEL ||
        teamFillColor;

      const chosen = player.state.health <= 20 ? lowHpColor : teamFillColor;
      // Сбрасываем классы и применяем inline-цвета
      if (healthBar) {
        healthBar.classList.remove("left_hp_bg_team1", "right_hp_bg_team2");
        setBg(healthBar, chosen);
      }
      if (healthBarFon) {
        setBg(healthBarFon, fonColor);
      }

      // ... existing code ...

      // ... existing code ...

      // Сохраняем предыдущее значение здоровья для анимации
      const prevHealth =
        parseInt(
          (healthBar && healthBar.dataset.prevHealth) || player.state.health,
          10
        ) || 0;
      const currentHealth = parseInt(player.state.health, 10) || 0;
      const healthChanged = prevHealth !== currentHealth;

      // Обновляем основную полосу здоровья
      if (healthBar) {
        healthBar.style.height = `${currentHeight}px`;
        setBg(healthBar, chosen);
        /*healthBar.style.transition = 'height 0.3s ease-out';*/
      }

      // Обновляем фоновую полосу здоровья независимо от состояния игрока
      if (healthBarFon) {
        // Плавное «догоняющее» изменение фона при уменьшении HP
        if (currentHealth < prevHealth) {
          const targetHeight = currentHeight;
          const startHeight =
            parseFloat(healthBarFon.style.height) || currentHeight;
          const step = () => {
            const cur = parseFloat(healthBarFon.style.height) || startHeight;
            const next = Math.max(targetHeight, cur - 2); // скорость догоняния
            healthBarFon.style.height = `${next}px`;
            setBg(healthBarFon, fonColor);
            if (next > targetHeight) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        } else {
          healthBarFon.style.height = `${currentHeight}px`;
          setBg(healthBarFon, fonColor);
        }
        healthBarFon.style.transition = "height 0.6s ease-out";
      }

      // Устанавливаем ширину и класс dead в зависимости от состояния
      if (healthBar) healthBar.dataset.prevHealth = String(currentHealth);
      if (isDead) {
        playerContainer.style.height = "165px";
        playerContainer.classList.add("dead");

        // Скрываем конкретные элементы
        const elementsToHide = [
          ".img_armor",
          ".img_hp",
          ".player_armor",
          ".player_hp",
          ".health-bar",
          ".health-bar_fon",
        ];

        elementsToHide.forEach((selector) => {
          const element = playerContainer.querySelector(selector);
          if (element) {
            /*element.style.transition = 'width 1s 0.5s';*/
            element.style.opacity = "0";
          }
        });

        // Оставляем имя и фоновую полосу видимыми
        const elementsToKeepVisible = [".username"];

        elementsToKeepVisible.forEach((selector) => {
          const element = playerContainer.querySelector(selector);
          if (element) {
            element.style.opacity = "1";
          }
        });
      } else {
        /*playerContainer.style.width = '300px';*/
        playerContainer.style.height = "185px";
        playerContainer.classList.remove("dead");

        // Показываем все элементы
        const elementsToShow = [
          ".img_armor",
          ".img_hp",
          ".player_armor",
          ".player_hp",
          ".health-bar",
          ".health-bar_fon",
        ];

        elementsToShow.forEach((selector) => {
          const element = playerContainer.querySelector(selector);
          if (element) {
            /*element.style.transition = 'width 1s 0.5s';*/
            element.style.opacity = "1";
          }
        });

        // ... existing code ...

        // ... existing code ...
      }

      // Подсветка активного наблюдаемого игрока по флагу observer (для каждого currentPlayer)
      // Подсветка применена выше по циклу и не должна дублироваться здесь

      // Добавляем отображение total damage при смерти
      const roundDmg = playerContainer.querySelector(".round_dmg");
      if (roundDmg) {
        if (isDead) {
          const totalDamage = player.state.round_totaldmg || 0; // Используем round_totaldmg
          roundDmg.textContent = `ROUND DMG: ${totalDamage}`;
          roundDmg.style.display = "block";
        } else {
          roundDmg.style.display = "none";
        }
      }
      // Обновляем информацию
      const nameElement = playerContainer.querySelector(".username");
      const hpElement = playerContainer.querySelector(".health_amount");
      const armorElement = playerContainer.querySelector(".armor_indicator");
      const avatarElement = playerContainer.querySelector(
        ".player-inner .avatar"
      );
      const armorImgElement = playerContainer.querySelector(
        ".armor_indicator.ind"
      );
      const hpImgElement = playerContainer.querySelector(".img_hp");
      const killsElement = playerContainer.querySelector(".kills");
      const deathsElement = playerContainer.querySelector(".deaths");
      const roundKillsElement = playerContainer.querySelector(
        ".player_kills_round"
      );
      const roundKillsImgElement = playerContainer.querySelector(
        ".player_kills_round_img"
      );
      const cameraIndicatorElement =
        playerContainer.querySelector(".camera_indicator");
      const roundKillsElementNew =
        playerContainer.querySelector(".round_kills");
      const hsElement = playerContainer.querySelector(".player_hs");
      const adrElement = playerContainer.querySelector(".player_adr");

      if (nameElement) {
        nameElement.textContent = player.name;
        //console.log(player.name);
      }

      if (hpElement) {
        // Обеспечиваем, что currentHealth всегда число
        const currentHealth = parseInt(player.state.health, 10) || 0;

        // Просто обновляем текст без анимации
        hpElement.textContent = String(currentHealth);

        // Отменяем предыдущую анимацию, если она была
        if (hpElement._animation) {
          clearInterval(hpElement._animation);
          hpElement._animation = null;
        }

        // Устанавливаем цвет текста в зависимости от количества здоровья
        if (currentHealth <= 20 && !isDead) {
          hpElement.style.color = "#ff0000";
        } else {
          hpElement.style.color = "";
          hpElement.classList.remove("damage-flash");
        }
      }

      if (armorElement) {
        armorElement.textContent = `${player.state.armor}`;
      }

      // Обновляем иконку брони
      if (armorImgElement) {
        const armorValue = Number(player.state.armor || 0);
        const hasHelmet = Boolean(player.state.helmet);

        const getArmorIcon = (armor, helmet) => {
          if (armor <= 0)
            return helmet
              ? "icon_armor_half_helmet_default.png"
              : "icon_armor_none_default.png";
          if (armor < 50)
            return helmet
              ? "icon_armor_half_helmet_default.png"
              : "icon_armor_half_default.png";
          if (armor >= 100)
            return helmet
              ? "icon_armor_helmet_default.png"
              : "icon_armor_full_default.png";
          // 50..99
          return helmet
            ? "icon_armor_helmet_default.png"
            : "icon_armor_full_default.png";
        };

        const iconName = getArmorIcon(armorValue, hasHelmet);
        armorImgElement.style.backgroundImage = `url("/images/elements/${iconName}")`;
        armorImgElement.style.backgroundRepeat = "no-repeat";
        armorImgElement.style.backgroundPosition = "center";
        armorImgElement.style.backgroundSize = "contain";
        armorImgElement.textContent = "";

        // Прозрачность в зависимости от брони
        if (armorValue === 0) {
          armorImgElement.style.opacity = "0.3";
        } else if (armorValue <= 30) {
          armorImgElement.style.opacity = "0.7";
        } else {
          armorImgElement.style.opacity = "1";
        }
      }

      if (hpImgElement) {
        hpImgElement.style.backgroundImage =
          'url("/images/elements/icon_health_full_default.png")';
        /* hpImgElement.style.backgroundSize = 'contain';
        hpImgElement.style.backgroundRepeat = 'no-repeat';
        hpImgElement.style.backgroundPosition = 'center';*/

        // Обеспечиваем, что currentHealth всегда число
        const currentHealth = parseInt(player.state.health, 10) || 0;

        // Плавное изменение цвета и анимация при низком здоровье
        if (currentHealth <= 20 && !isDead) {
          hpImgElement.style.backgroundImage =
            'url("/images/elements/icon_health_default.png")';
          hpImgElement.style.filter =
            "brightness(1) saturate(100%) hue-rotate(0deg) invert(27%) sepia(91%) saturate(2303%) hue-rotate(346deg) brightness(96%) contrast(92%)";

          // Удаляем старую анимацию и добавляем новую улучшенную
          hpImgElement.classList.remove("pulse_v2");
          hpImgElement.classList.add("health-pulse");

          // Если здоровье изменилось и стало низким, показываем анимацию мигания
          if (
            prevHealth !== currentHealth &&
            prevHealth > 20 &&
            currentHealth <= 20
          ) {
            hpImgElement.classList.remove("damage-flash");
            setTimeout(() => {
              hpImgElement.classList.add("damage-flash");
            }, 10);
          }
        } else {
          hpImgElement.style.filter = "none";
          hpImgElement.classList.remove(
            "pulse_v2",
            "health-pulse",
            "damage-flash"
          );
        }
      }

      if (avatarElement) {
        const avatarUrl = player.avatar
          ? `/uploads/${player.avatar}`
          : "/images/player_silhouette.webp";
        avatarElement.style.backgroundImage = `url("${avatarUrl}")`;
        avatarElement.style.backgroundSize = "cover";
        avatarElement.style.backgroundPosition = "center";
        //console.log(`Updated avatar for ${player.name}: ${avatarUrl}`);
      } else {
        //console.log(`Avatar element not found for ${player.name}`);
      }

      // Обработка денег игрока
      const moneyElement = playerContainer.querySelector(".money");
      if (moneyElement) {
        moneyElement.textContent = player.state?.money
          ? `$${player.state.money}`
          : "$0";
        /*moneyElement.style.display = isDead ? 'none' : '';*/
      }

      // Обработка гранат, бомбы и китов
      const grenadesContainer = playerContainer.querySelector(".grenades");
      if (grenadesContainer && !isDead) {
        // Очищаем контейнер
        grenadesContainer.innerHTML = "";

        const weapons = Object.values(player.weapons || {});
        let grenadeCount = 0;
        const maxGrenades = 4;

        // Сначала добавляем гранаты (кроме флешек)
        for (let weapon of weapons) {
          if (
            weapon.type === "Grenade" &&
            weapon.name !== "weapon_flashbang" &&
            grenadeCount < maxGrenades
          ) {
            const grenadeElement = document.createElement("div");
            grenadeElement.className = "grenade-item";
            grenadeElement.style.cssText = `
              width: 16px;
              height: 16px;
              background-image: url('/images/weapons/${weapon.name.replace(
                "weapon_",
                ""
              )}.png');
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              filter: brightness(0) invert(1);
              opacity: ${weapon.state === "active" ? "1" : "0.6"};
              margin: 0 2px;
              display: inline-block;
            `;
            grenadesContainer.appendChild(grenadeElement);
            grenadeCount++;
          }
        }

        // Добавляем флешки
        for (let weapon of weapons) {
          if (
            weapon.type === "Grenade" &&
            weapon.name === "weapon_flashbang" &&
            grenadeCount < maxGrenades
          ) {
            const grenadeElement = document.createElement("div");
            grenadeElement.className = "grenade-item";
            grenadeElement.style.cssText = `
              width: 16px;
              height: 16px;
              background-image: url('/images/weapons/${weapon.name.replace(
                "weapon_",
                ""
              )}.png');
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              filter: brightness(0) invert(1);
              opacity: ${weapon.state === "active" ? "1" : "0.6"};
              margin: 0 2px;
              display: inline-block;
            `;
            grenadesContainer.appendChild(grenadeElement);
            grenadeCount++;
          }
        }

        // Добавляем бомбу для T команды или кит для CT команды
        if (player.team === "T") {
          // Ищем бомбу у T команды
          const bomb = weapons.find((weapon) => weapon.name === "weapon_c4");
          if (bomb && grenadeCount < maxGrenades) {
            const bombElement = document.createElement("div");
            bombElement.className = "bomb-item";
            bombElement.style.cssText = `
              width: 16px;
              height: 16px;
              background-image: url('/images/weapons/c4.png');
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              filter: brightness(0) invert(1);
              opacity: ${bomb.state === "active" ? "1" : "0.6"};
              margin: 0 2px;
              display: inline-block;
            `;
            grenadesContainer.appendChild(bombElement);
            grenadeCount++;
          }
        } else if (player.team === "CT") {
          // Ищем кит у CT команды
          const kit = weapons.find(
            (weapon) => weapon.name === "weapon_defuser"
          );
          if (kit && grenadeCount < maxGrenades) {
            const kitElement = document.createElement("div");
            kitElement.className = "kit-item";
            kitElement.style.cssText = `
              width: 16px;
              height: 16px;
              background-image: url('/images/weapons/defuser.png');
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              filter: brightness(0) invert(1);
              opacity: ${kit.state === "active" ? "1" : "0.6"};
              margin: 0 2px;
              display: inline-block;
            `;
            grenadesContainer.appendChild(kitElement);
            grenadeCount++;
          }
        }

        // Заполняем оставшиеся слоты серыми кружками-заглушками
        while (grenadeCount < maxGrenades) {
          const slot = document.createElement("div");
          slot.className = "grenade-slot";
          grenadesContainer.appendChild(slot);
          grenadeCount++;
        }

        grenadesContainer.style.display = "flex";
      } else if (grenadesContainer) {
        grenadesContainer.style.display = "none";
      }

      // Обработка иконки оружия (приоритет: Rifle > SniperRifle > SMG > MG > Shotgun > Pistol)
      const primaryContainer =
        playerContainer.querySelector(".primary_container");
      if (primaryContainer && !isDead) {
        const weapons = Object.values(player.weapons || {});
        const priorityOrder = [
          "Rifle",
          "SniperRifle",
          "Submachine Gun",
          "Machine Gun",
          "Shotgun",
        ];
        const isPriority = (w) =>
          priorityOrder.includes(w.type) &&
          w.name !== "weapon_knife" &&
          !String(w.name || "").includes("grenade");
        const rank = (t) => {
          const idx = priorityOrder.indexOf(t);
          return idx === -1 ? 999 : idx;
        };

        // Сначала пробуем активное приоритетное оружие из списка (без пистолетов)
        let chosen = weapons
          .filter(isPriority)
          .filter((w) => w.state === "active")
          .sort((a, b) => rank(a.type) - rank(b.type))[0];

        // Если активного нет — берём самое приоритетное из доступных
        if (!chosen) {
          chosen = weapons
            .filter(isPriority)
            .sort((a, b) => rank(a.type) - rank(b.type))[0];
        }

        // Если ничего из списка (rifle/sniper/smg/mg/shotgun) не найдено → ищем пистолет (активный в приоритете)
        if (!chosen) {
          chosen = weapons
            .filter(
              (w) => w.type === "Pistol" && !String(w.name).includes("grenade")
            )
            .filter((w) => w.state === "active")[0];
          if (!chosen) {
            chosen = weapons.find(
              (w) => w.type === "Pistol" && !String(w.name).includes("grenade")
            );
          }
        }

        // Если нет пистолета → показываем нож, если есть
        if (!chosen) {
          chosen = weapons.find(
            (w) =>
              w.type === "Knife" ||
              String(w.name || "").startsWith("weapon_knife")
          );
        }

        if (chosen) {
          const weaponName = String(chosen.name || "").replace("weapon_", "");
          primaryContainer.style.backgroundImage = `url("/images/weapons/${weaponName}.png")`;
          // Размер задаём через классы CSS (weapon-*)
          primaryContainer.style.backgroundSize = "";
          primaryContainer.style.backgroundRepeat = "no-repeat";
          primaryContainer.style.backgroundPosition = "center";
          primaryContainer.style.display = "";

          // Тип оружия → класс контейнера для пропорций иконки
          const typeToClass = {
            Rifle: "weapon-rifle",
            SniperRifle: "weapon-sniper",
            "Submachine Gun": "weapon-smg",
            "Machine Gun": "weapon-mg",
            Shotgun: "weapon-shotgun",
            Pistol: "weapon-pistol",
            Taser: "weapon-taser",
            Knife: "weapon-knife",
          };
          const allTypeClasses = [
            "weapon-rifle",
            "weapon-sniper",
            "weapon-smg",
            "weapon-mg",
            "weapon-shotgun",
            "weapon-pistol",
            "weapon-taser",
            "weapon-knife",
          ];
          allTypeClasses.forEach((c) => primaryContainer.classList.remove(c));
          const typeClass = typeToClass[chosen.type];
          if (typeClass) primaryContainer.classList.add(typeClass);

          // Cостояние иконки: активное — белая; неактивное — приглушённая
          if (chosen.state === "active") {
            primaryContainer.classList.add("active");
            primaryContainer.classList.remove("inactive");
          } else {
            primaryContainer.classList.remove("active");
            primaryContainer.classList.add("inactive");
          }
        } else {
          primaryContainer.style.display = "none";
        }
      } else if (primaryContainer) {
        primaryContainer.style.display = "none";
      }

      // Обработка стоимости экипировки
      const moneyValueElement = playerContainer.querySelector(
        ".player_money_value"
      );
      if (moneyValueElement) {
        moneyValueElement.textContent = player.state?.equip_value
          ? `-$${player.state.equip_value}`
          : "$0";
        moneyValueElement.style.display = isDead ? "none" : "";
      }

      const slotElement = playerContainer.querySelector(".slot");
      if (slotElement) {
        // Обновляем логику отображения слота по observer_slot игрока
        const obs =
          typeof player.observer_slot === "number"
            ? player.observer_slot
            : null;
        const displaySlot = obs === 9 ? 0 : obs !== null ? obs + 1 : "";
        slotElement.textContent = displaySlot;
      }

      // Обновляем номер слота в obs-slot элементе
      const obsSlotElement = playerContainer.querySelector(
        `.obs-slot_${playerNumber}`
      );
      if (obsSlotElement) {
        const obs =
          typeof player.observer_slot === "number"
            ? player.observer_slot
            : null;
        const displaySlot = obs === 9 ? 0 : obs !== null ? obs + 1 : "";
        obsSlotElement.textContent = displaySlot;

        // Добавляем цвет команды
        if (player.team === "CT") {
          obsSlotElement.style.background = COLOR_NEW_CT_TOPPANEL;
        } else if (player.team === "T") {
          obsSlotElement.style.background = COLOR_NEW_T_TOPPANEL;
        }
      }

      // Добавляем обновление статистики убийств и смертей
      if (killsElement) {
        killsElement.textContent = player.match_stats?.kills || "0";
      }
      if (deathsElement) {
        deathsElement.textContent = player.match_stats?.deaths || "0";
      }
      // Обновляем убийства в раунде (показываем только если > 0)
      if (roundKillsElementNew) {
        const roundKills = player.state?.round_kills || player.round_kills || 0;
        roundKillsElementNew.textContent = roundKills;
        roundKillsElementNew.style.display = roundKills > 0 ? "" : "none";
      }
      // Обновляем убийства в раунде
      if (roundKillsElement && roundKillsImgElement) {
        const roundKills = player.state?.round_kills || 0;
        roundKillsElement.textContent = roundKills;

        // Показываем/скрываем элементы в зависимости от количества убийств
        if (roundKills > 0) {
          roundKillsElement.style.display = "";
          roundKillsImgElement.style.display = "";
        } else {
          roundKillsElement.style.display = "none";
          roundKillsImgElement.style.display = "none";
        }

        const $playerContainer = $(playerContainer);
        // Отладочная информация только при необходимости
        if (player.state.flashed === 1 || player.state.burning > 0) {
          console.log(`Player ${player.name} state:`, player.state);
        }

        // Обработка горящего игрока
        if (player.state.burning > 0 && !isDead) {
          //console.log(`Player ${player.name} is burning: ${player.state.burning}`);
          const burningElement = $playerContainer.find("#burning_level");

          if (burningElement.length > 0) {
            burningElement.addClass("burnt");
            burningElement.css("opacity", player.state.burning / 255);
            //console.log(`Applied burning effect to ${player.name}, opacity: ${player.state.burning / 255}`);
          } else {
            //console.error(`#burning_level not found for player ${player.name}`);
          }
        } else {
          const burningElement = $playerContainer.find("#burning_level");
          if (burningElement.length > 0) {
            burningElement.removeClass("burnt");
            burningElement.css("opacity", 0);
            //console.log(`Removed burning effect from ${player.name}`);
          }
        }
        // Обработка зафлешивания
        if (player.state.flashed > 0 && !isDead) {
          //console.log(`Player ${player.name} is flashed: ${player.state.flashed}`);
          const flashedElement = $playerContainer.find("#player_image2");

          if (flashedElement.length > 0) {
            flashedElement.addClass("flashed_avatar");
            // При зафлешивании делаем аватарку белой (opacity 1)
            flashedElement.css("opacity", 1);
            //console.log(`Applied flash effect to ${player.name}`);
          } else {
            //console.error(`#player_image2 not found for player ${player.name}`);
          }
        } else {
          const flashedElement = $playerContainer.find("#player_image2");
          if (flashedElement.length > 0) {
            flashedElement.removeClass("flashed_avatar");
            // При снятии зафлешивания возвращаем нормальную прозрачность
            flashedElement.css("opacity", 1);
            //console.log(`Removed flash effect from ${player.name}`);
          }
        }
      }
      // Отладочная информация для проверки полей состояния (можно убрать после отладки)
      /*
      Object.values(allplayers).forEach(player => {
        if (player && player.state) {
          // Проверяем все возможные поля состояния игрока
          console.log(`Player ${player.name} full state:`, player.state);
          console.log(`Player ${player.name} state keys:`, Object.keys(player.state));
          
          // Проверяем различные возможные названия полей для зафлешивания
          const flashFields = ['flashed', 'flash', 'flashbang', 'flash_duration', 'flash_time'];
          flashFields.forEach(field => {
            if (player.state[field] !== undefined) {
              console.log(`Player ${player.name} ${field}:`, player.state[field]);
            }
          });
        }
      });
      */

      if (adrElement) {
        adrElement.textContent = `${player.state.adr}`;
      }

      // Обработка оружия и гранат
      const weaponElement = playerContainer.querySelector(".player_weapon");
      const grenadeContainer = playerContainer.querySelector(".player_grenade");

      if (weaponElement) {
        let activeWeapon = null;
        const priorityTypes = [
          "Rifle",
          "SniperRifle",
          "Submachine Gun",
          "Machine Gun",
          "Shotgun",
          "Stun gun",
        ];
        const weapons = Object.values(player.weapons || {});

        // Проверяем, есть ли у игрока только нож
        const hasOnlyKnife = weapons.every(
          (weapon) => weapon.type === "Knife" || weapon.type === "C4"
        );

        if (!hasOnlyKnife) {
          // Сначала ищем активное оружие приоритетных типов
          activeWeapon = weapons.find(
            (weapon) =>
              weapon.state === "active" && priorityTypes.includes(weapon.type)
          );

          // Если активное приоритетное оружие не найдено, ищем любое приоритетное
          if (!activeWeapon) {
            activeWeapon = weapons.find((weapon) =>
              priorityTypes.includes(weapon.type)
            );
          }

          // Если приоритетное оружие не найдено, ищем активный пистолет
          if (!activeWeapon) {
            activeWeapon = weapons.find(
              (weapon) => weapon.type === "Pistol" && weapon.state === "active"
            );
          }

          // Если активный пистолет не найден, ищем любой пистолет
          if (!activeWeapon) {
            activeWeapon = weapons.find((weapon) => weapon.type === "Pistol");
          }
          // Если активный пистолет не найден, ищем любой пистолет
          if (!activeWeapon) {
            activeWeapon = weapons.find((weapon) => weapon.type === "Knife");
          }
        }

        if (activeWeapon && activeWeapon.type !== "C4") {
          const weaponName = activeWeapon.name.replace("weapon_", "");
          const weaponPath = `/images/weapons/${weaponName}.png`;

          weaponElement.style.backgroundImage = `url("${weaponPath}")`;
          weaponElement.classList.add("invert");

          if (activeWeapon.state === "holstered") {
            weaponElement.classList.add("holstered");
          } else {
            weaponElement.classList.remove("holstered");
          }

          weaponElement.style.display = isDead ? "none" : "";
        } else {
          weaponElement.style.display = "none";
        }
      }

      // Обработка гранат
      if (grenadeContainer) {
        // Очищаем все слоты гранат
        for (let i = 1; i <= 4; i++) {
          const grenadeSlot = grenadeContainer.querySelector(`.grenade_${i}`);
          if (grenadeSlot) {
            grenadeSlot.style.display = "none";
            grenadeSlot.style.backgroundImage = "";
            grenadeSlot.classList.remove("active", "holstered", "invert");
          }
        }

        // Очищаем слот бомбы/дефузкита
        const bombKitSlot = grenadeContainer.querySelector(".bomb_kit");
        if (bombKitSlot) {
          bombKitSlot.style.display = "none";
          bombKitSlot.style.backgroundImage = "";
          bombKitSlot.classList.remove("active", "holstered", "invert");
        }

        // Очищаем слот зевс
        const zeusSlot = grenadeContainer.querySelector(".zeus");
        if (zeusSlot) {
          zeusSlot.style.display = "none";
          zeusSlot.style.backgroundImage = "";
          zeusSlot.classList.remove("active", "holstered", "invert");
        }

        // Обрабатываем оружие только если игрок жив
        if (!isDead) {
          let grenadeCount = 1;

          // Сначала отображаем все гранаты кроме флешек
          for (let weaponKey in player.weapons) {
            const weapon = player.weapons[weaponKey];

            if (
              weapon.type === "Grenade" &&
              weapon.name !== "weapon_flashbang" &&
              grenadeCount <= 4
            ) {
              const grenadeSlot = grenadeContainer.querySelector(
                `.grenade_${grenadeCount}`
              );
              if (grenadeSlot) {
                const grenadeName = weapon.name.replace("weapon_", "");
                grenadeSlot.style.backgroundImage = `url("/images/weapons/${grenadeName}.png")`;
                grenadeSlot.style.display = "";
                grenadeSlot.classList.add("invert");

                if (weapon.state === "active") {
                  grenadeSlot.classList.add("active");
                  grenadeSlot.classList.remove("holstered");
                } else {
                  grenadeSlot.classList.remove("active");
                  grenadeSlot.classList.add("holstered");
                }

                grenadeCount++;
              }
            }
          }

          // Затем отображаем флешки
          for (let weaponKey in player.weapons) {
            const weapon = player.weapons[weaponKey];

            if (
              weapon.type === "Grenade" &&
              weapon.name === "weapon_flashbang" &&
              grenadeCount <= 4
            ) {
              const flashCount = weapon.ammo_reserve || 1;

              // Отображаем первую флешку
              const grenadeSlot = grenadeContainer.querySelector(
                `.grenade_${grenadeCount}`
              );
              if (grenadeSlot) {
                grenadeSlot.style.backgroundImage =
                  'url("/images/weapons/flashbang.png")';
                grenadeSlot.style.display = "";
                grenadeSlot.classList.add("invert");

                if (weapon.state === "active") {
                  grenadeSlot.classList.add("active");
                  grenadeSlot.classList.remove("holstered");
                } else {
                  grenadeSlot.classList.remove("active");
                  grenadeSlot.classList.add("holstered");
                }

                grenadeCount++;

                // Если есть вторая флешка, отображаем её в следующем слоте
                if (flashCount > 1 && grenadeCount <= 4) {
                  const secondFlashSlot = grenadeContainer.querySelector(
                    `.grenade_${grenadeCount}`
                  );
                  if (secondFlashSlot) {
                    secondFlashSlot.style.backgroundImage =
                      'url("/images/weapons/flashbang.png")';
                    secondFlashSlot.style.display = "";
                    secondFlashSlot.classList.add("invert");
                    secondFlashSlot.classList.add("holstered");
                    grenadeCount++;
                  }
                }
              }
            }
          }

          // Обработка C4 и дефузкита
          if (bombKitSlot) {
            // Проверяем наличие C4
            const hasBomb = Object.values(player.weapons).some((weapon) => {
              if (weapon.type === "C4") {
                bombKitSlot.style.backgroundImage =
                  'url("/images/weapons/c4.png")';
                bombKitSlot.style.display = "";
                bombKitSlot.classList.add("invert");

                if (weapon.state === "active") {
                  bombKitSlot.classList.add("active");
                  bombKitSlot.classList.remove("holstered");
                } else {
                  bombKitSlot.classList.remove("active");
                  bombKitSlot.classList.add("holstered");
                }
                return true;
              }
              return false;
            });

            // Если нет C4, проверяем наличие дефузкита
            if (!hasBomb && player.state?.defusekit) {
              bombKitSlot.style.backgroundImage =
                'url("/images/weapons/defuse.png")';
              bombKitSlot.style.display = "";
              bombKitSlot.classList.add("invert");
            }
          }
        }

        // Обработка C4 и дефузкита
        if (bombKitSlot) {
          // Проверяем наличие C4
          const hasBomb = Object.values(player.weapons).some((weapon) => {
            if (weapon.type === "C4") {
              bombKitSlot.style.backgroundImage =
                'url("/images/weapons/c4.png")';
              bombKitSlot.style.display = "";
              bombKitSlot.classList.add("invert");

              if (weapon.state === "active") {
                bombKitSlot.classList.add("active");
                bombKitSlot.classList.remove("holstered");
              } else {
                bombKitSlot.classList.remove("active");
                bombKitSlot.classList.add("holstered");
              }
              return true;
            }
            return false;
          });

          // Если нет C4, проверяем наличие дефузкита
          if (!hasBomb && player.state?.defusekit) {
            bombKitSlot.style.backgroundImage =
              'url("/images/weapons/defuse.png")';
            bombKitSlot.style.display = "";
            bombKitSlot.classList.add("invert");
          }
        }

        // Обработка Zeus
        if (zeusSlot) {
          const hasZeus = Object.values(player.weapons).some((weapon) => {
            if (weapon.type === "Taser") {
              zeusSlot.style.backgroundImage =
                'url("/images/weapons/taser.png")';
              zeusSlot.style.display = "";
              zeusSlot.classList.add("invert");

              // Добавляем классы active/holstered как у гранат
              if (weapon.state === "active") {
                zeusSlot.classList.add("active");
                zeusSlot.classList.remove("holstered");
              } else {
                zeusSlot.classList.remove("active");
                zeusSlot.classList.add("holstered");
              }
              return true;
            }
            return false;
          });

          // Скрываем слот если нет Zeus
          if (!hasZeus) {
            zeusSlot.style.display = "none";
          }
        }
      }
    }
  }
} // закрывающая скобка для if (playerContainer)

function updateAnimation(phase, allplayers, map) {
  const info = $("#info");
  if (map.phase === "gameover") {
    info.css("opacity", 0);
    info.removeClass("animated fadeOut").addClass("animated fadeIn");
  } else {
    if (phase.phase === "freezetime") {
      info.css("opacity", 1);
      info.removeClass("animated fadeOut").addClass("animated fadeIn");
    } else {
      info.css("opacity", 0);
      info.removeClass("animated fadeIn").addClass("animated fadeOut");
    }
  }

  const mapPickTeam1 = $(".map-veto");
  if (phase.phase === "freezetime") {
    mapPickTeam1.css("opacity", 1);
    mapPickTeam1.removeClass("animated fadeOut").addClass("animated fadeIn");
  } else {
    mapPickTeam1.css("opacity", 0);
    mapPickTeam1.removeClass("animated fadeOut").addClass("animated fadeIn");
  }

  const mapPick = $(".map-veto");
  if (phase.phase === "freezetime") {
    mapPick.css("opacity", 1);
    mapPick.removeClass("animated fadeOut").addClass("animated fadeIn");
  } else {
    mapPick.css("opacity", 0);
    mapPick.removeClass("animated fadeIn").addClass("animated fadeOut");
  }

  const winnerTeam = $("#winner_team");
  if (phase.phase === "over") {
    winnerTeam.removeClass("animated fadeOut").addClass("animated fadeIn");
  } else {
    winnerTeam.removeClass("animated fadeIn").addClass("animated fadeOut");
  }

  const moneyValue = $(".player_money_value");
  if (phase.phase === "freezetime") {
    moneyValue.css("opacity", 1);
    moneyValue.removeClass("animated fadeOut").addClass("animated fadeIn");
  } else {
    moneyValue.css("opacity", 0);
    moneyValue.removeClass("animated fadeIn").addClass("animated fadeOut");
  }

  const teamComparisonChart = $("#team-comparison-chart");
  if (map.phase === "gameover") {
    teamComparisonChart.css("opacity", 0);
    teamComparisonChart
      .removeClass("animated fadeIn")
      .addClass("animated fadeOut");
  } else {
    if (phase.phase === "freezetime") {
      teamComparisonChart.css("opacity", 1);
      teamComparisonChart
        .removeClass("animated fadeOut")
        .addClass("animated fadeIn");
    } else {
      teamComparisonChart.css("opacity", 0);
      teamComparisonChart
        .removeClass("animated fadeIn")
        .addClass("animated fadeOut");
    }
  }

  const killsleaderboard = $("#kills-leaderboard");
  if (map.phase === "gameover") {
    killsleaderboard.css("opacity", 0);
    killsleaderboard
      .removeClass("animated fadeIn")
      .addClass("animated fadeOut");
  } else {
    if (phase.phase === "freezetime") {
      killsleaderboard.css("opacity", 1);
      killsleaderboard
        .removeClass("animated fadeOut")
        .addClass("animated fadeIn");
    } else {
      killsleaderboard.css("opacity", 0);
      killsleaderboard
        .removeClass("animated fadeIn")
        .addClass("animated fadeOut");
    }
  }

  const utility_left = $("#utility_left");
  if (map.phase === "gameover") {
    utility_left.css("opacity", 0);
    utility_left.removeClass("animated fadeIn").addClass("animated fadeOut");
  } else {
    if (phase.phase === "freezetime") {
      utility_left.css("opacity", 1);
      utility_left.removeClass("animated fadeOut").addClass("animated fadeIn");
    } else {
      utility_left.css("opacity", 0);
      utility_left.removeClass("animated fadeIn").addClass("animated fadeOut");
    }
  }

  const utility_right1 = $("#utility_right");
  if (map.phase === "gameover") {
    utility_right1.css("opacity", 0);
    utility_right1.removeClass("animated fadeIn").addClass("animated fadeOut");
  } else {
    if (phase.phase === "freezetime") {
      utility_right1.css("opacity", 1);
      utility_right1
        .removeClass("animated fadeOut")
        .addClass("animated fadeIn");
    } else {
      utility_right1.css("opacity", 0);
      utility_right1
        .removeClass("animated fadeIn")
        .addClass("animated fadeOut");
    }
  }

  const matchGameover3 = $("#team_right");
  if (map.phase === "gameover") {
    matchGameover3.css("opacity", 0);
    matchGameover3
      .removeClass("animated fadeInRight")
      .addClass("animated fadeOutRight");
  } else {
    matchGameover3.css("opacity", 1);
    matchGameover3
      .removeClass("animated fadeOutRight")
      .addClass("animated fadeInRight");
  }

  const matchGameover2 = $("#top-panel, #spectator, #live_player");

  if (map.phase === "gameover") {
    matchGameover2.css("opacity", 0);
    matchGameover2.removeClass("animated fadeIn").addClass("animated fadeOut");
  } else {
    matchGameover2.css("opacity", 1);
    matchGameover2.removeClass("animated fadeOut").addClass("animated fadeIn");
  }
}
// Проверяем, объявлена ли переменная radarInitialized
let radarInitialized = false;

function initializeRadar() {
  window.radar = {
    lastAngles: {},
    lastAmmo: {},
    lastAlivePositions: {},
    resolution: 1,
    offset: { x: 0, y: 0 },
    zRange: { min: 0, max: 0 },
  };

  window.radar.loadMapData = function (mapName) {
    // Очищаем кеш игроков при загрузке новой карты
    this.lastAngles = {};
    this.lastAmmo = {};
    this.lastAlivePositions = {};

    // Полностью очищаем все элементы игроков на радаре
    document.querySelectorAll('[id^="player-"]').forEach((el) => el.remove());

    // Очищаем все элементы гранат
    //document.querySelectorAll('.grenade, .inferno-flame').forEach(el => el.remove());

    // Очищаем бомбу
    document.querySelectorAll("#bomb-container").forEach((el) => el.remove());

    // Сбрасываем глобальную переменную активного игрока
    window.activePlayerSteamId = null;

    const cleanMapName = mapName.toLowerCase().trim();
    const metaPath = `/maps/${cleanMapName}/meta.json`;
    const radarPath = `/maps/${cleanMapName}/radar.png`;
    const overlayPath = `/maps/${cleanMapName}/overlay_buyzones.png`;

    // Полностью очищаем радар от всех элементов
    const radarContainer = document.getElementById("radar-players");
    if (radarContainer) {
      // Сохраняем только фон радара
      const backgroundImage = radarContainer.style.backgroundImage;

      // Полностью очищаем содержимое
      radarContainer.innerHTML = "";

      // Восстанавливаем фон
      radarContainer.style.backgroundImage = backgroundImage;
    }

    // Удаляем все элементы игроков по селектору
    document.querySelectorAll('[id^="player-"]').forEach((el) => el.remove());

    // Удаляем все элементы гранат
    document
      .querySelectorAll(".grenade, .inferno-flame")
      .forEach((el) => el.remove());

    // Удаляем бомбу
    document.querySelectorAll("#bomb-container").forEach((el) => el.remove());

    fetch(metaPath)
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((mapData) => {
        // Сохраняем все данные как есть
        this.mapData = mapData;
        this.resolution = mapData.resolution;
        this.offset = mapData.offset;
        this.splits = mapData.splits;
        this.zRange = mapData.zRange;

        // Обновляем элементы радара
        const radarElement = document.getElementById("radar-players");
        const overlayElement = document.getElementById("radarBuyZones");

        if (radarElement) {
          radarElement.style.backgroundImage = `url('${radarPath}')`;
          radarElement.style.backgroundSize = "cover";
          radarElement.style.backgroundPosition = "center";
        }

        if (overlayElement) {
          overlayElement.style.backgroundImage = `url('${overlayPath}')`;
          overlayElement.style.backgroundSize = "cover";
          overlayElement.style.backgroundPosition = "center";
        }
      })
      .catch((error) =>
        console.warn("Не удалось загрузить настройки карты:", error)
      );
  };

  window.radar.positionToPerc = function (position, axis) {
    const pos = position[axis];
    const offset = this.offset[axis];
    return ((pos + offset) / (1024 * this.resolution)) * 100;
  };

  window.radar.updatePlayer = function (player, position) {
    const steamid = player.steamid;

    // Проверяем, мертв ли игрок
    const isDead = player.state.health <= 0;

    // Если игрок мертв, используем последние зафиксированные координаты
    if (isDead) {
      if (!this.lastAlivePositions[steamid]) {
        // Сохраняем последние координаты перед смертью
        this.lastAlivePositions[steamid] = position;
      }
      position = this.lastAlivePositions[steamid];
    } else {
      // Если игрок жив, обновляем lastAlivePosition
      this.lastAlivePositions[steamid] = position;
    }

    const playerElement = document.getElementById(`player-${steamid}`);
    if (!playerElement) return;

    // Обновляем состояние игрока (мертвый/живой)
    playerElement.classList.toggle("dead_map", isDead);
    playerElement.style.opacity = isDead ? "0.5" : "1";

    // Обновляем позицию игрока
    const { x, y, level } = this.positionToPixels(position);

    // Скрываем/показываем игрока в зависимости от этажа
    if (level === "lower") {
      playerElement.style.display = "block"; // Показываем на нижнем этаже
    } else if (level === "upper") {
      playerElement.style.display = "block"; // Показываем на верхнем этаже
    } else {
      playerElement.style.display = "none"; // Скрываем, если этаж неизвестен
    }

    // Обновляем позицию игрока
    playerElement.style.transform = `translate(${x}px, ${y}px)`;

    // Обновляем направление игрока только если он жив
    if (player.forward) {
      const markerElement = playerElement.querySelector(".player-marker");

      if (markerElement) {
        if (isDead) {
          markerElement.style.display = "none";
        } else {
          markerElement.style.display = "block";
          let angle = 0;
          let rawAngle = player.forward.split(", ");
          const x = parseFloat(rawAngle[0]);
          const y = parseFloat(rawAngle[1]);

          if (!isNaN(x) && !isNaN(y)) {
            if (x > 0) {
              angle = 90 + y * -1 * 90;
            } else {
              angle = 270 + y * 90;
            }

            const rotation = `rotate(${angle}deg)`;
            markerElement.style.transform = rotation;
          }
        }
      }
    }

    //fireElement

    // Отдельная обработка fireElement
    const fireElement = playerElement.querySelector(".background-fire");

    if (fireElement) {
      // По умолчанию скрываем эффект огня
      fireElement.style.display = "none";

      if (!isDead && player.weapons) {
        const activeWeapon = Object.values(player.weapons).find(
          (weapon) => weapon.state === "active"
        );
        const currentAmmo = activeWeapon?.ammo_clip;
        const lastAmmo = window.radar.lastAmmo[player.steamid];

        // Показываем эффект огня только если количество патронов уменьшилось
        if (lastAmmo !== undefined && currentAmmo < lastAmmo) {
          fireElement.style.display = "block";
          let angle = 0;
          let rawAngle = player.forward.split(", ");
          const x = parseFloat(rawAngle[0]);
          const y = parseFloat(rawAngle[1]);

          if (!isNaN(x) && !isNaN(y)) {
            if (x > 0) {
              angle = 90 + y * -1 * 90;
            } else {
              angle = 270 + y * 90;
            }

            const distance = 30;
            const radians = (angle - 90) * (Math.PI / 180);
            const translateX = Math.cos(radians) * distance;
            const translateY = Math.sin(radians) * distance;

            fireElement.style.transform = `
                        translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) 
                        rotate(${angle + 90}deg)`;

            // Добавляем анимацию Blink
            fireElement.style.animation = "Blink";
            // После завершения анимации скрываем элемент
            /*fireElement.addEventListener('animationend', () => {
                        fireElement.style.display = 'none';
                        fireElement.style.animation = '';
                    }, { once: true });*/
          }
        }

        // Сохраняем текущее количество патронов
        if (activeWeapon) {
          window.radar.lastAmmo[player.steamid] = currentAmmo;
        }
      }
    }

    /*
      // Обработка стрельбы
      if (player.weapons) {
          const activeWeapon = Object.values(player.weapons).find(weapon => weapon.state === 'active');
          if (activeWeapon) {
              const currentAmmo = activeWeapon.ammo_clip;
              const lastAmmo = this.lastAmmo[steamid];
              
              // Если количество патронов уменьшилось - игрок стреляет
              if (lastAmmo !== undefined && currentAmmo < lastAmmo) {
                  const fireElement = playerElement.querySelector('.background-fire');
                  if (fireElement) {
                      fireElement.style.display = 'flex';
                      setTimeout(() => {
                          if (fireElement) fireElement.style.display = 'none';
                      }, 250);
                  }
              }
              
              this.lastAmmo[steamid] = currentAmmo;
          }
      }*/

    /*if (player.forward) {
        const markerElement = playerElement.querySelector('.player-marker');
        const fireElement = playerElement.querySelector('.background-fire');
        
        if (markerElement && fireElement) {
          if (isDead) {
              markerElement.style.display = 'none';
              fireElement.style.display = 'none';
          } else {
            let angle = 0
            let rawAngle = player.forward.split(", ");
            console.log(rawAngle)
    
            if (parseFloat(rawAngle[0]) > 0) {
              angle = 90 + parseFloat(rawAngle[1]) * -1 * 90;
            } else {
              angle = 270 + parseFloat(rawAngle[1]) * 90;
            }
          }
        }
      }*/
  };

  window.radar.positionToPixels = function (position) {
    const radarContainer = document.getElementById("radar-players");
    if (!radarContainer) {
      //console.error('Контейнер радара не найден.');
      return { x: 0, y: 0 };
    }

    // Если position - строка (как у бомбы), преобразуем её в массив чисел
    if (typeof position === "string") {
      position = position.split(", ").map(Number);
    }

    // Если position - массив (как у бомбы), преобразуем в объект
    if (Array.isArray(position)) {
      position = { x: position[0], y: position[1], z: position[2] };
    }

    // Получаем диапазон Z для этажей

    const lowerLevelRange = this.splits?.[0]?.zRange || {
      min: -Infinity,
      max: Infinity,
    };
    const upperLevelRange = this.zRange || { min: -Infinity, max: Infinity };
    //console.log(upperLevelRange);
    // Определяем, на каком этаже находится объект
    const isLowerLevel =
      position.z >= lowerLevelRange.min && position.z <= lowerLevelRange.max;
    const isUpperLevel =
      position.z >= upperLevelRange.min && position.z <= upperLevelRange.max;
    //console.log(isUpperLevel);
    const containerWidth = radarContainer.offsetWidth;
    const containerHeight = radarContainer.offsetHeight;

    // Преобразуем координаты карты в пиксели
    let x =
      ((position.x + this.offset.x) / (1024 * this.resolution)) *
      containerWidth *
      1.02;
    let y =
      containerHeight -
      ((position.y + this.offset.y) / (1024 * this.resolution)) *
        containerHeight *
        1.02;

    // Если это нижний этаж, применяем смещение
    if (isLowerLevel && this.splits?.[0]) {
      const split = this.splits[0];
      x += ((split.offset.x * containerWidth) / 100) * 1.9;
      y -= ((split.offset.y * containerHeight) / 100) * 2.8; // Добавлен множитель 1.5
    }
    // Если это верхний этаж, применяем смещение
    else if (isUpperLevel && this.splits?.[1]) {
      const split = this.splits[1];
      x += (split.offset.x * containerWidth) / 100;
      y += (split.offset.y * containerHeight) / 100;
    }

    return {
      x,
      y,
      level: isLowerLevel ? "lower" : isUpperLevel ? "upper" : "unknown",
    };
  };
}

function updateRadar(allplayers, map, data, observed, bomb, player, grenades) {
  //console.log(bomb);
  // Инициализация радара, если он еще не инициализирован
  if (!radarInitialized) {
    initializeRadar();
    radarInitialized = true;
  }

  // Фильтруем игроков, которых нужно скрыть (на всякий случай, если они не были отфильтрованы ранее)
  if (allplayers) {
    allplayers = filterHiddenPlayers(allplayers);
  }

  // Загрузка данных карты, если она изменилась
  if (
    map?.name &&
    (!window.radar.currentMap || window.radar.currentMap !== map.name)
  ) {
    // Очищаем все элементы перед загрузкой новой карты
    clearAllRadarElements();

    window.radar.currentMap = map.name;
    window.radar.loadMapData(map.name);

    // Очищаем контейнер радара от всех элементов игроков
    const radarPlayers = document.getElementById("radar-players");
    if (radarPlayers) {
      // Сохраняем только фон радара
      const backgroundImage = radarPlayers.style.backgroundImage;

      // Полностью очищаем содержимое
      radarPlayers.innerHTML = "";

      // Восстанавливаем фон
      radarPlayers.style.backgroundImage = backgroundImage;
    }
  }

  // Обновление бомбы только если есть данные о бомбе
  if (window.radar && bomb) {
    const bombElement = document.querySelector("#bomb-container");
    updateBombState(bomb, bombElement);
  } else if (window.radar) {
    // Если данных о бомбе нет, скрываем элемент бомбы
    const bombElement = document.querySelector("#bomb-container");
    if (bombElement) {
      bombElement.style.display = "none";
    }
  }

  // Обновление игроков
  if (allplayers && window.radar) {
    // Обновляем глобальную переменную активного игрока
    window.activePlayerSteamId = data?.player?.steamid || observed?.steamid;

    // Получаем все текущие элементы игроков на радаре
    const radarContainer = document.getElementById("radar-players");
    const currentPlayerElements = radarContainer
      ? Array.from(radarContainer.querySelectorAll('[id^="player-"]'))
      : [];

    // Создаем Set с ID текущих игроков для быстрого поиска
    const currentPlayerIds = new Set();
    Object.keys(allplayers).forEach((steamid) => {
      if (steamid) {
        currentPlayerIds.add(`player-${steamid}`);
      }
    });

    // Удаляем элементы игроков, которых нет в текущем списке
    currentPlayerElements.forEach((element) => {
      if (!currentPlayerIds.has(element.id)) {
        element.remove();
      }
    });

    // Обновляем всех игроков
    const fragment = document.createDocumentFragment();
    const toAppend = [];
    Object.entries(allplayers).forEach(([steamid, player]) => {
      if (!steamid) {
        return;
      }

      // Пропускаем тренеров (скрываем их на радаре)
      if (isCoach(player)) {
        return;
      }

      // Добавляем steamid в объект игрока, если его нет
      if (!player.steamid) {
        player.steamid = steamid;
      }

      let playerElement = document.getElementById(`player-${steamid}`);

      // Если элемент не существует, создаем его
      if (!playerElement) {
        playerElement = createPlayerElement(player, steamid);
        if (playerElement) toAppend.push(playerElement);
      }

      // Обновляем цвет и слот игрока
      if (playerElement) {
        // Определяем, несет ли игрок бомбу
        const hasBomb = steamid === bomb?.player;

        // Обновляем цвет в зависимости от команды и наличия бомбы
        if (hasBomb) {
          playerElement.style.background = PLAYER_BOMB;
        } else {
          playerElement.style.background =
            player.team.toLowerCase() === "ct"
              ? COLOR_NEW_CT_TOPPANEL
              : COLOR_NEW_T_TOPPANEL;
        }

        // Обработка слотов
        let slotIdentifier;
        if (typeof player.observer_slot === "number") {
          if (player.observer_slot === 9) {
            slotIdentifier = 0;
          } else if (player.observer_slot === 10) {
            slotIdentifier = 11;
          } else if (player.observer_slot === 11) {
            slotIdentifier = 12;
          } else if (player.observer_slot >= 0 && player.observer_slot < 9) {
            slotIdentifier = player.observer_slot + 1;
          } else {
            slotIdentifier = player.observer_slot;
          }
        } else {
          slotIdentifier = "N/A";
        }

        // Обновляем номер слота в элементе
        const slotElement = playerElement.querySelector(".player-slot");
        if (slotElement) {
          slotElement.textContent = slotIdentifier;
        }
        playerElement.setAttribute("data-slot", slotIdentifier);

        // выбиранному игроку необходимо добавлять класс selected
        if (steamid === window.activePlayerSteamId) {
          playerElement.classList.add("active_player_map");
        } else {
          playerElement.classList.remove("active_player_map");
        }
      }

      // Проверяем, изменилась ли позиция игрока
      const position = player.position
        ? player.position.split(", ").map(Number)
        : null;
      if (
        position &&
        (!player.lastPosition ||
          position[0] !== player.lastPosition.x ||
          position[1] !== player.lastPosition.y ||
          position[2] !== player.lastPosition.z)
      ) {
        // Обновляем позицию игрока
        window.radar.updatePlayer(player, {
          x: position[0],
          y: position[1],
          z: position[2],
        });

        // Сохраняем последнюю позицию
        player.lastPosition = {
          x: position[0],
          y: position[1],
          z: position[2],
        };
      }
    });
    // Append all newly created elements in one batch
    if (radarContainer && toAppend.length) {
      toAppend.forEach((el) => fragment.appendChild(el));
      radarContainer.appendChild(fragment);
    }
    // Обновляем гранаты
    if (grenades) {
      updateGrenades(grenades, allplayers);
    }
  }

  // Обновление гранат
  if (grenades && window.radar) {
    //console.log(grenades)
    try {
      Object.entries(grenades).forEach(([id, grenade]) => {
        // Обработка inferno (молотов/зажигательных гранат)
        if (grenade.type === "inferno") {
          // Обрабатываем каждое пламя отдельно
          Object.entries(grenade.flames).forEach(([flameId, flamePosition]) => {
            // Проверяем, что позиция существует и не равна null/undefined
            if (!flamePosition) {
              console.warn("Inferno flame missing position:", flamePosition);
              return;
            }

            // Логируем данные пламени для отладки
            //console.log('Flame data:', flameId, flamePosition);

            // Преобразуем позицию в массив чисел
            let position;
            if (typeof flamePosition === "string") {
              position = flamePosition.split(", ").map(Number);
            } else {
              console.warn("Invalid flame position format:", flamePosition);
              return;
            }

            // Создаем или обновляем элемент пламени
            let flameElement = document.getElementById(
              `inferno-${id}-${flameId}`
            );
            if (!flameElement) {
              flameElement = document.createElement("div");
              flameElement.id = `inferno-${id}-${flameId}`;
              flameElement.className = "inferno-flame";
              const infernosContainer = document.getElementById("infernos");
              if (infernosContainer) {
                infernosContainer.appendChild(flameElement);
              }
            }

            // Обновляем позицию пламени на радаре
            const { x, y, level } = window.radar.positionToPixels(position);
            flameElement.style.transform = `translate(${x}px, ${y}px)`;
            flameElement.setAttribute("data-level", level);
          });
          return; // Пропускаем стандартную обработку для inferno
        }

        // Стандартная обработка для других типов гранат
        if (!grenade.position) {
          console.warn("Grenade missing position:", grenade);
          return;
        }

        /*const position = typeof grenade.position === 'string' 
                ? grenade.position.split(', ').map(Number)
                : [grenade.position.x, grenade.position.y, grenade.position.z];

            let grenadeElement = document.getElementById(`grenade-${id}`);
            if (!grenadeElement) {
                grenadeElement = document.createElement('div');
                grenadeElement.id = `grenade-${id}`;
                grenadeElement.className = `grenade ${grenade.type}`;
                const radarContainer = document.getElementById('radar-players');
                if (radarContainer) {
                    radarContainer.appendChild(grenadeElement);
                }
            }

            const { x, y, level } = window.radar.positionToPixels(position);
            grenadeElement.style.transform = `translate(${x}px, ${y}px)`;
            grenadeElement.setAttribute('data-level', level);

            switch(grenade.type) {
                case 'smoke':
                    grenadeElement.classList.toggle('active', grenade.effecttime > 0);
                    break;
                case 'flashbang':
                case 'hegrenade':
                    grenadeElement.classList.toggle('exploded', grenade.lifetime >= 1.5);
                    break;
            }*/
      });

      // Удаляем устаревшие гранаты и пламена
      const existingGrenades = document.querySelectorAll(
        ".grenade, .inferno-flame"
      );
      existingGrenades.forEach((element) => {
        const id = element.id.replace(/(grenade-|inferno-\d+-)/, "");
        if (!grenades[id]) {
          //console.log('Removing old grenade/flame:', id);
          element.remove();
        }
      });
    } catch (error) {
      console.error("Ошибка при обновлении гранат:", error);
    }
  }
}

// Добавляем новую функцию для очистки всех элементов радара
function clearAllRadarElements() {
  // Очищаем все элементы игроков
  document.querySelectorAll('[id^="player-"]').forEach((el) => el.remove());

  // Очищаем все элементы гранат
  document
    .querySelectorAll(
      ".grenade, .smoke-grenade, .flash-grenade, .hegrenades-grenade, .firebomb-grenade"
    )
    .forEach((el) => el.remove());

  // Очищаем все элементы инферно (огня)
  document
    .querySelectorAll(".inferno-container, .inferno-flame, .flame-point")
    .forEach((el) => el.remove());

  // Очищаем бомбу
  document.querySelectorAll("#bomb-container").forEach((el) => el.remove());

  // Очищаем контейнеры для гранат
  const containers = ["#smokes", "#flashbangs", "#hegrenades", "#infernos"];
  containers.forEach((selector) => {
    const container = document.querySelector(selector);
    if (container) {
      container.innerHTML = "";
    }
  });

  // Сбрасываем кэшированные данные
  if (window.radar) {
    window.radar.lastAngles = {};
    window.radar.lastAmmo = {};
    window.radar.lastAlivePositions = {};
  }

  //console.log('Все элементы радара очищены при смене карты');
}

function createPlayerElement(player, steamid) {
  if (!steamid || !player) {
    console.error("Недостаточно данных для создания элемента игрока:", {
      steamid,
      player,
    });
    return null;
  }

  // Не создаем элементы для тренеров
  if (isCoach(player)) {
    return null;
  }

  // Создаем основной элемент игрока
  const playerElement = document.createElement("div");
  playerElement.id = `player-${steamid}`;
  playerElement.className = `player ${player.team.toLowerCase()}`;
  playerElement.setAttribute("data-steamid", steamid);

  // Устанавливаем цвет в зависимости от команды
  playerElement.style.background =
    player.team === "CT" ? COLOR_NEW_CT : COLOR_NEW_T;

  // Обновляем стили для мертвых игроков
  if (player.state.health <= 0) {
    playerElement.classList.add("dead_map");
  } else {
    playerElement.classList.remove("dead_map");
    playerElement.style.transition = "transform 0.15s ease-out";
  }

  // Преобразуем observer_slot в нужный идентификатор
  let slotIdentifier;
  if (player.observer_slot === 9) {
    slotIdentifier = 0; // 9 -> 0
  } else if (player.observer_slot >= 0 && player.observer_slot < 9) {
    slotIdentifier = player.observer_slot + 1; // 0 -> 1, 1 -> 2, ..., 8 -> 9
  } else if (player.observer_slot >= 10) {
    slotIdentifier = player.observer_slot; // 10 -> 10, 11 -> 11, и т.д.
  } else {
    slotIdentifier = "N/A"; // Если слот неизвестен
  }

  // Добавляем проверку на наличие бомбы
  const hasBomb = Object.values(player.weapons || {}).some(
    (weapon) => weapon.type === "C4"
  );
  if (hasBomb) {
    playerElement.style.background = PLAYER_BOMB;
  }

  // Устанавливаем data-slot
  playerElement.setAttribute("data-slot", slotIdentifier);

  // Создаем элемент для номера слота
  const slotElement = document.createElement("div");
  slotElement.className = "player-slot";
  slotElement.textContent = slotIdentifier;
  playerElement.appendChild(slotElement);

  // Создаем дочерние элементы (маркер и эффект огня)
  const elements = {
    marker: createMarkerContainer(),
    fire: createFireContainer(),
  };

  // Добавляем дочерние элементы в основной элемент
  Object.values(elements).forEach((el) => playerElement.appendChild(el));

  // Возвращаем созданный элемент
  return playerElement;
}
/*
  function createAvatarContainer(player) {
    const container = document.createElement('div');
    container.className = 'player-avatar';
    //регулировка расположения аватара
    container.style.top = '-51%';
    const img = document.createElement('img');
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    
    if (player.avatar) {
      img.src = `/storage/${player.avatar}`;
      img.onerror = () => {
        container.style.backgroundColor = player.team.toLowerCase() === 'ct' ? COLOR_NEW_CT : COLOR_NEW_T;
      };
    }
    
    container.appendChild(img);
    return container;
  }*/

function createMarkerContainer() {
  const container = document.createElement("div");
  container.className = "player-marker";

  const triangle = document.createElement("div");
  triangle.className = "player-triangle";

  /*const fire = document.createElement('div');
    fire.className = 'background-fire';*/

  container.appendChild(triangle);
  /*container.appendChild(fire);*/
  return container;
}

function formatObserverSlot(slot) {
  // Удаляем console.log, который может замедлять работу
  const slotNumber = parseInt(slot);
  if (slotNumber === 9) {
    return "0";
  } else if (slotNumber === 10) {
    return "11";
  } else if (slotNumber === 11) {
    return "12";
  } else {
    return (slotNumber + 1).toString();
  }
}
function createSlotElement(player) {
  // Удаляем console.log, который может замедлять работу
  const element = document.createElement("div");
  element.className = "player-slot";

  // Проверяем, что observer_slot существует и является числом
  if (player.observer_slot !== undefined) {
    element.textContent = formatObserverSlot(player.observer_slot);
  } else {
    element.textContent = "N/A";
  }

  return element;
}
function createFireContainer() {
  const container = document.createElement("div");
  container.className = "background-fire";

  const bg = document.createElement("div");
  bg.className = "bg";

  container.appendChild(bg);
  container.style.display = "none";
  // Добавляем позиционирование
  container.style.position = "absolute";
  container.style.transformOrigin = "center center";
  // Смещаем контейнер за пределы маркера игрока
  container.style.left = "50%";
  container.style.top = "50%";
  container.style.transform = "translate(-50%, -50%)";

  return container;
}

function updatePlayerElement(element, player) {
  if (!element || !player) {
    console.error("Недостаточно данных для обновления элемента игрока:", {
      element,
      player,
    });
    return;
  }

  // Определяем, несет ли игрок бомбу
  const hasBomb = player.steamid === bomb?.player;

  // Обновляем цвет в зависимости от команды и наличия бомбы
  if (hasBomb) {
    element.style.background = PLAYER_ORANGE;
  } else {
    element.style.background =
      player.team.toLowerCase() === "ct" ? COLOR_NEW_CT : COLOR_NEW_T;
  }

  // Обработка слотов
  let slotIdentifier;
  if (typeof player.observer_slot === "number") {
    if (player.observer_slot === 9) {
      slotIdentifier = 0;
    } else if (player.observer_slot === 10) {
      slotIdentifier = 11;
    } else if (player.observer_slot === 11) {
      slotIdentifier = 12;
    } else if (player.observer_slot >= 0 && player.observer_slot < 9) {
      slotIdentifier = player.observer_slot + 1;
    } else {
      slotIdentifier = player.observer_slot;
    }
  } else {
    slotIdentifier = "N/A";
  }

  // Обновляем номер слота в элементе
  const slotElement = element.querySelector(".player-slot");
  if (slotElement) {
    slotElement.textContent = slotIdentifier;
  }

  // Обновляем data-slot атрибут
  element.setAttribute("data-slot", slotIdentifier);
}
/*
  function calculateMapPosition(position) {
    // Преобразуем строку координат в массив чисел
    const [x, y] = position.split(', ').map(coord => parseFloat(coord));
    
    // Получаем данные карты из radar
    const { resolution, offset } = window.radar;
    
    // Используем тот же расчет, что и для игроков на радаре
    return {
      x: (x - offset.x) / resolution,
      y: (y - offset.y) / resolution
    };
  }*/

function updateBombState(bomb, bombElement) {
  // Если нет данных о бомбе или нет позиции, скрываем элемент бомбы
  if (!bomb || !bomb.position) {
    console.warn("No bomb data or position");
    if (bombElement) {
      bombElement.style.display = "none";
    }
    return;
  }

  const radarPlayers = document.getElementById("radar-players");

  // Проверяем наличие необходимых элементов
  if (!radarPlayers) {
    console.warn("Radar players container not found");
    return;
  }

  // Создаем элемент бомбы, если он не существует
  if (!bombElement) {
    bombElement = document.createElement("div");
    bombElement.id = "bomb-container";
    bombElement.innerHTML = `
              <div class="bomb-icon"></div>
              <!--<div class="bomb-timer"></div>-->
          `;
    radarPlayers.appendChild(bombElement);
  }

  if (!window.radar) {
    console.warn("Radar not initialized");
    return;
  }

  try {
    // Преобразуем координаты из строки в массив чисел
    let position;
    if (typeof bomb.position === "string") {
      position = bomb.position.split(", ").map(Number);
    } else if (bomb.position.x !== undefined) {
      position = [bomb.position.x, bomb.position.y, bomb.position.z];
    } else {
      console.warn("Invalid bomb position format");
      bombElement.style.display = "none";
      return;
    }

    switch (bomb.state) {
      case "carried":
        bombElement.style.display = "none";
        break;

      case "dropped":
        bombElement.className = "bomb-state dropped";
        bombElement.style.display = "block";
        updateBombPosition(position, bombElement);
        break;

      case "planted":
        bombElement.className = "bomb-state planted";
        bombElement.style.display = "block";
        updateBombPosition(position, bombElement);
        break;

      case "defused":
        bombElement.className = "bomb-state defused";
        bombElement.style.display = "block";
        updateBombPosition(position, bombElement);
        break;

      case "exploded":
        bombElement.style.display = "none";
        break;

      default:
        bombElement.style.display = "none";
    }
  } catch (error) {
    console.error("Error updating bomb:", error);
    // В случае ошибки скрываем элемент бомбы
    if (bombElement) {
      bombElement.style.display = "none";
    }
  }
}

// Обновляем функцию updateBombPosition для более точного позиционирования
function updateBombPosition(position, bombElement) {
  if (!position || !bombElement || !window.radar) {
    console.warn("Missing required parameters for updateBombPosition:", {
      hasPosition: !!position,
      hasBombElement: !!bombElement,
      hasRadar: !!window.radar,
    });
    return;
  }

  try {
    // Проверяем этаж
    const isLowerLevel = window.radar.splits?.[0]?.zRange
      ? position[2] <= window.radar.splits[0].zRange.max &&
        position[2] >= window.radar.splits[0].zRange.min
      : false;

    let x = position[0] + window.radar.offset.x;
    let y = position[1] + window.radar.offset.y;
    const scale = 1024 * window.radar.resolution;

    if (isLowerLevel && window.radar.splits?.[0]) {
      const split = window.radar.splits[0];
      x = (x / scale) * 100 + split.offset.x * 1.725;
      y = (y / scale) * 100 + split.offset.y * 2.8;
    } else {
      x = (x / scale) * 100;
      y = (y / scale) * 100;
    }

    // Регулировка позиции бомбы
    bombElement.style.left = `${x + 4}%`;
    bombElement.style.bottom = `${y - 8}%`;
    bombElement.setAttribute("data-z", position[2]);
    bombElement.setAttribute("data-level", isLowerLevel ? "lower" : "upper");

    // Добавляем плавное перемещение
    bombElement.style.transition = "left 0.1s linear, bottom 0.1s linear";
  } catch (error) {
    console.error("Error in updateBombPosition:", error);
  }
}

function updateGrenades(grenades, allplayers) {
  // Проверяем, что grenades существует и не пустой
  if (
    !grenades ||
    Object.keys(grenades).length === 0 ||
    !allplayers ||
    !window.radar?.splits
  )
    return;

  try {
    const smokesContainer = document.getElementById("smokes");
    const flashesContainer = document.getElementById("flashbangs");
    const heContainer = document.getElementById("hegrenades");
    const infernosContainer = document.getElementById("infernos");

    if (
      !smokesContainer ||
      !flashesContainer ||
      !heContainer ||
      !infernosContainer
    )
      return;

    // Кэшируем команды игроков для быстрого доступа
    const playerTeams = {};
    Object.values(allplayers).forEach((player) => {
      playerTeams[player.steamid] = player.team;
    });

    // Используем Set для отслеживания существующих гранат
    const existingGrenades = {
      smoke: new Set(),
      flash: new Set(),
      frag: new Set(),
      firebomb: new Set(),
      inferno: new Set(),
    };

    // Обрабатываем только определенное количество гранат за один кадр
    const grenadeKeys = Object.keys(grenades);
    const MAX_GRENADES_PER_FRAME = 20; // Ограничиваем количество обрабатываемых гранат

    // Batch fragments per container to minimize reflow
    const smokesFrag = document.createDocumentFragment();
    const flashesFrag = document.createDocumentFragment();
    const heFrag = document.createDocumentFragment();
    const infernosFrag = document.createDocumentFragment();
    const appendToContainer = (container, el) => {
      if (!container || !el) return;
      if (container === smokesContainer) smokesFrag.appendChild(el);
      else if (container === flashesContainer) flashesFrag.appendChild(el);
      else if (container === heContainer) heFrag.appendChild(el);
      else if (container === infernosContainer) infernosFrag.appendChild(el);
    };

    grenadeKeys.slice(0, MAX_GRENADES_PER_FRAME).forEach((id) => {
      const grenade = grenades[id];

      if (
        grenade.type === "smoke" ||
        grenade.type === "flashbang" ||
        grenade.type === "frag" ||
        grenade.type === "firebomb" ||
        grenade.type === "inferno"
      ) {
        const isSmoke = grenade.type === "smoke";
        const isFlash = grenade.type === "flashbang";
        const isFrag = grenade.type === "frag";
        const isFirebomb = grenade.type === "firebomb";
        const isInferno = grenade.type === "inferno";

        const grenadeType = isSmoke
          ? "smoke"
          : isFlash
          ? "flash"
          : isFrag
          ? "frag"
          : isInferno
          ? "inferno"
          : "firebomb";

        existingGrenades[grenadeType].add(id);

        const container = isSmoke
          ? smokesContainer
          : isFlash
          ? flashesContainer
          : isFrag
          ? heContainer
          : infernosContainer;

        const grenadeId = `${grenade.type}_${id}`;
        const lifetime = parseFloat(grenade.lifetime);
        const effecttime = parseFloat(grenade.effecttime || 0);

        let grenadeElement = document.getElementById(grenadeId);

        // Специальная обработка для inferno (огня)
        if (isInferno) {
          if (!grenadeElement) {
            grenadeElement = document.createElement("div");
            grenadeElement.id = grenadeId;
            grenadeElement.className = "inferno-container";
            appendToContainer(container, grenadeElement);
          }

          if (grenade.flames) {
            const existingFlames = new Set();

            // Ограничиваем количество обрабатываемых точек пламени
            const flameEntries = Object.entries(grenade.flames);
            const MAX_FLAMES_PER_FRAME = 15;

            const flamesFragment = document.createDocumentFragment();
            flameEntries
              .slice(0, MAX_FLAMES_PER_FRAME)
              .forEach(([flameId, position]) => {
                existingFlames.add(flameId);
                let flameElement = document.getElementById(
                  `${grenadeId}_${flameId}`
                );

                if (!flameElement) {
                  flameElement = document.createElement("div");
                  flameElement.id = `${grenadeId}_${flameId}`;
                  flameElement.className = "flame-point";
                  flamesFragment.appendChild(flameElement);
                }

                // Используем более эффективный способ преобразования позиции
                const flamePos =
                  typeof position === "string"
                    ? position.split(", ").map(Number)
                    : [position.x, position.y, position.z];

                const scale = 1024 * window.radar.resolution;

                // Проверяем, на каком этаже находится точка пламени
                const isLowerLevel = window.radar.splits?.[0]?.zRange
                  ? flamePos[2] <= window.radar.splits[0].zRange.max &&
                    flamePos[2] >= window.radar.splits[0].zRange.min
                  : false;

                let x = flamePos[0] + window.radar.offset.x;
                let y = flamePos[1] + window.radar.offset.y;

                if (isLowerLevel && window.radar.splits?.[0]) {
                  const split = window.radar.splits[0];
                  const baseX = (x / scale) * 100;
                  const baseY = (y / scale) * 100;

                  x = baseX + split.offset.x * 1.9;
                  y = baseY + split.offset.y * 2.8;
                } else {
                  x = (x / scale) * 100;
                  y = (y / scale) * 100;
                }

                // Возвращаемся к оригинальному позиционированию
                flameElement.style.left = `${x + 4}%`;
                flameElement.style.bottom = `${y + 96}%`;
                flameElement.setAttribute(
                  "data-level",
                  isLowerLevel ? "lower" : "upper"
                );
              });
            if (flamesFragment.childNodes.length)
              grenadeElement.appendChild(flamesFragment);

            // Удаляем только те flames, которых больше нет в данных
            if (lifetime <= 0) {
              grenadeElement
                .querySelectorAll(".flame-point")
                .forEach((flame) => {
                  const flameId = flame.id.replace(`${grenadeId}_`, "");
                  if (!existingFlames.has(flameId)) {
                    flame.remove();
                  }
                });
            }
          }

          if (lifetime <= 0) {
            grenadeElement.remove();
          }
        } else {
          // Обработка других типов гранат
          if (!grenadeElement) {
            grenadeElement = document.createElement("div");
            grenadeElement.id = grenadeId;

            if (isFirebomb) {
              grenadeElement.className = "firebomb-grenade";
              const ownerTeam = playerTeams[grenade.owner];
              const teamClass = `util_${
                ownerTeam === "T" ? "molotov" : "incgrenade"
              }_${ownerTeam}`;
              grenadeElement.classList.add(teamClass);

              const imgElement = document.createElement("img");
              imgElement.className = "firebomb-icon";
              imgElement.src = `/images/maps/element/grenades/weapon_${
                ownerTeam === "T" ? "molotov" : "incgrenade"
              }_${ownerTeam}.webp`;
              // Применяем цветовой фильтр к иконке
              if (ownerTeam) {
                const color = ownerTeam === "T" ? COLOR_NEW_T : COLOR_NEW_CT;
                imgElement.style.filter = `brightness(0) saturate(100%) invert(1) drop-shadow(0 0 2px ${color})`;
              }
              grenadeElement.appendChild(imgElement);
            } else {
              grenadeElement.className = isSmoke
                ? "smoke-grenade"
                : isFlash
                ? "flash-grenade"
                : "hegrenades-grenade";

              const ownerTeam = playerTeams[grenade.owner];
              const teamClass = ownerTeam
                ? `util_${
                    isSmoke
                      ? "smokegrenade"
                      : isFlash
                      ? "flashbang"
                      : "hegrenades"
                  }_${ownerTeam}`
                : `util_${
                    isSmoke
                      ? "smokegrenade"
                      : isFlash
                      ? "flashbang"
                      : "hegrenades"
                  }_default`;
              grenadeElement.classList.add(teamClass);

              const imgElement = document.createElement("img");
              imgElement.className = isSmoke
                ? "smoke-icon"
                : isFlash
                ? "flash-icon"
                : "hegrenades-icon";
              imgElement.src = `/images/maps/element/grenades/weapon_${
                isSmoke ? "smokegrenade" : isFlash ? "flashbang" : "hegrenade"
              }${ownerTeam ? "_" + ownerTeam : ""}.webp`;
              // Применяем цветовой фильтр к иконке
              if (ownerTeam) {
                const color = ownerTeam === "T" ? COLOR_NEW_T : COLOR_NEW_CT;
                imgElement.style.filter = `brightness(0) saturate(100%) invert(1) drop-shadow(0 0 2px ${color})`;
              }
              grenadeElement.appendChild(imgElement);
            }

            appendToContainer(container, grenadeElement);
          }

          // Оптимизируем обработку позиции
          const position =
            typeof grenade.position === "string"
              ? grenade.position.split(", ").map(Number)
              : [grenade.position.x, grenade.position.y, grenade.position.z];

          const scale = 1024 * window.radar.resolution;

          // Проверяем, на каком этаже находится граната
          const isLowerLevel = window.radar.splits?.[0]?.zRange
            ? position[2] <= window.radar.splits[0].zRange.max &&
              position[2] >= window.radar.splits[0].zRange.min
            : false;

          let x = position[0] + window.radar.offset.x;
          let y = position[1] + window.radar.offset.y;

          if (isLowerLevel && window.radar.splits?.[0]) {
            const split = window.radar.splits[0];
            const baseX = (x / scale) * 100;
            const baseY = (y / scale) * 100;

            x = baseX + split.offset.x * 1.9;
            y = baseY + split.offset.y * 2.8;
          } else {
            x = (x / scale) * 100;
            y = (y / scale) * 100;
          }

          // Возвращаемся к оригинальному позиционированию
          grenadeElement.style.left = `${x + 4}%`;
          grenadeElement.style.bottom = `${y - 3}%`;
          grenadeElement.setAttribute(
            "data-level",
            isLowerLevel ? "lower" : "upper"
          );
          grenadeElement.style.transition =
            "left 0.1s linear, bottom 0.1s linear";

          // Обработка специфичных эффектов для разных типов гранат
          if (isSmoke) {
            // Проверяем состояние дымовой гранаты
            if (effecttime > 0 && effecttime < 22) {
              // Дым активен - показываем эффект дыма
              grenadeElement.style.transition = "none";
              grenadeElement.classList.add("smoke-active");

              // Подсветка активного дыма по команде владельца
              const ownerTeam = playerTeams[grenade.owner];
              if (ownerTeam) {
                const color = ownerTeam === "T" ? COLOR_NEW_T : COLOR_NEW_CT;
                grenadeElement.classList.toggle("smoke-t", ownerTeam === "T");
                grenadeElement.classList.toggle("smoke-ct", ownerTeam === "CT");
                grenadeElement.style.boxShadow = `0 0 8px 2px ${color}`;
                grenadeElement.dataset.team = ownerTeam;
              }

              // Удаляем иконку гранаты, если она есть
              const iconElement = grenadeElement.querySelector(".smoke-icon");
              if (iconElement) {
                iconElement.remove();
              }
            } else if (effecttime >= 22) {
              // Время действия дыма закончилось - удаляем элемент
              existingGrenades.smoke.delete(id);
              grenadeElement.remove();
            } else {
              // Дым еще не активен (летит) — убираем подсветку команды
              grenadeElement.classList.remove(
                "smoke-active",
                "smoke-t",
                "smoke-ct"
              );
              grenadeElement.style.boxShadow = "";
              grenadeElement.removeAttribute("data-team");
            }
          } else if (isFlash) {
            const FLASH_MAX_LIFETIME = 1.5;

            if (
              lifetime >= FLASH_MAX_LIFETIME &&
              !grenadeElement.dataset.exploded
            ) {
              grenadeElement.dataset.exploded = "true";
              grenadeElement.style.transition = "none";

              const iconElement = grenadeElement.querySelector(".flash-icon");
              if (iconElement) {
                iconElement.remove();
              }

              grenadeElement.classList.add("flash-active");

              // Используем setTimeout с меньшей задержкой для более плавной анимации
              setTimeout(() => {
                grenadeElement.classList.add("hide");
              }, 100);

              setTimeout(() => {
                existingGrenades.flash.delete(id);
                grenadeElement.remove();
              }, 2100);
            }
          } else if (isFrag) {
            const FRAG_MAX_LIFETIME = 1.5;

            if (grenadeElement && grenadeElement.dataset.exploded) {
              return;
            }

            if (lifetime >= FRAG_MAX_LIFETIME) {
              if (
                grenadeElement &&
                !grenadeElement.dataset.exploded &&
                !grenadeElement.dataset.animationStarted
              ) {
                grenadeElement.dataset.exploded = "true";
                grenadeElement.dataset.animationStarted = "true";
                grenadeElement.style.transition = "none";

                const iconElement =
                  grenadeElement.querySelector(".hegrenades-icon");
                if (iconElement) {
                  iconElement.remove();
                }

                grenadeElement.classList.add("hegrenades-active");

                setTimeout(() => {
                  if (grenadeElement) {
                    grenadeElement.classList.add("hide");
                  }
                }, 100);

                setTimeout(() => {
                  existingGrenades.frag.delete(id);
                  if (grenadeElement && grenadeElement.parentNode) {
                    grenadeElement.remove();
                  }
                }, 7000);
              }
            }
          }
        }
      }
    });

    // Очистка устаревших элементов - выполняем реже для оптимизации
    if (Math.random() < 0.2) {
      // Выполняем очистку только в 20% кадров
      smokesContainer.querySelectorAll(".smoke-grenade").forEach((element) => {
        const id = element.id.replace("smoke_", "");
        if (!existingGrenades.smoke.has(id)) {
          element.remove();
        }
      });

      flashesContainer.querySelectorAll(".flash-grenade").forEach((element) => {
        const id = element.id.replace("flashbang_", "");
        if (!existingGrenades.flash.has(id)) {
          element.remove();
        }
      });

      heContainer.querySelectorAll(".hegrenades-grenade").forEach((element) => {
        const id = element.id.replace("frag_", "");
        if (!existingGrenades.frag.has(id)) {
          element.remove();
        }
      });

      infernosContainer
        .querySelectorAll(".firebomb-grenade, .inferno-container")
        .forEach((element) => {
          const id = element.id.replace(/(firebomb_|inferno_)/, "");
          if (
            !existingGrenades.firebomb.has(id) &&
            !existingGrenades.inferno.has(id)
          ) {
            element.remove();
          }
        });
    }

    // Flush fragments to DOM before cleanup
    if (smokesFrag.childNodes.length) smokesContainer.appendChild(smokesFrag);
    if (flashesFrag.childNodes.length)
      flashesContainer.appendChild(flashesFrag);
    if (heFrag.childNodes.length) heContainer.appendChild(heFrag);
    if (infernosFrag.childNodes.length)
      infernosContainer.appendChild(infernosFrag);
  } catch (error) {
    console.error("Error updating grenades:", error);
  }
}

// ... existing code ...

// Добавляем новую функцию для очистки всех гранат
function clearAllGrenades() {
  const smokesContainer = document.getElementById("smokes");
  const flashesContainer = document.getElementById("flashbang");
  const heContainer = document.getElementById("hegrenades");
  const infernosContainer = document.getElementById("infernos");

  if (smokesContainer) smokesContainer.innerHTML = "";
  if (flashesContainer) flashesContainer.innerHTML = "";
  if (heContainer) heContainer.innerHTML = "";
  if (infernosContainer) infernosContainer.innerHTML = "";
}
// ... existing code ...

// Добавьте эту функцию перед функцией updateHUD или в начале файла

// Функция для отображения всплывающих уведомлений
function showAlertSlide(team, color, message) {
  // Создаем или получаем элемент для уведомления

  // Показываем уведомление
  alertElement.style.opacity = "1";

  // Скрываем уведомление через 3 секунды
  setTimeout(() => {
    alertElement.style.opacity = "0";
  }, 3000);
}

// Глобальная функция для получения loss bonus команды
function getTeamLossBonus(players, map) {
  // Определяем, какая это команда (CT или T) по первому игроку
  if (!players || !players.length || !map) return 1400;

  const teamSide = players[0]?.team;
  let losses = 0;

  if (teamSide === "CT") {
    losses = map.team_ct?.consecutive_round_losses || 0;
  } else if (teamSide === "T") {
    losses = map.team_t?.consecutive_round_losses || 0;
  }

  // Правильные значения loss bonus
  switch (losses) {
    case 0:
      return 1400;
    case 1:
      return 1900;
    case 2:
      return 2400;
    case 3:
      return 2900;
    default:
      return losses >= 4 ? 3400 : 1400;
  }
}
// Функция для обновления диаграммы сравнения команд
function updateTeamComparisonChart(allplayers, map) {
  // Получаем данные команд
  const left = Object.values(allplayers).filter(
    (player) => player.team === "CT"
  );
  const right = Object.values(allplayers).filter(
    (player) => player.team === "T"
  );

  // Подсчитываем деньги команд
  const leftTeamMoney = left.reduce(
    (sum, player) => sum + (player.state?.money || 0),
    0
  );
  const rightTeamMoney = right.reduce(
    (sum, player) => sum + (player.state?.money || 0),
    0
  );

  // Подсчитываем стоимость экипировки
  const leftEquipValue = left.reduce(
    (sum, player) => sum + (player.state?.equip_value || 0),
    0
  );
  const rightEquipValue = right.reduce(
    (sum, player) => sum + (player.state?.equip_value || 0),
    0
  );

  // Подсчитываем K/D команд
  const leftTotalKills = left.reduce(
    (sum, player) => sum + (player.match_stats?.kills || 0),
    0
  );
  const rightTotalKills = right.reduce(
    (sum, player) => sum + (player.match_stats?.kills || 0),
    0
  );
  const leftTotalDeaths = left.reduce(
    (sum, player) => sum + (player.match_stats?.deaths || 0),
    0
  );
  const rightTotalDeaths = right.reduce(
    (sum, player) => sum + (player.match_stats?.deaths || 0),
    0
  );

  const leftKD =
    leftTotalDeaths > 0 ? leftTotalKills / leftTotalDeaths : leftTotalKills;
  const rightKD =
    rightTotalDeaths > 0 ? rightTotalKills / rightTotalDeaths : rightTotalKills;

  // Обновляем значения в полосках
  $(".money-left").text("$" + leftTeamMoney.toLocaleString());
  $(".money-right").text("$" + rightTeamMoney.toLocaleString());
  $(".equip-left").text("$" + leftEquipValue.toLocaleString());
  $(".equip-right").text("$" + rightEquipValue.toLocaleString());
  $(".kd-left").text(leftKD.toFixed(2));
  $(".kd-right").text(rightKD.toFixed(2));

  // Обновляем ширину диаграмм
  const maxMoney = Math.max(leftTeamMoney, rightTeamMoney);
  const maxEquip = Math.max(leftEquipValue, rightEquipValue);
  const maxKD = Math.max(leftKD, rightKD);

  $(".money-chart .bar-left").css(
    "width",
    Math.max(10, (leftTeamMoney / maxMoney) * 100) + "%"
  );
  $(".money-chart .bar-right").css(
    "width",
    Math.max(10, (rightTeamMoney / maxMoney) * 100) + "%"
  );
  $(".equip-chart .bar-left").css(
    "width",
    Math.max(10, (leftEquipValue / maxEquip) * 100) + "%"
  );
  $(".equip-chart .bar-right").css(
    "width",
    Math.max(10, (rightEquipValue / maxEquip) * 100) + "%"
  );
  $(".kd-chart .bar-left").css(
    "width",
    Math.max(10, (leftKD / maxKD) * 100) + "%"
  );
  $(".kd-chart .bar-right").css(
    "width",
    Math.max(10, (rightKD / maxKD) * 100) + "%"
  );
  // Цвета из констант
  const CT_COLOR =
    typeof COLOR_NEW_CT !== "undefined" ? COLOR_NEW_CT : "#0bc7ed";
  const T_COLOR = typeof COLOR_NEW_T !== "undefined" ? COLOR_NEW_T : "#f0be21";
  // Установить переменные для диаграммы
  const chart = document.getElementById("team-comparison-chart");
  if (chart) {
    chart.style.setProperty("--ct-color", CT_COLOR);
    chart.style.setProperty("--t-color", T_COLOR);
  }
}

// Функция для обновления таблицы лидеров по киллам
function updateKillsLeaderboard(allplayers) {
  const players = Object.values(allplayers).filter((p) => p.match_stats);
  const sorted = players.sort(
    (a, b) => (b.match_stats?.kills || 0) - (a.match_stats?.kills || 0)
  );
  const topPlayers = sorted.slice(0, 10);

  const CT_COLOR =
    typeof COLOR_NEW_CT !== "undefined" ? COLOR_NEW_CT : "#0bc7ed";
  const T_COLOR = typeof COLOR_NEW_T !== "undefined" ? COLOR_NEW_T : "#f0be21";
  const maxKills = Math.max(
    ...topPlayers.map((p) => p.match_stats?.kills || 0),
    1
  );

  // TOP-1 (оставляем как есть)
  if (topPlayers[0]) {
    const p = topPlayers[0];
    $(".top-player-name").text(p.name || "-");
    $(".top-kills").text(p.match_stats?.kills ?? 0);
    $(".top-assists").text(p.match_stats?.assists ?? 0);
    $(".top-deaths").text(p.match_stats?.deaths ?? 0);
    $(".top-adr").text(p.state?.adr ?? 0);
    $(".top-hs").text(p.state?.hs ?? 0);
    let avatarUrl = "/images/default-avatar.png";
    if (p.avatar && p.avatar !== "") {
      avatarUrl = p.avatar.startsWith("/uploads/")
        ? p.avatar
        : `/uploads/${p.avatar}`;
    }
    $(".top-player-avatar").attr("src", avatarUrl);
    const teamColor = p.team?.toLowerCase() === "ct" ? CT_COLOR : T_COLOR;
    $(".top-player-block").css("--top-player-bg", teamColor);
  } else {
    $(".top-player-name").text("-");
    $(".top-kills").text(0);
    $(".top-assists").text(0);
    $(".top-deaths").text(0);
    $(".top-adr").text(0);
    $(".top-hs").text(0);
    $(".top-player-avatar").attr("src", "/images/default-avatar.png");
    $(".top-player-block").css("--top-player-bg", "#222");
  }

  // Остальные игроки (2-10)
  const rows = $(".players-list .player-row");
  for (let i = 0; i < rows.length; i++) {
    const row = $(rows[i]);
    const p = topPlayers[i + 1];
    if (p) {
      row.find(".player-name").text(p.name || "-");
      row.find(".player-kills").text(p.match_stats?.kills ?? 0);
      row.find(".player-assists").text(p.match_stats?.assists ?? 0);
      row.find(".player-deaths").text(p.match_stats?.deaths ?? 0);
      row.find(".player-adr").text(p.state?.adr ?? 0);
      row.find(".player-hs").text(p.state?.hs ?? 0);
      const kills = p.match_stats?.kills || 0;
      const width = Math.max(10, (kills / maxKills) * 100);
      const teamColor = p.team?.toLowerCase() === "ct" ? CT_COLOR : T_COLOR;
      row
        .find(".progress-inner")
        .css("width", width + "%")
        .css("background", teamColor);
    } else {
      row.find(".player-name").text("-");
      row.find(".player-kills").text(0);
      row.find(".player-assists").text(0);
      row.find(".player-deaths").text(0);
      row.find(".player-adr").text(0);
      row.find(".player-hs").text(0);
      row.find(".progress-inner").css("width", "0%").css("background", "#666");
    }
  }
}

//-------------------------------------------------------------------------------
// Подписываемся на обновления GSI
gsiManager.subscribe((event) => {
  switch (event.type) {
    case "update":
      updateHUD(event.data);
      break;
  }
});

// В index.js HUD'a
document.addEventListener("DOMContentLoaded", function () {
  // Проверяем, откуда загружена страница
  const isHttps = window.location.protocol === "https:";

  // Выбираем правильный порт и протокол
  const socketProtocol = isHttps ? "wss:" : "ws:";
  const socketPort = isHttps ? "2627" : "2626";
  const socketUrl = `${socketProtocol}//${window.location.hostname}:${socketPort}`;

  //console.log('Подключение к Socket.IO:', socketUrl);

  // Создаем соединение
  const hudIdFromUrl =
    (window.location.pathname.match(/^\/hud\/([^\/]+)/) || [])[1] || "";
  try {
    localStorage.setItem("hudId", hudIdFromUrl || HUD_NAME || "");
  } catch {}
  const socket = io(socketUrl, {
    secure: isHttps,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    auth: { hudId: hudIdFromUrl },
  });

  // Настраиваем обработчики
  socket.on("connect", () => {
    //console.log('Соединение установлено через', isHttps ? 'HTTPS' : 'HTTP');
  });

  socket.on("connect_error", (error) => {
    //console.error('Ошибка соединения:', error);

    // Если не удалось подключиться по выбранному протоколу, пробуем альтернативный
    if (isHttps) {
      //console.log('Не удалось подключиться по HTTPS, пробуем HTTP...');
      // Здесь можно добавить код для переключения на HTTP если нужно
    }
  });

  // GSI обновления получаем только через gsiManager, чтобы не дублировать апдейты

  // Обработка киллфида
  socket.on("killfeed", (data) => {
    if (data.type === "new_kill") {
      // Фильтр скрытых игроков по steamid
      try {
        const hidden1 = localStorage.getItem("hiddenSteamId1") || "";
        const hidden2 = localStorage.getItem("hiddenSteamId2") || "";
        const hideSet = new Set(
          [hidden1, hidden2, ...(window.gsiHiddenSteamIds || [])].filter(
            Boolean
          )
        );
        const ks = data.kill?.killer_steamid;
        const vs = data.kill?.victim_steamid;
        // Если убийца или жертва скрыты — пропускаем
        if (ks && hideSet.has(ks)) return;
        if (vs && hideSet.has(vs)) return;
        // Фильтруем ассистов
        if (Array.isArray(data.kill?.assists) && hideSet.size) {
          data.kill.assists = data.kill.assists.filter(
            (a) => a?.steamid && !hideSet.has(a.steamid)
          );
        }
      } catch {}
      addKillfeedEntry(data.kill);
    } else if (data.type === "update_kill") {
      updateKillfeedEntry(data.kill);
    } else if (data.type === "clear") {
      // Очищаем killfeed при новом раунде
      clearKillfeed();
    }
  });

  // Обработка HLAE киллфида (netcon)
  socket.on("hlae_killfeed", (data) => {
    if (data.type === "new_kill") {
      try {
        const hidden1 = localStorage.getItem("hiddenSteamId1") || "";
        const hidden2 = localStorage.getItem("hiddenSteamId2") || "";
        const hideSet = new Set(
          [hidden1, hidden2, ...(window.gsiHiddenSteamIds || [])].filter(
            Boolean
          )
        );
        const ks = data.kill?.killer_steamid;
        const vs = data.kill?.victim_steamid;
        if (ks && hideSet.has(ks)) return;
        if (vs && hideSet.has(vs)) return;
      } catch {}
      addHlaeKillfeedEntry(data.kill);
    } else if (data.type === "clear") {
      clearHlaeKillfeed();
    }
  });
});

// Функции для киллфида
function addKillfeedEntry(kill) {
  const killfeedContainer = $("#killfeed-container .killfeed-entries");
  if (!killfeedContainer.length) return;

  const entry = createKillfeedEntry(kill);
  killfeedContainer.append(entry);

  // Удаляем через 8 секунд
  setTimeout(() => {
    entry.addClass("fade-out");
    setTimeout(() => {
      entry.remove();
    }, 300);
  }, 5000);

  // Ограничиваем количество записей
  const entries = killfeedContainer.find(".killfeed-entry");
  if (entries.length > 15) {
    entries.first().remove();
  }
}

function addHlaeKillfeedEntry(kill) {
  const killfeedContainer = $("#killfeed-HLAE .killfeed-entries");
  if (!killfeedContainer.length) return;

  const entry = createHlaeKillfeedEntry(kill);
  killfeedContainer.append(entry);

  // Удаляем через 8 секунд
  setTimeout(() => {
    entry.addClass("fade-out");
    setTimeout(() => entry.remove(), 300);
  }, 5000);

  const entries = killfeedContainer.find(".killfeed-entry");
  if (entries.length > 15) entries.first().remove();
}

function updateKillfeedEntry(kill) {
  const killfeedContainer = $("#killfeed-container .killfeed-entries");
  if (!killfeedContainer.length) return;

  // Ищем существующую запись по комбинации killer + victim + weapon
  const existingEntry = killfeedContainer
    .find(".killfeed-entry")
    .filter(function () {
      const killer = $(this).find(".killfeed-killer").text();
      const victim = $(this).find(".killfeed-victim").text();
      const weapon = $(this).find(".killfeed-weapon-icon img").attr("alt");
      return (
        killer === kill.killer &&
        victim === kill.victim &&
        weapon === kill.weapon
      );
    })
    .first();

  if (existingEntry.length > 0) {
    // Обновляем существующую запись
    const newEntry = createKillfeedEntry(kill);
    existingEntry.replaceWith(newEntry);

    // Устанавливаем таймер удаления для обновленной записи
    setTimeout(() => {
      newEntry.addClass("fade-out");
      setTimeout(() => {
        newEntry.remove();
      }, 300);
    }, 8000);

    console.log(
      `Killfeed: Обновлена запись ${kill.killer} -> ${
        kill.victim
      } с ассистами: ${kill.assists ? kill.assists.length : 0}`
    );
  } else {
    // Если не нашли, добавляем новую
    console.log(
      `Killfeed: Не найдена запись для обновления ${kill.killer} -> ${kill.victim}, добавляем новую`
    );
    addKillfeedEntry(kill);
  }
}

function clearKillfeed() {
  const killfeedContainer = $(".killfeed-entries");
  if (!killfeedContainer.length) return;

  // Очищаем все записи killfeed
  killfeedContainer.empty();
}

function clearHlaeKillfeed() {
  const killfeedContainer = $("#killfeed-HLAE .killfeed-entries");
  if (!killfeedContainer.length) return;
  killfeedContainer.empty();
}

function createKillfeedEntry(kill) {
  // Определяем иконку оружия
  const weaponIcon = getWeaponIcon(
    String(kill.weapon || "").toLowerCase(),
    !!kill.knife,
    !!kill.grenade,
    !!kill.bomb,
    !!kill.he_grenade,
    !!kill.shooting,
    !!kill.headshot,
    !!kill.burning
  );

  // Специальная обработка для planted_c4.svg
  if (kill.weapon === "planted_c4.svg" || kill.weapon === "planted_c4") {
    kill.planted_c4 = true;
    // НЕ меняем weapon, чтобы показать дефолтную иконку оружия, а planted_c4 иконка покажется дополнительно
  }

  // Специальная обработка для disconnect
  if (
    kill.type === "disconnect" ||
    kill.disconnect ||
    kill.weapon === "disconnect" ||
    kill.weapon === "earth"
  ) {
    kill.disconnect = true;
  }

  // Специальная обработка для suicide/world
  if (kill.weapon === "suicide" || kill.weapon === "world" || kill.world) {
    kill.world = true;
  }
  // Определяем классы для типа килла
  let entryClass = "killfeed-entry";
  if (kill.knife) entryClass += " knife";
  if (kill.grenade) entryClass += " grenade";
  if (kill.bomb) entryClass += " bomb";
  if (kill.he_grenade) entryClass += " he-grenade";
  if (kill.planted_c4) entryClass += " planted-c4"; // Добавляем класс для planted_c4

  // Формируем HTML для ассистентов: имена ассистов с цветом команды
  let assistsHtml = "";
  if (Array.isArray(kill.assists) && kill.assists.length > 0) {
    const flashedFlag = !!(
      kill.victim_flashed ||
      kill.flashed ||
      kill.was_victim_flashed_at_throw ||
      kill.flash_assist ||
      kill.flash_assisted ||
      kill.assist_flash
    );
    assistsHtml = kill.assists
      .map((assist) => {
        // normalize team and pick color
        const teamVal = (assist.team || assist.side || "")
          .toString()
          .toUpperCase();
        const assistColor =
          teamVal === "CT"
            ? COLOR_NEW_CT_TOPPANEL || COLOR_NEW_CT
            : COLOR_NEW_T_TOPPANEL || COLOR_NEW_T;
        const assistName = assist.name || "";
        const flashedAfterPlus = flashedFlag
          ? ' <img src="/files/img/elements/flashed.png" alt="FL" class="killfeed-flashed-icon">'
          : "";
        return `<span class=\"killfeed-assist\" title=\"${assistName}\"><span style=\"color: ${COLOR_WHITE};\">+</span>${flashedAfterPlus} <span style=\"color: ${assistColor};\">${assistName}</span></span>`;
      })
      .join("");
  }

  // Значок ослепления жертвы
  const flashedIconHtml =
    kill.victim_flashed || kill.flashed
      ? '<img src="/files/img/elements/flashed.png" alt="FL" class="killfeed-flashed-icon">'
      : "";
  // Значок ослепления киллера (attackerblind) — перед ником киллера
  const attackerBlindIconHtml = kill.killer_flashed
    ? '<img src="/files/img/elements/attackerblind.png" alt="AB" class="killfeed-attackerblind-icon">'
    : "";

  const killerColor =
    kill.killer_team === "CT" ? COLOR_NEW_CT_TOPPANEL : COLOR_NEW_T_TOPPANEL;
  const victimColor =
    kill.victim_team === "CT" ? COLOR_NEW_CT_TOPPANEL : COLOR_NEW_T_TOPPANEL;

  // Значок флеша больше отдельно не выводим перед ассистами/киллером, он находится после знака '+'

  // Классы для форматирования записи
  const headshotClass = kill.headshot ? " headshot" : "";
  const noscopeClass = kill.noscope ? " noscope" : "";
  const throughsmokeClass = kill.throughsmoke ? " throughsmoke" : "";
  const wallbangClass = kill.attackerblind ? " attackerblind" : "";
  const teamClass =
    (kill.killer_team || kill.killer_side) === "CT" ? " ct" : " t";

  // Избежать дублирования иконки огня: если weapon === 'inferno', основная иконка будет fire,
  // поэтому дополнительную fire-иконку не добавляем
  const shouldAddFireExtra =
    !!kill.burning && String(kill.weapon || "").toLowerCase() !== "inferno";

  // Иконка полёта/в воздухе перед иконкой оружия
  const killerInAir = !!(
    kill.attackerinair ||
    kill.attacker_in_air ||
    kill.attackerInAir ||
    kill.inair ||
    kill.air
  );

  // Определяем, есть ли иконка оружия
  const hasWeaponIcon = weaponIcon && weaponIcon.trim() !== "";

  // Определяем, нужно ли показывать блок киллера
  const shouldShowKillers =
    !kill.planted_c4 &&
    !kill.disconnect &&
    !kill.world &&
    kill.killer &&
    kill.killer.trim() !== "";

  const entry = $(`
    <div class="${wallbangClass}${entryClass}${teamClass}${noscopeClass}${throughsmokeClass}${headshotClass}">
      ${
        shouldShowKillers
          ? `
        <div class="killfeed-killers">
          ${attackerBlindIconHtml}
          <span class="killfeed-killer" style="color: ${killerColor};" title="${kill.killer}">${kill.killer}</span>
          ${assistsHtml}
        </div>
      `
          : ""
      }
      <div class="killfeed-weapon">
        ${
          killerInAir && shouldShowKillers
            ? '<img src="/files/img/icons/fly.png" alt="AIR" class="killfeed-air-icon">'
            : ""
        }
        ${
          hasWeaponIcon
            ? `<span class="killfeed-weapon-icon">${weaponIcon}</span>`
            : ""
        }
        ${
          shouldAddFireExtra
            ? '<img src="/files/img/icons/fire.png" alt="FIRE" class="killfeed-fire-icon">'
            : ""
        }
        ${
          // Показываем HE-значок дополнительно, если отмечен he_grenade, но активная иконка не граната
          kill.he_grenade && String(kill.weapon).toLowerCase() !== "hegrenade"
            ? '<img src="/files/img/icons/hegrenade.png" alt="HE" class="killfeed-he-icon">'
            : ""
        }
        ${
          kill.bomb_exploded
            ? '<img src="/files/img/icons/c4.png" alt="C4" class="killfeed-c4-icon">'
            : ""
        }
        ${
          // Значок отключения (earth) — если событие помечено как disconnect
          kill.type === "disconnect" || kill.disconnect
            ? '<img src="/files/img/icons/earth.png" alt="DISCONNECT" class="killfeed-disconnect-icon">'
            : ""
        }
        ${
          // Показываем planted_c4 иконку
          kill.planted_c4
            ? '<img src="/files/img/icons/planted_c4.png" alt="PLANTED_C4" class="killfeed-planted-c4-icon">'
            : ""
        }
        ${
          // Показываем world иконку для suicide
          kill.world
            ? '<img src="/files/img/icons/world.png" alt="WORLD" class="killfeed-world-icon">'
            : ""
        }
      </div>
      <span class="killfeed-victim" style="color: ${victimColor};" title="${
    kill.victim
  }">${kill.victim}</span>
    </div>
  `);

  // Добавляем дополнительные иконки только если есть иконка оружия
  try {
    const weaponBlock = entry.find(".killfeed-weapon");
    const weaponIconSpan = weaponBlock.find(".killfeed-weapon-icon");

    // Добавляем дополнительные иконки только если есть span оружия
    if (weaponIconSpan.length > 0) {
      let extraIconsHtml = "";
      if ((kill.penetrated && Number(kill.penetrated) > 0) || kill.wallbang) {
        extraIconsHtml +=
          '<img src="/files/img/icons/wallbang.png" alt="WB" class="killfeed-wallbang-icon">';
      }
      if (kill.throughsmoke) {
        extraIconsHtml +=
          '<img src="/files/img/icons/smoke.png" alt="SMOKE" class="killfeed-smoke-icon">';
      }
      if (kill.headshot) {
        extraIconsHtml +=
          '<img src="/files/img/icons/headshot.png" alt="HS" class="killfeed-headshot-icon">';
      }

      if (extraIconsHtml) weaponIconSpan.after(extraIconsHtml);
    }
  } catch {}

  return entry;
}

function createHlaeKillfeedEntry(kill) {
  const noscopeIcon = kill.noscope
    ? '<img src="/files/img/icons/noscope.png" alt="NS" class="killfeed-noscope-icon">'
    : "";
  const withExtras = { ...kill };
  withExtras.throughsmoke = !!kill.throughsmoke || !!kill.thrusmoke;
  withExtras.killer = kill.killer_name || kill.killer || "";
  withExtras.victim = kill.victim_name || kill.victim || "";

  // Обрабатываем planted_c4 для HLAE
  if (kill.weapon === "planted_c4.svg" || kill.weapon === "planted_c4") {
    withExtras.planted_c4 = true;
    // НЕ меняем weapon, чтобы показать дефолтную иконку, а planted_c4 иконка покажется дополнительно
  }

  const entry = createKillfeedEntry(withExtras);
  const weaponBlock = entry.find(".killfeed-weapon");
  weaponBlock.append(noscopeIcon);
  return entry;
}

// Глобальная таблица соответствия оружия → файл иконки
const WEAPON_IMAGE_MAP = {
  // Основное оружие
  ak47: "ak47.svg",
  m4a1: "m4a1.svg",
  m4a1_silencer: "m4a1_silencer.svg",
  m4a4: "m4a1.svg",
  awp: "awp.svg",
  elite: "elite.svg",
  hkp2000: "hkp2000.svg",
  usp_silencer: "usp_silencer.svg",
  p2000: "hkp2000.svg",
  tec9: "tec9.svg",
  mp9: "mp9.svg",
  p250: "p250.svg",
  deagle: "deagle.svg",
  fiveseven: "fiveseven.svg",
  glock: "glock.svg",
  nova: "nova.svg",
  xm1014: "xm1014.svg",
  mag7: "mag7.svg",
  sawedoff: "sawedoff.svg",
  m249: "m249.svg",
  negev: "negev.svg",
  mac10: "mac10.svg",
  mp7: "mp7.svg",
  ump45: "ump45.svg",
  p90: "p90.svg",
  bizon: "bizon.svg",
  galilar: "galilar.svg",
  famas: "famas.svg",
  ssg08: "ssg08.svg",
  aug: "aug.svg",
  sg556: "sg556.svg",
  scar20: "scar20.svg",
  g3sg1: "g3sg1.svg",
  mp5sd: "mp5sd.svg",
  cz75a: "cz75a.svg",
  revolver: "revolver.svg",
  inferno: "inferno_fire.svg",
  world: "world.svg",
  molotov: "molotov.svg",
  incgrenade: "incgrenade.svg",
  hegrenade: "hegrenade.svg",
  flashbang: "flashbang.svg",
  smokegrenade: "smokegrenade.svg",
  decoy: "decoy.svg",
  taser: "taser.svg",

  // Ножи
  knife: "knife.svg",
  knife_bayonet: "knife_bayonet.svg",
  knife_butterfly: "knife_butterfly.svg",
  knife_canis: "knife_canis.svg",
  knife_cord: "knife_cord.svg",
  knife_css: "knife_css.svg",
  knife_falchion: "knife_falchion.svg",
  knife_flip: "knife_flip.svg",
  knife_gut: "knife_gut.svg",
  knife_gypsy_jackknife: "knife_gypsy_jackknife.svg",
  knife_karambit: "knife_karambit.svg",
  knife_m9_bayonet: "knife_m9_bayonet.svg",
  knife_outdoor: "knife_outdoor.svg",
  knife_push: "knife_push.svg",
  knife_skeleton: "knife_skeleton.svg",
  knife_stiletto: "knife_stiletto.svg",
  knife_survival_bowie: "knife_survival_bowie.svg",
  knife_t: "knife_t.svg",
  knife_tactical: "knife_tactical.svg",
  knife_ursus: "knife_ursus.svg",
  knife_widowmaker: "knife_widowmaker.svg",
  bayonet: "bayonet.svg",
  knife_bayonet: "knife_bayonet.svg",
  knife_kukri: "knife_kukri.svg",

  // Гранаты
  molotov: "molotov.svg",
  incgrenade: "incgrenade.svg",
  hegrenade: "hegrenade.svg",
  flashbang: "flashbang.svg",
  smokegrenade: "smokegrenade.svg",
  decoy: "decoy.svg",

  // Специальное оружие
  taser: "taser.svg",
  c4: "planted_c4.svg",
  planted_c4: "planted_c4.svg", // Добавляем специально для HLAE
  world: "world.svg",
  trigger_hurt: "trigger_hurt.svg",
  earth: "earth.svg",

  // Дополнительные маппинги для похожих оружий
  weapon_ak47: "ak47.svg",
  weapon_m4a1: "m4a1.svg",
  weapon_m4a1_silencer: "m4a1_silencer.svg",
  weapon_awp: "awp.svg",
  weapon_elite: "elite.svg",
  weapon_hkp2000: "hkp2000.svg",
  weapon_usp_silencer: "usp_silencer.svg",
  weapon_tec9: "tec9.svg",
  weapon_mp9: "mp9.svg",
  weapon_p250: "p250.svg",
  weapon_deagle: "deagle.svg",
  weapon_fiveseven: "fiveseven.svg",
  weapon_glock: "glock.svg",
  weapon_nova: "nova.svg",
  weapon_xm1014: "xm1014.svg",
  weapon_mag7: "mag7.svg",
  weapon_sawedoff: "sawedoff.svg",
  weapon_m249: "m249.svg",
  weapon_negev: "negev.svg",
  weapon_mac10: "mac10.svg",
  weapon_mp7: "mp7.svg",
  weapon_ump45: "ump45.svg",
  weapon_p90: "p90.svg",
  weapon_bizon: "bizon.svg",
  weapon_galilar: "galilar.svg",
  weapon_famas: "famas.svg",
  weapon_ssg08: "ssg08.svg",
  weapon_aug: "aug.svg",
  weapon_sg556: "sg556.svg",
  weapon_scar20: "scar20.svg",
  weapon_g3sg1: "g3sg1.svg",
  weapon_mp5sd: "mp5sd.svg",
  weapon_cz75a: "cz75a.svg",
  weapon_revolver: "revolver.svg",
  weapon_knife: "knife.svg",
  weapon_knife_bayonet: "knife_bayonet.svg",
  weapon_knife_butterfly: "knife_butterfly.svg",
  weapon_knife_falchion: "knife_falchion.svg",
  weapon_knife_flip: "knife_flip.svg",
  weapon_knife_gut: "knife_gut.svg",
  weapon_knife_karambit: "knife_karambit.svg",
  weapon_knife_m9_bayonet: "knife_m9_bayonet.svg",
  weapon_knife_push: "knife_push.svg",
  weapon_knife_stiletto: "knife_stiletto.svg",
  weapon_knife_survival_bowie: "knife_survival_bowie.svg",
  weapon_knife_t: "knife_t.svg",
  weapon_knife_tactical: "knife_tactical.svg",
  weapon_knife_ursus: "knife_ursus.svg",
  weapon_knife_widowmaker: "knife_widowmaker.svg",
  weapon_bayonet: "bayonet.svg",
  weapon_molotov: "molotov.svg",
  weapon_incgrenade: "incgrenade.svg",
  weapon_hegrenade: "hegrenade.svg",
  weapon_flashbang: "flashbang.svg",
  weapon_smokegrenade: "smokegrenade.svg",
  weapon_taser: "taser.svg",
};
function getWeaponIcon(
  weapon,
  isKnife,
  isGrenade,
  isBomb,
  isHeGrenade,
  isShooting,
  isHeadshot,
  isBurning
) {
  // Приоритет как в внешнем скрипте, но без HLAE:
  // 1) Если headshot → всегда показываем активное оружие (перебивает HE/огонь/С4)
  if (isHeadshot) {
    const imageHs = WEAPON_IMAGE_MAP[weapon];
    if (imageHs)
      return `<img src="../../images/weapons/${imageHs}" alt="${weapon}" class="weapon-icon">`;
    return '<img src="/files/img/icons/ak47.png" alt="unknown" class="weapon-icon">';
  }

  // 2) Если не headshot → спец. источники урона важнее ножа
  if (isBomb) {
    return '<img src="/files/img/icons/c4.png" alt="bomb" class="weapon-icon">';
  }
  // HE показываем, только если не было стрельбы на тике (эвристика от свитча на нож)
  if (isHeGrenade && !isShooting) {
    return '<img src="/files/img/icons/hegrenade.png" alt="he-grenade" class="weapon-icon">';
  }
  if (isBurning) {
    return '<img src="/files/img/icons/fire.png" alt="fire" class="weapon-icon">';
  }
  if (isKnife) {
    // Prefer weapon-specific knife SVG if available in WEAPON_IMAGE_MAP,
    // otherwise fall back to generic knife icon
    const imageFileKnife = WEAPON_IMAGE_MAP[weapon] || "knife.svg";
    return `<img src="../../images/weapons/${imageFileKnife}" alt="${weapon}" class="weapon-icon">`;
  }
  if (isGrenade) {
    return '<img src="/files/img/icons/hegrenade.png" alt="grenade" class="weapon-icon">';
  }

  // 3) Иначе — активное оружие
  // Специальная обработка для planted_c4 - не показываем никакое оружие
  if (weapon === "planted_c4" || weapon === "planted_c4.svg") {
    return ""; // Пустая строка - никакого оружия не показываем
  }

  // Специальная обработка для disconnect - не показываем никакое оружие
  if (weapon === "disconnect" || weapon === "earth") {
    return ""; // Пустая строка - никакого оружия не показываем
  }

  // Специальная обработка для suicide - не показываем никакое оружие
  if (weapon === "suicide" || weapon === "world") {
    return ""; // Пустая строка - никакого оружия не показываем
  }

  const imageFile = WEAPON_IMAGE_MAP[weapon];
  if (imageFile) {
    return `<img src="../../images/weapons/${imageFile}" alt="${weapon}" class="weapon-icon">`;
  }

  return '<img src="/files/img/icons/ak47.png" alt="unknown" class="weapon-icon">';
}

// ... existing code ...

// Обработчик событий для тестирования (можно убрать в продакшене)
document.addEventListener("keydown", (event) => {
  // Alt+T для тестирования
  if (event.altKey && event.key === "t") {
    event.preventDefault();
    showPopupWord("TEST POPUP!");
  }
});

// ... existing code ...
