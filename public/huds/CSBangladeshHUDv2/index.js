// Объявляем константы в глобальной области видимости
let COLOR_CT,
  COLOR_T,
  COLOR_NEW_CT,
  COLOR_NEW_T,
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
  BG_DEAD_T;

// Глобальные переменные для отслеживания состояния игры
let freezetime = false;
let last_round = 0;
let round_now = 0;
let start_money = {};

// Переменные для отслеживания разминирования бомбы
let isDefusing = false;
let defuse_seconds = 10;
let divider = 1;
let hasKit = false;

// Добавляем переменную для отслеживания начального времени разминирования
let initialDefuseTime = null;

// Переменные для бомбы
let bomb_time = 0;
let bomb_timer;
let bomb_timer_css;

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
    }
  });

  //console.log(
  //`Отображаем ${Object.keys(filteredPlayers).length} из ${
  //  Object.keys(allplayers).length
  //} игроков`
  //);
  return filteredPlayers;
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
COLOR_CT = "rgba(56, 123, 238, 1)";
COLOR_T = "rgba(255, 160, 0, 1)";
COLOR_NEW_CT = "rgba(56, 123, 238, 1)";
COLOR_NEW_T = "rgba(255, 160, 0, 1)";
COLOR_NEW_CT_Baground =
  "linear-gradient(280deg, rgba(56, 123, 238, ) 7%, rgba(0, 0, 0, 1) 100%)";
COLOR_NEW_T_Baground =
  "linear-gradient(280deg, rgba(255, 160, 0, 1) 7%, rgba(0, 0, 0, 1) 100%)";
COLOR_RED = "rgba(229, 11, 11, 1.0)";
COLOR_CT_SPECTATOR =
  "linear-gradient(0deg, rgba(56, 123, 238, 1 ) 0%, rgba(56, 123, 238,0.623) 100%)";
COLOR_T_SPECTATOR =
  "linear-gradient(0deg, rgba(255, 160, 0,1) 0%, rgba(255, 160, 0, 0.623) 100%)";
COLOR_MAIN_PANEL = "rgba(12, 15, 18, 0.75)";
COLOR_SUB_PANEL = "rgba(12, 15, 18, 0.6)";
COLOR_GRAY = "rgba(191, 191, 191, 1.0)";
COLOR_WHITE = "rgba(250, 250, 250, 1.0)";
COLOR_WHITE_HALF = "rgba(250, 250, 250, 0.5)";
COLOR_WHITE_DULL = "rgba(250, 250, 250, 0.25)";
PLAYER_BOMB = "rgba(237, 163, 56, 1.0)";
PLAYER_ORANGE = "rgba(237, 163, 56, 1.0)";
PLAYER_GREEN = "rgba(16, 152, 86, 1.0)";
PLAYER_BLUE = "rgba(104, 163, 229, 1.0)";
PLAYER_YELLOW = "rgba(230, 241, 61, 1.0)";
PLAYER_PURPLE = "rgba(128, 60, 161, 1.0)";
DEV_PURPLE = "rgba(200, 0, 255, 1.0)";
BG_DEAD_CT = "rgba(56, 123, 238, 0.6)";
BG_DEAD_T = "rgba(255, 160, 0, 0.6)";

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
    // Пытаемся определить имя HUD из URL: /hud/<hudId>/...
    const fromUrl = (window.location.pathname.match(/^\/hud\/([^\/]+)/) ||
      [])[1];
    const hudName =
      fromUrl || (typeof HUD_NAME === "string" && HUD_NAME) || "default";
    const tryPaths = [
      `/hud/${hudName}/colors.config.json`,
      `/huds/${hudName}/colors.config.json`,
    ];
    const load = (i) => {
      if (i >= tryPaths.length) return Promise.resolve(null);
      return fetch(tryPaths[i], { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
        .then((j) => (j ? j : load(i + 1)));
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

// Подписываемся на события скрытия игроков
document.addEventListener("DOMContentLoaded", function () {
  // Проверяем наличие Socket.IO
  if (window.io) {
    // Подключаемся к серверу Socket.IO
    const socket = io();

    // Подписываемся на события hud_data
    socket.on("hud_data", function (data) {
      if (data.type === "hide_players" && Array.isArray(data.steamids)) {
        // Сохраняем steamid в localStorage
        localStorage.setItem("hiddenSteamId1", data.steamids[0] || "");
        localStorage.setItem("hiddenSteamId2", data.steamids[1] || "");

        // Обновляем глобальную переменную для хранения скрытых Steam64 ID
        window.gsiHiddenSteamIds = data.steamids.filter((id) => id);

        console.log(
          "Получены ID для скрытия через Socket.IO:",
          window.gsiHiddenSteamIds
        );

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
  }

  // Проверяем наличие сохраненных ID при загрузке страницы
  const hiddenSteamId1 = localStorage.getItem("hiddenSteamId1");
  const hiddenSteamId2 = localStorage.getItem("hiddenSteamId2");

  if (hiddenSteamId1 || hiddenSteamId2) {
    const hideIds = [hiddenSteamId1, hiddenSteamId2].filter((id) => id);
    // Обновляем глобальную переменную для хранения скрытых Steam64 ID
    window.gsiHiddenSteamIds = hideIds;
    console.log("Загружены сохраненные ID для скрытия:", hideIds);
  }
});

// Объявляем константу для имени HUD
const HUD_NAME = "default";

let currentPhaseState = {
  phase: null,
  round: null,
};

// Добавить в глобальную область
let lastFrameTime = 0;
const targetFPS = 30;
const frameDuration = 1000 / targetFPS;
let pendingDataUpdate = null;

// Заменить текущую функцию updateHUD на эту
function updateHUD(data) {
  console.log(data);
  // Сохраняем данные для следующего обновления
  pendingDataUpdate = data;

  // Если обновление не запланировано, планируем его
  if (!window.pendingUpdate) {
    window.pendingUpdate = true;
    requestAnimationFrame(frameRateControlledUpdate);
  }

  // FPS counter - оставляем как есть
  if (!window._fpsData) {
    window._fpsData = {
      frames: 0,
      lastSecond: performance.now(),
      lastUpdate: performance.now(),
      fps: 0,
      fpsHistory: [],
      updateInterval: 1000,
    };
  }

  const now = performance.now();
  window._fpsData.frames++;

  if (now - window._fpsData.lastSecond >= window._fpsData.updateInterval) {
    window._fpsData.fps = Math.round(
      (window._fpsData.frames * 1000) / (now - window._fpsData.lastSecond)
    );
    window._fpsData.fpsHistory.push(window._fpsData.fps);

    if (window._fpsData.fpsHistory.length > 10) {
      window._fpsData.fpsHistory.shift();
    }

    const avgFps = Math.round(
      window._fpsData.fpsHistory.reduce((a, b) => a + b, 0) /
        window._fpsData.fpsHistory.length
    );
    const minFps = Math.min(...window._fpsData.fpsHistory);
    const maxFps = Math.max(...window._fpsData.fpsHistory);

    //console.log(
    //  `HUD FPS: ${window._fpsData.fps} (Avg: ${avgFps}, Min: ${minFps}, Max: ${maxFps}) [Target: ${targetFPS}]`
    //);

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
    requestAnimationFrame(frameRateControlledUpdate);
  }
}

function actuallyUpdateHUD(data) {
  //console.log(data);

  // Проверяем, есть ли команда на скрытие игроков
  if (data.type === "hide_players" && Array.isArray(data.steamids)) {
    // Сохраняем steamid в localStorage
    localStorage.setItem("hiddenSteamId1", data.steamids[0] || "");
    localStorage.setItem("hiddenSteamId2", data.steamids[1] || "");

    // Обновляем глобальную переменную для хранения скрытых Steam64 ID
    window.gsiHiddenSteamIds = data.steamids.filter((id) => id);

    console.log("Получены ID для скрытия через GSI:", window.gsiHiddenSteamIds);
    return; // Прерываем выполнение, так как это команда, а не обновление HUD
  }

  // Фильтруем игроков, которых нужно скрыть
  if (data.allplayers) {
    data.allplayers = filterHiddenPlayers(data.allplayers);
  }

  const slot = data.player?.slot;

  // Проверяем изменение фазы раунда
  if (
    data.round &&
    (data.round.phase === "over" || data.round.phase === "freezetime")
  ) {
    clearAllGrenades();
  }

  // Обновляем глобальную переменную freezetime
  if (data.round) {
    freezetime = data.round.phase === "freezetime";
  }

  // Сохраняем allplayers в глобальную переменную для доступа из других функций
  window.allplayers = data.allplayers || {};

  const left = Object.values(data.allplayers || {}).filter(
    (player) => player.team === "CT"
  );
  const right = Object.values(data.allplayers || {}).filter(
    (player) => player.team === "T"
  );
  const teams_players = {
    left: left.length > 0 ? { side: "ct", players: left } : null,
    right: right.length > 0 ? { side: "t", players: right } : null,
  };

  const phase = data.phase_countdowns;
  const round = data.round;
  const map = data.map;
  const previously = data.previously;
  const bomb = data.bomb;
  const match = data.match;
  // Используем локальную переменную для round_now, чтобы не конфликтовать с глобальной
  const current_round = data.round_now;

  const teams = {
    left:
      left[0]?.team === "CT"
        ? {
            side: "ct",
          }
        : {
            side: "t",
          },
    right:
      right[0]?.team === "CT"
        ? {
            side: "ct",
          }
        : {
            side: "t",
          },
  };

  // Обновляем HUD компоненты
  updateTopPanel(
    left,
    right,
    data.map,
    data.phase_countdowns,
    data.bomb,
    data.match,
    current_round
  );
  updateRoundNow(data.round, data.map);
  updateRoundState(
    data.phase_countdowns,
    data.round,
    data.map,
    data.previously,
    data.bomb,
    data.allplayers, // Передаем allplayers вместо players для правильного определения игрока, разминирующего бомбу
    left,
    right,
    teams
  );
  fillObserved(data.player);
  updatePlayers(
    data.allplayers,
    data.players,
    data.observed,
    data.phase,
    data.previously,
    teams,
    teams_players,
    data.map
  );
  updateTeamValues(left, right, data.map);
  countNades(left, right);
  updatePlayerNames(data.allplayers);
  updateRadar(
    data.allplayers,
    data.map,
    data,
    data.player,
    data.bomb,
    data.player,
    data.grenades
  );
  last_round = current_round;
}

function updateActivePlayer(allplayers, player) {
  // Проверяем, что player существует
  if (!player) return;

  // Получаем слот активного игрока
  const activePlayerSlot = player.slot;

  // Проходим по всем игрокам и сравниваем observer_slot
  for (let steamid in allplayers) {
    const currentPlayer = allplayers[steamid];
    const side = currentPlayer.team.toLowerCase() === "ct" ? "left" : "right";
    let playerNumber;

    // Определяем номер слота так же, как в updateTeams
    if (side === "left") {
      playerNumber = currentPlayer.observer_slot + 1;
    } else {
      // Используем ту же логику, что и в функции updatePlayerElement
      if (currentPlayer.observer_slot === 9) {
        playerNumber = 5; // T: 9->5 (отображается как 0)
      } else if (
        currentPlayer.observer_slot >= 5 &&
        currentPlayer.observer_slot < 9
      ) {
        playerNumber = currentPlayer.observer_slot - 4; // T: 5->1, 6->2, 7->3, 8->4
      } else if (currentPlayer.observer_slot === 10) {
        playerNumber = 6; // T: 10->6
      } else if (currentPlayer.observer_slot === 11) {
        playerNumber = 7; // T: 11->7
      } else {
        playerNumber = currentPlayer.observer_slot - 4;
      }
    }

    // Получаем контейнер игрока
    const playerContainer = document.querySelector(
      `#team_${side} .player_${playerNumber}`
    );
    if (playerContainer) {
      // Если observer_slot совпадает с активным слотом, добавляем класс
      if (currentPlayer.observer_slot === activePlayerSlot) {
        playerContainer.classList.add("active_spectated_player");
      } else {
        playerContainer.classList.remove("active_spectated_player");
      }
    }
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
  //console.log(left, right, map, phase_countdowns, bomb, match, round_now);

  var phase = phase_countdowns;
  var round = map.round;

  // Проверяем наличие необходимых данных
  if (!map || !left || !right) {
    // Скрываем или очищаем элементы при отсутствии данных
    $(".team_left, .team_right, .score_left, .score_right").text("");
    $(".logo_left .logo, .logo_right .logo").attr("src", "");
    $(".border_left, .border_right, .map_left, .map_right").css(
      "background-color",
      ""
    );
    $(
      "#left_team #best_of .block1, #left_team #best_of .block2, #left_team #best_of .block3, #right_team #best_of .block1, #right_team #best_of .block2, #right_team #best_of .block3"
    ).css("background-color", "");
    return; // Прерываем выполнение функции
  }

  const currentRound = map.round || 0;
  const teamsSelected = left?.name && right?.name;
  const matchFormat = match?.format; // Получаем формат матча или используем bo1 по умолчанию
  const isValidFormat = ["bo1", "bo3", "bo5"].includes(matchFormat); // Проверяем валидность формата

  // Базовые цвета текста
  $(
    "#left_team #main, .live_left, #left_team #score, #right_team #main, .live_right, #right_team #score"
  ).css("color", COLOR_WHITE);

  // Цвета для верхних полос слева/справа из констант
  try {
    const leftSideTeam = (left && left[0] && left[0].team) || "CT";
    const rightSideTeam = (right && right[0] && right[0].team) || "T";
    const leftBarColor = leftSideTeam === "CT" ? COLOR_NEW_CT : COLOR_NEW_T;
    const rightBarColor = rightSideTeam === "CT" ? COLOR_NEW_CT : COLOR_NEW_T;
    $("#left_bar").css("background-color", leftBarColor);
    $("#right_bar").css("background-color", rightBarColor);
    $("#score_left").css("color", leftBarColor);
    $("#score_right").css("color", rightBarColor);
  } catch {}

  // Обновляем счет в центральной секции
  $("#score_left").text(map.team_ct?.score || "0");
  $("#score_right").text(map.team_t?.score || "0");

  if (!teamsSelected) {
    // Используем имена команд напрямую из map объекта, с проверкой на существование
    $("#left_team #main").text(map.team_ct?.name || "");
    $("#right_team #main").text(map.team_t?.name || "");

    // Обновляем счет с проверкой на существование
    $("#left_team #score").text(map.team_ct?.score || "0");
    $("#right_team #score").text(map.team_t?.score || "0");

    if (map.team_ct.logo && map.team_t.logo !== null) {
      // Используем дефолтные логотипы на основе сторон
      $("#left_team #team_logo").attr("src", "/uploads/" + map.team_ct.logo);
      $("#right_team #team_logo").attr("src", "/uploads/" + map.team_t.logo);
    } else {
      // Используем дефолтные логотипы на основе сторон
      $("#left_team #team_logo").attr("src", "/images/logo_ct_default.png");
      $("#right_team #team_logo").attr("src", "/images/logo_t_default.png");
    }

    $("#left_team .bar").css("background-color", COLOR_NEW_CT);
    $("#right_team .bar").css("background-color", COLOR_NEW_T);

    $("#left_team #alert #alert_pole_right").css(
      "background-color",
      COLOR_NEW_CT
    );
    $("#right_team #alert #alert_pole_left").css(
      "background-color",
      COLOR_NEW_T
    );

    $("#match_pole_1").css("background-color", COLOR_NEW_CT);
    $("#match_pole_2").css("background-color", COLOR_NEW_T);

    // Добавляем одиночные полосы для режима без выбора команд
    $(".map_left, .map_right").empty();
    $(".map_left, .map_right").append($("<div>").addClass("map_bar"));

    // Устанавливаем цвет основной полосы
    if (left[0].team == "CT") {
      $("#left_team #best_of .bar").css("background-color", COLOR_NEW_CT);
      $("#right_team #best_of .bar").css("background-color", COLOR_NEW_T);
    } else {
      $("#left_team #best_of .bar").css("background-color", COLOR_NEW_T);
      $("#right_team #best_of .bar").css("background-color", COLOR_NEW_CT);
    }

    // Получаем счет команд
    const scoreTeamCT = map.team_ct.matches_won_this_series || 0;
    const scoreTeamT = map.team_t.matches_won_this_series || 0;

    // Определяем, какая команда на какой стороне
    const teams = {
      left:
        left[0]?.team === "CT"
          ? { side: "ct", score: scoreTeamCT }
          : { side: "t", score: scoreTeamT },
      right:
        right[0]?.team === "CT"
          ? { side: "ct", score: scoreTeamCT }
          : { side: "t", score: scoreTeamT },
    };

    // Сначала скрываем все блоки
    $(
      "#left_team #best_of .block1, #left_team #best_of .block2, #left_team #best_of .block3, #left_team #best_of .block4, #left_team #best_of .block5"
    ).css({
      "background-color": "",
      opacity: "0",
    });
    $(
      "#right_team #best_of .block1, #right_team #best_of .block2, #right_team #best_of .block3, #right_team #best_of .block4, #right_team #best_of .block5"
    ).css({
      "background-color": "",
      opacity: "0",
    });

    // Устанавливаем цвет основной полосы
    $("#left_team #best_of .bar").css(
      "background-color",
      teams.left.side === "ct" ? COLOR_NEW_CT : COLOR_NEW_T
    );
    $("#right_team #best_of .bar").css(
      "background-color",
      teams.right.side === "ct" ? COLOR_NEW_CT : COLOR_NEW_T
    );

    if (matchFormat === "bo3") {
      // Показываем только нужные блоки для bo3 (block4 и block5)
      $("#left_team #best_of .block4, #left_team #best_of .block5").css(
        "opacity",
        "1"
      );
      $("#right_team #best_of .block4, #right_team #best_of .block5").css(
        "opacity",
        "1"
      );

      // Для левой команды
      if (teams.left.score >= 1) {
        $("#left_team #best_of .block4").css("background-color", COLOR_WHITE);
      }
      if (teams.left.score >= 2) {
        $("#left_team #best_of .block5").css("background-color", COLOR_WHITE);
      }

      // Для правой команды
      if (teams.right.score >= 1) {
        $("#right_team #best_of .block4").css("background-color", COLOR_WHITE);
      }
      if (teams.right.score >= 2) {
        $("#right_team #best_of .block5").css("background-color", COLOR_WHITE);
      }
    } else if (matchFormat === "bo5") {
      // Показываем только нужные блоки для bo5 (block1, block2 и block3)
      $(
        "#left_team #best_of .block1, #left_team #best_of .block2, #left_team #best_of .block3"
      ).css("opacity", "1");
      $(
        "#right_team #best_of .block1, #right_team #best_of .block2, #right_team #best_of .block3"
      ).css("opacity", "1");

      // Для левой команды
      if (teams.left.score >= 1) {
        $("#left_team #best_of .block1").css("background-color", COLOR_WHITE);
      }
      if (teams.left.score >= 2) {
        $("#left_team #best_of .block2").css("background-color", COLOR_WHITE);
      }
      if (teams.left.score >= 3) {
        $("#left_team #best_of .block3").css("background-color", COLOR_WHITE);
      }

      // Для правой команды
      if (teams.right.score >= 1) {
        $("#right_team #best_of .block1").css("background-color", COLOR_WHITE);
      }
      if (teams.right.score >= 2) {
        $("#right_team #best_of .block2").css("background-color", COLOR_WHITE);
      }
      if (teams.right.score >= 3) {
        $("#right_team #best_of .block3").css("background-color", COLOR_WHITE);
      }
    } else {
      // Для bo1 скрываем все блоки
      $(
        "#left_team #best_of .block1, #left_team #best_of .block2, #left_team #best_of .block3, #left_team #best_of .block4, #left_team #best_of .block5"
      ).css("opacity", "0");
      $(
        "#right_team #best_of .block1, #right_team #best_of .block2, #right_team #best_of .block3, #right_team #best_of .block4, #right_team #best_of .block5"
      ).css("opacity", "0");
    }
  }
}

function updateRoundNow(round, map) {
  if (!round || !map) return;

  // Используем глобальную переменную round_now
  round_now =
    map.round +
    (round.phase == "over" || round.phase == "intermission" ? 0 : 1);

  // Обновляем отображение номера раунда
  $("#round_number").text("Round " + round_now + " / 24");

  // Примечание: сброс start_money теперь происходит в updateStateFreezetime
}

function updateRoundState(
  phase_countdowns,
  round,
  map,
  previously,
  bomb,
  players,
  left,
  right,
  teams
) {
  // Функция для подсчета живых игроков
  function checkAlivePlayers(players) {
    if (!players || !Array.isArray(players)) {
      return 0;
    }

    let count = 0;
    for (let i = 0; i < players.length; i++) {
      if (players[i].state && players[i].state.health > 0) {
        count++;
      }
    }
    return count;
  }

  var left_alive = checkAlivePlayers(left);
  var right_alive = checkAlivePlayers(right);
  $("#PA_left_team_counter")
    .text(left_alive)
    .css("color", teams.left.side == "ct" ? COLOR_NEW_CT : COLOR_NEW_T);
  $("#PA_right_team_counter")
    .text(right_alive)
    .css("color", teams.right.side == "ct" ? COLOR_NEW_CT : COLOR_NEW_T);

  switch (phase_countdowns.phase) {
    case "warmup":
      updateStateWarmup(phase_countdowns, teams);
      break;
    case "freezetime":
      updateStateFreezetime(phase_countdowns, previously, teams);
      break;
    case "live":
      updateStateLive(phase_countdowns, bomb, players, previously, teams);
      break;
    case "over":
      updateStateOver(phase_countdowns, round, previously, teams);
      break;
    case "bomb":
      updateStatePlanted(phase_countdowns, round, previously, teams);
      break;
    case "defuse":
      updateStateDefuse(phase_countdowns, bomb, players, teams);
      break;
    case "paused":
      updateStatePaused(phase_countdowns, "paused", previously, map);
      break;
    case "timeout_t":
      updateStatePaused(phase_countdowns, "timeout_t", previously, map);
      break;
    case "timeout_ct":
      updateStatePaused(phase_countdowns, "timeout_ct", previously, map);
      break;
  }
}

function updateStateWarmup(phase_countdowns, teams) {
  if (phase_countdowns) {
    forceRemoveAlerts();
    for (let x = 1; x <= 5; x++) {
      $("#players_left #player_section #player" + x + " #player_stat").css(
        "opacity",
        0
      );
      $("#players_right #player_section #player" + x + " #player_stat").css(
        "opacity",
        0
      );
    }
    if (!$("#round_timer_text").hasClass("round_warmup"))
      animateRoundTimer("round_warmup", true);
  }
}

function updateStateFreezetime(phase, previously, teams) {
  if (phase) {
    // Удаляем все классы таймера раунда
    removeRoundTimeGraphics();

    // Сбрасываем состояние бомбы
    resetBomb();

    // Сбрасываем состояние разминирования
    isDefusing = false;

    // Сбрасываем начальные деньги игроков для нового раунда
    start_money = {};

    // Показываем статистику игроков
    showPlayerStats(phase);

    // Показываем утилиты и деньги
    $("#players_left #box_utility").slideDown(500);
    $("#players_right #box_utility").slideDown(500);
    $("#players_left #box_monetary").slideDown(500);
    $("#players_right #box_monetary").slideDown(500);

    // Устанавливаем цвет таймера
    $("#round_timer_text").css("color", COLOR_GRAY);

    // Очищаем дополнительные классы таймера раунда
    $("#round_timer_text").removeClass("bomb_active");
    $("#round_timer_text").removeClass("bomb_defused");
    $("#round_timer_text").removeClass("bomb_exploded");

    if (previously.hasOwnProperty("round")) {
      if (previously.round.hasOwnProperty("win_team")) {
        if (previously.round.win_team == "CT") {
          if (teams.left.side == "CT") {
            // * CT alert on Left
            hideAlertSlide("#left_team");
          } else {
            // * CT alert on Right
            hideAlertSlide("#right_team");
          }
        } else if (previously.round.win_team == "T") {
          if (teams.left.side == "T") {
            // * T alert on Left
            hideAlertSlide("#left_team");
          } else {
            // * T alert on Right
            hideAlertSlide("#right_team");
          }
        }
      }
    } else if (checkPrev(previously, "paused")) {
      $("#alert_middle").removeClass();
      animateElement("#alert_middle", "fadeOutDown", function () {
        $("#alert_middle").css("opacity", 0).removeClass();
      });
    } else if (
      checkPrev(previously, "timeout_t") ||
      checkPrev(previously, "timeout_ct")
    ) {
      $("#alert_middle").removeClass();
      animateElement("#alert_middle", "fadeOutDown", function () {
        $("#alert_middle").css("opacity", 0).removeClass();
      });
      hideAlert("#left_team");
      hideAlert("#right_team");
    }

    if (phase.phase_ends_in) {
      var clock_time = Math.abs(Math.ceil(phase.phase_ends_in));
      var count_minute = Math.floor(clock_time / 60);
      var count_seconds = clock_time - count_minute * 60;
      if (count_seconds < 10) {
        count_seconds = "0" + count_seconds;
      }
      $("#round_timer_text").text(count_minute + ":" + count_seconds);
    }
  }
}

function updateStateOver(
  phase_countdowns,
  round,
  previously,
  teams,
  left_alive,
  right_alive
) {
  //console.log(teams.left.side);
  // Проверяем, что teams определен
  if (!teams || !teams.left || !teams.right) {
    //console.log("Teams object is undefined or incomplete");
    return;
  }

  // Всегда сбрасываем бомбу при завершении раунда
  resetBomb();

  if (phase_countdowns) {
    $("#round_timer_text").css("color", COLOR_GRAY);
    //#region Which Team Won
    if (round.win_team == "CT") {
      if (teams.left.side == "ct") {
        //console.log(teams.left.side);
        showAlertSlide("#left_team", COLOR_NEW_CT, "WINS THE ROUND");
      } else {
        showAlertSlide("#right_team", COLOR_NEW_CT, "WINS THE ROUND");
      }
    } else if (round.win_team == "T") {
      if (teams.left.side == "t") {
        // * T alert on Left
        showAlertSlide("#left_team", COLOR_NEW_T, "WINS THE ROUND");
        if (checkPrev(previously, "defuse")) {
          $("#right_team #alert").css("opacity", 0).removeClass();
        }
      } else {
        // * T alert on Right
        showAlertSlide("#right_team", COLOR_NEW_T, "WINS THE ROUND");
        if (checkPrev(previously, "defuse")) {
          $("#left_team #alert").css("opacity", 0).removeClass();
        }
      }
    }
    //#endregion
    resetBomb();
    if (round.bomb == null) {
      if (round.win_team == "T") {
        if (checkPrev(previously, "live") || checkPrev(previously, "bomb")) {
          if ($("#round_timer_text").hasClass("animated"))
            $("#round_timer_text").removeClass("animated");
          if ($("#round_timer_text").hasClass("flash"))
            $("#round_timer_text").removeClass("flash");
          animateRoundTimer("players_eliminated_T", false);
        }
      } else if (round.win_team == "CT") {
        // var t_alive = checkAliveTerrorists(team_t.players);
        var t_alive = checkAliveTerrorists(
          teams.left.side == "T" ? teams.left.players : teams.right.players
        );
        if (checkPrev(previously, "live"))
          if (t_alive) {
            // * CT RUN OUT THE CLOCK
            if (!$("#round_timer_text").hasClass("players_eliminated_CT")) {
              if ($("#round_timer_text").hasClass("animated"))
                $("#round_timer_text").removeClass("animated");
              if ($("#round_timer_text").hasClass("flash"))
                $("#round_timer_text").removeClass("flash");
              animateRoundTimer("round_time_reached", false);
            }
          } else if (!t_alive) {
            // * CT ELIMINATE T
            animateRoundTimer("players_eliminated_CT", false);
          }
      }
    } else if (round.bomb == "planted") {
      if (checkPrev(previously, "live"))
        animateRoundTimer("players_eliminated_T", false);
      if (checkPrev(previously, "defuse")) {
        if ($("#round_timer_text").hasClass("animated"))
          $("#round_timer_text").removeClass("animated");
        if ($("#round_timer_text").hasClass("flash"))
          $("#round_timer_text").removeClass("flash");
        animateRoundTimer("players_eliminated_T", false);
      }
    } else if (round.bomb == "exploded") {
      if (checkPrev(previously, "bomb")) {
        if ($("#round_timer_text").hasClass("animated"))
          $("#round_timer_text").removeClass("animated");
        if ($("#round_timer_text").hasClass("flash"))
          $("#round_timer_text").removeClass("flash");
        animateRoundTimer("bomb_exploded", true);
        $("#round_timer_text")
          .css("animation-duration", "0.25s")
          .css("animation-iteration-count", "1");
      }
    } else if (round.bomb == "defused") {
      if (checkPrev(previously, "defuse")) {
        let _side = teams.left.side == "ct" ? "#left_team" : "#right_team";
        animateElement(_side + " #alert #alert_text", "flash", function () {
          $(_side + " #alert #alert_text").removeClass("animated flash");
        });
        animateRoundTimer("bomb_defused", true);
        $("#timers #defuse_bar").css("opacity", 0);
        $("#left_team #bomb_defuse #icon").css("opacity", 0);
        $("#left_team #bomb_defuse #kit_bar").css("opacity", 0);
        $("#right_team #bomb_defuse #icon").css("opacity", 0);
        $("#right_team #bomb_defuse #kit_bar").css("opacity", 0);
      }
    }
  }
  // Дополнительный сброс таймера бомбы в конце функции
  $("#timers #bomb_bar").css("opacity", 0);
  $("#timers #defuse_bar").css("opacity", 0);
}

function updateStatePlanted(phase, round, previously, teams) {
  if (phase) {
    if (round.bomb == "planted") {
      if (checkPrev(previously, "live")) {
        $("#players_left #box_utility").slideDown(500);
        $("#players_right #box_utility").slideDown(500);
      }
      if (checkPrev(previously, "defuse")) {
        // Fake Defuse or killed
        let defuse_side =
          teams.left.side == "ct" ? "#left_team" : "#right_team";
        hideAlertSlide(defuse_side);
      }
      if (phase.phase_ends_in <= 35) {
        $("#players_left #box_utility").slideUp(500);
        $("#players_right #box_utility").slideUp(500);
      }
      if (checkPrev(previously, "live")) {
        let side = teams.left.side == "T" ? "#left_team" : "#right_team";
        hideAlertSlide(side);
        if ($("#round_timer_text").hasClass("animated"))
          $("#round_timer_text").removeClass("animated");
        if ($("#round_timer_text").hasClass("flash"))
          $("#round_timer_text").removeClass("flash");
        animateRoundTimer("bomb_active", false);

        // После анимации таймера скрываем текст с часами
        $("#round_timer_text").text(""); // Очищаем текст таймера

        showMiddleAlert(COLOR_NEW_T, COLOR_NEW_T, "BOMB PLANTED", COLOR_NEW_T);
        var wait = setTimeout(function () {
          $("#alert_middle")
            .css("opacity", 0)
            .removeClass("animated fadeOutDown");
        }, 5000);
      }
      /*if (phase.phase_ends_in <= 2) {
        $("#round_timer_text")
          .css("animation-duration", "0.5s")
          .css("animation-iteration-count", "infinite");
      } else if (phase.phase_ends_in <= 5) {
        $("#round_timer_text")
          .css("animation-duration", "1s")
          .css("animation-iteration-count", "infinite");
      } else if (phase.phase_ends_in <= 10) {
        $("#round_timer_text")
          .addClass("animated flash")
          .css("animation-duration", "2s")
          .css("animation-iteration-count", "infinite");
      }*/
      bomb(parseFloat(phase.phase_ends_in));
      $("#timers #defuse_bar").css("opacity", 0);
      $("#left_team #bomb_defuse #icon").css("opacity", 0);
      $("#left_team #bomb_defuse #kit_bar").css("opacity", 0);
      $("#right_team #bomb_defuse #icon").css("opacity", 0);
      $("#right_team #bomb_defuse #kit_bar").css("opacity", 0);
    }
  }
}

function updateStateDefuse(phase, bomb, players, teams) {
  if (phase) {
    if (phase.phase == "defuse") {
      let side = teams.left.side == "T" ? "#left_team" : "#right_team";
      if (!isDefusing) {
        // * Checks for Kit ONCE
        if (parseFloat(phase.phase_ends_in) > 5) {
          defuse_seconds = 10;
          divider = 1;
          hasKit = false;
        } else {
          defuse_seconds = 5;
          divider = 2;
          hasKit = true;
        }
        isDefusing = true;
      }
      var defuse_timer_css = {
        opacity: 1,
        width:
          (25 / divider) * (parseFloat(phase.phase_ends_in) / defuse_seconds) +
          "%",
      };
      let defusing_side =
        teams.left.side == "ct" ? "#left_team" : "#right_team";
      $(defusing_side + " #bomb_defuse #icon").css("opacity", hasKit ? 1 : 0);
      $(defusing_side + " #bomb_defuse #kit_bar")
        .css("background-color", COLOR_NEW_CT)
        .css("opacity", hasKit ? 1 : 0);
      $("#timers #defuse_bar").css(defuse_timer_css);

      if (bomb != null) {
        if (bomb.state == "defusing") {
          let player_steamid = bomb.player;
          let defuserName = "Unknown Player"; // Имя по умолчанию

          // Получаем доступ к глобальной переменной allplayers
          const allplayers = window.allplayers;

          // Проверяем, есть ли игрок в глобальном объекте allplayers
          if (allplayers && player_steamid && allplayers[player_steamid]) {
            defuserName = allplayers[player_steamid].name || defuserName;
          }
          // Если не нашли в allplayers, ищем в переданных players
          else if (players) {
            // Если players - объект с игроками по steamid
            if (typeof players === "object" && !Array.isArray(players)) {
              if (player_steamid && players[player_steamid]) {
                defuserName = players[player_steamid].name || defuserName;
              }
            }
            // Если players - массив игроков
            else if (Array.isArray(players)) {
              for (let i = 0; i < players.length; i++) {
                const _player = players[i];
                if (
                  _player &&
                  (_player.steamid === player_steamid ||
                    _player.observer_slot === bomb.player)
                ) {
                  defuserName = _player.name || defuserName;
                  break;
                }
              }
            }
          }

          // Выводим сообщение о разминировании
          //console.log(`Defuser found: ${defuserName}, steamid: ${player_steamid}`);
          showAlertSlide(
            defusing_side,
            COLOR_NEW_CT,
            defuserName + " is defusing the bomb"
          );
        }
      }
    }
  }
}

function updateStateLive(phase, bomb, players, previously, teams) {
  if (phase) {
    removeRoundTimeGraphics();
    forceRemoveAlerts();
    resetBomb(teams);
    hidePlayerStats(phase, previously);
    if (checkPrev(previously, "freezetime")) {
      $("#players_left #box_monetary").slideUp(500);
      $("#players_right #box_monetary").slideUp(500);
    }
    if (phase.phase_ends_in <= 109.9) {
      $("#players_left #box_utility").slideUp(500);
      $("#players_right #box_utility").slideUp(500);
    }
    /*if (phase.phase_ends_in <= 5) {
          $("#round_timer_text")
              .addClass("animated flash")
              .css("animation-duration", "2s")
              .css("animation-iteration-count", "infinite");
      }*/
    $("#round_timer_text").css(
      "color",
      phase.phase_ends_in <= 10 ? COLOR_RED : COLOR_WHITE
    );
    if (phase.phase_ends_in) {
      var clock_time = Math.abs(Math.ceil(phase.phase_ends_in));
      var count_minute = Math.floor(clock_time / 60);
      var count_seconds = clock_time - count_minute * 60;
      if (count_seconds < 10) {
        count_seconds = "0" + count_seconds;
      }
      $("#round_timer_text").text(count_minute + ":" + count_seconds);
    }
    if (bomb != null) {
      if (bomb.state == "planting") {
        let side = teams.left.side == "T" ? "#left_team" : "#right_team";
        let player_steamid = bomb.player;

        // Поиск игрока в тех, что уже переданы в функцию players (должны быть все steamID)
        let planter = null;
        for (let steamid in players) {
          if (steamid === player_steamid) {
            planter = players[steamid];
            break;
          }
        }

        if (planter) {
          showAlertSlide(
            side,
            COLOR_NEW_T,
            planter.name + " is planting the bomb"
          );
        } else {
          showAlertSlide(side, COLOR_NEW_T, "Bomb is being planted");
        }
      }
    }
  }
}

function updateStatePaused(phase, type, previously, map) {
  removeRoundTimeGraphics();
  resetBomb();
  $("#players_left #box_utility").slideDown(500);
  $("#players_right #box_utility").slideDown(500);
  $("#alert_middle").removeClass();

  // Извлекаем названия команд и количество оставшихся таймаутов из объекта map
  let leftTeamName = map.team_ct.name
    ? map.team_ct.name.toUpperCase()
    : "UNKNOWN";
  let rightTeamName = map.team_t.name
    ? map.team_t.name.toUpperCase()
    : "UNKNOWN";
  let leftTimeoutsRemaining = map.team_ct.timeouts_remaining;
  let rightTimeoutsRemaining = map.team_t.timeouts_remaining;

  if (type == "paused") {
    if (
      checkPrev(previously, "freezetime") ||
      checkPrev(previously, "live") ||
      checkPrev(previously, "defuse") ||
      checkPrev(previously, "bomb")
    )
      animateRoundTimer("pause_active", false);
    $("#alert_middle #pole_1_middle").css(
      "background-color",
      map.team_ct.side == "ct" ? COLOR_WHITE : COLOR_WHITE
    );
    $("#alert_middle #pole_2_middle").css(
      "background-color",
      map.team_t.side == "ct" ? COLOR_WHITE : COLOR_WHITE
    );
    $("#alert_middle #alert_text_middle")
      .text("MATCH PAUSED")
      .css("color", COLOR_WHITE);
  } else if (type == "timeout_t") {
    if (phase.phase_ends_in) {
      var clock_time = Math.abs(Math.ceil(phase.phase_ends_in));
      var count_minute = Math.floor(clock_time / 60);
      var count_seconds = clock_time - count_minute * 60;
      if (count_seconds < 10) {
        count_seconds = "0" + count_seconds;
      }
      $("#round_timer_text")
        .text(count_minute + ":" + count_seconds)
        .css("color", COLOR_NEW_T);
    }
    $("#alert_middle #pole_1_middle").css("background-color", COLOR_NEW_T);
    $("#alert_middle #pole_2_middle").css("background-color", COLOR_NEW_T);
    $("#alert_middle #alert_text_middle")
      .text(
        // Всегда показываем название команды T, независимо от стороны
        map.team_t.name
          ? map.team_t.name.toUpperCase() + " TIMEOUT"
          : "T TIMEOUT"
      )
      .css("color", COLOR_NEW_T);
    showAlertSlide(
      "#left_team",
      map.team_t.side == "t" ? COLOR_WHITE : COLOR_WHITE,
      "Timeouts Remaining: " + leftTimeoutsRemaining
    );
    showAlertSlide(
      "#right_team",
      map.team_t.side == "t" ? COLOR_WHITE : COLOR_WHITE,
      "Timeouts Remaining: " + rightTimeoutsRemaining
    );
  } else if (type == "timeout_ct") {
    if (phase.phase_ends_in) {
      var clock_time = Math.abs(Math.ceil(phase.phase_ends_in));
      var count_minute = Math.floor(clock_time / 60);
      var count_seconds = clock_time - count_minute * 60;
      if (count_seconds < 10) {
        count_seconds = "0" + count_seconds;
      }
      $("#round_timer_text")
        .text(count_minute + ":" + count_seconds)
        .css("color", COLOR_NEW_CT);
    }
    $("#alert_middle #pole_1_middle").css("background-color", COLOR_NEW_CT);
    $("#alert_middle #pole_2_middle").css("background-color", COLOR_NEW_CT);
    $("#alert_middle #alert_text_middle")
      .text(
        // Всегда показываем название команды CT, независимо от стороны
        map.team_ct.name
          ? map.team_ct.name.toUpperCase() + " TIMEOUT"
          : "CT TIMEOUT"
      )
      .css("color", COLOR_NEW_CT);
    showAlertSlide(
      "#left_team",
      map.team_ct.side == "ct" ? COLOR_WHITE : COLOR_WHITE,
      "Timeouts Remaining: " + leftTimeoutsRemaining
    );
    showAlertSlide(
      "#right_team",
      map.team_ct.side == "ct" ? COLOR_WHITE : COLOR_WHITE,
      "Timeouts Remaining: " + rightTimeoutsRemaining
    );
  }

  $("#alert_middle").css("opacity", 1).addClass("animated fadeInUp");
}

function fillObserved(player) {
  let stats = player.state;
  let weapons = player.weapons;
  team_color = player.team == "CT" ? COLOR_NEW_CT : COLOR_NEW_T;

  // Пример заполнения данных игрока
  $("#player_name").text(player.name);
  $("#player_team").text(player.team);
  $("#player_health").text(player.state.health);
  $("#player_armor").text(player.state.armor);
  $("#player_money").text(player.state.money);
  //#region Poles
  $("#obs_lane3_left_pole").css("background-color", team_color);
  $("#obs_lane3_right_pole").css("background-color", team_color);
  //#endregion

  $("#obs_alias_text").text(player.name);
  $("#obs_alias_text").css("color", team_color);
  if (player.real_name && player.real_name != player.name) {
    $("#obs_realname_text").text(player.real_name);
  } else {
    $("#obs_realname_text").text("");
  }

  // Проверка наличия аватара
  if (player.avatar) {
    $("#obs_img").attr("src", "/uploads/" + player.avatar);
  } else {
    // Используем дефолтный логотип команды
    const defaultLogo =
      player.team === "CT"
        ? "/images/logo_ct_default.png"
        : "/images/logo_t_default.png";
    $("#obs_img").attr("src", defaultLogo);
  }

  $("#obs_health_text").text(stats.health);
  $("#obs_health_img").removeClass();
  if (stats.health <= 20) {
    $("#obs_health_img").addClass("health_" + player.team);
    $("#obs_health_text").css("color", COLOR_RED);
  } else if (stats.health > 20) {
    $("#obs_health_img").addClass("health_full_" + player.team);
    $("#obs_health_text").css("color", COLOR_WHITE);
  }

  $("#obs_armor_text").text(stats.armor);
  $("#obs_armor_img").removeClass();
  if (stats.helmet) {
    if (stats.armor == 0) {
      $("#obs_armor_img").addClass("armor_none_" + player.team);
    } else if (stats.armor <= 30) {
      $("#obs_armor_img").addClass("armor_half_helm_" + player.team);
    } else if (stats.armor <= 100) {
      $("#obs_armor_img").addClass("armor_helm_" + player.team);
    }
  } else {
    if (stats.armor == 0) {
      $("#obs_armor_img").addClass("armor_none_" + player.team);
    } else if (stats.armor <= 30) {
      $("#obs_armor_img").addClass("armor_half_" + player.team);
    } else if (stats.armor <= 100) {
      $("#obs_armor_img").addClass("armor_kev_" + player.team);
    }
  }

  $("#obs_kills_k").css("color", team_color);
  $("#obs_kills_text").text(player.match_stats ? player.match_stats.kills : 0);
  $("#obs_assists_a").css("color", team_color);
  $("#obs_assists_text").text(
    player.match_stats ? player.match_stats.assists : 0
  );
  $("#obs_deaths_d").css("color", team_color);
  $("#obs_deaths_text").text(
    player.match_stats ? player.match_stats.deaths : 0
  );

  $("#obs_reserve").css("color", team_color);

  $("#obs_nade1").removeClass();
  $("#obs_nade2").removeClass();
  $("#obs_nade3").removeClass();
  $("#obs_nade4").removeClass();
  $("#obs_bomb_kit").removeClass();
  $("#obs_bullets_section").removeClass();
  $("#obs_bullets_section").addClass("bullets_" + player.team);

  let grenades_list = [];
  for (let key in weapons) {
    let weapon = weapons[key];
    if (weapon.type == "Grenade") {
      for (let x = 0; x < weapon.ammo_reserve; x++) {
        grenades_list.push(weapon.name);
      }
    }
    if (weapon.type == "C4") {
      $("#obs_bomb_kit").addClass("obs_bomb");
    }
    if (weapon.state == "active" || weapon.state == "reloading") {
      if (
        weapon.type == "Grenade" ||
        weapon.type == "C4" ||
        weapon.type == "Knife" ||
        stats.health == 0
      ) {
        $("#obs_clip").css("color", COLOR_WHITE);
        $("#obs_clip").text("-");
        $("#obs_reserve").text("/-");
      } else {
        $("#obs_clip").text(weapon.ammo_clip);
        if (weapon.ammo_clip <= 3) {
          $("#obs_clip").css("color", COLOR_RED);
        } else {
          $("#obs_clip").css("color", COLOR_WHITE);
        }
        $("#obs_reserve").text("/" + weapon.ammo_reserve);
      }
    }
  }
  for (let x = 0; x < grenades_list.length; x++) {
    $("#obs_nade" + (x + 1)).addClass("nade_" + grenades_list[x].substr(7));
  }

  if (player.state.defusekit) {
    $("#obs_bomb_kit").addClass("obs_kit");
  }

  skull_color = player.team == "CT" ? "CT" : "T";
  $("#obs_round_kills #obs_skull").removeClass();
  if (stats.round_kills > 0) {
    $("#obs_round_kills #obs_skull").addClass("obs_skull_" + skull_color);
    $("#obs_round_kills #obs_round_kills_text").text(stats.round_kills);
  } else {
    $("#obs_round_kills #obs_round_kills_text").text("");
  }
}

function updatePlayers(
  allplayers,
  players,
  observed,
  phase,
  previously,
  teams,
  teams_players,
  map
) {
  // Проверяем, что map определен
  if (!map) {
    console.log("Map is undefined in updatePlayers");
  } else {
    console.log(
      `Map data in updatePlayers: CT logo: ${map.team_ct?.logo}, T logo: ${map.team_t?.logo}`
    );
  }

  if (teams_players) {
    fillPlayers(
      allplayers,
      teams,
      teams_players,
      observed,
      phase,
      previously,
      map
    );
  }
}

function fillPlayers(
  allplayers,
  teams,
  teams_players,
  observed,
  phase,
  previously,
  map
) {
  // Проверяем, что map определен
  if (!map) {
    console.log("Map is undefined in fillPlayers");
  } else {
    console.log(
      `Map data in fillPlayers: CT logo: ${map.team_ct?.logo}, T logo: ${map.team_t?.logo}`
    );
  }

  if (teams_players?.left?.players) {
    for (var i = 0; i < 5; i++) {
      if (i >= teams_players.left.players.length) {
        $("#players_left #player_section")
          .find("#player" + (i + 1))
          .css("opacity", "0");
      } else {
        const player = teams_players.left.players[i];
        if (player) {
          // Проверяем, что игрок существует
          fillPlayer(
            allplayers,
            teams,
            player,
            i,
            "players_left",
            observed,
            phase,
            previously,
            map // Убедитесь, что map передается здесь
          );
          $("#players_left #player_section")
            .find("#player" + (i + 1))
            .css("opacity", "1");
        }
      }
    }
  }

  if (teams_players?.right?.players) {
    for (var i = 0; i < 5; i++) {
      if (i >= teams_players.right.players.length) {
        $("#players_right #player_section")
          .find("#player" + (i + 1))
          .css("opacity", "0");
      } else {
        const player = teams_players.right.players[i];
        if (player) {
          // Проверяем, что игрок существует
          fillPlayer(
            allplayers,
            teams,
            player,
            i,
            "players_right",
            observed,
            phase,
            previously,
            map // Добавляем параметр map для правой команды
          );
          $("#players_right #player_section")
            .find("#player" + (i + 1))
            .css("opacity", "1");
        }
      }
    }
  }
}

// В начале файла добавьте:
let disp_player_avatars = true; // установите true для отображения аватаров

function fillPlayer(
  allplayers,
  teams,
  player,
  nr,
  side,
  observed,
  phase,
  previously,
  map
) {
  console.log("fillPlayer", player);
  // Проверяем, что player существует
  if (!player) {
    //console.log("Player is undefined");
    return;
  }

  // Проверяем, что map определен
  if (!map) {
    console.log(`Map is undefined for player ${player.name} on side ${side}`);
  }

  // Получаем данные игрока с проверками на undefined
  let slot = player.observer_slot || 0;
  let stats = player.state || {}; // Если state не определен, используем пустой объект
  let match_stats = player.match_stats || {};
  let weapons = player.weapons || {};
  let steamid = player.steamid;
  let team = player.team;
  let obs_slot = observed?.observer_slot;

  // Проверяем наличие необходимых данных
  if (!stats || typeof stats.health === "undefined") {
    //console.log("Player stats or health is undefined", player);
    return;
  }

  let dead = stats.health == 0;
  let health_color =
    stats.health <= 20 ? COLOR_RED : team == "CT" ? COLOR_NEW_CT : COLOR_NEW_T;
  let alt_health_color =
    stats.health <= 20 ? COLOR_RED : team == "CT" ? COLOR_NEW_CT : COLOR_NEW_T;

  let side_color = team == "CT" ? COLOR_NEW_CT : COLOR_NEW_T;

  let $player = $("#" + side).find("#player" + (nr + 1));

  // Обновляем номер слота игрока
  // Используем ту же логику, что и в функции formatObserverSlot
  if (slot === 9) {
    $player.find(".player_slot_number").text("0");
  } else if (slot === 10) {
    $player.find(".player_slot_number").text("11");
  } else if (slot === 11) {
    $player.find(".player_slot_number").text("12");
  } else {
    $player.find(".player_slot_number").text(slot + 1);
  }

  $player
    .find(".player_slot_number")
    .css("background-color", dead ? COLOR_MAIN_PANEL : side_color);

  let $top = $player.find(".player_section_top");
  let $bottom = $player.find(".player_section_bottom");

  // Устанавливаем стиль для имени игрока (в player_section_bottom)
  $bottom
    .find("#player_alias_text")
    .css("color", dead ? COLOR_WHITE_HALF : COLOR_WHITE);

  // Устанавливаем имя игрока
  $bottom.find("#player_alias_text").text(player.name);

  $player.find("#player_image").removeClass("dead");
  if (disp_player_avatars) {
    if (player.hasOwnProperty("avatar") && player.avatar) {
      // Если у игрока есть аватарка, используем её
      $player
        .find("#player_image")
        .attr("src", "/uploads/" + player.avatar)
        .addClass(dead ? "dead" : "");
    } else {
      // Если у игрока нет аватарки, используем логотип команды
      let _img = "";

      // Логируем информацию для отладки
      console.log(
        `Player ${player.name} (team: ${team}) has no avatar, trying to use team logo`
      );

      // Проверяем наличие данных о командах и их логотипах
      if (map && map.team_ct && map.team_t) {
        // Логируем информацию о логотипах команд
        console.log(
          `Team logos available - CT: ${map.team_ct.logo}, T: ${map.team_t.logo}`
        );

        if (team === "CT" && map.team_ct.logo) {
          // Для CT команды используем её логотип
          _img = "/uploads/" + map.team_ct.logo;
          console.log(`Using CT team logo: ${_img} for player ${player.name}`);
        } else if (team === "T" && map.team_t.logo) {
          // Для T команды используем её логотип
          _img = "/uploads/" + map.team_t.logo;
          console.log(`Using T team logo: ${_img} for player ${player.name}`);
        }
      } else {
        console.log(
          `No team logos available or map data incomplete for player ${player.name}`
        );
      }

      // Если логотип команды не найден или путь некорректный, используем дефолтный логотип
      if (
        !_img ||
        _img === "/uploads/" ||
        _img.includes("undefined") ||
        _img.includes("null")
      ) {
        _img =
          team === "CT"
            ? "/images/logo_ct_default.png"
            : "/images/logo_t_default.png";
      }

      // Устанавливаем изображение и добавляем класс dead, если игрок мертв
      $player.find("#player_image").attr("src", _img).toggleClass("dead", dead);
    }
  }

  // Устанавливаем K/D в элементы player_stat
  $bottom.find("#stat_kills #player_stat_kills_text").text(match_stats.kills);
  $bottom
    .find("#stat_deaths #player_stat_deaths_text")
    .text(match_stats.deaths);

  // Устанавливаем значения для мертвых игроков
  $player.find("#player_dead_kills_text").text(match_stats.kills);
  $player.find("#player_dead_assists_text").text(match_stats.assists);
  $player.find("#player_dead_deaths_text").text(match_stats.deaths);

  if (dead) {
    $bottom.find("#player_bomb_kit_image").css("opacity", 0);
    $bottom.find("#player_armor_image").css("opacity", 0);
    $top.find("#player_health_text").css("opacity", 0);
    $player.find(".player_dead").css("opacity", 1);

    // Добавляем класс dead к черепу
    $player.find("#player_skull").addClass("dead");

    if (side.substr(8) == "left") {
      $bottom.find("#player_alias_text").css("left", "0px");
      $player.find("#player_current_money_text").css("left", "1px");
      $player.find("#player_skull").css("left", "0px");
      $player.find("#player_round_kills_text").css("left", "20px");
    } else if (side.substr(8) == "right") {
      $bottom.find("#player_alias_text").css("right", "0px");
      $player.find("#player_current_money_text").css("left", "7px");
      $player.find("#player_skull").css("right", "0px");
      $player.find("#player_round_kills_text").css("right", "40px");
    }
  } else {
    $bottom.find("#player_bomb_kit_image").css("opacity", 1);
    $bottom.find("#player_armor_image").css("opacity", 1);
    $top.find("#player_health_text").css("opacity", 1);
    $player.find(".player_dead").css("opacity", 0);

    // Удаляем класс dead у черепа
    $player.find("#player_skull").removeClass("dead");

    if (side.substr(8) == "left") {
      $bottom.find("#player_alias_text").css("left", "0px");
      $player.find("#player_current_money_text").css("left", "1px");
      $player.find("#player_skull").css("left", "0px");
      $player.find("#player_round_kills_text").css("left", "20px");
    } else if (side.substr(8) == "right") {
      $bottom.find("#player_alias_text").css("right", "0px");
      $player.find("#player_current_money_text").css("left", "7px");
      $player.find("#player_skull").css("right", "0px");
      $player.find("#player_round_kills_text").css("right", "40px");
    }
  }

  if (stats.burning > 0 && !dead) {
    $player.find(".burning").css("display", "block");
    $player.find("#burning_level").addClass("burnt");
    $player.find("#burning_level").css("opacity", stats.burning / 255);
  } else {
    $player.find("#burning_level").removeClass("burnt");
    $player.find(".burning").css("display", "none");
  }

  if (stats.flashed > 0 && !dead) {
    $player.find(".flashed").css("display", "block");
    $player.find("#flashed_level").removeClass("blind");
    $player.find("#flashed_level").css("opacity", stats.flashed / 255);
  } else {
    $player.find("#flashed_level").removeClass("blind");
    $player.find(".flashed").css("display", "none");
  }

  if (slot == obs_slot) {
    $player
      .find("#player_spec_bar")
      .css("background-color", side_color)
      .css("opacity", 1);
  } else {
    $player.find("#player_spec_bar").css("opacity", 0);
  }

  // let desired = "linear-gradient(to " + side.substr(8) + ", " + health_color + ", " + alt_health_color + ")";
  // ! gradient_double works in browser but not on the overlay
  // let gradient_double = "linear-gradient(to " + side.substr(8) + ", rgba(0,0,0,0) " + (100 - stats.health) + "%, " + health_color + "0% " + (50 - stats.health) + "%" + ", " + alt_health_color + " 100%)";
  // ! gradient_single works in browser and on the overlay
  let gradient_single =
    "linear-gradient(to " +
    side.substr(8) +
    ", rgba(0,0,0,0) " +
    (100 - stats.health) +
    "%, " +
    alt_health_color +
    " " +
    (100 - stats.health) +
    "%)";

  $top.find(".player_health_bar").css("background", gradient_single);
  $top.find("#player_health_text").text(stats.health);

  let armor_icon = $bottom.find("#player_armor_image");
  armor_icon.removeClass();
  if (stats.helmet) {
    if (stats.armor == 0) {
      // armor_icon.addClass("armor_none_default");
    } else if (stats.armor <= 50) {
      armor_icon.addClass("armor_half_helm_default");
    } else if (stats.armor <= 100) {
      armor_icon.addClass("armor_helm_default");
    }
  } else {
    if (stats.armor == 0) {
      // armor_icon.addClass("armor_none_default");
    } else if (stats.armor <= 50) {
      armor_icon.addClass("armor_half_default");
    } else if (stats.armor <= 100) {
      armor_icon.addClass("armor_kev_default");
    }
  }

  $bottom.find("#player_bomb_kit_image").removeClass();
  if (player.state.defusekit) {
    $bottom.find("#player_bomb_kit_image").addClass("player_kit");
  }

  $bottom
    .find("#player_current_money_text")
    .css("color", dead ? COLOR_WHITE_HALF : "#a7d32e");
  $bottom.find("#player_current_money_text").text("$" + stats.money);
  if (!start_money[steamid]) {
    start_money[steamid] = stats.money;
  }

  // Вычисляем потраченную сумму
  const spent = start_money[steamid] - stats.money;

  // Отображаем потраченную сумму с правильным знаком
  if (spent > 0) {
    // Если потрачено больше, чем было, показываем со знаком минус
    $bottom.find("#player_spent_text").text("-$" + spent);
  } else if (spent < 0) {
    // Если денег стало больше (например, после убийства), показываем со знаком плюс
    $bottom.find("#player_spent_text").text("+$" + Math.abs(spent));
  } else {
    // Если сумма не изменилась
    $bottom.find("#player_spent_text").text("$0");
  }

  // Сначала очищаем все классы и устанавливаем текст
  $bottom.find("#player_skull").removeClass();
  $bottom.find("#player_round_kills_text").text("");

  // Добавляем класс dead к черепу, если игрок мертв
  if (dead) {
    $bottom.find("#player_skull").addClass("dead");
  }

  // Затем добавляем класс obs_skull_CT или obs_skull_T, если есть убийства
  if (stats.round_kills > 0) {
    // Используем правильный класс для черепа в зависимости от команды
    const skull_color = team == "CT" ? "CT" : "T";
    $bottom.find("#player_skull").addClass("obs_skull_" + skull_color);
    $bottom.find("#player_round_kills_text").text(stats.round_kills);
  }

  $top.find("#player_weapon_primary_img").attr("src", "").removeClass();
  $bottom.find("#player_weapon_secondary_img").attr("src", "").removeClass();

  $bottom.find("#player_nade1").removeClass();
  $bottom.find("#player_nade2").removeClass();
  $bottom.find("#player_nade3").removeClass();
  $bottom.find("#player_nade4").removeClass();
  let grenades = [];
  for (let key in weapons) {
    let weapon = weapons[key];
    let name = weapon.name.replace("weapon_", "");
    let state = weapon.state;
    let view = "";
    let type = weapon.type;
    if (type != "C4" && type != "Knife") {
      view += state == "active" ? "checked" : "holstered";
      if (type == "Grenade") {
        for (let x = 0; x < weapon.ammo_reserve; x++) {
          let nade = {
            weapon: weapon.name.substr(7),
            state: view,
          };
          grenades.push(nade);
        }
      } else if (type) {
        view += side.substr(8) == "right" ? " img-hor" : "";
        if (type == "Pistol") {
          $bottom
            .find("#player_weapon_secondary_img")
            .attr("src", "/files/img/weapons/" + name + ".png")
            .addClass("invert")
            .addClass(view);
        } else {
          $top
            .find("#player_weapon_primary_img")
            .attr("src", "/files/img/weapons/" + name + ".png")
            .addClass("invert")
            .addClass(view);
        }
      }
    }
    if (type == "C4") {
      view = weapon.state == "active" ? "player_bomb_selected" : "player_bomb";
      $bottom.find("#player_bomb_kit_image").addClass(view);
    }
    if (!checkGuns(weapons)) {
      view += side.substr(8) == "right" ? " img-hor" : "";
      $top
        .find("#player_weapon_primary_img")
        .attr("src", "/files/img/weapons/" + name + ".png")
        .addClass("invert")
        .addClass(view);
    }
  }

  if (team == "CT") {
    if (teams.left.side == "CT") {
      grenades = grenades.reverse();
    }
  } else if (team == "T") {
    if (teams.left.side == "T") {
      grenades = grenades.reverse();
    }
  }

  for (let x = 0; x < grenades.length; x++) {
    $bottom
      .find("#player_nade" + (x + 1))
      .addClass("player_nade_" + grenades[x].weapon);
    $bottom.find("#player_nade" + (x + 1)).addClass(grenades[x].state);
  }
}

function updatePlayerNames(allplayers) {
  if (!allplayers) return;

  Object.values(allplayers).forEach((player) => {
    const slot = player.observer_slot;
    const playerName = player.name;
    const team = player.team?.toLowerCase();

    if (!team) return; // Пропускаем, если команда не определена

    // Определяем сторону и номер игрока
    const side = team === "ct" ? "left" : "right";
    let playerNumber;

    if (side === "left") {
      playerNumber = slot + 1;
    } else {
      // Используем ту же логику, что и в функции updatePlayerElement
      if (slot === 9) {
        playerNumber = 5; // T: 9->5 (отображается как 0)
      } else if (slot >= 5 && slot < 9) {
        playerNumber = slot - 4; // T: 5->1, 6->2, 7->3, 8->4
      } else if (slot === 10) {
        playerNumber = 6; // T: 10->6
      } else if (slot === 11) {
        playerNumber = 7; // T: 11->7
      } else {
        playerNumber = slot - 4;
      }
    }

    // Находим контейнер игрока по номеру
    const playerContainer = $(`#team_${side} #player${playerNumber}`);

    if (playerContainer.length) {
      // Устанавливаем имя игрока в player_section_bottom, а не в player_section_top
      playerContainer
        .find(".player_section_bottom #player_alias_text")
        .text(playerName);
    }
  });
}

function removeRoundTimeGraphics() {
  $("#round_timer_text").removeClass("animated");
  $("#round_timer_text").removeClass("flash");
  $("#round_timer_text").removeClass("bomb_timer");
  $("#round_timer_text").removeClass("bomb_timer_below_10");
  $("#round_timer_text").removeClass("bomb_timer_below_5");
  $("#round_timer_text").removeClass("players_eliminated_T");
  $("#round_timer_text").removeClass("players_eliminated_CT");
  $("#round_timer_text").removeClass("round_time_reached");
  $("#round_timer_text").removeClass("round_warmup");

  // Добавляем удаление классов bomb_active и bomb_defused
  $("#round_timer_text").removeClass("bomb_active");
  $("#round_timer_text").removeClass("bomb_defused");
  $("#round_timer_text").removeClass("bomb_exploded");

  // Добавляем удаление классов для паузы
  $("#round_timer_text").removeClass("pause_active");
  $("#round_timer_text").removeClass("pause_active_T");
  $("#round_timer_text").removeClass("pause_active_CT");
}

function bomb(time) {
  if (Math.pow(time - bomb_time, 2) > 1) {
    clearInterval(bomb_timer);
    bomb_time = parseFloat(time);
    if (bomb_time > 0) {
      bomb_timer = setInterval(function () {
        bomb_timer_css = {
          opacity: 1,
          width: (bomb_time * 100) / 40 + "%",
        };
        $("#timers #bomb_bar").css(bomb_timer_css);
        bomb_time = bomb_time - 0.01;
      }, 10);
    } else {
      clearInterval(bomb_timer);
    }
  }
}

function resetBomb(teams) {
  // Останавливаем таймер бомбы
  clearInterval(bomb_timer);

  // Сбрасываем состояние разминирования
  isDefusing = false;

  // Скрываем индикаторы бомбы и разминирования
  $("#timers #bomb_bar").css("opacity", 0);
  $("#timers #defuse_bar").css("opacity", 0);

  // Удаляем классы таймера, связанные с бомбой
  $("#round_timer_text").removeClass("bomb_active");
  $("#round_timer_text").removeClass("bomb_defused");
  $("#round_timer_text").removeClass("bomb_exploded");

  // Скрываем иконки разминирования
  if (teams) {
    if (teams.left && teams.left.side == "t") {
      $("#left_team #bomb_defuse #icon").css("opacity", 0);
      $("#left_team #bomb_defuse #kit_bar").css("opacity", 0);
      $("#right_team #bomb_defuse #icon").css("opacity", 0);
      $("#right_team #bomb_defuse #kit_bar").css("opacity", 0);
    } else if (teams.right && teams.right.side == "t") {
      $("#right_team #bomb_defuse #icon").css("opacity", 0);
      $("#right_team #bomb_defuse #kit_bar").css("opacity", 0);
      $("#left_team #bomb_defuse #icon").css("opacity", 0);
      $("#left_team #bomb_defuse #kit_bar").css("opacity", 0);
    }
  } else {
    // Если teams не определено, все равно очищаем все связанные с бомбой элементы
    $("#left_team #bomb_defuse #icon").css("opacity", 0);
    $("#left_team #bomb_defuse #kit_bar").css("opacity", 0);
    $("#right_team #bomb_defuse #icon").css("opacity", 0);
    $("#right_team #bomb_defuse #kit_bar").css("opacity", 0);
  }
}

function executeAnim(element, animationNameIn, length, animationNameOut) {
  $(element).css("opacity", 1);
  $(element).addClass("animated");
  $(element).addClass(animationNameIn);
  var wait = setTimeout(function () {
    $(element).removeClass(animationNameIn);
    $(element).addClass(animationNameOut);
  }, length);
  $(element).removeClass(animationNameOut);
}

function animateElement(element, animationName, callback) {
  const node = document.querySelector(element);
  node.classList.add("animated", animationName);

  function handleAnimationEnd() {
    node.removeEventListener("animationend", handleAnimationEnd);

    if (typeof callback === "function") callback();
  }
  node.addEventListener("animationend", handleAnimationEnd);
}

function showAlert(side, color, text) {
  $(side + " #alert #pole_1").css("background-color", color);
  $(side + " #alert #pole_2").css("background-color", color);
  $(side + " #alert #alert_text")
    .text(text)
    .css("color", color);
  $(side + " #alert")
    .css("opacity", 1)
    .addClass("animated fadeInUp");
}

function showAlertSlide(side, color, text) {
  $(side + " #alert #pole_1").css("background-color", color);
  $(side + " #alert #pole_2").css("background-color", color);
  $(side + " #alert #alert_text")
    .text(text)
    .css("color", color);
  if (side == "#left_team") {
    $(side + " #alert")
      .css("opacity", 1)
      .addClass("animated fadeInRight");
  } else if (side == "#right_team") {
    $(side + " #alert")
      .css("opacity", 1)
      .addClass("animated fadeInLeft");
  }
}

function hideAlert(side) {
  let element = side + " #alert";
  $(element).removeClass("animated fadeInUp");
  animateElement(element, "fadeOutDown", function () {
    $(element).css("opacity", 0).removeClass("animated fadeOutDown");
  });
}

function hideAlertSlide(side) {
  let element = side + " #alert";
  if (side == "#left_team") {
    $(element).removeClass("animated fadeInRight");
  } else if (side == "#right_team") {
    $(element).removeClass("animated fadeInLeft");
  }
  if (side == "#left_team") {
    anim = "fadeOutRight";
  } else if (side == "#right_team") {
    anim = "fadeOutLeft";
  }
  animateElement(element, anim, function () {
    $(element)
      .css("opacity", 0)
      .removeClass("animated")
      .removeClass(side == "#left_team" ? "fadeOutRight" : "fadeOutLeft");
  });
}

function showMiddleAlert(pole_left_color, pole_right_color, text, text_color) {
  $("#alert_middle #pole_1_middle").css("background-color", pole_left_color);
  $("#alert_middle #pole_2_middle").css("background-color", pole_right_color);
  $("#alert_middle #alert_text_middle").text(text).css("color", text_color);
  executeAnim("#alert_middle", "fadeInUp", 3000, "fadeOut");
}

function forceRemoveAlerts() {
  if ($("#left_team #alert").css("opacity") == 1) {
    $("#left_team #alert").css("opacity", 0).removeClass();
  }
  if ($("#right_team #alert").css("opacity") == 1) {
    $("#right_team #alert").css("opacity", 0).removeClass();
  }
  if ($("#alert_middle").css("opacity") == 1) {
    $("#alert_middle").css("opacity", 0).removeClass();
  }
}

function animateRoundTimer(_class, remove_graphics) {
  $("#round_timer_text")
    .css("animation-duration", "0.25s")
    .css("animation-iteration-count", "1");
  animateElement("#round_timer_text", "fadeOut", function () {
    $("#round_timer_text").removeClass("animated fadeOut");
    if (remove_graphics) removeRoundTimeGraphics();

    // Очищаем текст и добавляем класс
    $("#round_timer_text").text("").addClass(_class);

    // Если это bomb_active, не показываем текст таймера
    if (_class === "bomb_active") {
      $("#round_timer_text").text("");
    }

    animateElement("#round_timer_text", "fadeIn", function () {
      $("#round_timer_text").removeClass("animated fadeIn");
    });
  });
}

function checkAliveTerrorists(players) {
  if (!players || !Array.isArray(players)) return false;
  for (i = 0; i < players.length; i++) {
    if (players[i].state.health > 0) {
      return true;
    }
  }
  return false;
}

function checkPrev(previously, state) {
  if (previously.hasOwnProperty("phase_countdowns")) {
    if (
      previously.phase_countdowns.hasOwnProperty("phase") &&
      previously.phase_countdowns.phase == state
    ) {
      return true;
    }
  }
  return false;
}

function hidePlayerStats(phase, previously) {
  if (phase.hasOwnProperty("phase")) {
    if (phase.phase == "live") {
      if (previously.hasOwnProperty("phase_countdowns")) {
        if (
          previously.phase_countdowns.phase_ends_in >= 110 &&
          phase.phase_ends_in <= 109.9
        ) {
          for (let x = 1; x <= 5; x++) {
            animateElement(
              "#players_left #player_section #player" + x + " #player_stat",
              "fadeOutLeft",
              function () {
                $("#players_left #player_section #player" + x + " #player_stat")
                  .css("opacity", 0)
                  .removeClass("animated fadeOutLeft");
              }
            );
            animateElement(
              "#players_right #player_section #player" + x + " #player_stat",
              "fadeOutRight",
              function () {
                $(
                  "#players_right #player_section #player" + x + " #player_stat"
                )
                  .css("opacity", 0)
                  .removeClass("animated fadeOutRight");
              }
            );
          }
        } else if (phase.phase_ends_in <= 109) {
          for (let x = 1; x <= 5; x++) {
            if (
              $(
                "#players_left #player_section #player" + x + " #player_stat"
              ).css("opacity") !== 0
            )
              $(
                "#players_left #player_section #player" + x + " #player_stat"
              ).css("opacity", 0);
            if (
              $(
                "#players_right #player_section #player" + x + " #player_stat"
              ).css("opacity") !== 0
            )
              $(
                "#players_right #player_section #player" + x + " #player_stat"
              ).css("opacity", 0);
          }
        }
      }
    }
  }
}

function showPlayerStats(phase) {
  if (phase.phase == "freezetime") {
    for (let x = 1; x <= 5; x++) {
      if (
        $("#players_left #player_section #player" + x + " #player_stat").css(
          "opacity"
        ) == 0
      ) {
        $("#players_left #player_section #player" + x + " #player_stat").css(
          "opacity",
          1
        );
        animateElement(
          "#players_left #player_section #player" + x + " #player_stat",
          "fadeInLeft",
          function () {
            $(
              "#players_left #player_section #player" + x + " #player_stat"
            ).removeClass("animated fadeInLeft");
          }
        );
      }
      if (
        $("#players_right #player_section #player" + x + " #player_stat").css(
          "opacity"
        ) == 0
      ) {
        $("#players_right #player_section #player" + x + " #player_stat").css(
          "opacity",
          1
        );
        animateElement(
          "#players_right #player_section #player" + x + " #player_stat",
          "fadeInRight",
          function () {
            $(
              "#players_right #player_section #player" + x + " #player_stat"
            ).removeClass("animated fadeInRight");
          }
        );
      }
    }
  }
}

function checkGuns(weapons) {
  for (let key in weapons) {
    if (
      weapons[key].type == "Pistol" ||
      weapons[key].type == "Rifle" ||
      weapons[key].type == "SniperRifle" ||
      weapons[key].type == "Submachine Gun"
    ) {
      return true;
    }
  }
  return false;
}

function updateTeamValues(left, right, map) {
  // Преобразуем объекты в массивы
  const leftArray = Object.values(left);
  const rightArray = Object.values(right);

  // Суммируем деньги всех игроков в каждой команде
  const leftTeamMoney = leftArray.reduce(
    (sum, player) => sum + (player.state?.money || 0),
    0
  );
  const rightTeamMoney = rightArray.reduce(
    (sum, player) => sum + (player.state?.money || 0),
    0
  );

  let left_color = leftArray[0]?.team === "CT" ? COLOR_NEW_CT : COLOR_NEW_T;
  let right_color = rightArray[0]?.team === "CT" ? COLOR_NEW_CT : COLOR_NEW_T;

  $("#players_left #money_text").css("color", left_color);
  $("#players_left #money_value").text("$" + leftTeamMoney);
  $("#players_right #money_text").css("color", right_color);
  $("#players_right #money_value").text("$" + rightTeamMoney);

  // Суммируем стоимость экипировки всех игроков
  const leftEquipValue = leftArray.reduce(
    (sum, player) => sum + (player.state?.equip_value || 0),
    0
  );
  const rightEquipValue = rightArray.reduce(
    (sum, player) => sum + (player.state?.equip_value || 0),
    0
  );

  $("#players_left #equip_text").css("color", left_color);
  $("#players_left #equip_value").text("$" + leftEquipValue);
  $("#players_right #equip_text").css("color", right_color);
  $("#players_right #equip_value").text("$" + rightEquipValue);

  $("#players_left .loss_1").css("background-color", COLOR_WHITE_DULL);
  $("#players_left .loss_2").css("background-color", COLOR_WHITE_DULL);
  $("#players_left .loss_3").css("background-color", COLOR_WHITE_DULL);
  $("#players_left .loss_4").css("background-color", COLOR_WHITE_DULL);
  $("#players_right .loss_1").css("background-color", COLOR_WHITE_DULL);
  $("#players_right .loss_2").css("background-color", COLOR_WHITE_DULL);
  $("#players_right .loss_3").css("background-color", COLOR_WHITE_DULL);
  $("#players_right .loss_4").css("background-color", COLOR_WHITE_DULL);

  let left_loss = 1400;
  let right_loss = 1400;

  // Добавляем проверки на существование свойств
  if (map?.team_ct?.consecutive_round_losses == 0) {
    left_loss = 1400;
  } else if (map?.team_ct?.consecutive_round_losses == 1) {
    left_loss = 1900;
    $("#players_left .loss_1").css("background-color", left_color);
  } else if (map?.team_ct?.consecutive_round_losses == 2) {
    left_loss = 2400;
    $("#players_left .loss_1").css("background-color", left_color);
    $("#players_left .loss_2").css("background-color", left_color);
  } else if (map?.team_ct?.consecutive_round_losses == 3) {
    left_loss = 2900;
    $("#players_left .loss_1").css("background-color", left_color);
    $("#players_left .loss_2").css("background-color", left_color);
    $("#players_left .loss_3").css("background-color", left_color);
  } else if (map?.team_ct?.consecutive_round_losses >= 4) {
    left_loss = 3400;
    $("#players_left .loss_1").css("background-color", left_color);
    $("#players_left .loss_2").css("background-color", left_color);
    $("#players_left .loss_3").css("background-color", left_color);
    $("#players_left .loss_4").css("background-color", left_color);
  }

  if (map?.team_t?.consecutive_round_losses == 0) {
    right_loss = 1400;
  } else if (map?.team_t?.consecutive_round_losses == 1) {
    right_loss = 1900;
    $("#players_right .loss_1").css("background-color", right_color);
  } else if (map?.team_t?.consecutive_round_losses == 2) {
    right_loss = 2400;
    $("#players_right .loss_1").css("background-color", right_color);
    $("#players_right .loss_2").css("background-color", right_color);
  } else if (map?.team_t?.consecutive_round_losses == 3) {
    right_loss = 2900;
    $("#players_right .loss_1").css("background-color", right_color);
    $("#players_right .loss_2").css("background-color", right_color);
    $("#players_right .loss_3").css("background-color", right_color);
  } else if (map?.team_t?.consecutive_round_losses >= 4) {
    right_loss = 3400;
    $("#players_right .loss_1").css("background-color", right_color);
    $("#players_right .loss_2").css("background-color", right_color);
    $("#players_right .loss_3").css("background-color", right_color);
    $("#players_right .loss_4").css("background-color", right_color);
  }

  $("#players_left #loss_text").css("color", left_color);
  $("#players_left #loss_value").text("$" + left_loss);
  $("#players_right #loss_text").css("color", right_color);
  $("#players_right #loss_value").text("$" + right_loss);
}

function countNades(left, right) {
  var count_left_smokegrenade = 0,
    count_left_incgrenade = 0,
    count_left_molotov = 0,
    count_left_flashbang = 0,
    count_left_hegrenade = 0;
  var count_right_smokegrenade = 0,
    count_right_incgrenade = 0,
    count_right_molotov = 0,
    count_right_flashbang = 0,
    count_right_hegrenade = 0;

  // Определяем стороны команд на основе первого игрока каждой команды
  let side_left = left[0]?.team || "CT";
  let side_right = right[0]?.team || "T";

  side_left = side_left.toUpperCase();
  side_right = side_right.toUpperCase();

  for (let key in left) {
    let player = left[key];
    let weapons = player.weapons || {}; // Получаем оружие напрямую из свойства
    for (let key2 in weapons) {
      let weapon = weapons[key2];
      let name = weapon.name.replace("weapon_", "");
      let type = weapon.type;
      if (type == "Grenade") {
        switch (name) {
          case "smokegrenade":
            count_left_smokegrenade += 1;
            break;
          case "incgrenade":
            count_left_incgrenade += 1;
            break;
          case "molotov":
            count_left_molotov += 1;
            break;
          case "flashbang":
            count_left_flashbang += 1;
            break;
          case "hegrenade":
            count_left_hegrenade += 1;
            break;
        }
      }
    }
  }

  for (let key in right) {
    let player = right[key];
    let weapons = player.weapons || {}; // Получаем оружие напрямую из свойства
    for (let key2 in weapons) {
      let weapon = weapons[key2];
      let name = weapon.name.replace("weapon_", "");
      let type = weapon.type;
      if (type == "Grenade") {
        switch (name) {
          case "smokegrenade":
            count_right_smokegrenade += weapon.ammo_reserve;
            break;
          case "incgrenade":
            count_right_incgrenade += weapon.ammo_reserve;
            break;
          case "molotov":
            count_right_molotov += weapon.ammo_reserve;
            break;
          case "flashbang":
            count_right_flashbang += weapon.ammo_reserve;
            break;
          case "hegrenade":
            count_right_hegrenade += weapon.ammo_reserve;
            break;
        }
      }
    }
  }

  $("#players_left #util_nade_1").removeClass();
  $("#players_left #util_nade_2").removeClass();
  $("#players_left #util_nade_3").removeClass();
  $("#players_left #util_nade_4").removeClass();
  $("#players_right #util_nade_1").removeClass();
  $("#players_right #util_nade_2").removeClass();
  $("#players_right #util_nade_3").removeClass();
  $("#players_right #util_nade_4").removeClass();

  let total_left =
    count_left_smokegrenade +
    count_left_incgrenade +
    count_left_molotov +
    count_left_flashbang +
    count_left_hegrenade;
  let total_right =
    count_right_smokegrenade +
    count_right_incgrenade +
    count_right_molotov +
    count_right_flashbang +
    count_right_hegrenade;

  if (total_left == 0) {
    $("#players_left #box_heading_subtext")
      .text("- None")
      .css("color", "#f21822");
  } else if (total_left <= 5) {
    $("#players_left #box_heading_subtext")
      .text("- Poor")
      .css("color", "#f25618");
  } else if (total_left <= 9) {
    $("#players_left #box_heading_subtext")
      .text("- Low")
      .css("color", "#f29318");
  } else if (total_left <= 14) {
    $("#players_left #box_heading_subtext")
      .text("- Good")
      .css("color", "#8ef218");
  } else if (total_left >= 15) {
    $("#players_left #box_heading_subtext")
      .text("- Great")
      .css("color", "#32f218");
  } else if (total_left == 20) {
    $("#players_left #box_heading_subtext")
      .text("- Full")
      .css("color", "#22f222");
  }

  if (total_right == 0) {
    $("#players_right #box_heading_subtext")
      .text("- None")
      .css("color", "#f21822");
  } else if (total_right <= 5) {
    $("#players_right #box_heading_subtext")
      .text("- Poor")
      .css("color", "#f25618");
  } else if (total_right <= 9) {
    $("#players_right #box_heading_subtext")
      .text("- Low")
      .css("color", "#f29318");
  } else if (total_right <= 14) {
    $("#players_right #box_heading_subtext")
      .text("- Good")
      .css("color", "#8ef218");
  } else if (total_right >= 15) {
    $("#players_right #box_heading_subtext")
      .text("- Great")
      .css("color", "#32f218");
  } else if (total_right == 20) {
    $("#players_right #box_heading_subtext")
      .text("- Full")
      .css("color", "#22f222");
  }

  $("#players_left #box_heading_text").css(
    "color",
    side_left == "CT" ? COLOR_NEW_CT : COLOR_NEW_T
  );
  $("#players_right #box_heading_text").css(
    "color",
    side_right == "CT" ? COLOR_NEW_CT : COLOR_NEW_T
  );

  $("#players_left #util_nade_1_count").text("x" + count_left_smokegrenade);
  $("#players_left #util_nade_1").addClass("util_smokegrenade_" + side_left);
  $("#players_left #util_nade_2_count").text(
    "x" + (count_left_incgrenade + count_left_molotov)
  );
  $("#players_left #util_nade_2").addClass(
    side_left == "CT" ? "util_incgrenade_CT" : "util_molotov_T"
  );
  $("#players_left #util_nade_3_count").text("x" + count_left_flashbang);
  $("#players_left #util_nade_3").addClass("util_flashbang_" + side_left);
  $("#players_left #util_nade_4_count").text("x" + count_left_hegrenade);
  $("#players_left #util_nade_4").addClass("util_hegrenade_" + side_left);

  $("#players_right #util_nade_4_count").text("x" + count_right_smokegrenade);
  $("#players_right #util_nade_4").addClass("util_smokegrenade_" + side_right);
  $("#players_right #util_nade_3_count").text(
    "x" + (count_right_incgrenade + count_right_molotov)
  );
  $("#players_right #util_nade_3").addClass(
    side_right == "CT" ? "util_incgrenade_CT" : "util_molotov_T"
  );
  $("#players_right #util_nade_2_count").text("x" + count_right_flashbang);
  $("#players_right #util_nade_2").addClass("util_flashbang_" + side_right);
  $("#players_right #util_nade_1_count").text("x" + count_right_hegrenade);
  $("#players_right #util_nade_1").addClass("util_hegrenade_" + side_right);
}

let radarInitialized = false;

function initializeRadar() {
  window.radar = {
    lastAngles: {},
    lastAmmo: {},
    lastAlivePositions: {},
    resolution: 1,
    offset: { x: 0, y: 0 },
    zRange: { min: 0, max: 0 },
    // Кэш для хранения элементов DOM
    domCache: {
      radarContainer: null,
      overlayElement: null,
    },
    // Кэш для хранения данных карты
    mapCache: {},
    // Флаг для отслеживания обновлений
    updateFlags: {
      playersNeedUpdate: false,
      grenadeNeedUpdate: false,
    },
    // Счетчик кадров для оптимизации
    frameCounter: 0,
  };

  window.radar.loadMapData = function (mapName) {
    // Очищаем кеш игроков при загрузке новой карты
    this.lastAngles = {};
    this.lastAmmo = {};
    this.lastAlivePositions = {};

    // Проверяем, есть ли карта в кэше
    const cleanMapName = mapName.toLowerCase().trim();
    if (this.mapCache[cleanMapName]) {
      // Используем кэшированные данные
      const cachedData = this.mapCache[cleanMapName];
      this.applyMapData(cachedData, cleanMapName);
      return;
    }

    // Очищаем DOM элементы только один раз
    this.clearRadarElements();

    const metaPath = `/maps/${cleanMapName}/meta.json`;
    const radarPath = `/maps/${cleanMapName}/radar.png`;
    const overlayPath = `/maps/${cleanMapName}/overlay_buyzones.png`;

    // Инициализируем кэш DOM элементов
    this.domCache.radarContainer = document.getElementById("radar-players");
    this.domCache.overlayElement = document.getElementById("radarBuyZones");

    fetch(metaPath)
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((mapData) => {
        // Кэшируем данные карты
        this.mapCache[cleanMapName] = {
          mapData,
          radarPath,
          overlayPath,
        };

        // Применяем данные карты
        this.applyMapData(this.mapCache[cleanMapName], cleanMapName);
      })
      .catch((error) =>
        console.warn("Не удалось загрузить настройки карты:", error)
      );
  };

  // Новый метод для применения данных карты
  window.radar.applyMapData = function (cachedData, mapName) {
    const { mapData, radarPath, overlayPath } = cachedData;

    // Сохраняем все данные как есть
    this.mapData = mapData;
    this.resolution = mapData.resolution;
    this.offset = mapData.offset;
    this.splits = mapData.splits;
    this.zRange = mapData.zRange;

    // Обновляем элементы радара
    if (this.domCache.radarContainer) {
      this.domCache.radarContainer.style.backgroundImage = `url('${radarPath}')`;
      this.domCache.radarContainer.style.backgroundSize = "cover";
      this.domCache.radarContainer.style.backgroundPosition = "center";
    }

    if (this.domCache.overlayElement) {
      this.domCache.overlayElement.style.backgroundImage = `url('${overlayPath}')`;
      this.domCache.overlayElement.style.backgroundSize = "cover";
      this.domCache.overlayElement.style.backgroundPosition = "center";
    }
  };

  // Новый метод для очистки элементов радара
  window.radar.clearRadarElements = function () {
    // Используем более эффективный способ очистки DOM
    const radarContainer = document.getElementById("radar-players");
    if (radarContainer) {
      // Сохраняем только фон радара
      const backgroundImage = radarContainer.style.backgroundImage;

      // Используем innerHTML для быстрой очистки
      radarContainer.innerHTML = "";

      // Восстанавливаем фон
      radarContainer.style.backgroundImage = backgroundImage;
    }

    // Сбрасываем глобальную переменную активного игрока
    window.activePlayerSteamId = null;
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

    // Оптимизация: используем кэширование для позиций мертвых игроков
    if (isDead) {
      if (!this.lastAlivePositions[steamid]) {
        this.lastAlivePositions[steamid] = position;
      }
      position = this.lastAlivePositions[steamid];
    } else {
      this.lastAlivePositions[steamid] = position;
    }

    const playerElement = document.getElementById(`player-${steamid}`);
    if (!playerElement) return;

    // Обновляем состояние игрока (мертвый/живой)
    playerElement.classList.toggle("dead_map", isDead);
    playerElement.style.opacity = isDead ? "0.5" : "1";

    // Оптимизация: вычисляем позицию только если игрок должен быть видимым
    const { x, y, level } = this.positionToPixels(position);

    // Оптимизация: используем classList для переключения видимости
    if (level === "lower" || level === "upper") {
      playerElement.style.display = "block";
    } else {
      playerElement.style.display = "none";
      return; // Прекращаем обновление, если игрок не видим
    }

    // Оптимизация: используем transform для перемещения (лучше для производительности)
    playerElement.style.transform = `translate(${x}px, ${y}px)`;

    // Обновляем направление игрока только если он жив
    if (!isDead && player.forward) {
      const markerElement = playerElement.querySelector(".player-marker");

      if (markerElement) {
        markerElement.style.display = "block";

        // Оптимизация: кэшируем разбор строки
        const rawAngle = player.forward.split(", ");
        const x = parseFloat(rawAngle[0]);
        const y = parseFloat(rawAngle[1]);

        if (!isNaN(x) && !isNaN(y)) {
          // Оптимизация: упрощаем вычисление угла
          const angle = x > 0 ? 90 + y * -1 * 90 : 270 + y * 90;
          markerElement.style.transform = `rotate(${angle}deg)`;
        }
      }
    } else if (isDead) {
      const markerElement = playerElement.querySelector(".player-marker");
      if (markerElement) {
        markerElement.style.display = "none";
      }
    }

    // Отдельная обработка fireElement - только если игрок жив
    // ... existing code ...
    if (!isDead) {
      const fireElement = playerElement.querySelector(".background-fire");

      if (fireElement) {
        // По умолчанию скрываем эффект огня
        fireElement.style.display = "none";

        if (player.weapons) {
          const activeWeapon = Object.values(player.weapons).find(
            (weapon) => weapon.state === "active"
          );
          const currentAmmo = activeWeapon?.ammo_clip;
          const lastAmmo = this.lastAmmo[player.steamid];

          // Показываем эффект огня только если количество патронов уменьшилось
          if (lastAmmo !== undefined && currentAmmo < lastAmmo) {
            fireElement.style.display = "block";

            // Используем кэшированные данные для угла
            const rawAngle = player.forward.split(", ");
            const x = parseFloat(rawAngle[0]);
            const y = parseFloat(rawAngle[1]);

            if (!isNaN(x) && !isNaN(y)) {
              const angle = x > 0 ? 90 + y * -1 * 90 : 270 + y * 90;

              const distance = 30;
              const radians = (angle - 90) * (Math.PI / 180);
              const translateX = Math.cos(radians) * distance;
              const translateY = Math.sin(radians) * distance;

              fireElement.style.transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) rotate(${
                angle + 90
              }deg)`;
            }
          }

          // Сохраняем текущее количество патронов
          if (activeWeapon) {
            this.lastAmmo[player.steamid] = currentAmmo;
          }
        }
      }
    } else {
      // Если игрок мертв, явно скрываем эффект огня
      const fireElement = playerElement.querySelector(".background-fire");
      if (fireElement) {
        fireElement.style.display = "none";
      }
    }
    // ... existing code ...
  };

  window.radar.positionToPixels = function (position) {
    // Оптимизация: кэшируем DOM элемент
    if (!this.domCache.radarContainer) {
      this.domCache.radarContainer = document.getElementById("radar-players");
    }

    const radarContainer = this.domCache.radarContainer;
    if (!radarContainer) {
      return { x: 0, y: 0, level: "unknown" };
    }

    // Оптимизация: преобразуем position только один раз
    let posX, posY, posZ;

    if (typeof position === "string") {
      const posArray = position.split(", ").map(Number);
      posX = posArray[0];
      posY = posArray[1];
      posZ = posArray[2];
    } else if (Array.isArray(position)) {
      posX = position[0];
      posY = position[1];
      posZ = position[2];
    } else {
      posX = position.x;
      posY = position.y;
      posZ = position.z;
    }

    // Оптимизация: кэшируем диапазоны Z
    const lowerLevelRange = this.splits?.[0]?.zRange || {
      min: -Infinity,
      max: Infinity,
    };
    const upperLevelRange = this.zRange || { min: -Infinity, max: Infinity };

    // Определяем, на каком этаже находится объект
    const isLowerLevel =
      posZ >= lowerLevelRange.min && posZ <= lowerLevelRange.max;
    const isUpperLevel =
      posZ >= upperLevelRange.min && posZ <= upperLevelRange.max;

    // Оптимизация: кэшируем размеры контейнера
    const containerWidth = radarContainer.offsetWidth;
    const containerHeight = radarContainer.offsetHeight;

    // Преобразуем координаты карты в пиксели
    let x =
      ((posX + this.offset.x) / (1024 * this.resolution)) *
      containerWidth *
      1.02;
    let y =
      containerHeight -
      ((posY + this.offset.y) / (1024 * this.resolution)) *
        containerHeight *
        1.02;

    // Оптимизация: применяем смещение только если нужно
    if (isLowerLevel && this.splits?.[0]) {
      const split = this.splits[0];
      x += ((split.offset.x * containerWidth) / 100) * 1.9;
      y -= ((split.offset.y * containerHeight) / 100) * 2.8;
    }

    return {
      x,
      y,
      level: isLowerLevel ? "lower" : isUpperLevel ? "upper" : "unknown",
    };
  };
}

function updateRadar(allplayers, map, data, observed, bomb, player, grenades) {
  // Инициализация радара, если он еще не инициализирован
  if (!radarInitialized) {
    initializeRadar();
    radarInitialized = true;
  }

  // Проверка на фризтайм или вармап
  const isWarmup = data?.map?.phase === "warmup";
  const isFreezeTime = data?.phase_countdowns?.phase === "freezetime";

  // Очищаем радар при начале фризтайма или вармапа
  if ((isWarmup || isFreezeTime) && !window.radar.lastPhase) {
    clearAllRadarElements();
    window.radar.lastPhase = isWarmup ? "warmup" : "freezetime";
  } else if (!isWarmup && !isFreezeTime && window.radar.lastPhase) {
    // Сбрасываем флаг, когда фризтайм или вармап закончились
    window.radar.lastPhase = null;
  }

  // Оптимизация: проверяем, нужно ли обновлять карту
  if (
    map?.name &&
    (!window.radar.currentMap || window.radar.currentMap !== map.name)
  ) {
    // Очищаем все гранаты при смене карты
    clearAllGrenades();

    window.radar.currentMap = map.name;
    window.radar.loadMapData(map.name);
  }

  // Оптимизация: увеличиваем счетчик кадров
  window.radar.frameCounter = (window.radar.frameCounter + 1) % 60;

  // Обновление бомбы только если есть данные о бомбе
  if (window.radar && bomb) {
    const bombElement = document.querySelector("#bomb-container");
    updateBombState(bomb, bombElement);
  } else if (window.radar && window.radar.frameCounter % 10 === 0) {
    // Проверяем реже для оптимизации
    const bombElement = document.querySelector("#bomb-container");
    if (bombElement) {
      bombElement.style.display = "none";
    }
  }

  // Обновление игроков
  if (allplayers && window.radar) {
    // Обновляем глобальную переменную активного игрока
    window.activePlayerSteamId = data?.player?.steamid || observed?.steamid;

    // Оптимизация: кэшируем DOM элементы
    if (!window.radar.domCache.radarContainer) {
      window.radar.domCache.radarContainer =
        document.getElementById("radar-players");
    }
    const radarContainer = window.radar.domCache.radarContainer;

    // Оптимизация: обновляем игроков только каждый второй кадр
    if (window.radar.frameCounter % 2 === 0) {
      // Создаем Set с ID текущих игроков для быстрого поиска
      const currentPlayerIds = new Set();

      // Обновляем всех игроков
      Object.entries(allplayers).forEach(([steamid, player]) => {
        if (!steamid) return;

        currentPlayerIds.add(`player-${steamid}`);

        // Добавляем steamid в объект игрока, если его нет
        if (!player.steamid) {
          player.steamid = steamid;
        }

        let playerElement = document.getElementById(`player-${steamid}`);

        // Если элемент не существует, создаем его
        if (!playerElement) {
          playerElement = createPlayerElement(player, steamid);
          if (radarContainer && playerElement) {
            radarContainer.appendChild(playerElement);
          }
        }

        // Обновляем цвет и слот игрока
        if (playerElement) {
          // Определяем, несет ли игрок бомбу
          const hasBomb = steamid === bomb?.player;

          // Обновляем цвет в зависимости от команды и наличия бомбы
          if (hasBomb) {
            playerElement.style.backgroundColor = PLAYER_ORANGE;
          } else {
            playerElement.style.backgroundColor =
              player.team.toLowerCase() === "ct" ? COLOR_NEW_CT : COLOR_NEW_T;
          }

          // Обработка слотов
          let slotIdentifier;
          if (typeof player.observer_slot === "number") {
            slotIdentifier =
              player.observer_slot === 9 ? 0 : player.observer_slot + 1;
          } else {
            slotIdentifier = "N/A";
          }

          // Обновляем номер слота в элементе
          const slotElement = playerElement.querySelector(".player-slot");
          if (slotElement) {
            slotElement.textContent = slotIdentifier;
          }
          playerElement.setAttribute("data-slot", slotIdentifier);

          // Выбранному игроку добавляем класс selected
          playerElement.classList.toggle(
            "active_player_map",
            steamid === window.activePlayerSteamId
          );
        }

        // Проверяем, изменилась ли позиция игрока
        const position = player.position
          ? player.position.split(", ").map(Number)
          : null;

        if (
          position &&
          (!player.lastPosition ||
            Math.abs(position[0] - player.lastPosition.x) > 0.5 ||
            Math.abs(position[1] - player.lastPosition.y) > 0.5 ||
            Math.abs(position[2] - player.lastPosition.z) > 0.5)
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

      // Оптимизация: удаляем элементы игроков, которых нет в текущем списке
      // Делаем это реже для оптимизации
      if (window.radar.frameCounter % 10 === 0 && radarContainer) {
        const currentPlayerElements = Array.from(
          radarContainer.querySelectorAll('[id^="player-"]')
        );
        currentPlayerElements.forEach((element) => {
          if (!currentPlayerIds.has(element.id)) {
            element.remove();
          }
        });
      }
    }
  }

  // Обновление гранат с ограничением частоты
  if (grenades && window.radar && window.radar.frameCounter % 1 === 0) {
    updateGrenades(grenades, allplayers);
  }
}

// Добавляем новую функцию для очистки всех элементов радара
function clearAllRadarElements() {
  // Очищаем все элементы игроков
  document.querySelectorAll('[id^="player-"]').forEach((el) => el.remove());

  // Очищаем все элементы гранат
  document
    .querySelectorAll(
      ".grenade, .inferno-flame, .inferno-container, .flame-point"
    )
    .forEach((el) => el.remove());

  // Очищаем бомбу
  document.querySelectorAll("#bomb-container").forEach((el) => el.remove());

  // Очищаем контейнеры гранат
  const grenadeContainers = [
    "#smokes",
    "#flashbangs",
    "#hegrenades",
    "#infernos",
  ];
  grenadeContainers.forEach((selector) => {
    const container = document.querySelector(selector);
    if (container) container.innerHTML = "";
  });
}

function createPlayerElement(player, steamid) {
  if (!steamid || !player) {
    //console.error('Недостаточно данных для создания элемента игрока:', { steamid, player });
    return null;
  }

  // Создаем основной элемент игрока
  const playerElement = document.createElement("div");
  playerElement.id = `player-${steamid}`;
  playerElement.className = `player ${player.team.toLowerCase()}`;
  playerElement.setAttribute("data-steamid", steamid);

  // Устанавливаем цвет в зависимости от команды
  playerElement.style.backgroundColor =
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
    playerElement.style.backgroundColor = PLAYER_ORANGE;
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

function createMarkerContainer() {
  const container = document.createElement("div");
  container.className = "player-marker";

  const triangle = document.createElement("div");
  triangle.className = "player-triangle";

  container.appendChild(triangle);
  /*container.appendChild(fire);*/
  return container;
}

function formatObserverSlot(slot) {
  // Удаляем console.log, который может замедлять работу
  const slotNumber = parseInt(slot);
  return slotNumber === 9 ? "0" : (slotNumber + 1).toString();
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
    //console.error('Недостаточно данных для обновления элемента игрока:', { element, player });
    return;
  }

  // Определяем, несет ли игрок бомбу
  const hasBomb = player.steamid === bomb?.player;

  // Обновляем цвет в зависимости от команды и наличия бомбы
  if (hasBomb) {
    element.style.backgroundColor = PLAYER_ORANGE;
  } else {
    element.style.backgroundColor =
      player.team.toLowerCase() === "ct" ? COLOR_NEW_CT : COLOR_NEW_T;
  }

  // Обработка слотов
  let slotIdentifier;
  if (typeof player.observer_slot === "number") {
    if (player.observer_slot === 9) {
      slotIdentifier = 0;
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

function updateBombState(bomb, bombElement) {
  // Если нет данных о бомбе или нет позиции, скрываем элемент бомбы
  if (!bomb || !bomb.position) {
    //console.warn('No bomb data or position');
    if (bombElement) {
      bombElement.style.display = "none";
    }
    return;
  }

  const radarPlayers = document.getElementById("radar-players");

  // Проверяем наличие необходимых элементов
  if (!radarPlayers) {
    //console.warn('Radar players container not found');
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
    //console.warn('Radar not initialized');
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
      //console.warn('Invalid bomb position format');
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
    //console.error('Error updating bomb:', error);
    // В случае ошибки скрываем элемент бомбы
    if (bombElement) {
      bombElement.style.display = "none";
    }
  }
}

// Обновляем функцию updateBombPosition для более точного позиционирования
function updateBombPosition(position, bombElement) {
  if (!position || !bombElement || !window.radar) {
    //  console.warn('Missing required parameters for updateBombPosition:', {
    //    hasPosition: !!position,
    //    hasBombElement: !!bombElement,
    //    hasRadar: !!window.radar
    //});
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
      x = (x / scale) * 100 + split.offset.x * 1.9;
      y = (y / scale) * 100 + split.offset.y * 2.8;
    } else {
      x = (x / scale) * 100;
      y = (y / scale) * 100;
    }

    // Регулировка позиции бомбы
    bombElement.style.left = `${x + 4}%`;
    bombElement.style.bottom = `${y - 6}%`;
    bombElement.setAttribute("data-z", position[2]);
    bombElement.setAttribute("data-level", isLowerLevel ? "lower" : "upper");

    // Добавляем плавное перемещение
    bombElement.style.transition = "left 0.1s linear, bottom 0.1s linear";
  } catch (error) {
    //console.error('Error in updateBombPosition:', error);
  }
}

// ... existing code ...

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
    const firebombsContainer =
      document.getElementById("firebombs") || infernosContainer; // Используем отдельный контейнер или fallback

    if (
      !smokesContainer ||
      !flashesContainer ||
      !heContainer ||
      !infernosContainer
    )
      return;

    // Исправляем создание объекта playerTeams
    const playerTeams = {};

    // Правильно заполняем объект playerTeams
    Object.entries(allplayers).forEach(([steamid, player]) => {
      if (steamid && player && player.team) {
        playerTeams[steamid] = player.team;
      }
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
          : isFirebomb
          ? "firebomb"
          : "";

        existingGrenades[grenadeType].add(id);

        // Исправляем выбор контейнера для разных типов гранат
        const container = isSmoke
          ? smokesContainer
          : isFlash
          ? flashesContainer
          : isFrag
          ? heContainer
          : isFirebomb
          ? firebombsContainer
          : infernosContainer;

        const grenadeId = `${grenade.type}_${id}`;
        const lifetime = parseFloat(grenade.lifetime);
        const effecttime = parseFloat(grenade.effecttime || 0);

        let grenadeElement = document.getElementById(grenadeId);

        // Специальная обработка для inferno (огня)
        // Специальная обработка для inferno (огня)
        if (isInferno) {
          if (!grenadeElement) {
            grenadeElement = document.createElement("div");
            grenadeElement.id = grenadeId;
            grenadeElement.className = "inferno-container";
            grenadeElement.dataset.createdAt = Date.now(); // Добавляем метку времени создания
            container.appendChild(grenadeElement);
          }

          if (grenade.flames) {
            const existingFlames = new Set();

            // Ограничиваем количество обрабатываемых точек пламени
            const flameEntries = Object.entries(grenade.flames);
            const MAX_FLAMES_PER_FRAME = 15;

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
                  grenadeElement.appendChild(flameElement);
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

            // Удаляем только те flames, которых больше нет в данных
            if (lifetime >= 22) {
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

          if (lifetime >= 7) {
            grenadeElement.remove();
          }
        } else {
          // Обработка других типов гранат

          //console.log('grenades', grenades);
          //console.log('playerTeams', playerTeams);

          // Добавьте этот код перед созданием элемента гранаты
          if (!playerTeams[grenade.owner]) {
            //console.log('Неизвестная команда для гранаты:', {
            //  grenadeType: grenade.type,
            //  grenadeId: id,
            //  owner: grenade.owner,
            //  allPlayerIds: Object.keys(playerTeams)
            //});
          }

          if (!grenadeElement) {
            grenadeElement = document.createElement("div");
            grenadeElement.id = grenadeId;

            if (isFirebomb) {
              grenadeElement.className = "firebomb-grenade";
              const ownerTeam = playerTeams[grenade.owner];
              const teamClass = `util_${
                ownerTeam === "T" ? "molotov" : "incgrenade"
              }_${ownerTeam || "default"}`;
              grenadeElement.classList.add(teamClass);

              const imgElement = document.createElement("img");
              imgElement.className = "firebomb-icon";
              imgElement.src = `/images/maps/element/grenades/weapon_${
                ownerTeam === "T" ? "molotov" : "incgrenade"
              }_${ownerTeam || "default"}.webp`;

              grenadeElement.appendChild(imgElement);
            } else {
              grenadeElement.className = isSmoke
                ? "smoke-grenade"
                : isFlash
                ? "flash-grenade"
                : "hegrenades-grenade";

              const ownerTeam = playerTeams[grenade.owner];
              const teamClass = `util_${
                isSmoke ? "smokegrenade" : isFlash ? "flashbang" : "hegrenade"
              }_${ownerTeam || "default"}`;
              grenadeElement.classList.add(teamClass);

              const imgElement = document.createElement("img");
              imgElement.className = isSmoke
                ? "smoke-icon"
                : isFlash
                ? "flash-icon"
                : "hegrenades-icon";

              // Исправляем путь к изображению
              const grenadeType = isSmoke
                ? "smokegrenade"
                : isFlash
                ? "flashbang"
                : "hegrenade";
              imgElement.src = `/images/maps/element/grenades/weapon_${grenadeType}${
                ownerTeam ? "_" + ownerTeam : ""
              }.webp`;

              // Обработка ошибки загрузки изображения - используем версию по умолчанию
              imgElement.onerror = function () {
                this.src = `/images/maps/element/grenades/weapon_${grenadeType}_default.webp`;
              };

              grenadeElement.appendChild(imgElement);
            }

            container.appendChild(grenadeElement);
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

              // Удаляем иконку гранаты, если она есть
              const iconElement = grenadeElement.querySelector(".smoke-icon");
              if (iconElement) {
                iconElement.remove();
              }
            } else if (effecttime >= 22) {
              // Время действия дыма закончилось - удаляем элемент
              existingGrenades.smoke.delete(id);
              grenadeElement.remove();
            }
          } else if (isFirebomb) {
            const FIREBOMB_MAX_LIFETIME = 7.0; // Максимальное время жизни зажигательной гранаты

            if (
              lifetime >= FIREBOMB_MAX_LIFETIME &&
              !grenadeElement.dataset.exploded
            ) {
              grenadeElement.dataset.exploded = "true";
              grenadeElement.style.transition = "none";

              const iconElement =
                grenadeElement.querySelector(".firebomb-icon");
              if (iconElement) {
                iconElement.remove();
              }

              grenadeElement.classList.add("firebomb-active");

              // Используем setTimeout для удаления элемента после анимации
              setTimeout(() => {
                existingGrenades.firebomb.delete(id);
                grenadeElement.remove();
              }, 7000);
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

    // Очистка устаревших элементов - выполняем чаще для смоков и огня
    // Очищаем смоки каждый кадр
    smokesContainer.querySelectorAll(".smoke-grenade").forEach((element) => {
      const id = element.id.replace("smoke_", "");
      if (!existingGrenades.smoke.has(id)) {
        element.remove();
      } else {
        // Проверяем время жизни смока
        const effecttime = parseFloat(element.dataset.effecttime || 0);
        if (effecttime >= 22) {
          element.remove();
        }
      }
    });

    // Очищаем инферно каждый кадр
    if (infernosContainer) {
      infernosContainer
        .querySelectorAll(".inferno-container")
        .forEach((element) => {
          const id = element.id.replace("inferno_", "");
          if (!existingGrenades.inferno.has(id)) {
            element.remove();
          } else {
            // Проверяем время жизни инферно
            const createdAt = parseInt(element.dataset.createdAt || 0);
            const currentTime = Date.now();
            const lifetime = (currentTime - createdAt) / 1000;

            if (lifetime >= 7.0) {
              element.remove();
            }
          }
        });
    }

    // Остальные гранаты очищаем реже
    if (Math.random() < 0.2) {
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

      // Отдельная очистка для firebomb элементов
      const firebombsContainer = document.getElementById("firebombs");
      if (firebombsContainer) {
        firebombsContainer
          .querySelectorAll(".firebomb-grenade")
          .forEach((element) => {
            const id = element.id.replace("firebomb_", "");
            if (!existingGrenades.firebomb.has(id)) {
              element.remove();
            }
          });
      }
    }
  } catch (error) {
    //console.error('Error updating grenades:', error);
  }
}

// Улучшенная функция для очистки всех гранат
function clearAllGrenades() {
  const containers = [
    "#smokes",
    "#flashbangs",
    "#hegrenades",
    "#infernos",
    "#firebombs",
  ];

  containers.forEach((selector) => {
    const container = document.querySelector(selector);
    if (container) {
      container.innerHTML = "";
    }
  });
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
  // Используем новую функцию connectWebSocket
  const socket = connectWebSocket();

  if (socket) {
    socket.on("gsi", (data) => {
      updateHUD(data);
    });
  }
});

// Инициализация системы обновления кадров при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  //console.log("HUD загружен, инициализация системы обновления кадров");

  // Запускаем систему обновления кадров
  window.requestAnimationFrame(frameRateControlledUpdate);

  // Проверяем, находимся ли мы в оверлее
  const isOverlay =
    window.location.href.includes("overlay") ||
    window.navigator.userAgent.includes("Electron");

  if (isOverlay) {
    //console.log('Запуск в режиме оверлея');

    // Добавляем обработчик ошибок для оверлея
    window.onerror = function (message, source, lineno, colno, error) {
      //console.error('Ошибка в оверлее:', message, 'Строка:', lineno);
      return true; // Предотвращаем стандартную обработку ошибок
    };
  }
});

// Обновляем функцию для подключения к WebSocket без проверки HTTPS
function connectWebSocket() {
  try {
    // Удаляем проверку HTTPS и используем только HTTP
    // const isHttps = window.location.protocol === "https:";
    // const socketProtocol = isHttps ? "wss:" : "ws:";
    // const socketPort = isHttps ? "2627" : "2626";

    const socketProtocol = "ws:";
    const socketPort = "2626";

    const socketUrl = `${socketProtocol}//${window.location.hostname}:${socketPort}`;
    //console.log("Подключение к WebSocket:", socketUrl);

    const socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // secure: isHttps,
    });

    socket.on("connect", function () {
      //console.log("Соединение установлено через HTTP");
      socket.emit("ready");
    });

    socket.on("connect_error", function (error) {
      //console.error("Ошибка подключения:", error);
      // Удаляем попытку переключения на HTTP
      // if (isHttps) {
      //   console.log("Не удалось подключиться по HTTPS, пробуем HTTP...");
      //   const httpSocketUrl = `ws://${window.location.hostname}:2626`;
      //   socket.io.uri = httpSocketUrl;
      //   socket.connect();
      // }
    });

    // ... остальные обработчики событий ...

    return socket;
  } catch (error) {
    //console.error("Ошибка при создании WebSocket:", error);
    return null;
  }
}

$(document).ready(function () {
  // Удаляем класс player_skull_default из всех элементов #player_skull
  $("#player_skull").removeClass("player_skull_default");

  // Инициализация
  let socket = connectWebSocket();
  if (socket) {
    socket.on("update", updateHUD);
    socket.on("gsi", (data) => {
      updateHUD(data);
    });
  }

  // Запускаем систему обновления кадров
  window.requestAnimationFrame(frameRateControlledUpdate);

  // Проверяем, находимся ли мы в оверлее
  const isOverlay =
    window.location.href.includes("overlay") ||
    window.navigator.userAgent.includes("Electron");

  if (isOverlay) {
    // Добавляем обработчик ошибок для оверлея
    window.onerror = function (message, source, lineno, colno, error) {
      return true; // Предотвращаем стандартную обработку ошибок
    };
  }
});
