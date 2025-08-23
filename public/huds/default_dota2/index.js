const p1 = "rgba(52, 118, 255, 1.0)";
const p2 = "rgba(103, 255, 192, 1.0)";
const p3 = "rgba(192, 0, 192, 1.0)";
const p4 = "rgba(243, 240, 12, 1.0)";
const p5 = "rgba(255, 108, 0, 1.0)";
const p6 = "rgba(254, 135, 195, 1.0)";
const p7 = "rgba(162, 181, 72, 1.0)";
const p8 = "rgba(102, 217, 247, 1.0)";
const p9 = "rgba(0, 132, 34, 1.0)";
const p10 = "rgba(165, 106, 0, 1.0)";
const radiant_left = "rgba(125, 213, 77, 1.0)";
const diant_right = "rgba(227, 78, 49, 1.0)";

const HUD_NAME = "default_dota2";


function updatePage(data) {
  console.log(data);
  // Проверка типа игры - работаем только с Dota 2
  if (!data || !data.provider || data.provider.name !== "Dota 2") {
    return;
  }
  
  // Проверка наличия необходимых данных
  if (!data || !data.map) {
    return;
  }

  const GAME_STATE = {
    HERO_SELECTION: "DOTA_GAMERULES_STATE_HERO_SELECTION",
    STRATEGY_TIME: "DOTA_GAMERULES_STATE_STRATEGY_TIME",
    TEAM_SHOWCASE: "DOTA_GAMERULES_STATE_TEAM_SHOWCASE",
    Waiting_players: "DOTA_GAMERULES_STATE_WAIT_FOR_PLAYERS_TO_LOAD",
    PRE_GAME: "DOTA_GAMERULES_STATE_PRE_GAME",
    GAME_IN_PROGRESS: "DOTA_GAMERULES_STATE_GAME_IN_PROGRESS",
    POST_GAME: "DOTA_GAMERULES_STATE_POST_GAME",
  };

  const ELEMENTS_TO_TOGGLE = [
    "#observed",
    "#players_left",
    "#players_right",
    "#top_panel",
    "#draft",
    "#roshan",
    "#couriers",
    "#buyback_container",
  ];

  function toggleElementsVisibility(data) {
    const gameState = data.map.game_state;
    const opacity =
      gameState === GAME_STATE.HERO_SELECTION ||
      gameState === GAME_STATE.STRATEGY_TIME ||
      gameState === GAME_STATE.TEAM_SHOWCASE ||
      gameState === GAME_STATE.Waiting_players ||
      gameState === GAME_STATE.POST_GAME
        ? 0
        : 1;

    /*ELEMENTS_TO_TOGGLE.forEach((selector) => {
      if (selector === "#observed") {
        console.log(`[toggleElementsVisibility] Устанавливаем opacity ${opacity} для ${selector}`);
      }
      $(selector).css("opacity", opacity);
    });*/
  }

  const ELEMENTS_TO_TOGGLE2 = ["#draft"];

  function toggleElementsVisibility2(data) {
    const gameState = data.map.game_state;
    const opacity =
      gameState === GAME_STATE.HERO_SELECTION ||
      gameState === GAME_STATE.STRATEGY_TIME /*||
      gameState === GAME_STATE.PRE_GAME*/
        ? 1
        : 0;

    ELEMENTS_TO_TOGGLE2.forEach((selector) => {
      $(selector).css("opacity", opacity);
    });
  }
  const ELEMENTS_TO_TOGGLE3 = [
    "#pick_ban",
    "#current_time.timer.active",
    ".reserve",
    "#side_name",
  ];

  function toggleElementsVisibility3(data) {
    const gameState = data.map.game_state;
    const opacity = gameState === GAME_STATE.STRATEGY_TIME ? 0 : 1;

    ELEMENTS_TO_TOGGLE3.forEach((selector) => {
      $(selector).css("opacity", opacity);
    });
  }

  // Заменить существующий if-else блок на:
  toggleElementsVisibility(data);
  toggleElementsVisibility2(data);
  toggleElementsVisibility3(data);

  // Безопасные вызовы функций с проверкой данных
  if (data.league || data.dota) updateTopPanel(data.league, data.dota);
  
  // Вызываем abilitiesUlta с проверкой данных
  if (data.abilities && data.players) {
  abilitiesUlta(data.abilities, data.players);
  } else if (data.abilities && data.player) {
    abilitiesUlta(data.abilities, data.player);
  }
  
  //if (data.roshan) updateRoshan(data.roshan);
  //if (data.player && data.couriers) updateCourier(data.player);
  //if (data.hero) updateDota2ProTracker(data.hero);
  //if (data.player) updateItemsForPlayers(data.player);
  //if (data.player) updateBuyback(data.player);
  //if (data.draft && data.player && data.dota) updateDraft(data.draft, data.player, data.dota, data.slot, data.player, data.league, data.teams);
  
  // updateObserver должен выполняться ПОСЛЕ всех toggleElementsVisibility
  // Вызываем updateObserver всегда для проверки selected_unit статуса
  if (data.observer && data.player) {
    updateObserver(data.observer, data.players, data.map, data.player);
  } else if (data.player) {
    // Если нет observer, но есть player - все равно проверяем selected_unit
    updateObserver(null, null, data.map, data.player);
  }
}


function abilitiesUlta(abilities, players){
  if (!abilities || !players) {
    return;
  }
  
  for (let player = 0; player < 10; player++) {
    const team = player < 5 ? "team2" : "team3";
    const playerNum = player < 5 ? player : player - 5;

    if (!abilities[team] || !abilities[team][`player${player}`]) continue;

    const uiIndex = player + 1;

    for (let i = 0; i < 9; i++) {
      const ability = abilities[team][`player${player}`][`ability${i}`];

      if (ability && ability.ultimate === true) {
        const ultimateNameElement = $(`#ultimate_name_${uiIndex}`);
        if (ultimateNameElement.length) {
          ultimateNameElement.text(ability.name);
        }

        if (ability.cooldown !== 0) {
          const ultimateImageElement = $(`#ultimate_image_${uiIndex}`);
          const ultimateCooldownElement = $(`#ultimate_cooldown_${uiIndex}`);
          
          if (ultimateImageElement.length) {
            ultimateImageElement
            .attr({
              src: `/images/dota2/abilities/${ability.name}.webp`,
              alt: ability.name,
            })
            .show();
          }
          
          if (ultimateCooldownElement.length) {
            ultimateCooldownElement
            .text(Math.ceil(ability.cooldown))
            .show();
          }
        } else {
          const ultimateImageElement = $(`#ultimate_image_${uiIndex}`);
          const ultimateCooldownElement = $(`#ultimate_cooldown_${uiIndex}`);
          
          if (ultimateImageElement.length) {
            ultimateImageElement.hide();
          }
          
          if (ultimateCooldownElement.length) {
            ultimateCooldownElement.hide();
          }
        }

        break;
      }
    }
  }
}

function updateTopPanel(league, dota) {
  if (!league && !dota) {
    return;
  }

  if (dota && dota.radiant_team && dota.radiant_team.logo) {
    $("#left_team #team_logo").attr("src", `/uploads/${dota.radiant_team.logo}`);
    $("#left_team2 #team_logo2").attr("src", `/uploads/${dota.radiant_team.logo}`);
  } else {
    $("#left_team #team_logo").attr("src", "/images/elements/logo_left_default.webp");
    $("#left_team2 #team_logo2").attr("src", "/images/elements/logo_left_default.webp");
  }

  if (dota && dota.dire_team && dota.dire_team.logo) {
    $("#right_team #team_logo").attr("src", `/uploads/${dota.dire_team.logo}`);
    $("#right_team2 #team_logo2").attr("src", `/uploads/${dota.dire_team.logo}`);
  } else {
    $("#right_team #team_logo").attr("src", "/images/elements/logo_right_default.webp");
    $("#right_team2 #team_logo2").attr("src", "/images/elements/logo_right_default.webp");
  }

  if (dota && dota.radiant_team && dota.radiant_team.name) {
    $("#left_team #main").text(dota.radiant_team.name);
  } else if (league && league.radiant && league.radiant.name) {
    $("#left_team #main").text(league.radiant.name);
  } else {
    $("#left_team #main").text("Radiant");
  }

  if (dota && dota.dire_team && dota.dire_team.name) {
    $("#right_team #main").text(dota.dire_team.name);
  } else if (league && league.dire && league.dire.name) {
    $("#right_team #main").text(league.dire.name);
  } else {
    $("#right_team #main").text("Dire");
  }
}

function updateObserver(observed, players, map, player) {
  // Проверка существования объекта observed
  if (!observed) {
    $("#observed").hide().css("opacity", "0");
    return;
  }

  // Если player не определен, скрываем #observed
  if (!player) {
    $("#observed").hide().css("opacity", "0");
    return;
  }

  // Проверяем, есть ли выбранный герой в любой из команд
  let hasSelectedHero = false;
  let selectedHeroInfo = null;
  
  // Проверяем команду Radiant (team2)
  if (player.team2) {
    for (let i = 0; i < 5; i++) {
      const playerData = player.team2[`player${i}`];
      if (playerData && playerData.hero && playerData.hero.selected_unit === true) {
        hasSelectedHero = true;
        selectedHeroInfo = { team: 'Radiant', player: i, name: playerData.name };
        break;
      }
    }
  }
  
  // Проверяем команду Dire (team3)
  if (!hasSelectedHero && player.team3) {
    for (let i = 5; i < 10; i++) {
      const playerData = player.team3[`player${i}`];
      if (playerData && playerData.hero && playerData.hero.selected_unit === true) {
        hasSelectedHero = true;
        selectedHeroInfo = { team: 'Dire', player: i, name: playerData.name };
        break;
      }
    }
  }

  // Если ни один герой не выбран, скрываем #observed
  if (!hasSelectedHero) {
    $("#observed").hide().css("opacity", "0");
    return;
  }

  // Если есть выбранный герой, показываем #observed
  $("#observed").show().css("opacity", "1");

  // Устанавливаем данные только если observed определен
  if (observed.name) {
    $("#obs_alias_text").text(observed.name);
  }
  
  // Проверяем наличие аватара
  if (observed.avatar) {
    // Если аватар есть, устанавливаем его и убираем класс отсутствия аватара
    $("#obs_avatar_img")
      .attr("src", `/uploads/${observed.avatar}`)
      .removeClass("obs_img_no_avatar");
  } else {
    // Если аватара нет, добавляем класс отсутствия аватара
    $("#obs_avatar_img")
    .attr("src", `/images/player_silhouette.webp`)
  }
}

// Подписываемся на обновления GSI
gsiManager.subscribe((event) => {
  switch(event.type) {
      case 'update':
          updatePage(event.data);
          break;
  }
});

// В index.js HUD'a
document.addEventListener('DOMContentLoaded', function() {
// Проверяем, откуда загружена страница
const isHttps = window.location.protocol === 'https:';

// Выбираем правильный порт и протокол
const socketProtocol = isHttps ? 'wss:' : 'ws:';
const socketPort = isHttps ? '2627' : '2626';
const socketUrl = `${socketProtocol}//${window.location.hostname}:${socketPort}`;

// Создаем соединение
const socket = io(socketUrl, {
  secure: isHttps,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

// Настраиваем обработчики
socket.on('connect', () => {
  socket.emit('ready');
});

socket.on('connect_error', (error) => {
  // Если не удалось подключиться по выбранному протоколу, пробуем альтернативный
  if (isHttps) {
    // Здесь можно добавить код для переключения на HTTP если нужно
  }
});

socket.on('gsi', (data) => {
  updatePage(data);
});
});