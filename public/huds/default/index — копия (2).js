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

var teams = {
  left: {},
  right: {},
};

function updatePage(data) {
  var matchup = data.getMatchType();
  var match = data.getMatch();
  var team_one = data.getTeamOne();
  var team_two = data.getTeamTwo();
  var team_Dire = data.getDire();
  var team_Radiant = data.getRadiant();
  var observed = data.getObserved();
  var players = data.getPlayers();
  live_map = map;
  var abilities = data.abilities();
  var buildings = data.buildings();
  var couriers = data.couriers();
  var draft = data.draft();
  var events = data.events();
  var hero = data.hero();
  var items = data.items();
  var league = data.league();
  var map = data.map();
  var minimap = data.minimap();
  var neutralitems = data.neutralitems();
  var player = data.player();
  var previously = data.previously();
  var provider = data.provider();
  var roshan = data.roshan();
  var wearables = data.wearables();
  //console.log(observed);
  //console.log(team_Radiant);

  var test_player = data.getPlayer(1);

  if (test_player) {
    teams.left = test_player.team.toLowerCase() == "ct" ? team_ct : team_t;
    teams.right = test_player.team.toLowerCase() != "ct" ? team_ct : team_t;

    teams.left.name = team_one.team_name || teams.left.name;
    teams.right.name = team_two.team_name || teams.right.name;
    teams.left.short_name = team_one.short_name || teams.left.short_name;
    if (teams.left.short_name === undefined || teams.left.short_name === null) {
      if (teams.left.name == "Counter-terrorists") {
        teams.left.short_name = "CT";
      } else {
        teams.left.short_name = "TT";
      }
    }
    teams.right.short_name = team_two.short_name || teams.right.short_name;
    if (
      teams.right.short_name === undefined ||
      teams.right.short_name === null
    ) {
      if (teams.right.name == "Counter-terrorists") {
        teams.right.short_name = "CT";
      } else {
        teams.right.short_name = "TT";
      }
    }
    teams.left.logo = team_one.logo || null;
    teams.right.logo = team_two.logo || null;
    teams.left.flag = team_one.country_code || null;
    teams.right.flag = team_two.country_code || null;
  }

  //console.log(info.player.team2.player0.name)

  console.log(data);
  //console.log(data.info.player.team2.player0.gold)
  //console.log(data.info.teams.team_1.team)
  //console.log(data.info.teams.team_1.team)
  //console.log(teams.left.name);

  teams.left.name = team_one.team_name || teams.left.name;
  teams.right.name = team_two.team_name || teams.right.name;
  teams.left.short_name = team_one.short_name || teams.left.short_name;
  if (teams.left.short_name === undefined || teams.left.short_name === null) {
    if (teams.left.name == "Counter-terrorists") {
      teams.left.short_name = "team2";
    } else {
      teams.left.short_name = "team3";
    }
  }
  teams.right.short_name = team_two.short_name || teams.right.short_name;
  if (teams.right.short_name === undefined || teams.right.short_name === null) {
    if (teams.right.name == "Counter-terrorists") {
      teams.right.short_name = "team2";
    } else {
      teams.right.short_name = "team3";
    }
  }
  teams.left.logo = team_one.logo || null;
  teams.right.logo = team_two.logo || null;
  teams.left.flag = team_one.country_code || null;
  teams.right.flag = team_two.country_code || null;

  teams.left.side = data.info.player.team2 || null;
  teams.right.side = data.info.player.team3 || null;
  teams.left.sidehero = data.info.hero.team2 || null;
  teams.right.sidehero = data.info.hero.team3 || null;
  //console.log(teams.right.sidehero);

  teams.left.players = teams.left.side;
  teams.right.players = teams.right.side;

  teams.left.hero = teams.left.sidehero;
  teams.right.hero = teams.right.sidehero;

  //console.log(teams.left.players);
  //console.log(teams.left.hero);
  //console.log(teams.right.players);

  const GAME_STATE = {
    HERO_SELECTION: "DOTA_GAMERULES_STATE_HERO_SELECTION",
    STRATEGY_TIME: "DOTA_GAMERULES_STATE_STRATEGY_TIME",
    TEAM_SHOWCASE: "DOTA_GAMERULES_STATE_TEAM_SHOWCASE",
    Waiting_players: "DOTA_GAMERULES_STATE_WAIT_FOR_PLAYERS_TO_LOAD",
    PRE_GAME: "DOTA_GAMERULES_STATE_PRE_GAME",
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
  ];

  function toggleElementsVisibility(data) {
    const gameState = data.info.map.game_state;
    const opacity =
      gameState === GAME_STATE.HERO_SELECTION ||
      gameState === GAME_STATE.STRATEGY_TIME ||
      gameState === GAME_STATE.TEAM_SHOWCASE ||
      gameState === GAME_STATE.Waiting_players ||
      gameState === GAME_STATE.POST_GAME
        ? 0
        : 1;

    ELEMENTS_TO_TOGGLE.forEach((selector) => {
      $(selector).css("opacity", opacity);
    });
  }

  const ELEMENTS_TO_TOGGLE2 = ["#draft"];

  function toggleElementsVisibility2(data) {
    const gameState = data.info.map.game_state;
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
  const ELEMENTS_TO_TOGGLE3 = ["#pick_ban"];

  function toggleElementsVisibility3(data) {
    const gameState = data.info.map.game_state;
    const opacity = gameState === GAME_STATE.STRATEGY_TIME ? 0 : 1;

    ELEMENTS_TO_TOGGLE3.forEach((selector) => {
      $(selector).css("opacity", opacity);
    });
  }

  // Заменить существующий if-else блок на:
  toggleElementsVisibility(data);
  toggleElementsVisibility2(data);
  toggleElementsVisibility3(data);

  var name1 = teams.left.players.player0.name;
  var name2 = teams.left.players.player1.name;
  var name3 = teams.left.players.player2.name;
  var name4 = teams.left.players.player3.name;
  var name5 = teams.left.players.player4.name;
  var name6 = teams.right.players.player5.name;
  var name7 = teams.right.players.player6.name;
  var name8 = teams.right.players.player7.name;
  var name9 = teams.right.players.player8.name;
  var name10 = teams.right.players.player9.name;
  var info1 = teams.left.players.player0;
  var info2 = teams.left.players.player1;
  var info3 = teams.left.players.player2;
  var info4 = teams.left.players.player3;
  var info5 = teams.left.players.player4;
  var info6 = teams.right.players.player5;
  var info7 = teams.right.players.player6;
  var info8 = teams.right.players.player7;
  var info9 = teams.right.players.player8;
  var info10 = teams.right.players.player9;
  var hero1 = teams.left.hero.player0.name;
  var hero2 = teams.left.hero.player1.name;
  var hero3 = teams.left.hero.player2.name;
  var hero4 = teams.left.hero.player3.name;
  var hero5 = teams.left.hero.player4.name;
  var hero6 = teams.right.hero.player5.name;
  var hero7 = teams.right.hero.player6.name;
  var hero8 = teams.right.hero.player7.name;
  var hero9 = teams.right.hero.player8.name;
  var hero10 = teams.right.hero.player9.name;
  var steam1 = teams.left.players.player0.steamid;
  var steam2 = teams.left.players.player1.steamid;
  var steam3 = teams.left.players.player2.steamid;
  var steam4 = teams.left.players.player3.steamid;
  var steam5 = teams.left.players.player4.steamid;
  var steam6 = teams.right.players.player5.steamid;
  var steam7 = teams.right.players.player6.steamid;
  var steam8 = teams.right.players.player7.steamid;
  var steam9 = teams.right.players.player8.steamid;
  var steam10 = teams.right.players.player9.steamid;
  var league = data.info.league;
  var abilities = data.info.abilities;
  //var draft = data.info.draft;
  //var hero = data.info.hero;
  var name = data.info.player;
  var draft_player = data.info.player;
  var slot = data.info.player;

  //console.log(slot);

  //teams.left.players.player0
  // net_worth - общая ценность
  // team_slot - слот на карте
  // steamid - steam64
  // gold - золото
  // runes_activated - активные руны (количество)
  // xpm - xpm / мана
  // team_name - название каомады (силы света или силы тьмы)

  // teams.left.hero.player0
  // aghanims_scepter - Улучшает ульт, а также некоторые способности всех героев.
  // aghanims_shard - Улучшает существующую способность героя или дает ему новую.
  // mana - мана
  // max_mana - максимально маны
  // health - хп
  // has_debuff - тру или фолс
  // buyback_cooldown - через сколько можно активировать байбэк
  // disarmed - обезоруженный
  // hexed -  заколдованный
  // level - уровень
  // magicimmune - есть ли иммун к магии
  // muted - замьючен
  // respawn_seconds - возраждение через
  // silenced -
  // smoked
  // stunned
  // talent_1 (2,3,4 до 8)

  /*
    var name = 0;

    for (var i = 0; i < 10; i++) {
      name++;
        console.log(name);
    }
  */
  //let heroname = newdata.hero.team2.player5.name.replace("npc_dota_hero_", "")
  //console.log(newdata);
  //console.log(newdata.league.dire.name)

  //console.log(newdata.player.team2.player0.accountid)
  //console.log(newdata.hero.team2.player[Index].name)
  //$("#left_team #main").text(newdata.hero.team2.player0.name)
  //console.log(name1);
  //console.log(name6);
  // ... existing code ...

  // Обновление имен игроков
  for (let i = 1; i <= 5; i++) {
    $(`#players_left #player_section #player${i} #player_alias_text`).text(
      eval(`name${i}`)
    );
    $(`#players_right #player_section #player${i} #player_alias_text`).text(
      eval(`name${i + 5}`)
    );
  }

  // ... existing code ...

  //console.log(hero1);
  //$("#player_health_text").text(newdata.hero.team2.player0.name.replace("npc_dota_hero_", ""))
  // ... existing code ...

  // Обновление текста здоровья героев
  for (let i = 1; i <= 5; i++) {
    $(`#players_left #player_section #player${i} #player_health_text`).text(
      eval(`hero${i}`)
    );
    $(`#players_right #player_section #player${i} #player_health_text`).text(
      eval(`hero${i + 5}`)
    );
  }

  // ... existing code ...
  /*
      if (hero9.name = "npc_dota_hero_rattletrap") {
        $("#players_right #player_section #player5 #player_health_text").text("Clockwerk")
      } else {
          $("#players_right #player_section #player5 #player_health_text").text(hero10)
      }
  */

  // ... existing code ...

  // Обновление изображений героев
  for (let i = 1; i <= 5; i++) {
    $(`#players_left #player_section #player${i} #player_image`).attr(
      "src",
      `/storage/dota2/heroes/${eval("hero" + i)}.webp`
    );
    $(`#players_right #player_section #player${i} #player_image`).attr(
      "src",
      `/storage/dota2/heroes/${eval("hero" + (i + 5))}.webp`
    );
  }

  // ... existing code ...

  //console.log(steam1);
  //$("#players_left #player_section #player1 #player_image").attr("src", "/storage/" + steam1 + ".png")

  // ... existing code ...

  // Обновление цветов боковых панелей
  for (let i = 1; i <= 5; i++) {
    $(`#players_left #player_section #player${i} .player_side_bar`).css(
      "background-color",
      eval(`p${i}`)
    );
    $(`#players_right #player_section #player${i} .player_side_bar`).css(
      "background-color",
      eval(`p${i + 5}`)
    );
  }

  // ... existing code ...

  //console.log(info1.gold);

  // ... existing code ...

  // Обновление статистики игроков (золото, убийства, помощь, смерти)
  for (let i = 1; i <= 5; i++) {
    $(
      `#players_left #player_section #player${i} #player_current_money_text`
    ).text(eval(`info${i}`).gold);
    $(
      `#players_right #player_section #player${i} #player_current_money_text`
    ).text(eval(`info${i + 5}`).gold);
  }

  // ... существующий код ...
  //console.log(info1.kills);
  // ... существующий код ...

  // Обновление статистики (убийства/смерти/помощь) для всех игроков
  const stats = ["kills", "deaths", "assists"];

  stats.forEach((stat) => {
    for (let i = 1; i <= 5; i++) {
      $(`#players_left #player_section #player${i} #player_${stat}_text`).text(
        eval(`info${i}`)[stat]
      );
      $(`#players_right #player_section #player${i} #player_${stat}_text`).text(
        eval(`info${i + 5}`)[stat]
      );
    }
  });

  // ... existing code ...

  $(document).ready(function () {
    // Глобальный перехватчик ошибок для изображений
    $("img").on("error", function (e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
  });

  updateTopPanel(league, teams);
  updateStateLive(map);
  updateObserver(observed, players);
  abilitiesUlta(abilities, players);
  updateDraft(draft, hero, draft_player, slot, name, league, teams);
  updateRoshan(roshan);
  updateSmoke(hero);
  updateCourier(player, couriers);
  updateDota2ProTracker(hero);
  //console.log(couriers);
  //updateObserved(observed);
  //console.log(match);
}

function updateDota2ProTracker(hero) {}
function updateCourier(player) {
  updateTeam2Couriers(player.team2);
  updateTeam3Couriers(player.team3);
  /* updateSpecificCourierItem0(player.team3.player8); // Обновление конкретного предмета для игрока 8
  updateSpecificCourierItem1(player.team3.player9);
  updateSpecificCourierItem7(player.team3.player5);
  updateSpecificCourierItem8(player.team3.player6);
  updateSpecificCourierItem9(player.team3.player7);*/
}

// Определение функции updateCourierItemsForTeam3
function updateCourierItemsForTeam3(courier, playerIndex) {
  updateCourierItemsForPlayers(courier, playerIndex);
}

// Определение функции updateCourierItemsForPlayers
function updateCourierItemsForPlayers(courier, playerIndex) {
  let hasItems = false;
  const itemElementBaseId = `#courier${playerIndex} #item_courier`;

  // Обработка предметов курьера для игроков
  for (let j = 0; j < 6; j++) {
    const itemKey = courier.items[`item${j}`];
    const itemElement = $(`${itemElementBaseId}${j}`); // Получаем элемент предмета
    const fonElement = $(`#courier${playerIndex} .fon${j + 3}`); // Получаем элемент фона (fon3-fon8 для предметов)

    if (itemKey) {
      hasItems = true;
      const itemName = itemKey.name.replace("item_", "");
      const itemImagePath = `/storage/dota2/items/${itemName}.webp`;

      $.get(itemImagePath)
        .done(() => {
          itemElement.attr("src", itemImagePath);
          itemElement.css("opacity", 1).fadeIn();
          fonElement.show(); // Показываем фоновый элемент когда есть предмет
        })
        .fail(() => {
          itemElement.fadeOut(() => {
            itemElement.css("opacity", 0);
          });
          fonElement.hide(); // Скрываем фоновый элемент если картинка не загрузилась
        });
    } else {
      itemElement.fadeOut(() => {
        itemElement.css("opacity", 0);
      });
      fonElement.hide(); // Скрываем фоновый элемент если нет предмета
    }
  }

  // Показываем .fon1 и .fon2 всегда, так как они содержат иконку героя и курьера
  $(`#courier${playerIndex} .fon1`).show();
  $(`#courier${playerIndex} .fon2`).show();

  if (!hasItems) {
    $(`#couriers #courier${playerIndex}`).css({
      display: "none",
      opacity: 0,
    });
  } else {
    $(`#couriers #courier${playerIndex}`).css({ display: "", opacity: 1 });
  }
}

// ... existing code ...

function updateTeam2Couriers(team2) {
  // Проверяем существование team2
  if (!team2) return;

  // Обновляем для игроков от 0 до 4
  for (let playerIndex = 0; playerIndex < 5; playerIndex++) {
    const playerData = team2[`player${playerIndex}`];
    // Если нет данных игрока, пропускаем итерацию
    if (!playerData) continue;

    // Безопасно получаем имя героя
    const heroName = playerData.hero?.name?.replace("npc_dota_hero_", "");
    if (heroName) {
      $(`#couriers #courier${playerIndex} img#geroi${playerIndex}`).attr(
        "src",
        `/storage/dota2/heroes/icons/${heroName}.png`
      );
    }

    // Получаем данные курьера
    const courier = playerData[`courier${playerIndex + 2}`];
    if (courier) {
      updateCourierItemsForPlayers(courier, playerIndex); // Изменено здесь
    }

    // Устанавливаем иконку курьера в зависимости от команды
    const courierFlyIcon = `#courier_fly${playerIndex}`;
    const team = playerData.team_name;
    const iconPath =
      team === "dire"
        ? "/storage/dota2/Couriers/team3.webp"
        : "/storage/dota2/Couriers/team2.webp";
    $(courierFlyIcon).attr("src", iconPath);
  }
}

// ... existing code ...

function updateTeam3Couriers(team3) {
  // Проверяем существование team3
  if (!team3) return;

  // Обновляем для игроков от 5 до 9
  for (let playerIndex = 5; playerIndex < 10; playerIndex++) {
    const playerData = team3[`player${playerIndex}`];
    // Если нет данных игрока, пропускаем итерацию
    if (!playerData) continue;

    // Безопасно получаем имя героя
    const heroName = playerData.hero?.name?.replace("npc_dota_hero_", "");
    if (heroName) {
      $(`#couriers #courier${playerIndex} img#geroi${playerIndex}`).attr(
        "src",
        `/storage/dota2/heroes/icons/${heroName}.png`
      );
    }

    // Определяем курьера в зависимости от индекса игрока
    let courier;
    switch (playerIndex) {
      case 8:
        courier = playerData.courier0;
        break;
      case 9:
        courier = playerData.courier1;
        break;
      case 5:
        courier = playerData.courier7;
        break;
      case 6:
        courier = playerData.courier8;
        break;
      case 7:
        courier = playerData.courier9;
        break;
    }

    if (courier) {
      updateCourierItemsForTeam3(courier, playerIndex);
    }

    // Устанавливаем иконку курьера
    const courierFlyIcon = `#courier_fly${playerIndex}`;
    const team = playerData.team_name;
    const iconPath =
      team === "dire"
        ? "/storage/dota2/Couriers/team3.webp"
        : "/storage/dota2/Couriers/team2.webp";
    $(courierFlyIcon).attr("src", iconPath);
  }
}
/*
function updateCourierItems(courier, playerIndex) {
  //console.log(courier);
  let hasItems = false; // Флаг для проверки наличия предметов
  const itemElementBaseId = `#courier${playerIndex} #item_courier`; // Базовый селектор для предметов

  // Обработка предметов курьера для команды 2
  for (let j = 0; j < 6; j++) {
    const itemKey = courier.items[`item${j}`]; // Проверяем предметы с ключами item0, item1, ..., item5
    const itemElement = $(`${itemElementBaseId}${j}`); // Получаем элемент для предмета

    if (itemKey) {
      hasItems = true; // Если есть хотя бы один предмет, устанавливаем флаг
      const itemName = itemKey.name.replace("item_", ""); // Убираем "item_" из названия
      const itemImagePath = `/storage/dota2/items/${itemName}.webp`; // Путь к изображению

      // Проверка существования изображения
      $.get(itemImagePath)
        .done(() => {
          itemElement.attr("src", itemImagePath);
          itemElement.css("opacity", 1).fadeIn(); // Устанавливаем opacity и применяем fadeIn
        })
        .fail(() => {
          console.warn(
            `Изображение для ${itemName} не найдено по пути: ${itemImagePath}`
          );
          itemElement.fadeOut(() => {
            itemElement.css("opacity", 0); // Устанавливаем opacity: 0 после fadeOut
          });
        });
    } else {
      itemElement.fadeOut(() => {
        itemElement.css("opacity", 0); // Устанавливаем opacity: 0 после fadeOut
      });
    }
    // Обработка предметов курьера для команды 3
    for (let j = 0; j < 6; j++) {
      const itemKey = courier.items[`item${j}`]; // Проверяем предметы с ключами item0, item1, ..., item5
      const itemElement = $(`${itemElementBaseId}${j}`); // Получаем элемент для предмета

      if (itemKey) {
        hasItems = true; // Если есть хотя бы один предмет, устанавливаем флаг
        const itemName = itemKey.name.replace("item_", ""); // Убираем "item_" из названия
        const itemImagePath = `/storage/dota2/items/${itemName}.webp`; // Путь к изображению

        // Проверка существования изображения
        $.get(itemImagePath)
          .done(() => {
            itemElement.attr("src", itemImagePath);
            itemElement.css("opacity", 1).fadeIn(); // Устанавливаем opacity и применяем fadeIn
          })
          .fail(() => {
            console.warn(
              `Изображение для ${itemName} не найдено по пути: ${itemImagePath}`
            );
            itemElement.fadeOut(() => {
              itemElement.css("opacity", 0); // Устанавливаем opacity: 0 после fadeOut
            });
          });
      } else {
        itemElement.fadeOut(() => {
          itemElement.css("opacity", 0); // Устанавливаем opacity: 0 после fadeOut
        });
      }
    }
  }

  // Если нет предметов, добавляем стиль display: none и opacity: 0
  if (!hasItems) {
    $(`#couriers #courier${playerIndex}`).css({
      display: "none",
      opacity: 0,
    });
  } else {
    $(`#couriers #courier${playerIndex}`).css({ display: "", opacity: 1 }); // Убираем стиль, если есть предметы
  }
}
*/
function updateSmoke(hero) {
  // Обработка игроков команды 2
  for (let i = 0; i < 5; i++) {
    const isSmoked = hero.team2[`player${i}`].smoked;
    //console.log(`Проверка состояния героя ${i}:`, isSmoked);
    $(`#smoke${i + 1}`).css({
      opacity: isSmoked ? 1 : 0, // Показываем или скрываем элемент
      transition: "opacity 0.1s ease, transform 0.1s ease", // Добавлено: эффект плавной прозрачности и наклона
      transform: isSmoked ? "translateY(0)" : "translate(-50px)", // Эффект наклона слева на права
    });
  }

  // Обработка игроков команды 3
  for (let i = 5; i < 10; i++) {
    const isSmoked = hero.team3[`player${i}`].smoked;
    //console.log(`Проверка состояния героя ${i}:`, isSmoked);
    $(`#smoke${i + 1}`).css({
      opacity: isSmoked ? 1 : 0, // Показываем или скрываем элемент
      transition: "opacity 0.1s ease", // Добавлено: эффект плавной прозрачности
    });
  }
}

// ... existing code ...
let lastRoshanPhase = null; // Add this variable at the top of the file with other globals

function updateRoshan(roshan) {
  // 7500; в сети
  // 7500 1 рошан
  // 9510; 2 рошан
  // 82102 3 рошан
  console.log(roshan.health);
  console.log(roshan.spawn_phase);
  // Only trigger animation when spawn_phase changes to 0
  if (roshan.spawn_phase === 0 && lastRoshanPhase !== 0) {
    $("#roshan_image")
      .css("opacity", 1)
      .attr("src", "/storage/dota2/roshan/roshan.webp")
      .fadeIn(400) // Fade in over 400ms
      .delay(5000) // Keep visible for 5 seconds
      .fadeOut(400); // Fade out over 400ms
  }

  lastRoshanPhase = roshan.spawn_phase; // Update the last phase

  if (roshan.alive === true) {
    //console.log(roshan.items_drop);

    for (let i = 0; i < 6; i++) {
      // Цикл для item0, item1, ..., item5
      const itemKey = `item${i}`; // Формируем ключ для каждого предмета
      const itemName = roshan.items_drop[itemKey]?.replace("item_", ""); // Убираем "item" из названия, если предмет существует

      if (itemName) {
        const itemImagePath = `/storage/dota2/items/${itemName}.webp`; // Путь к картинке
        //console.log(`Итем: ${itemName}, Путь к картинке: ${itemImagePath}`);

        // Устанавливаем путь к картинке в соответствующий элемент
        const itemElement = document.getElementById(`item${i}`);
        if (itemElement) {
          // Проверяем, существует ли элемент
          itemElement.src = itemImagePath; // Устанавливаем src для элемента
          itemElement.alt = itemName; // Устанавливаем alt для элемента
          $(itemElement).css("opacity", 1).fadeIn(200); // Используем jQuery для изменения opacity
        } else {
          console.warn(`Элемент с id "item${i}" не найден.`);
        }
      } else {
        // Если itemName равен null, скрываем элемент
        const itemElement = document.getElementById(`item${i}`);
        if (itemElement) {
          $(itemElement).css("opacity", 0); // Скрываем элемент
        }
      }
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const itemElement = document.getElementById(`item${i}`);
      if (itemElement) {
        //itemElement.src = "/storage/dota2/items/default_item.webp";
        //itemElement.alt = "default_item";
        $(itemElement).css("opacity", 0); // Используем jQuery для изменения opacity
      }
    }
  }
}

function updateDraft(draft, hero, draft_player, slot, name, league, teams) {
  //console.log(draft);
  //console.log(draft.team2.ban0_class);

  // Обработка банов для команды 2
  for (let i = 0; i <= 6; i++) {
    const banClass = draft.team2[`ban${i}_class`];
    const selector = `.ban_group #radiant_ban${i} .ban_img`;
    $(selector)
      .attr(
        "src",
        banClass
          ? `/storage/dota2/heroes/${banClass}.webp`
          : "/storage/dota2/heroes/default_hero.webp"
      )
      .css("opacity", 1);
  }

  // Обработка банов для команды 3
  for (let i = 0; i <= 6; i++) {
    const banClass = draft.team3[`ban${i}_class`];
    const selector = `.ban_group #dire_ban${i} .ban_img`;
    $(selector)
      .attr(
        "src",
        banClass
          ? `/storage/dota2/heroes/${banClass}.webp`
          : "/storage/dota2/heroes/default_hero.webp"
      )
      .css("opacity", 1);
  }

  // Функция для обновления видео по имени героя
  function updateHeroVideo(pickClass, team, index, teams) {
    const selector = `.pick_group #${team}_pick${index}.${team} .pick_video`;
    const currentSrc = $(selector).attr("src"); // Получаем текущий источник видео

    if (!pickClass) {
      if (currentSrc !== "/storage/dota2/video/dota2_logo_animated.webm") {
        $(selector)
          .attr("src", "/storage/dota2/video/dota2_logo_animated.webm")
          .show()
          .css("opacity", 1);
      }
    } else {
      const heroName = pickClass;
      const newSrc = `/storage/dota2/heroes/animated/npc_dota_hero_${heroName}.webm`;
      if (currentSrc !== newSrc) {
        // Проверяем, изменился ли источник
        $(selector).attr("src", newSrc).show().css("opacity", 1);
      }
    }
  }

  // Обновление видео для команды 2
  for (let i = 0; i <= 6; i++) {
    updateHeroVideo(draft.team2[`pick${i}_class`], "radiant", i);
  }

  // Обновление видео для команды 3
  for (let i = 0; i <= 6; i++) {
    updateHeroVideo(draft.team3[`pick${i}_class`], "dire", i);
  }
  //console.log(hero.team3.player5.id);
  //console.log(slot.team3.player5.team_slot);
  //console.log(draft.team3.pick0_id);
  //console.log(name.team3.player5.name);

  // Проверка, выбраны ли все 10 героев
  const allHeroesPicked =
    draft.team2.pick0_id &&
    draft.team2.pick1_id &&
    draft.team2.pick2_id &&
    draft.team2.pick3_id &&
    draft.team2.pick4_id &&
    draft.team3.pick0_id &&
    draft.team3.pick1_id &&
    draft.team3.pick2_id &&
    draft.team3.pick3_id &&
    draft.team3.pick4_id;

  // Если все герои выбраны, очищаем имена и обновляем данные
  if (allHeroesPicked) {
    // Очищаем имена игроков
    $("#radiant_pick0.pick.radiant .player_name").text("");
    $("#radiant_pick1.pick.radiant .player_name").text("");
    $("#radiant_pick2.pick.radiant .player_name").text("");
    $("#radiant_pick3.pick.radiant .player_name").text("");
    $("#radiant_pick4.pick.radiant .player_name").text("");
    $("#dire_pick0.pick.dire .player_name").text("");
    $("#dire_pick1.pick.dire .player_name").text("");
    $("#dire_pick2.pick.dire .player_name").text("");
    $("#dire_pick3.pick.dire .player_name").text("");
    $("#dire_pick4.pick.dire .player_name").text("");

    let allNamesUpdated = true; // Флаг для отслеживания обновления имен
    let positionsUpdated = []; // Массив для отслеживания обновленных позиций

    // Проверка draft.team2.pickX_id со всеми hero.team2.playerX.id
    for (let i = 0; i <= 4; i++) {
      for (let j = 0; j <= 4; j++) {
        if (draft.team2[`pick${j}_id`] === hero.team2[`player${i}`].id) {
          // Обновление имени игрока
          const playerName = name.team2[`player${i}`].name;
          $(`#radiant_pick${j}.pick.radiant .player_name`).text(playerName);
          positionsUpdated[j] = true; // Отметка обновленной позиции
          break; // Остановка поиска при совпадении
        }
      }
    }

    // Проверка draft.team3.pickX_id со всеми hero.team3.playerX.id
    for (let i = 5; i <= 9; i++) {
      for (let j = 0; j <= 4; j++) {
        if (draft.team3[`pick${j}_id`] === hero.team3[`player${i}`].id) {
          // Обновление имени игрока
          const playerName = name.team3[`player${i}`].name;
          $(`#dire_pick${j}.pick.dire .player_name`).text(playerName);
          positionsUpdated[j + 5] = true; // Отметка обновленной позиции
          break; // Остановка поиска при совпадении
        }
      }
    }

    // Проверка, обновлены ли все имена
    for (let j = 0; j <= 4; j++) {
      if (!$(`#radiant_pick${j}.pick.radiant .player_name`).text()) {
        allNamesUpdated = false; // Если хоть одно имя не обновлено, устанавливаем флаг в false
        break;
      }
    }

    for (let j = 0; j <= 4; j++) {
      if (!$(`#dire_pick${j}.pick.dire .player_name`).text()) {
        allNamesUpdated = false; // Если хоть одно имя не обновлено, устанавливаем флаг в false
        break;
      }
    }

    // Если обновилась хотя бы одна позиция, показываем соответствующее имя
    if (positionsUpdated.some((updated) => updated)) {
      positionsUpdated.forEach((updated, index) => {
        if (updated) {
          if (index < 5) {
            $(`#radiant_pick${index}.pick.radiant .player_name`)
              .show()
              .css("opacity", 1);
          } else {
            $(`#dire_pick${index - 5}.pick.dire .player_name`)
              .show()
              .css("opacity", 1);
          }
        }
      });
    }
  } else {
    // Скрываем имена игроков, если не все герои выбраны
    $("#radiant_pick0.pick.radiant .player_name").hide();
    $("#radiant_pick1.pick.radiant .player_name").hide();
    $("#radiant_pick2.pick.radiant .player_name").hide();
    $("#radiant_pick3.pick.radiant .player_name").hide();
    $("#radiant_pick4.pick.radiant .player_name").hide();
    $("#dire_pick0.pick.dire .player_name").hide();
    $("#dire_pick1.pick.dire .player_name").hide();
    $("#dire_pick2.pick.dire .player_name").hide();
    $("#dire_pick3.pick.dire .player_name").hide();
    $("#dire_pick4.pick.dire .player_name").hide();
  }
  // ... existing code ...

  //console.log(draft.activeteam);

  if (draft.activeteam === 2) {
    /*$("#center_info.info").css(
      "background-color",
      "linear-gradient(var(--info-left) 0%, var(--info-right) 100%)"
    );*/
    // Форматирование времени
    const timeRemaining = draft.activeteam_time_remaining;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    $("#current_time.timer.active").text(
      `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
    );

    // Форматирование времени для резервов
    const formatTime = (time) => {
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    // Обновление времени резервов
    $("#dire_reserve.timer").text(formatTime(draft.dire_bonus_time));
    $("#radiant_reserve.timer").text(formatTime(draft.radiant_bonus_time));

    // Отображение стрелки
    if (draft.activeteam === 2) {
      $("#side")
        .attr("src", "/storage/dota2/arrow.png")
        .css({
          transform: "scaleX(-1)", // Зеркальное отображение
          filter: "hue-rotate(0deg)", // Цвет белый
        })
        .addClass("side_radiant"); // Добавляем класс .side_radiant
    } else if (draft.activeteam === 3) {
      $("#side").removeClass("side_radiant"); // Убираем класс .side_radiant
    }
  } else if (draft.activeteam === 3) {
    /*$("#center_info.info").css(
      "background-color",
      "var(--info-left) 100%, var(--info-right) 0%)"
    );*/
    // Форматирование времени
    const timeRemaining = draft.activeteam_time_remaining;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    $("#current_time.timer.active").text(
      `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
    );

    // Форматирование времени для резервов
    const formatTime = (time) => {
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    // Обновление времени резервов
    $("#dire_reserve.timer").text(formatTime(draft.dire_bonus_time));
    $("#radiant_reserve.timer").text(formatTime(draft.radiant_bonus_time));

    // Отображение стрелки
    if (draft.activeteam === 3) {
      $(".reserve #side")
        .attr("src", "/storage/dota2/arrow.png")
        .css({
          transform: "scaleX(1)", // Обычное отображение
          filter: "hue-rotate(0deg)", // Цвет белый
        })
        .addClass("side_dire"); // Добавляем класс .side_dire
    } else {
      $(".reserve #side").removeClass("side_dire"); // Убираем класс .side_dire, если активная команда 2
    }
  }

  if (teams.left.name === undefined) {
    $("#scorebar_spacer #left_team #main")
      .text(league.radiant.name.toUpperCase())
      .css("color", radiant_left);
  } else {
    $("#scorebar_spacer #left_team #main")
      .text(teams.left.name.toUpperCase())
      .css("color", radiant_left);
  }
  if (teams.right.name === undefined) {
    $("#scorebar_spacer #right_team #main")
      .text(league.dire.name)
      .css("color", diant_right);
  } else {
    $("#scorebar_spacer #right_team #main")
      .text(teams.right.name.toUpperCase())
      .css("color", diant_right);
  }

  // Добавлено: обновление текста в #current_team в зависимости от draft.pick
  if (draft.pick) {
    $("#pick_ban").text("PICK");
  } else {
    $("#pick_ban").text("BANNED");
  }
}

function updateTopPanel(league, teams) {
  //#region Team Name
  // ... existing code ...
  if (teams.left.name === undefined) {
    const radiantName =
      league.radiant.name.length > 16
        ? `${league.radiant.team_tag}`
        : league.radiant.name.toUpperCase();
    $("#left_team #main").text(radiantName).css("color", radiant_left);
  } else {
    $("#left_team #main")
      .text(teams.left.name.toUpperCase())
      .css("color", radiant_left);
  }
  if (teams.right.name === undefined) {
    const direName =
      league.dire.name.length > 16
        ? `${league.dire.team_tag}`
        : league.dire.name;
    $("#right_team #main").text(direName).css("color", diant_right);
  } else {
    $("#right_team #main")
      .text(teams.right.name.toUpperCase())
      .css("color", diant_right);
  }
  // ... existing code ...
  //#endregion

  //#region Team Score
  // $("#left_team #score")
  //   .text(data.info.map.radiant_score)
  //   .css("color", radiant_left);
  // $("#right_team #score")
  //   .text(data.info.map.dire_score)
  //   .css("color", diant_right);
  //#endregion

  //#region Poles
  $("#left_team .bar").css("background-color", radiant_left);
  $("#right_team .bar").css("background-color", diant_right);
  /*$("#left_team #alert #alert_pole_right").css("background-color", teams.left.side == "ct" ? COLOR_NEW_CT : COLOR_NEW_T);
    $("#right_team #alert #alert_pole_left").css("background-color", teams.right.side == "ct" ? COLOR_NEW_CT : COLOR_NEW_T);
    $("#match_pole_1").css("background-color", teams.left.side == "ct" ? COLOR_NEW_CT : COLOR_NEW_T);
    $("#match_pole_2").css("background-color", teams.right.side == "ct" ? COLOR_NEW_CT : COLOR_NEW_T);
    //#endregion
  */
  //#region Team Logos
  if (!teams.left.logo) {
    teams.left.logo = "logo_" + "left" + "_default.webp";
  }
  if (!teams.right.logo) {
    teams.right.logo = "logo_" + "right" + "_default.webp";
  }
  $("#left_team #team_logo").attr("src", "/storage/" + teams.left.logo);
  $("#right_team #team_logo").attr("src", "/storage/" + teams.right.logo);
  //#endregion

  //#region Team Flag
  if (teams.left.flag && disp_team_flags) {
    $("#left_team #team_flag").css(
      "background-image",
      "url(/files/img/flags-50/" + teams.left.flag + ".png)"
    );
  } else {
    $("#left_team #team_flag").css("background-image", "");
  }
  if (teams.right.flag && disp_team_flags) {
    $("#right_team #team_flag").css(
      "background-image",
      "url(/files/img/flags-50/" + teams.right.flag + ".png)"
    );
  } else {
    $("#right_team #team_flag").css("background-image", "");
  }
  //#endregion
}

function updateStateLive(map) {
  //console.log(map.clock_time);
  if (map.clock_time) {
    var clock_time = Math.abs(Math.ceil(map.clock_time));
    var count_minute = Math.floor(clock_time / 60);
    var count_seconds = clock_time - count_minute * 60;
    if (count_seconds < 10) {
      count_seconds = "0" + count_seconds;
    }
    $("#round_timer_text").text(count_minute + ":" + count_seconds);
  }
}

function updateObserver(observed, players) {
  console.log(observed);

  // Находим первого игрока с выбранным юнитом
  const player = observed.find((player) => player.selected_unit);

  if (player) {
    const { avatar, name: playerName } = player; // Деструктуризация для получения имени и аватара игрока

    // Устанавливаем имя игрока
    $("#obs_alias_text").text(playerName);

    // Проверяем наличие аватара и обновляем изображение
    if (avatar) {
      requestAnimationFrame(() => {
        $("#obs_img").attr("src", `/storage/${avatar}`).show(); // Используем fadeIn для плавного появления
        $("#obs_img2").hide();
      });
    } else {
      $("#obs_img").hide();
      $("#obs_img2")
        .attr("src", "/storage/dota2/player_silhouette.webp")

        .show();
    }
  }
  //.fadeIn(200)
  // ... existing code ...
  // Если selected_unit у всех false, скрываем observed
  const anySelected = observed.some((player) => player.selected_unit);
  if (!anySelected) {
    $("#observed").css("opacity", "0");
  }

  /*// Функция для поиска игрока и его аватара в базе players
  function findPlayerAvatar(searchName) {
    for (let playerId in data.info.players) {
      if (data.info.players[playerId].displayed_name === searchName) {
        return data.info.players[playerId].avatar;
      }
    }
    return null;
  }

  // Проверяем левую команду (player0-player4)
  for (let i = 0; i < 5; i++) {
    if (data.info.hero.team2[`player${i}`].selected_unit) {
      const playerName = data.info.player.team2[`player${i}`].name;
      const avatar = findPlayerAvatar(playerName);

      if (avatar) {
        $("#obs_img").attr("src", `/storage/${avatar}`).show();
        $("#obs_img2").hide();
        $("#obs_alias_text").text(playerName);
      } else {
        $("#obs_img").hide();
        $("#obs_img2")
          .attr("src", "/storage/dota2/player_silhouette.webp")
          .show();
        $("#obs_alias_text").text(playerName);
      }
      return;
    }
  }

  // Проверяем правую команду (player5-player9)
  for (let i = 5; i < 10; i++) {
    if (data.info.hero.team3[`player${i}`].selected_unit) {
      const playerName = data.info.player.team3[`player${i}`].name;
      const avatar = findPlayerAvatar(playerName);

      if (avatar) {
        $("#obs_img").attr("src", `/storage/${avatar}`).show();
        $("#obs_img2").hide();
        $("#obs_alias_text").text(playerName);
      } else {
        $("#obs_img").hide();
        $("#obs_img2")
          .attr("src", "/storage/dota2/player_silhouette.webp")
          .show();
        $("#obs_alias_text").text(playerName);
      }
      return;
    }
  }

  // Если никто не выбран, скрываем observed
  $("#observed").css("opacity", "0");
  */
}

function abilitiesUlta(abilities, players) {
  // Проходим по всем игрокам (0-9)
  for (let player = 0; player < 10; player++) {
    // Определяем команду и номер игрока
    const team = player < 5 ? "team2" : "team3";
    const playerNum = player < 5 ? player : player - 5;

    // HTML элементы нумеруются с 1 до 10, а игроки с 0 до 9
    const uiIndex = player + 1;

    // Проверяем способности от 0 до 8 для каждого игрока
    for (let i = 0; i < 9; i++) {
      const ability = abilities[team][`player${player}`][`ability${i}`];

      // Если находим ульту
      if (ability && ability.ultimate === true) {
        //console.log(`Найдена ульта игрока ${player}: ${ability.name}`);

        // Отображаем название ульты для конкретного игрока
        $(`#ultimate_name_${uiIndex}`).text(ability.name);

        // Проверяем кулдаун
        if (ability.cooldown !== 0) {
          // Если кулдаун не 0, показываем картинку и значение кулдауна
          $(`#ultimate_image_${uiIndex}`)
            .attr({
              src: `/storage/dota2/abilities/${ability.name}.webp`,
              alt: ability.name,
            })
            .show();
          $(`#ultimate_cooldown_${uiIndex}`)
            .text(Math.ceil(ability.cooldown))
            .show();
        } else {
          // Если кулдаун 0, скрываем картинку и значение кулдауна
          $(`#ultimate_image_${uiIndex}`).hide();
          $(`#ultimate_cooldown_${uiIndex}`).hide();
        }

        break; // Переходим к следующему игроку после нахождения ульты
      }
    }
  }
}
