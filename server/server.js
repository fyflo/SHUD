const express = require("express");
const ip = require("ip");
const path = require("path"); // Перемещаем сюда импорт path
const app = express();
const gsiApp = express();
const https = require("https");
const fs = require("fs");
const selfsigned = require("selfsigned");
const { Server } = require("socket.io"); // Добавляем импорт Server из socket.io
const compression = require("compression");

// Опциональная интеграция csgogsi для точных метрик ADR
let CSGOGSI = null;
let GSI = null;
let lastCsgogsiParsed = null;
try {
  ({ CSGOGSI } = require("csgogsi"));
  GSI = new CSGOGSI();
  GSI.on("data", (parsed) => {
    lastCsgogsiParsed = parsed;
  });
  console.log("CSGOGSI: интеграция активна (будет использован ADR из парсера)");
} catch (e) {
  console.log("CSGOGSI: пакет не установлен, используется локальный расчёт ADR (npm i csgogsi для включения)");
}

// Включаем сжатие для всех ответов
app.use(compression());
gsiApp.use(compression());

// Добавим полифил/проверку fetch для Node < 18
let fetchFn = global.fetch;
if (!fetchFn) {
  try {
    fetchFn = async (...args) => {
      const mod = await import("node-fetch");
      return mod.default(...args);
    };
    console.log("Используется полифил fetch (node-fetch)");
  } catch (e) {
    console.warn(
      "Global fetch недоступен. Установите Node 18+ или добавьте зависимость node-fetch"
    );
  }
}

// 2. Добавим функцию генерации сертификатов
function generateCertificate() {
  console.log("Генерация самоподписанных SSL-сертификатов...");
  const attrs = [{ name: "commonName", value: "localhost" }];
  const pems = selfsigned.generate(attrs, { days: 365 });

  const certPath = path.join(__dirname, "ssl-cert.pem");
  const keyPath = path.join(__dirname, "ssl-key.pem");

  fs.writeFileSync(certPath, pems.cert);
  fs.writeFileSync(keyPath, pems.private);

  return {
    cert: pems.cert,
    key: pems.private,
  };
}

// 3. Проверяем существование или создаем сертификаты
let sslOptions;
try {
  const certPath = path.join(__dirname, "ssl-cert.pem");
  const keyPath = path.join(__dirname, "ssl-key.pem");

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log("Загружаем существующие SSL-сертификаты");
    sslOptions = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    };
  } else {
    sslOptions = generateCertificate();
  }
} catch (error) {
  console.error("Ошибка при подготовке SSL:", error);
  // В случае ошибки продолжаем работу в HTTP режиме
  sslOptions = null;
}

// 1. Объявите переменную ioHttps ДО использования
// Переместите эту строку перед блоком if (sslOptions)
let ioHttps = null;

// 4. Создаем оба сервера - HTTP и HTTPS
// Оставляем оригинальный HTTP для совместимости
const http = require("http").createServer(app);
// Добавляем HTTPS сервер
let httpsServer = null;
let httpsGsiServer = null;

if (sslOptions) {
  try {
    httpsServer = https.createServer(sslOptions, app);
    httpsGsiServer = https.createServer(sslOptions, gsiApp);
    console.log("HTTPS серверы созданы успешно");

    // Инициализация Socket.IO для HTTPS - теперь переменная уже объявлена
    ioHttps = new Server(httpsServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    console.log("ioHttps (Socket.IO для HTTPS) инициализирован");

    // Настройка обработчиков событий
    ioHttps.on("connection", function (socket) {
      console.log("Новое подключение к HTTPS WebSocket");

      socket.on("ready", () => {
        console.log("Клиент на HTTPS отправил ready");
        socket.emit("gsi", gameState);

        // Получаем активный матч и данные команд
        // ... (аналогично коду для HTTP WebSocket)
      });

      socket.on("disconnect", () => {
        console.log("Клиент отключился от HTTPS WebSocket");
      });

      socket.on("hud_data", (data) => {
        console.log("Получены hud_data через HTTPS WebSocket:", data.type);
        ioHttps.emit("hud_data", data);
      });
    });
  } catch (error) {
    console.error("Ошибка при создании HTTPS серверов:", error);
    httpsServer = null;
    httpsGsiServer = null;
    ioHttps = null; // Теперь это нормально, т.к. переменная уже объявлена
  }
}

// 5. Создаем Socket.IO для HTTP
const io = new Server(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Удалите или закомментируйте эти строки, так как ioHttps уже объявлен выше
// Если HTTPS успешно создан, также подключаем Socket.IO к нему
// let ioHttps = null;
if (httpsServer && ioHttps) {
  // Дублируем обработчики событий с io на ioHttps
  ioHttps.on("connection", (socket) => {
    socket.on("ready", () => {
      socket.emit("gsi", gameState);

      // Получаем активный матч и данные команд (код такой же как для io)
      db.get(
        `
                SELECT 
                    m.*,
                    t1.name as team1_name,
                    t1.short_name as team1_short_name,
                    t2.name as team2_name,
                    t2.short_name as team2_short_name,
                    mm.id as map_id,
                    mm.map_name,
                    mm.pick_team,
                    mm.side_pick_team,
                    mm.order_number,
                    mm.score_team1 as map_score_team1,
                    mm.score_team2 as map_score_team2,
                    mm.status as map_status,
                    -- Используем winner_team и winner_logo напрямую
                    mm.winner_team as winner_team,
                    mm.winner_logo as winner_logo,
                    mm.original_pick_team_name as pick_team_name,
                    mm.original_pick_team_logo as pick_team_logo
                FROM matches m
                LEFT JOIN teams t1 ON m.team1_id = t1.id
                LEFT JOIN teams t2 ON m.team2_id = t2.id
                LEFT JOIN match_maps mm ON m.id = mm.match_id
                WHERE m.status IN ('pending', 'active')
                ORDER BY m.created_at DESC, mm.order_number ASC
            `,
        [],
        (err, rows) => {
          if (err) {
            //console.error('Ошибка при получении списка матчей:', err);
            return res.status(500).json({ error: err.message });
          }

          // Преобразуем результаты в структуру матчей с картами
          const matches = [];
          let currentMatch = null;

          rows.forEach((row) => {
            // Если это новый матч или первая запись
            if (!currentMatch || currentMatch.id !== row.id) {
              currentMatch = {
                id: row.id,
                team1_id: row.team1_id,
                team2_id: row.team2_id,
                team1_name: row.team1_name,
                team1_short_name: row.team1_short_name || "",
                team2_name: row.team2_name,
                team2_short_name: row.team2_short_name || "",
                format: row.format,
                status: row.status,
                score_team1: row.score_team1,
                score_team2: row.score_team2,
                created_at: row.created_at,
                match_time: row.match_time || "", // <--- добавлено
                maps: [],
              };
              matches.push(currentMatch);
            }

            // Добавляем карту, если она есть
            if (row.map_id) {
              currentMatch.maps.push({
                id: row.map_id,
                map_name: row.map_name,
                pick_team: row.pick_team,
                side_pick_team: row.side_pick_team,
                status: row.map_status,
                score_team1: row.map_score_team1,
                score_team2: row.map_score_team2,
                order_number: row.order_number,
                name_team_pick: row.pick_team_name || null,
                logo_team_pick: row.pick_team_logo || null,
                winner_team: row.winner_team,
                winner_logo: row.winner_logo,
                match_time: row.match_time || "",
              });
            }
          });

          res.json(matches);
        }
      );
    });

    socket.on("hud_data", (data) => {
      ioHttps.emit("hud_data", data);
    });
  });
}

// 6. Изменяем отправку событий - нужно отправлять в оба сокета
// Создаем функцию для рассылки
function broadcastToAllClients(event, data) {
  // Всегда отправляем через HTTP Socket.IO
  io.emit(event, data);

  // Если есть HTTPS Socket.IO, отправляем и через него
  if (ioHttps) {
    ioHttps.emit(event, data);
  }
}

// Получаем IP адрес сервера
const serverIP = ip.address();

// Настройка статических файлов
app.use(express.static("public"));

// Настройка кэширования для статических файлов
app.use(
  express.static("public", {
    maxAge: "1h",
    etag: true,
    lastModified: true,
  })
);

// Настройка кэширования для GSI-сервера
gsiApp.use(
  express.static("public", {
    maxAge: "1h",
    etag: true,
    lastModified: true,
  })
);

// Socket.IO подключения
io.on("connection", (socket) => {
  //console.log('Клиент подключился');

  socket.on("disconnect", () => {
    //console.log('Клиент отключился');
  });

  // Обработчик для получения текущего киллфида
  socket.on("get_killfeed", () => {
    socket.emit("killfeed", {
      type: "current_kills",
      all_kills: gameState.killfeed || []
    });
  });

  // Обработчик тестовых событий киллфида
  socket.on("test_killfeed", (killData) => {
    console.log('Сервер: Получены тестовые данные киллфида:', killData);
    addKillToKillfeed(killData);
  });
});

// Маршрут для получения информации о сервере
app.get("/api/server-info", (req, res) => {
  res.json({
    ip: serverIP,
    port: PORT,
  });
});

const multer = require("multer");
const { exec } = require("child_process");
const sqlite3 = require("sqlite3").verbose();
//// ELECTRON_APP_PATCH
// Определяем путь к базе данных в зависимости от окружения
const dbPath = process.env.ELECTRON_APP
  ? path.join(__dirname, "../database.db") // Путь для Electron приложения
  : "database.db"; // Стандартный путь

console.log("Используется база данных:", dbPath);
const db = new sqlite3.Database(dbPath); // Изменить с database.sqlite на database.db

// Загрузка локализаций (устойчиво к отсутствию файлов)
function loadLocale(lang) {
  const candidates = [
    path.join(__dirname, "../public/locales/" + lang + ".js"),
    path.join(__dirname, "../public/locales/" + lang + ".json"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return require(p);
      }
    } catch (e) {
      // ignore and try next
    }
  }
  return {};
}

const locales = {
  ru: loadLocale("ru"),
  en: loadLocale("en"),
  zh: loadLocale("zh"),
};

// Создаем отдельный сервер для GSI данных
const gsiServer = require("http").createServer(gsiApp);

// Добавляем парсеры для JSON и URL-encoded данных
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
gsiApp.use(express.json({ limit: "50mb" }));
gsiApp.use(express.urlencoded({ extended: true }));

// Настройка статических файлов для основного сервера
app.use(express.static(path.join(__dirname, "../public")));
app.use("/huds", express.static(path.join(__dirname, "../public/huds")));

// Настройка статических файлов для GSI-сервера
gsiApp.use(express.static(path.join(__dirname, "../public")));
gsiApp.use(
  "/uploads",
  express.static(path.join(__dirname, "../public/uploads"))
);
gsiApp.use("/images", express.static(path.join(__dirname, "../public/images")));

// Настройка хранения файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// Создаем папку для загрузок, если её нет
const uploadsDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Подключаем маршруты API
const matchesRoutes = require("./routes/matches");
const teamsRoutes = require("./routes/teams");
const playersRoutes = require("./routes/players");

// Делаем базу данных доступной в маршрутах
app.locals.db = db;

// Используем маршруты
app.use("/api/matches", matchesRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/api/players", playersRoutes);

// Middleware для определения языка (исправленный с проверкой на undefined)
app.use((req, res, next) => {
  // Проверяем, что cookies определены
  const cookies = req.cookies || {};

  // Получаем предпочтительный язык из куки или параметра запроса
  let lang = cookies.lang || req.query.lang || "ru"; // По умолчанию русский

  // Проверяем, поддерживается ли выбранный язык
  if (!locales[lang]) {
    lang = "ru";
  }

  // Сохраняем выбранный язык в куки на 1 год, если он был передан в запросе
  if (req.query.lang && req.query.lang !== cookies.lang) {
    res.cookie("lang", lang, { maxAge: 365 * 24 * 60 * 60 * 1000 });
  }

  // Добавляем переменные локализации к res.locals для использования в шаблонах
  res.locals.lang = lang;
  res.locals.t = locales[lang];

  next();
});

// API для изменения языка
app.get("/api/change-language", (req, res) => {
  const lang = req.query.lang || "ru";

  if (locales[lang]) {
    // Просто возвращаем выбранный язык без сохранения в cookies
    res.json({ success: true, language: lang });
  } else {
    res.status(400).json({ success: false, message: "Unsupported language" });
  }
});

// API для получения текущего языка и всех доступных переводов
app.get("/api/get-translations", (req, res) => {
  const lang = req.query.lang || "ru";
  const translationsToSend = locales[lang] || locales["ru"]; // Если выбранного языка нет, используем русский

  res.json({
    language: lang,
    translations: translationsToSend,
  });
});

// Настройка базы данных
// DB_FIX_APPLIED - Используем существующее подключение к базе данных

// Проверяем наличие колонки short_name в таблице teams
db.all(`PRAGMA table_info(teams)`, (err, rows) => {
  if (err) {
    console.error("Ошибка при проверке схемы таблицы teams:", err);
    return;
  }

  // Проверяем существование колонки short_name
  const hasShortName = rows && rows.some((row) => row.name === "short_name");

  if (!hasShortName) {
    db.run(`ALTER TABLE teams ADD COLUMN short_name TEXT`, (err) => {
      if (err) {
        console.error("Ошибка при добавлении колонки short_name:", err);
      } else {
        console.log("Колонка short_name успешно добавлена в таблицу teams");
      }
    });
  } else {
    console.log("Колонка short_name уже существует в таблице teams");
  }
});

// В начале файла после создания базы данных
db.serialize(() => {
  // Создание таблицы teams
  db.run(`CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        logo TEXT,
        region TEXT,
        short_name TEXT
    )`);

  // Создание таблицы players
  db.run(`CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT NOT NULL,
        realName TEXT,
        steam64 TEXT,
        teamId INTEGER,
        avatar TEXT,
        cameraLink TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(teamId) REFERENCES teams(id)
    )`);

  // Создание основной структуры таблицы matches
  db.run(`CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team1_id INTEGER,
        team2_id INTEGER,
        format TEXT DEFAULT 'bo1',
            match_time TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        score_team1 INTEGER DEFAULT 0,
        score_team2 INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(team1_id) REFERENCES teams(id),
        FOREIGN KEY(team2_id) REFERENCES teams(id)
    )`);

 

  // Обновляем существующие записи, где format пустой или NULL


  // Добавляем колонки для счета, если их нет
  db.run(
    `
        SELECT score_team1 FROM matches LIMIT 1
    `,
    [],
    (err) => {
      if (err) {
        // Колонка не существует, добавляем её
        db.run(`ALTER TABLE matches ADD COLUMN score_team1 INTEGER DEFAULT 0`);
      }
    }
  );

  db.run(
    `
        SELECT score_team2 FROM matches LIMIT 1
    `,
    [],
    (err) => {
      if (err) {
        // Колонка не существует, добавляем её
        db.run(`ALTER TABLE matches ADD COLUMN score_team2 INTEGER DEFAULT 0`);
      }
    }
  );
  // Удалить/закомментировать дублирующее добавление match_time:
  // db.run(`ALTER TABLE matches ADD COLUMN match_time INTEGER DEFAULT 0`);

  // Проверяем наличие столбца format
  db.all("PRAGMA table_info(matches)", [], (err, rows) => {
    if (err) {
      console.error("Ошибка при проверке структуры таблицы:", err);
      return;
    }

    // Используем метод .some() на массиве rows
    const hasFormatColumn =
      Array.isArray(rows) && rows.some((row) => row.name === "format");

    if (!hasFormatColumn) {
      db.run(
        "ALTER TABLE matches ADD COLUMN format TEXT DEFAULT 'bo1'",
        [],
        (err) => {
          if (err) {
            console.error("Ошибка при добавлении столбца format:", err);
            return;
          }
          console.log("Столбец format успешно добавлен в таблицу matches");
        }
      );
    }
  });

  // Проверяем наличие колонки cameraLink в таблице players
  db.all("PRAGMA table_info(players)", [], (err, rows) => {
    if (err) {
      console.error("Ошибка при проверке структуры таблицы players:", err);
      return;
    }

    const hasCameraLinkColumn =
      Array.isArray(rows) && rows.some((row) => row.name === "cameraLink");

    if (!hasCameraLinkColumn) {
      db.run("ALTER TABLE players ADD COLUMN cameraLink TEXT", [], (err) => {
        if (err) {
          console.error("Ошибка при добавлении столбца cameraLink:", err);
          return;
        }
        console.log("Столбец cameraLink успешно добавлен в таблицу players");
      });
    }
    
    // Проверяем наличие колонки created_at
    const hasCreatedAtColumn =
      Array.isArray(rows) && rows.some((row) => row.name === "created_at");
      
    if (!hasCreatedAtColumn) {
      console.log("Добавляем колонку created_at в таблицу players...");
      // Создаем новую таблицу с нужной структурой
      db.run(`
          CREATE TABLE IF NOT EXISTS players_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              nickname TEXT NOT NULL,
              realName TEXT,
              steam64 TEXT,
              teamId INTEGER,
              avatar TEXT,
              cameraLink TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(teamId) REFERENCES teams(id)
          )
      `, (err) => {
          if (err) {
              console.error("Ошибка при создании новой таблицы players_new:", err);
              return;
          }
          
          // Копируем данные из старой таблицы
          db.run(`
              INSERT INTO players_new (id, nickname, realName, steam64, teamId, avatar, cameraLink)
              SELECT id, nickname, realName, steam64, teamId, avatar, cameraLink FROM players
          `, (err) => {
              if (err) {
                  console.error("Ошибка при копировании данных в новую таблицу:", err);
                  return;
              }
              
              // Удаляем старую таблицу
              db.run("DROP TABLE players", (err) => {
                  if (err) {
                      console.error("Ошибка при удалении старой таблицы:", err);
                      return;
                  }
                  
                  // Переименовываем новую таблицу
                  db.run("ALTER TABLE players_new RENAME TO players", (err) => {
                      if (err) {
                          console.error("Ошибка при переименовании таблицы:", err);
                          return;
                      }
                      
                      console.log("Таблица players успешно обновлена с колонкой created_at");
                  });
              });
          });
      });
    }
  });
});

// Настройка шаблонизатора
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../public"));

// В начале файла, где создаются таблицы

db.serialize(() => {
  // Создаем временную таблицу для хранения данных
  db.run(
    "CREATE TABLE IF NOT EXISTS matches_temp AS SELECT id, team1_id, team2_id, format, status, score_team1, score_team2, created_at, match_time, updated_at FROM matches"
  );

  // Удаляем исходную таблицу
  db.run("DROP TABLE IF EXISTS matches");

  // Создаем новую таблицу с нужной структурой
  db.run(`
        CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team1_id INTEGER,
        team2_id INTEGER,
            format TEXT DEFAULT 'bo1',
            match_time TEXT DEFAULT ' ',
        status TEXT DEFAULT 'pending',
        score_team1 INTEGER DEFAULT 0,
        score_team2 INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(team1_id) REFERENCES teams(id),
        FOREIGN KEY(team2_id) REFERENCES teams(id)
        )
    `);

  // Копируем данные обратно из временной таблицы
  db.run(
    "INSERT INTO matches (id, team1_id, team2_id, format, status, score_team1, score_team2, created_at, match_time, updated_at) SELECT id, team1_id, team2_id, format, status, score_team1, score_team2, created_at, match_time, updated_at FROM matches_temp"
  );

  // Удаляем временную таблицу
  db.run("DROP TABLE IF EXISTS matches_temp");

  console.log("Таблица matches успешно пересоздана со столбцом format");
});

// Стандартные пути установки Steam
const defaultSteamPaths = [
  "C:\\Program Files (x86)\\Steam",
  "C:\\Program Files\\Steam",
  "D:\\Program Files (x86)\\Steam",
  "D:\\Program Files\\Steam",
  "E:\\Program Files (x86)\\Steam",
  "E:\\Program Files\\Steam",
  "F:\\Program Files (x86)\\Steam",
  "F:\\Program Files\\Steam",
  "G:\\Program Files (x86)\\Steam",
  "G:\\Program Files\\Steam",
  "H:\\Program Files (x86)\\Steam",
  "H:\\Program Files\\Steam",
  "I:\\Program Files (x86)\\Steam",
  "I:\\Program Files\\Steam",
  "J:\\Program Files (x86)\\Steam",
  "J:\\Program Files\\Steam",
  "K:\\Program Files (x86)\\Steam",
  "K:\\Program Files\\Steam",
  "L:\\Program Files (x86)\\Steam",
  "L:\\Program Files\\Steam",
  "M:\\Program Files (x86)\\Steam",
  "M:\\Program Files\\Steam",
  "C:\\Steam",
  "D:\\Steam",
  "E:\\Steam",
  "F:\\Steam",
  "G:\\Steam",
  "H:\\Steam",
  "I:\\Steam",
  "J:\\Steam",
  "K:\\Steam",
  "L:\\Steam",
  "M:\\Steam",
];

// Функция для поиска CS2 в стандартных местах
function findCS2Path() {
  // Стандартные пути для библиотек Steam
  const libraryFolders = [];

  // Проверяем стандартные пути установки Steam
  for (const steamPath of defaultSteamPaths) {
    if (fs.existsSync(steamPath)) {
      // Добавляем стандартную библиотеку Steam
      libraryFolders.push(path.join(steamPath, "steamapps"));

      // Проверяем libraryfolders.vdf для дополнительных библиотек
      const libraryVdf = path.join(
        steamPath,
        "steamapps",
        "libraryfolders.vdf"
      );
      if (fs.existsSync(libraryVdf)) {
        try {
          const content = fs.readFileSync(libraryVdf, "utf8");
          // Простой парсинг путей в VDF (не идеальный, но работает для большинства случаев)
          const pathMatches = content.match(/"path"\s+"([^"]+)"/g);
          if (pathMatches) {
            for (const match of pathMatches) {
              const libPath = match
                .match(/"path"\s+"([^"]+)"/)[1]
                .replace(/\\\\/g, "\\");
              libraryFolders.push(path.join(libPath, "steamapps"));
            }
          }
        } catch (err) {
          console.error("Ошибка при чтении libraryfolders.vdf:", err);
        }
      }
    }
  }

  // Проверяем каждую библиотеку на наличие CS2
  for (const libraryPath of libraryFolders) {
    // CS2 может быть по двум путям (старый CS:GO и новый CS2)
    const cs2Paths = [
      path.join(libraryPath, "common", "Counter-Strike Global Offensive"),
      path.join(libraryPath, "common", "Counter-Strike 2"),
    ];

    for (const cs2Path of cs2Paths) {
      if (fs.existsSync(cs2Path)) {
        return cs2Path;
      }
    }
  }

  return null;
}

// Функция для поиска пути к Dota 2
function findDota2Path() {
  // Стандартные пути для библиотек Steam
  const libraryFolders = [];

  // Проверяем стандартные пути установки Steam
  for (const steamPath of defaultSteamPaths) {
    if (fs.existsSync(steamPath)) {
      // Добавляем стандартную библиотеку Steam
      libraryFolders.push(path.join(steamPath, "steamapps"));

      // Проверяем libraryfolders.vdf для дополнительных библиотек
      const libraryVdf = path.join(
        steamPath,
        "steamapps",
        "libraryfolders.vdf"
      );
      if (fs.existsSync(libraryVdf)) {
        try {
          const content = fs.readFileSync(libraryVdf, "utf8");
          // Простой парсинг путей в VDF (не идеальный, но работает для большинства случаев)
          const pathMatches = content.match(/"path"\s+"([^"]+)"/g);
          if (pathMatches) {
            for (const match of pathMatches) {
              const libPath = match
                .match(/"path"\s+"([^"]+)"/)[1]
                .replace(/\\\\/g, "\\");
              libraryFolders.push(path.join(libPath, "steamapps"));
            }
          }
        } catch (err) {
          console.error("Ошибка при чтении libraryfolders.vdf:", err);
        }
      }
    }
  }

  // Проверяем каждую библиотеку на наличие Dota 2
  for (const libraryPath of libraryFolders) {
    // Dota 2 может быть по разным путям
    const dota2Paths = [
      path.join(libraryPath, "common", "dota 2 beta"),
      path.join(libraryPath, "common", "dota 2"),
    ];

    for (const dota2Path of dota2Paths) {
      if (fs.existsSync(dota2Path)) {
        return dota2Path;
      }
    }
  }

  return null;
}

// Функция для поиска CFG директории Dota 2
function findDota2CfgPath() {
  const dota2Path = findDota2Path();
  if (!dota2Path) {
    return null;
  }

  // CFG директория в Dota 2
  const cfgPath = path.join(dota2Path, "game", "dota", "cfg");
  
  if (fs.existsSync(cfgPath)) {
    return cfgPath;
  }
  return null;
}

// Функция для поиска папки gamestate_integration в CFG
function findDota2GsiPath() {
  const cfgPath = findDota2CfgPath();
  if (!cfgPath) {
    return null;
  }

  // Папка gamestate_integration в CFG
  const gsiPath = path.join(cfgPath, "gamestate_integration");
  
  return gsiPath;
}

// Функция для проверки установки CFG файла Dota 2
function checkDota2CfgInstallation() {
  const cfgPath = findDota2CfgPath();
  if (!cfgPath) {
    return {
      installed: false,
      error: 'Dota 2 не найден или CFG директория недоступна'
    };
  }

  const gsiPath = findDota2GsiPath();
  const cfgFile = path.join(gsiPath, 'gamestate_integration_fhud_dota2.cfg');

  const gsiExists = fs.existsSync(gsiPath);
  const cfgExists = fs.existsSync(cfgFile);

  return {
    installed: gsiExists && cfgExists,
    gsiExists: gsiExists,
    cfgExists: cfgExists,
    cfgPath: cfgPath,
    gsiPath: gsiPath,
    cfgFile: cfgFile
  };
}

// Функция для установки CFG файла Dota 2
function installDota2Cfg() {
  const cfgPath = findDota2CfgPath();
  if (!cfgPath) {
    return {
      success: false,
      error: 'Dota 2 не найден или CFG директория недоступна'
    };
  }

  try {
    const gsiPath = findDota2GsiPath();
    const sourceCfgFile = path.join(__dirname, '../cfg/gamestate_integration_fhud_dota2.cfg');
    const targetCfgFile = path.join(gsiPath, 'gamestate_integration_fhud_dota2.cfg');

    // Проверяем существование исходного файла
    if (!fs.existsSync(sourceCfgFile)) {
      return {
        success: false,
        error: `Исходный файл не найден: ${sourceCfgFile}`
      };
    }

    // Создаем папку gamestate_integration, если её нет
    if (!fs.existsSync(gsiPath)) {
      fs.mkdirSync(gsiPath, { recursive: true });
      console.log('Создана папка gamestate_integration:', gsiPath);
    }

    // Копируем CFG файл из project/cfg в Dota 2
    fs.copyFileSync(sourceCfgFile, targetCfgFile);
    console.log('CFG файл скопирован:', sourceCfgFile, '->', targetCfgFile);

    return {
      success: true,
      message: 'CFG файл Dota 2 успешно установлен',
      gsiPath: gsiPath,
      sourceFile: sourceCfgFile,
      targetFile: targetCfgFile
    };

  } catch (error) {
    console.error('Ошибка при установке CFG файла Dota 2:', error);
    return {
      success: false,
      error: `Ошибка при установке: ${error.message}`
    };
  }
}

// Функция для удаления CFG файла Dota 2
function removeDota2Cfg() {
  const cfgPath = findDota2CfgPath();
  if (!cfgPath) {
    return {
      success: false,
      error: 'Dota 2 не найден или CFG директория недоступна'
    };
  }

  try {
    const gsiPath = findDota2GsiPath();
    const cfgFile = path.join(gsiPath, 'gamestate_integration_fhud_dota2.cfg');

    let removed = {
      cfgFile: false,
      gsiFolder: false
    };

    // Удаляем CFG файл
    if (fs.existsSync(cfgFile)) {
      fs.unlinkSync(cfgFile);
      removed.cfgFile = true;
      console.log('Удален CFG файл:', cfgFile);
    }

    // Удаляем папку gamestate_integration, если она пустая
    if (fs.existsSync(gsiPath)) {
      const files = fs.readdirSync(gsiPath);
      if (files.length === 0) {
        fs.rmdirSync(gsiPath);
        removed.gsiFolder = true;
        console.log('Удалена пустая папка gamestate_integration');
      }
    }

    return {
      success: true,
      message: 'CFG файл Dota 2 успешно удален',
      removed: removed,
      cfgPath: cfgPath,
      gsiPath: gsiPath
    };

  } catch (error) {
    console.error('Ошибка при удалении CFG файла Dota 2:', error);
    return {
      success: false,
      error: `Ошибка при удалении: ${error.message}`
    };
  }
}

// Возвращает все найденные корни игр CS:GO/CS2 во всех библиотеках Steam
function findAllCS2Paths() {
  try {
    const roots = new Set();
    const libraryFolders = [];
    for (const steamPath of defaultSteamPaths) {
      if (fs.existsSync(steamPath)) {
        libraryFolders.push(path.join(steamPath, "steamapps"));
        const libraryVdf = path.join(steamPath, "steamapps", "libraryfolders.vdf");
        if (fs.existsSync(libraryVdf)) {
          try {
            const content = fs.readFileSync(libraryVdf, "utf8");
            const pathMatches = content.match(/"path"\s+"([^"]+)"/g) || [];
            for (const m of pathMatches) {
              const libPath = m.match(/"path"\s+"([^"]+)"/)[1].replace(/\\\\/g, "\\");
              libraryFolders.push(path.join(libPath, "steamapps"));
            }
          } catch {}
        }
      }
    }
    for (const libraryPath of libraryFolders) {
      const cs2Candidates = [
        path.join(libraryPath, "common", "Counter-Strike Global Offensive"),
        path.join(libraryPath, "common", "Counter-Strike 2"),
      ];
      for (const p of cs2Candidates) {
        try { if (fs.existsSync(p)) roots.add(p); } catch {}
      }
    }
    return Array.from(roots);
  } catch { return []; }
}

function getAllCs2ConfigDirs() {
  const roots = findAllCS2Paths();
  const dirs = [];
  for (const r of roots) {
    dirs.push(path.join(r, "game", "csgo", "cfg"));
    dirs.push(path.join(r, "csgo", "cfg")); // на случай старой структуры CS:GO
  }
  return dirs;
}

// Проверка и установка конфигов CS2
app.get("/api/check-cs2-configs", (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const customPath = req.query.path; // Позволяем пользователю указать свой путь
    let cs2Path = customPath;

    if (!cs2Path) {
      cs2Path = findCS2Path();
    }

    if (!cs2Path || !fs.existsSync(cs2Path)) {
      return res.json({
        success: false,
        message: "CS2 не найден по стандартным путям. Укажите путь вручную.",
      });
    }

    //console.info("Найдена установка CS2 в", cs2Path);
    // Обновленный правильный путь к конфигам
    const configDir = path.join(cs2Path, "game", "csgo", "cfg");

    // Также проверяем параллельно все найденные корни (CS:GO/CS2)
    const allConfigDirs = getAllCs2ConfigDirs();

    // Проверяем существование обоих конфигов
    const gsiConfigPath = path.join(
      configDir,
      "gamestate_integration_fhud.cfg"
    );
    const observerConfigPath = path.join(configDir, "observer.cfg");
    const observer_offConfigPath = path.join(configDir, "observer_off.cfg");
    const observer2ConfigPath = path.join(configDir, "observer2.cfg"); // Add this line
    const observerHlaeKillConfigPath = path.join(configDir, "observer_HLAE_kill.cfg");

    // Флаг установлен, если файл найден в любом из конфиг-директории
    const anyExists = (rel) => allConfigDirs.some(dir => {
      try { return fs.existsSync(path.join(dir, rel)); } catch { return false; }
    });

    const gsiInstalled = fs.existsSync(gsiConfigPath) || anyExists("gamestate_integration_fhud.cfg");
    const observerInstalled = fs.existsSync(observerConfigPath) || anyExists("observer.cfg");
    const observer_offInstalled = fs.existsSync(observer_offConfigPath) || anyExists("observer_off.cfg");
    const observer2Installed = fs.existsSync(observer2ConfigPath) || anyExists("observer2.cfg");
    const observerHlaeKillInstalled = fs.existsSync(observerHlaeKillConfigPath) || anyExists("observer_HLAE_kill.cfg");

    return res.json({
      success: true,
      gsiInstalled: gsiInstalled,
      observerInstalled: observerInstalled,
      observer_offInstalled: observer_offInstalled,
      observer2Installed: observer2Installed, // Add this line
      observerHlaeKillInstalled: observerHlaeKillInstalled,
      path: cs2Path,
      configPath: configDir,
    });
  } catch (error) {
    console.error("Ошибка при проверке конфигов:", error);
    return res
      .status(500)
      .json({ success: false, message: "Ошибка при проверке конфигов" });
  }
});

// Установка конфигов CS2
app.get("/api/install-cs2-configs", (req, res) => {
  try {
    const customPath = req.query.path;
    let cs2Path = customPath;

    if (!cs2Path) {
      cs2Path = findCS2Path();
    }

    if (!cs2Path || !fs.existsSync(cs2Path)) {
      return res.json({
        success: false,
        message: "CS2 не найден по стандартным путям. Укажите путь вручную.",
      });
    }

    // Обновленный правильный путь к конфигам
    const configDir = path.join(cs2Path, "game", "csgo", "cfg");

    // Создаем директорию конфига, если её нет
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Пути к исходным файлам конфигов из нашего проекта
    // In the install-cs2-configs endpoint:
    const projectCfgDir = resolveProjectCfgDir();
    const sourceGsiPath = path.join(projectCfgDir, "gamestate_integration_fhud.cfg");
    const sourceObserverPath = path.join(projectCfgDir, "observer.cfg");
    const sourceObserver_offPath = path.join(projectCfgDir, "observer_off.cfg");
    const sourceObserver2Path = path.join(projectCfgDir, "observer2.cfg"); // Add this line
    const sourceObserverHlaeKillPath = path.join(projectCfgDir, "observer_HLAE_kill.cfg");

    // Destination paths
    const destGsiPath = path.join(configDir, "gamestate_integration_fhud.cfg");
    const destObserverPath = path.join(configDir, "observer.cfg");
    const destObserver_offPath = path.join(configDir, "observer_off.cfg");
    const destObserver2Path = path.join(configDir, "observer2.cfg"); // Add this line
    const destObserverHlaeKillPath = path.join(configDir, "observer_HLAE_kill.cfg");

    let installed = {
      gsi: false,
      observer: false,
      observer_off: false,
      observer2: false,
      observer_hlae_kill: false,
    }; // Update this line
    let errors = [];

    // Копируем GSI конфиг
    if (fs.existsSync(sourceGsiPath)) {
      fs.copyFileSync(sourceGsiPath, destGsiPath);
      installed.gsi = true;
      //console.info("Установлен GSI конфиг в", destGsiPath);
    } else {
      errors.push("Не найден исходный файл GSI конфига");
    }

    // Копируем Observer конфиг
    if (fs.existsSync(sourceObserverPath)) {
      fs.copyFileSync(sourceObserverPath, destObserverPath);
      installed.observer = true;
      //console.info("Установлен Observer конфиг в", destObserverPath);
    } else {
      errors.push("Не найден исходный файл Observer конфига");
    }

    // Копируем Observer конфиг
    if (fs.existsSync(sourceObserver2Path)) {
      fs.copyFileSync(sourceObserver2Path, destObserver2Path);
      installed.observer2 = true;
      //console.info("Установлен Observer конфиг в", destObserverPath);
    } else {
      errors.push("Не найден исходный файл Observer2 конфига");
    }

    // Копируем Observer_off конфиг
    if (fs.existsSync(sourceObserver_offPath)) {
      fs.copyFileSync(sourceObserver_offPath, destObserver_offPath);
      installed.observer_off = true;
      //console.info("Установлен Observer_off конфиг в", destObserver_offPath);
    } else {
      errors.push("Не найден исходный файл Observer_off конфига");
    }

    // Копируем observer_HLAE_kill конфиг
    if (fs.existsSync(sourceObserverHlaeKillPath)) {
      fs.copyFileSync(sourceObserverHlaeKillPath, destObserverHlaeKillPath);
      installed.observer_hlae_kill = true;
    } else {
      errors.push("Не найден исходный файл observer_HLAE_kill.cfg");
    }

    if (errors.length > 0) {
      return res.json({
        success: false,
        message: errors.join(". "),
        installed: installed,
      });
    }

    return res.json({
      success: true,
      message: "Конфиги успешно установлены",
      installed: installed,
      configPath: configDir,
    });
  } catch (error) {
    //console.error("Ошибка при установке конфигов:", error);
    return res
      .status(500)
      .json({ success: false, message: "Ошибка при установке конфигов" });
  }
});

// Создание нового матча без использования поля format
app.post("/api/matches", (req, res) => {
  const { team1_id, team2_id, format } = req.body;

  // Проверка наличия обязательных полей
  if (!team1_id || !team2_id) {
    return res.status(400).json({
      error: "Обязательные поля отсутствуют",
      details: "team1_id и team2_id обязательны",
    });
  }

  db.run(
    `
        INSERT INTO matches (team1_id, team2_id, status, format) 
        VALUES (?, ?, 'pending', ?)
    `,
    [team1_id, team2_id, format || 'bo1'],
    function (err) {
      if (err) {
        console.error("Ошибка при создании матча:", err);
        return res.status(500).json({
          error: "Ошибка при создании матча",
          details: err.message,
        });
      }

      // Возвращаем ID созданного матча
      res.json({
        success: true,
        matchId: this.lastID,
        message: "Матч успешно создан",
      });
    }
  );
});

// Получение списка матчей
app.get("/api/matches", (req, res) => {
  logMatchesApi(
    `Запрос к /api/matches | DB_PATH: ${dbPath} | Параметры: ${JSON.stringify(
      req.query
    )}`
  );
  db.all(
    `
        SELECT 
            m.*,
            t1.name as team1_name,
            t1.short_name as team1_short_name,
            t2.name as team2_name,
            t2.short_name as team2_short_name,
            mm.id as map_id,
            mm.map_name,
            mm.pick_team,
            mm.side_pick_team,
            mm.order_number,
            mm.score_team1 as map_score_team1,
            mm.score_team2 as map_score_team2,
            mm.status as map_status,
            -- Используем winner_team и winner_logo напрямую
            mm.winner_team as winner_team,
            mm.winner_logo as winner_logo,
            mm.original_pick_team_name as pick_team_name,
            mm.original_pick_team_logo as pick_team_logo
        FROM matches m
        LEFT JOIN teams t1 ON m.team1_id = t1.id
        LEFT JOIN teams t2 ON m.team2_id = t2.id
        LEFT JOIN match_maps mm ON m.id = mm.match_id
        WHERE m.status IN ('pending', 'active')
        ORDER BY m.created_at DESC, mm.order_number ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        //console.error('Ошибка при получении списка матчей:', err);
        return res.status(500).json({ error: err.message });
      }

      // Преобразуем результаты в структуру матчей с картами
      const matches = [];
      let currentMatch = null;

      rows.forEach((row) => {
        // Если это новый матч или первая запись
        if (!currentMatch || currentMatch.id !== row.id) {
          currentMatch = {
            id: row.id,
            team1_id: row.team1_id,
            team2_id: row.team2_id,
            team1_name: row.team1_name,
            team1_short_name: row.team1_short_name || "",
            team2_name: row.team2_name,
            team2_short_name: row.team2_short_name || "",
            format: row.format,
            status: row.status,
            score_team1: row.score_team1,
            score_team2: row.score_team2,
            created_at: row.created_at,
            match_time: row.match_time || "", // <--- добавлено
            maps: [],
          };
          matches.push(currentMatch);
        }

        // Добавляем карту, если она есть
        if (row.map_id) {
          currentMatch.maps.push({
            id: row.map_id,
            map_name: row.map_name,
            pick_team: row.pick_team,
            side_pick_team: row.side_pick_team,
            status: row.map_status,
            score_team1: row.map_score_team1,
            score_team2: row.map_score_team2,
            order_number: row.order_number,
            name_team_pick: row.pick_team_name || null,
            logo_team_pick: row.pick_team_logo || null,
            winner_team: row.winner_team,
            winner_logo: row.winner_logo,
          });
        }
      });

      res.json(matches);
    }
  );
});

// Обработчик обновления счета матча
app.post("/api/matches/:id/score", async (req, res) => {
  const matchId = req.params.id;
  const { team, change, swap } = req.body; // Добавляем параметр swap

  //console.log('Получен запрос на обновление счета:', { matchId, team, change, swap });

  try {
    // Проверяем существование матча
    const match = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM matches WHERE id = ?", [matchId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!match) {
      //console.log('Матч не найден:', matchId);
      return res.status(404).json({ error: "Матч не найден" });
    }

    // Определяем поле для обновления
    let scoreField = team === 1 ? "score_team1" : "score_team2";
    let currentScore = match[scoreField] || 0;
    let newScore = Math.max(0, currentScore + change);

    // Если swap равен true, меняем местами счет команд
    if (swap) {
      const tempScore = match.score_team1;
      match.score_team1 = match.score_team2;
      match.score_team2 = tempScore;
      //console.log('Счет команд поменян местами:', {
      //    score_team1: match.score_team1,
      //    score_team2: match.score_team2
      //});
    }

    //console.log('Обновление счета:', {
    //    matchId,
    //    scoreField,
    //    currentScore,
    //    newScore
    //});

    // Обновляем счет в базе данных
    await new Promise((resolve, reject) => {
      const query = `UPDATE matches SET ${scoreField} = ? WHERE id = ?`;
      //console.log('SQL запрос:', query, [newScore, matchId]);

      db.run(query, [newScore, matchId], function (err) {
        if (err) {
          //console.error('Ошибка SQL:', err);
          reject(err);
        } else {
          //console.log('Счет обновлен успешно');
          resolve(this.changes);
        }
      });
    });

    // Получаем обновленные данные матча
    const updatedMatch = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM matches WHERE id = ?", [matchId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json({
      success: true,
      match: updatedMatch,
    });
  } catch (error) {
    //console.error('Ошибка при обновлении счета:', error);
    res.status(500).json({
      error: "Ошибка при обновлении счета",
      details: error.message,
    });
  }
});

// Удаление матча
app.delete("/api/matches/:id", (req, res) => {
  const matchId = req.params.id;

  // Использование транзакции для удаления матча и связанных записей
  db.run("BEGIN TRANSACTION", (err) => {
    if (err) {
      console.error("Ошибка начала транзакции:", err);
      return res.status(500).json({ error: "Ошибка начала транзакции" });
    }

    // Сначала удаляем записи из match_maps
    db.run("DELETE FROM match_maps WHERE match_id = ?", [matchId], (err) => {
      if (err) {
        db.run("ROLLBACK");
        console.error("Ошибка при удалении карт матча:", err);
        return res
          .status(500)
          .json({ error: "Ошибка при удалении карт матча" });
      }

      // Затем удаляем сам матч
      db.run("DELETE FROM matches WHERE id = ?", [matchId], (err) => {
        if (err) {
          db.run("ROLLBACK");
          console.error("Ошибка при удалении матча:", err);
          return res.status(500).json({ error: "Ошибка при удалении матча" });
        }

        // Завершаем транзакцию
        db.run("COMMIT", (err) => {
          if (err) {
            console.error("Ошибка при завершении транзакции:", err);
            return res
              .status(500)
              .json({ error: "Ошибка при завершении транзакции" });
          }

          // Успешный ответ
          res.json({
            success: true,
            message: "Матч успешно удален",
          });
        });
      });
    });
  });
});

// Запуск матча
app.post("/api/matches/:id/start", (req, res) => {
  db.run(
    'UPDATE matches SET status = "active" WHERE id = ?',
    [req.params.id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: "Матч запущен" });
    }
  );
});

// Смена сторон в матче
// Добавляем новые поля в таблицу match_maps для хранения оригинальных данных
app.post("/api/matches/:id/swap", (req, res) => {
  const matchId = req.params.id;

  // Сначала получаем текущие данные о матче и картах
  db.get(
    `
        SELECT 
            m.*,
            t1.id as team1_id,
            t1.name as team1_name,
            t1.logo as team1_logo,
            t2.id as team2_id,
            t2.name as team2_name,
            t2.logo as team2_logo
        FROM matches m
        LEFT JOIN teams t1 ON m.team1_id = t1.id
        LEFT JOIN teams t2 ON m.team2_id = t2.id
        WHERE m.id = ?
    `,
    [matchId],
    (err, match) => {
      if (err) {
        console.error("Ошибка при получении данных матча:", err);
        return res
          .status(500)
          .json({ error: "Ошибка при получении данных матча" });
      }

      if (!match) {
        return res.status(404).json({ error: "Матч не найден" });
      }

      // Получаем данные о картах
      db.all(
        `
            SELECT 
                mm.*,
                mm.original_pick_team_name as name_team_pick,
                mm.original_pick_team_logo as logo_team_pick
            FROM match_maps mm
            WHERE mm.match_id = ?
            ORDER BY mm.order_number
        `,
        [match.id],
        (err, maps) => {
          if (err) {
            console.error("Ошибка при получении данных карт:", err);
            return res
              .status(500)
              .json({ error: "Ошибка при получении данных карт" });
          }

          // Начинаем транзакцию
          db.run("BEGIN TRANSACTION", (beginErr) => {
            if (beginErr) {
              console.error("Ошибка начала транзакции:", beginErr);
              return res
                .status(500)
                .json({ error: "Ошибка начала транзакции" });
            }

            // Сначала сохраняем оригинальные данные о командах, пикнувших карты, если их еще нет
            const saveOriginalDataPromises = maps.map((map) => {
              return new Promise((resolve, reject) => {
                if (
                  !map.original_pick_team_name ||
                  !map.original_pick_team_logo
                ) {
                  let pickTeamName = null;
                  let pickTeamLogo = null;

                  if (map.pick_team === "team1") {
                    pickTeamName = match.team1_name;
                    pickTeamLogo =
                      map.original_pick_team_logo || match.team1_logo;
                  } else if (map.pick_team === "team2") {
                    pickTeamName = match.team2_name;
                    pickTeamLogo =
                      map.original_pick_team_logo || match.team2_logo;
                  } else if (map.pick_team === "DECIDER") {
                    pickTeamName = null;
                    pickTeamLogo = null;
                  }

                  db.run(
                    `
                                UPDATE match_maps 
                                SET original_pick_team_name = ?, original_pick_team_logo = ?
                                WHERE id = ?
                            `,
                    [pickTeamName, pickTeamLogo, map.id],
                    (err) => {
                      if (err) reject(err);
                      else resolve();
                    }
                  );
                } else {
                  resolve();
                }
              });
            });

            // Сохраняем original_winner_* если они еще не заданы
            const saveWinnerDataPromises = maps.map((map) => {
              return new Promise((resolve, reject) => {
                if (map.winner_team && !map.original_winner_team) {
                  console.log(
                    `Сохраняем original_winner_team=${map.winner_team} для карты ${map.map_name}`
                  );
                  db.run(
                    `
                                UPDATE match_maps 
                                SET original_winner_team = ?, original_winner_logo = ?
                                WHERE id = ?
                            `,
                    [map.winner_team, map.winner_logo, map.id],
                    (err) => {
                      if (err) reject(err);
                      else resolve();
                    }
                  );
                } else {
                  resolve();
                }
              });
            });

            // Дожидаемся сохранения оригинальных данных
            Promise.all([
              ...saveOriginalDataPromises,
              ...saveWinnerDataPromises,
            ]).then(() => {
              // Не меняем данные о победителях, просто продолжаем операцию swap
              console.log(
                "Выполняем swap операцию без изменения данных о победителях"
              );

              // Меняем значения pick_team для правильной работы селекторов
              db.run(
                `
                            UPDATE match_maps 
                            SET pick_team = CASE 
                                WHEN pick_team = 'team1' THEN 'team2'
                                WHEN pick_team = 'team2' THEN 'team1'
                                ELSE pick_team
                            END
                            WHERE match_id = ?
                        `,
                [matchId],
                (swapPickErr) => {
                  if (swapPickErr) {
                    db.run("ROLLBACK");
                    console.error(
                      "Ошибка при обновлении pick_team:",
                      swapPickErr
                    );
                    return res
                      .status(500)
                      .json({ error: "Ошибка при обновлении pick_team" });
                  }

                  // Выполняем свап команд в матче, но НЕ меняем данные о победителях карт
                  db.run(
                    `
                                UPDATE matches 
                                SET 
                                    team1_id = team2_id,
                                    team2_id = team1_id,
                                    score_team1 = score_team2,
                                    score_team2 = score_team1
                                WHERE id = ?
                            `,
                    [matchId],
                    (swapTeamsErr) => {
                      if (swapTeamsErr) {
                        db.run("ROLLBACK");
                        console.error("Ошибка при смене сторон:", swapTeamsErr);
                        return res
                          .status(500)
                          .json({ error: "Ошибка при смене сторон" });
                      }

                      // НОВЫЙ КОД: Синхронизируем поля winner_* с original_winner_* после свапа
                      db.run(
                        `
                                    UPDATE match_maps 
                                    SET winner_team = original_winner_team,
                                        winner_logo = original_winner_logo
                                    WHERE match_id = ? AND original_winner_team IS NOT NULL
                                `,
                        [matchId],
                        (syncErr) => {
                          if (syncErr) {
                            db.run("ROLLBACK");
                            console.error(
                              "Ошибка при синхронизации данных победителей:",
                              syncErr
                            );
                            return res.status(500).json({
                              error:
                                "Ошибка при синхронизации данных победителей",
                            });
                          }

                          // Остальной код остается без изменений...
                          // Подтверждаем транзакцию
                          db.run("COMMIT", (commitErr) => {
                            if (commitErr) {
                              console.error(
                                "Ошибка при подтверждении транзакции:",
                                commitErr
                              );
                              return res.status(500).json({
                                error: "Ошибка при подтверждении транзакции",
                              });
                            }

                            // Отправляем успешный ответ клиенту
                            res.json({
                              success: true,
                              message: "Стороны успешно изменены",
                            });
                          });
                        }
                      );
                    }
                  );
                }
              );
            });
          });
        }
      );
    }
  );
});

// Получение данных матча для редактирования
app.get("/api/matches/:id", (req, res) => {
  const matchId = req.params.id;

  db.get(
    `
        SELECT 
            m.*,
            t1.name as team1_name,
            t1.logo as team1_logo,
            t1.short_name as team1_short_name,
            t2.name as team2_name, 
            t2.logo as team2_logo,
            t2.short_name as team2_short_name
        FROM matches m
        LEFT JOIN teams t1 ON m.team1_id = t1.id
        LEFT JOIN teams t2 ON m.team2_id = t2.id
        WHERE m.id = ?
    `,
    [matchId],
    (err, match) => {
      if (err) {
        console.error("Ошибка при получении данных матча:", err);
        return res.status(500).json({ error: err.message });
      }
      if (!match) {
        return res.status(404).json({ error: "Матч не найден" });
      }

      // Получаем данные о картах матча
      db.all(
        `
            SELECT 
                mm.*,
                -- Используем winner_team и winner_logo напрямую без COALESCE
                mm.winner_team,
                mm.winner_logo
            FROM match_maps mm
            WHERE mm.match_id = ?
            ORDER BY mm.order_number
        `,
        [matchId],
        (err, maps) => {
          if (err) {
            console.error("Ошибка при получении данных о картах:", err);
            return res.status(500).json({ error: err.message });
          }

          match.maps = maps || [];
          res.json(match);
        }
      );
    }
  );
});

// Обновление данных матча
app.post("/api/matches/:id/update", async (req, res) => {
  const matchId = req.params.id;
  const { format, maps, match_time } = req.body;

  console.log("=== ОБНОВЛЕНИЕ МАТЧА ===");
  console.log("Match ID:", matchId);
  console.log("Request body:", req.body);
  console.log("match_time:", match_time);
  console.log("format:", format);
  console.log("maps:", maps);
  console.log("Все поля в req.body:", Object.keys(req.body));

  try {
    // Получаем информацию о командах матча
    const match = await new Promise((resolve, reject) => {
      db.get(
        `
                SELECT 
                    m.*,
                    t1.name as team1_name,
                    t1.logo as team1_logo,
                    t2.name as team2_name,
                    t2.logo as team2_logo
                FROM matches m
                LEFT JOIN teams t1 ON m.team1_id = t1.id
                LEFT JOIN teams t2 ON m.team2_id = t2.id
                WHERE m.id = ?
            `,
        [matchId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    console.log("Текущие данные матча:", match);

    // Начинаем транзакцию
    await new Promise((resolve, reject) => {
      db.run("BEGIN TRANSACTION", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Обновляем основные данные матча, включая match_time
    console.log("Обновляем матч с параметрами:", [format, match_time, matchId]);
    await new Promise((resolve, reject) => {
      db.run(
        `
                UPDATE matches 
                SET format = ?,
                    match_time = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `,
        [format, match_time, matchId],
        (err) => {
          if (err) {
            console.error("Ошибка при обновлении матча:", err);
            reject(err);
          } else {
            console.log("Матч успешно обновлен");
            resolve();
          }
        }
      );
    });

    // Удаляем существующие карты матча
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM match_maps WHERE match_id = ?", [matchId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Добавляем новые карты
    if (maps && maps.length > 0) {
      const stmt = db.prepare(`
                INSERT INTO match_maps (
                    match_id, 
                    map_name, 
                    pick_team, 
                    side_pick_team, 
                    order_number,
                    score_team1,
                    score_team2,
                    original_pick_team_name,
                    original_pick_team_logo,
                    map_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

      for (const [index, map] of maps.entries()) {
        let pickTeamName = null;
        let pickTeamLogo = null;

        // Определяем имя и лого команды, выбравшей карту
        if (map.pickTeam === "team1") {
          pickTeamName = match.team1_name;
          pickTeamLogo = match.team1_logo;
        } else if (map.pickTeam === "team2") {
          pickTeamName = match.team2_name;
          pickTeamLogo = match.team2_logo;
        } else if (map.pickTeam === "DECIDER") {
          pickTeamName = null;
          pickTeamLogo = null;
        }

        await new Promise((resolve, reject) => {
          stmt.run(
            [
              matchId,
              map.mapId,
              map.pickTeam || null,
              map.startingSide?.team || null,
              index + 1,
              map.score?.team1 || 0,
              map.score?.team2 || 0,
              pickTeamName, // Сохраняем имя команды, пикнувшей карту
              pickTeamLogo, // Сохраняем лого команды, пикнувшей карту
              map.mapType || "pick",
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      stmt.finalize();
    }

    // Завершаем транзакцию
    await new Promise((resolve, reject) => {
      db.run("COMMIT", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Проверяем результат обновления
    const updatedMatch = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM matches WHERE id = ?`,
        [matchId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    console.log("=== РЕЗУЛЬТАТ ОБНОВЛЕНИЯ ===");
    console.log("Обновленный матч:", updatedMatch);
    console.log("match_time в базе:", updatedMatch?.match_time);

    res.json({
      success: true,
      message: "Матч успешно обновлен",
    });
  } catch (error) {
    // В случае ошибки откатываем транзакцию
    await new Promise((resolve) => {
      db.run("ROLLBACK", () => resolve());
    });

    console.error("Ошибка при обновлении матча:", error);
    res.status(500).json({
      error: "Ошибка при обновлении матча",
      details: error.message,
    });
  }
});

// Обработчик обновления счета карты
app.post("/api/matches/:matchId/map-score", async (req, res) => {
  const matchId = req.params.matchId;
  const { mapIndex, team1Score, team2Score, winner, team1Name, team2Name } =
    req.body;

  //console.log('Получен запрос на обновление счета карты:', { matchId, mapIndex, team1Score, team2Score, winner });

  try {
    // Проверяем существование матча
    const match = await new Promise((resolve, reject) => {
      db.get(
        `
                SELECT 
                    m.*,
                    t1.name as team1_name, t1.logo as team1_logo,
                    t2.name as team2_name, t2.logo as team2_logo
                FROM matches m
                LEFT JOIN teams t1 ON m.team1_id = t1.id
                LEFT JOIN teams t2 ON m.team2_id = t2.id
                WHERE m.id = ?
            `,
        [matchId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!match) {
      //console.log('Матч не найден:', matchId);
      return res.status(404).json({ error: "Матч не найден" });
    }

    // Получаем карты матча, отсортированные по order_number
    const maps = await new Promise((resolve, reject) => {
      db.all(
        `
                SELECT * FROM match_maps 
                WHERE match_id = ? 
                ORDER BY order_number ASC
            `,
        [matchId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Проверяем, существует ли карта с указанным индексом
    if (!maps || maps.length <= mapIndex) {
      //console.log('Карта не найдена:', { matchId, mapIndex });
      return res.status(404).json({ error: "Карта не найдена" });
    }

    const mapToUpdate = maps[mapIndex];

    // Определяем статус карты на основе выбора победителя
    let status = mapToUpdate.status; // Сохраняем текущий статус по умолчанию

    // Определяем победителя на основе выбора или счета
    let winnerTeam = null;
    let winnerLogo = null;

    if (winner === "team1") {
      winnerTeam = match.team1_name;
      winnerLogo = match.team1_logo;
      status = "completed";
    } else if (winner === "team2") {
      winnerTeam = match.team2_name;
      winnerLogo = match.team2_logo;
      status = "completed";
    } else if (team1Score > team2Score) {
      winnerTeam = match.team1_name;
      winnerLogo = match.team1_logo;
      status = "completed";
    } else if (team2Score > team1Score) {
      winnerTeam = match.team2_name;
      winnerLogo = match.team2_logo;
      status = "completed";
    }

    //console.log('Обновление карты:', {
    //    mapId: mapToUpdate.id,
    //    team1Score,
    //    team2Score,
    //    status,
    //    winnerTeam,
    //    winnerLogo
    //});

    // Обновляем счет карты, статус и информацию о победителе
    await new Promise((resolve, reject) => {
      db.run(
        `
                UPDATE match_maps 
                SET score_team1 = ?, score_team2 = ?, status = ?, winner_team = ?, winner_logo = ?,
                    original_winner_team = COALESCE(original_winner_team, ?), 
                    original_winner_logo = COALESCE(original_winner_logo, ?) 
                WHERE id = ?
            `,
        [
          team1Score,
          team2Score,
          status,
          winnerTeam,
          winnerLogo,
          winnerTeam,
          winnerLogo,
          mapToUpdate.id,
        ],
        function (err) {
          if (err) {
            //console.error('Ошибка SQL при обновлении счета карты:', err);
            reject(err);
          } else {
            //console.log('Счет карты обновлен успешно');
            resolve(this.changes);
          }
        }
      );
    });

    // Обновляем GSI данные, если они существуют
    if (global.gsiState && global.gsiState.map) {
      // Если карта в GSI соответствует обновляемой карте
      if (global.gsiState.map.name === mapToUpdate.map_name) {
        // Обновляем счет в GSI данных
        global.gsiState.map.team_ct.score = team1Score;
        global.gsiState.map.team_t.score = team2Score;

        // Отправляем обновление через WebSocket, если доступно
        if (io) {
          io.emit("gsi_update", {
            type: "map_score_update",
            data: {
              matchId: parseInt(matchId),
              mapId: mapToUpdate.id,
              team1Score: team1Score,
              team2Score: team2Score,
              status: status,
              winnerTeam: winnerTeam,
              winnerLogo: winnerLogo,
            },
          });
          //console.log('Отправлено обновление счета карты через WebSocket');
        }
      }
    }

    // Получаем обновленные данные матча
    const updatedMatch = await new Promise((resolve, reject) => {
      db.get(
        `
                SELECT 
                    m.*,
                    t1.name as team1_name,
                    t1.short_name as team1_short_name,
                    t2.name as team2_name,
                    t2.short_name as team2_short_name
                FROM matches m
                LEFT JOIN teams t1 ON m.team1_id = t1.id
                LEFT JOIN teams t2 ON m.team2_id = t2.id
                WHERE m.id = ?
            `,
        [matchId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Получаем обновленные данные о картах
    const updatedMaps = await new Promise((resolve, reject) => {
      db.all(
        `
                SELECT 
                    mm.*,
                    mm.original_pick_team_name as pick_team_name,
                    mm.original_pick_team_logo as pick_team_logo,
                    -- Используем оригинальные данные о победителе, если они есть
                    COALESCE(mm.original_winner_team, mm.winner_team) as winner_team,
                    COALESCE(mm.original_winner_logo, mm.winner_logo) as winner_logo,
                    mm.original_winner_team,
                    mm.original_winner_logo
                FROM match_maps mm
                LEFT JOIN matches m ON mm.match_id = m.id
                LEFT JOIN teams t1 ON m.team1_id = t1.id
                LEFT JOIN teams t2 ON m.team2_id = t2.id
                WHERE mm.match_id = ? 
                ORDER BY mm.order_number ASC
            `,
        [matchId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      success: true,
      message: "Счет карты успешно обновлен",
      match: updatedMatch,
      maps: updatedMaps,
    });
  } catch (error) {
    //console.error('Ошибка при обновлении счета карты:', error);
    res.status(500).json({
      error: "Ошибка при обновлении счета карты",
      details: error.message,
    });
  }
});

// Получение списка доступных карт
app.get("/api/maps", (req, res) => {
  const maps = [
    { id: "de_dust2", name: "Dust II" },
    { id: "de_mirage", name: "Mirage" },
    { id: "de_inferno", name: "Inferno" },
    { id: "de_nuke", name: "Nuke" },
    { id: "de_overpass", name: "Overpass" },
    { id: "de_ancient", name: "Ancient" },
    { id: "de_anubis", name: "Anubis" },
    { id: "de_vertigo", name: "Vertigo" },
    { id: "de_cache", name: "Cache" },
    { id: "de_train", name: "Train" },
  ];
  res.json(maps);
});

// Запуск матча
app.post("/api/matches/:id/start", (req, res) => {
  const matchId = req.params.id;
  db.run(
    'UPDATE matches SET status = "active" WHERE id = ?',
    [matchId],
    (err) => {
      if (err) {
        //console.error('Ошибка при запуске матча:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({
        success: true,
        message: "Матч запущен",
      });
    }
  );
});

// Остановка матча
app.post("/api/matches/:id/stop", (req, res) => {
  const matchId = req.params.id;
  db.run(
    'UPDATE matches SET status = "pending" WHERE id = ?',
    [matchId],
    function (err) {
      if (err) {
        //console.error('Ошибка при остановке матча:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({
        success: true,
        message: "Матч остановлен",
      });
    }
  );
});

// Обновляем маршрут получения списка матчей, чтобы включить только активные матчи
app.get("/api/matches", (req, res) => {
  logMatchesApi(
    `Запрос к /api/matches | DB_PATH: ${dbPath} | Параметры: ${JSON.stringify(
      req.query
    )}`
  );
  db.all(
    `
        SELECT 
            m.*,
            t1.name as team1_name,
            t1.short_name as team1_short_name,
            t2.name as team2_name,
            t2.short_name as team2_short_name,
            mm.id as map_id,
            mm.map_name,
            mm.pick_team,
            mm.side_pick_team,
            mm.order_number,
            mm.score_team1 as map_score_team1,
            mm.score_team2 as map_score_team2,
            mm.status as map_status,
            -- Используем winner_team и winner_logo напрямую
            mm.winner_team as winner_team,
            mm.winner_logo as winner_logo,
            mm.original_pick_team_name as pick_team_name,
            mm.original_pick_team_logo as pick_team_logo
        FROM matches m
        LEFT JOIN teams t1 ON m.team1_id = t1.id
        LEFT JOIN teams t2 ON m.team2_id = t2.id
        LEFT JOIN match_maps mm ON m.id = mm.match_id
        WHERE m.status IN ('pending', 'active')
        ORDER BY m.created_at DESC, mm.order_number ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        //console.error('Ошибка при получении списка матчей:', err);
        return res.status(500).json({ error: err.message });
      }

      // Преобразуем результаты в структуру матчей с картами
      const matches = [];
      let currentMatch = null;

      rows.forEach((row) => {
        // Если это новый матч или первая запись
        if (!currentMatch || currentMatch.id !== row.id) {
          currentMatch = {
            id: row.id,
            team1_id: row.team1_id,
            team2_id: row.team2_id,
            team1_name: row.team1_name,
            team1_short_name: row.team1_short_name || "",
            team2_name: row.team2_name,
            team2_short_name: row.team2_short_name || "",
            format: row.format,
            status: row.status,
            score_team1: row.score_team1,
            score_team2: row.score_team2,
            created_at: row.created_at,
            match_time: row.match_time || "", // <--- добавлено
            maps: [],
          };
          matches.push(currentMatch);
        }

        // Добавляем карту, если она есть
        if (row.map_id) {
          currentMatch.maps.push({
            id: row.map_id,
            map_name: row.map_name,
            pick_team: row.pick_team,
            side_pick_team: row.side_pick_team,
            status: row.map_status,
            score_team1: row.map_score_team1,
            score_team2: row.map_score_team2,
            order_number: row.order_number,
            name_team_pick: row.pick_team_name || null,
            logo_team_pick: row.pick_team_logo || null,
            winner_team: row.winner_team,
            winner_logo: row.winner_logo,
          });
        }
      });

      res.json(matches);
    }
  );
});

// Обновление счета и статуса карты
app.put("/api/matches/:matchId/maps/:mapId", (req, res) => {
  const { matchId, mapId } = req.params;
  const { team1_score, team2_score, status, team1_side } = req.body;

  db.run(
    `UPDATE match_maps 
        SET team1_score = ?, team2_score = ?, status = ?, team1_side = ?
        WHERE id = ? AND match_id = ?`,
    [team1_score, team2_score, status, team1_side, mapId, matchId],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: "Обновлено успешно" });
    }
  );
});

app.post("/api/matches/:matchId/score", async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const { team, change } = req.body;

    //console.log('Получен запрос на обновление счета:', { matchId, team, change });

    // Проверяем структуру таблицы
    const tableInfo = await db.all("PRAGMA table_info(matches)");
    //console.log('Структура таблицы matches:', tableInfo.map(col => col.name));

    // Получаем текущий матч из базы данных
    const match = await db.get("SELECT * FROM matches WHERE id = ?", [matchId]);

    if (!match) {
      return res.status(404).json({ error: "Матч не найден" });
    }

    //console.log('Текущие данные матча:', match);

    // Определяем имена столбцов на основе структуры таблицы
    let team1ScoreField, team2ScoreField;

    // Проверяем возможные варианты имен столбцов
    if (match.hasOwnProperty("team1Score")) {
      team1ScoreField = "team1Score";
      team2ScoreField = "team2Score";
    } else if (match.hasOwnProperty("score_team1")) {
      team1ScoreField = "score_team1";
      team2ScoreField = "score_team2";
    } else if (match.hasOwnProperty("team1_score")) {
      team1ScoreField = "team1_score";
      team2ScoreField = "team2_score";
    } else {
      // Если не нашли подходящих столбцов, выводим все доступные поля
      //console.log('Доступные поля матча:', Object.keys(match));
      return res
        .status(500)
        .json({ error: "Не удалось определить столбцы для счета" });
    }

    // Выбираем нужное поле в зависимости от команды
    const scoreField = team === 1 ? team1ScoreField : team2ScoreField;
    const currentScore = match[scoreField] || 0;
    const newScore = Math.max(0, currentScore + change);

    //console.log('Обновление счета:', {
    //    matchId,
    //    scoreField,
    //    currentScore,
    //    newScore
    //});

    // Формируем SQL запрос с правильными именами столбцов
    const sql = `UPDATE matches SET ${scoreField} = ? WHERE id = ?`;
    //console.log('SQL запрос:', sql, [newScore, matchId]);

    // Выполняем запрос
    await db.run(sql, [newScore, matchId]);

    // Получаем обновленные данные
    const updatedMatch = await db.get("SELECT * FROM matches WHERE id = ?", [
      matchId,
    ]);

    //console.log('Счет обновлен успешно');

    // Обновляем GSI данные
    if (global.gsiState) {
      // Если GSI данные еще не инициализированы, создаем структуру
      if (!global.gsiState.matches) {
        global.gsiState.matches = [];
      }

      // Ищем матч в GSI данных
      let gsiMatch = global.gsiState.matches.find(
        (m) => m.id === parseInt(matchId)
      );

      // Если матч не найден, добавляем его
      if (!gsiMatch) {
        gsiMatch = {
          id: parseInt(matchId),
          team1Score: 0,
          team2Score: 0,
        };
        global.gsiState.matches.push(gsiMatch);
      }

      // Обновляем счет в GSI данных
      gsiMatch.team1Score = updatedMatch[team1ScoreField] || 0;
      gsiMatch.team2Score = updatedMatch[team2ScoreField] || 0;

      //console.log('GSI данные обновлены:', gsiMatch);

      // Отправляем обновление всем подключенным клиентам через WebSocket
      if (io) {
        io.emit("gsi_update", {
          type: "score_update",
          data: {
            matchId: parseInt(matchId),
            team1Score: gsiMatch.team1Score,
            team2Score: gsiMatch.team2Score,
          },
        });
        //console.log('Отправлено обновление через WebSocket');
      }
    }

    res.json({
      success: true,
      team1Score: updatedMatch[team1ScoreField] || 0,
      team2Score: updatedMatch[team2ScoreField] || 0,
    });
  } catch (error) {
    //console.error('Ошибка при обновлении счета:', error);
    res
      .status(500)
      .json({ error: "Ошибка при обновлении счета", details: error.message });
  }
});

// Поиск команд
app.get("/api/teams/search", (req, res) => {
  const { query } = req.query;

  db.all(
    "SELECT * FROM teams WHERE name LIKE ? LIMIT 10",
    [`%${query}%`],
    (err, teams) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(teams);
    }
  );
});

// Получение списка всех команд
// Добавьте этот роут для получения списка команд
app.get("/api/teams", (req, res) => {
  const query = `
        SELECT id, name, logo, region, short_name
        FROM teams 
        ORDER BY name ASC
    `;

  db.all(query, [], (err, teams) => {
    if (err) {
      //console.error('Ошибка при получении списка команд:', err);
      return res.status(500).json({
        error: "Ошибка при получении списка команд",
        details: err.message,
      });
    }

    res.json(teams);
  });
});

app.post("/api/teams", upload.single("logo"), (req, res) => {
  const { name, region, short_name } = req.body;
  // Сохраняем только имя файла, без /uploads/
  const logo = req.file ? req.file.filename : null;

  db.run(
    "INSERT INTO teams (name, region, logo, short_name) VALUES (?, ?, ?, ?)",
    [name, region, logo, short_name || ""],
    function (err) {
      if (err) {
        //console.error('Ошибка при создании команды:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

// Добавьте этот код временно для исправления путей в базе данных
app.get("/api/fix-logo-paths", (req, res) => {
  // Исправляем пути к логотипам команд
  db.all("SELECT id, logo FROM teams", [], (err, teams) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    teams.forEach((team) => {
      if (team.logo && team.logo.startsWith("/uploads/")) {
        const fixedLogo = team.logo.replace("/uploads/", "");
        db.run("UPDATE teams SET logo = ? WHERE id = ?", [fixedLogo, team.id]);
      }
    });

    // Исправляем пути к аватарам игроков
    db.all("SELECT id, avatar FROM players", [], (err, players) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      players.forEach((player) => {
        if (player.avatar && player.avatar.startsWith("/uploads/")) {
          const fixedAvatar = player.avatar.replace("/uploads/", "");
          db.run("UPDATE players SET avatar = ? WHERE id = ?", [
            fixedAvatar,
            player.id,
          ]);
        }
      });

      res.json({ message: "Пути к логотипам и аватарам исправлены" });
    });
  });
});

app.delete("/api/teams/:id", async (req, res) => {
  try {
    const teamId = req.params.id;

    db.run("DELETE FROM teams WHERE id = ?", [teamId], function (err) {
      if (err) {
        //console.error('Ошибка при удалении:', err);
        return res.status(500).json({ message: "Ошибка при удалении команды" });
      }

      if (this.changes === 0) {
        return res
          .status(404)
          .json({ message: `Команда с ID ${teamId} не найдена` });
      }

      res.json({ message: "Команда успешно удалена" });
    });
  } catch (error) {
    //console.error('Ошибка при удалении команды:', error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

app.get("/api/teams/:id", (req, res) => {
  const teamId = req.params.id;

  const query = `
        SELECT * FROM teams WHERE id = ?
    `;

  db.get(query, [teamId], (err, team) => {
    if (err) {
      //console.error('Ошибка при получении данных команды:', err);
      return res.status(500).json({
        message: "Ошибка при получении данных команды",
        error: err.message,
      });
    }

    if (!team) {
      return res.status(404).json({
        message: `Команда с ID ${teamId} не найдена`,
      });
    }

    res.json(team);
  });
});

app.put("/api/teams/:id", upload.single("logo"), (req, res) => {
  const teamId = req.params.id;
  const { name, region, short_name } = req.body;

  db.get("SELECT id FROM teams WHERE id = ?", [teamId], (err, team) => {
    if (err) {
      return res.status(500).json({ message: "Ошибка сервера" });
    }

    if (!team) {
      return res
        .status(404)
        .json({ message: `Команда с ID ${teamId} не найдена` });
    }

    // Сохраняем только имя файла, без /uploads/
    const logo = req.file ? req.file.filename : null;
    let updateQuery = "UPDATE teams SET name = ?, region = ?, short_name = ?";
    let params = [name, region, short_name || ""];

    if (logo) {
      updateQuery += ", logo = ?";
      params.push(logo); // Теперь сохраняем только имя файла
    }

    updateQuery += " WHERE id = ?";
    params.push(teamId);

    db.run(updateQuery, params, function (err) {
      if (err) {
        return res
          .status(500)
          .json({ message: "Ошибка при обновлении команды" });
      }

      res.json({
        message: "Команда успешно обновлена",
        teamId: teamId,
      });
    });
  });
});

// ... existing code ...

app.get("/api/players", (req, res) => {
  const query = `
        SELECT 
            players.*,
            teams.name as teamName
        FROM players 
        LEFT JOIN teams ON players.teamId = teams.id
    `;

  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Дублирующие маршруты игроков были удалены, так как они уже обрабатываются через app.use("/api/players", playersRoutes)

app.get("/api/teams/:teamId/players", (req, res) => {
  const teamId = req.params.teamId;

  db.all(
    `
        SELECT * FROM players 
        WHERE teamId = ?
        ORDER BY nickname
    `,
    [teamId],
    (err, players) => {
      if (err) {
        //console.error('Ошибка при получении игроков команды:', err);
        return res.status(500).json({ error: "Ошибка при получении игроков" });
      }
      res.json(players || []); // Возвращаем пустой массив, если игроков нет
    }
  );
});

// ... existing code ...

// Endpoint для запуска оверлея
app.post("/api/start-overlay", (req, res) => {
  const { hudId } = req.body;

  // Санитизация hudId
  const safeHudId = String(hudId || "");
  if (!/^[A-Za-z0-9_-]+$/.test(safeHudId)) {
    return res.status(400).json({ error: "Некорректный hudId" });
  }

  // Путь к файлу start.bat в папке overlay
  const overlayPath = path.join(__dirname, "../overlay/start.bat");

  // Запускаем оверлей с параметром hudId
  exec(`"${overlayPath}" "${safeHudId}"`, (error) => {
    if (error) {
      //console.error('Error starting overlay:', error);
      res.status(500).json({ error: "Failed to start overlay" });
      return;
    }
    res.json({ success: true });
  });
});

// Функция для сканирования HUD'ов
function scanHUDs() {
  const hudsPath = path.join(__dirname, "../public/huds");
  const huds = [];

  fs.readdirSync(hudsPath).forEach((hudDir) => {
    if (
      !fs.statSync(path.join(hudsPath, hudDir)).isDirectory() ||
      hudDir.startsWith(".")
    ) {
      return;
    }

    const hudPath = path.join(hudsPath, hudDir);
    if (
      fs.existsSync(path.join(hudPath, "template.pug")) ||
      fs.existsSync(path.join(hudPath, "index.html"))
    ) {
      let config = {
        id: hudDir,
        name: hudDir.charAt(0).toUpperCase() + hudDir.slice(1) + " HUD",
        description: "Custom HUD",
      };

      const configPath = path.join(hudPath, "config.json");
      if (fs.existsSync(configPath)) {
        try {
          const hudConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
          config = { ...config, ...hudConfig };
        } catch (e) {
          //console.error(`Ошибка чтения конфига для ${hudDir}:`, e);
        }
      }

      huds.push(config);
    }
  });

  return huds;
}

// Маршруты для HUD
app.get("/api/huds", (req, res) => {
  res.json(scanHUDs());
});

app.get("/hud/:hudId", (req, res) => {
  const { hudId } = req.params;
  res.render(`huds/${hudId}/template`, { hudId });
});

app.get("/hud/:hudId/:file", (req, res) => {
  const { hudId, file } = req.params;
  res.sendFile(path.join(__dirname, `../public/huds/${hudId}/${file}`));
});

// Инициализация начального состояния игры
const gameState = {
  map: {
    name: "",
    mode: "",
    num_matches_to_win_series: "",
    phase: "",
    round: "",
    round_wins: {},
    team_ct: {
      consecutive_round_losses: "",
      matches_won_this_series: "",
      timeouts_remaining: "",
      score: "",
      name: "",
      flag: "",
    },
    team_t: {
      consecutive_round_losses: "",
      matches_won_this_series: "",
      timeouts_remaining: "",
      score: "",
      name: "",
      flag: "",
    },
  },
  phase_countdowns: {
    phase: "",
    phase_ends_in: "",
  },
  player: {
    name: "",
    team: "",
    state: {
      health: 100,
      armor: 0,
      money: 0,
    },
    match_stats: {
      kills: 0,
      assists: 0,
      deaths: 0,
    },
    weapons: {},
  },
  allplayers: {},
  bomb: {},
  grenades: {},
  previously: {},
  provider: {},
  round: {},
  // Хранилище записей киллфида
  killfeed: [],
  // Dota 2 данные
  dota: {
    radiant_team: {
      name: "Radiant",
      logo: "",
      score: 0
    },
    dire_team: {
      name: "Dire", 
      logo: "",
      score: 0
    },
    game_state: "",
    game_time: 0,
    clock_time: 0,
    roshan_state: "",
    match_id: ""
  },
  // Другие Dota 2 поля
  abilities: null,
  buildings: null,
  hero: null,
  items: null,
  draft: null,
  wearables: null,
  league: null,
  couriers: null,
  neutralitems: null,
  roshan: null,
  events: null,
  minimap: null,
  buyback: null,
  observer: null,
  teams: null,
  slot: null,
  name: null
};

// GSI endpoints

// Функция расчета ADR как в csgogsi
function calculateADR(playerData, currentRound, mapData) {
  if (!gameState.roundDamageSnapshots) {
    // roundDamageSnapshots: Array<{ round: number, players: Array<{ steamid: string, damage: number }> }>
    gameState.roundDamageSnapshots = [];
  }
  
  const steamid = playerData?.steamid || playerData?.name || "unknown";
  const roundNumber = Number(currentRound ?? mapData?.round ?? 0) || 0;

  // Берём накопительный урон из GSI для текущего раунда
  const currentRoundDamage = Number(playerData?.state?.round_totaldmg ?? 0);
  
  // Обновляем/создаём снимок для текущего раунда: сохраняем урон всех увиденных игроков
  if (roundNumber > 0) {
    let snapshot = gameState.roundDamageSnapshots.find(s => s.round === roundNumber);
    if (!snapshot) {
      snapshot = { round: roundNumber, players: [] };
      gameState.roundDamageSnapshots.push(snapshot);
    }
    const playerEntry = snapshot.players.find(p => p.steamid === steamid);
    if (playerEntry) {
      playerEntry.damage = currentRoundDamage;
  } else {
      snapshot.players.push({ steamid, damage: currentRoundDamage });
    }
  }

  // Фильтруем только завершённые раунды: строго меньше текущего
  const completedSnapshots = gameState.roundDamageSnapshots.filter(s => s.round < roundNumber);
  if (completedSnapshots.length === 0) return 0;

  // Сумма урона игрока по завершённым раундам
  const damageEntries = completedSnapshots.map(snap => {
    const entry = snap.players.find(p => p.steamid === steamid);
    return entry ? Number(entry.damage) || 0 : 0;
  });

  const totalDamage = damageEntries.reduce((a, b) => a + b, 0);
  const roundsDivisor = Number(mapData?.round || 1) || 1; // делим на фактический номер раунда из raw

  const adr = Math.floor(totalDamage / roundsDivisor);
  return adr;
}

function calculateHSPercent(playerData, currentRound, mapData) {
  // Инициализируем структуру для хранения HS по раундам
  if (!gameState.hsHistory) {
    gameState.hsHistory = {};
  }
  
  // Используем steamid, если доступен, иначе используем только имя игрока
  let playerId = playerData.steamid;
  if (!playerId) {
    // Создаем уникальный ID только на основе имени (без команды)
    playerId = playerData.name;
  }
  
  if (!gameState.hsHistory[playerId]) {
    gameState.hsHistory[playerId] = [];
  }
  
  // Получаем текущие значения за раунд
  const currentRoundKills = playerData.state?.round_kills || 0;
  const currentRoundHS = playerData.state?.round_killhs || 0;
  
  // Находим или создаем запись для текущего раунда
  let roundEntry = gameState.hsHistory[playerId].find(entry => entry.round === currentRound);
  
  if (!roundEntry) {
    roundEntry = {
      round: currentRound,
      kills: currentRoundKills,
      hs: currentRoundHS
    };
    gameState.hsHistory[playerId].push(roundEntry);
  } else {
    // Обновляем значения для текущего раунда
    roundEntry.kills = currentRoundKills;
    roundEntry.hs = currentRoundHS;
  }
  
  // Рассчитываем HS% на основе всех раундов
  const totalKills = gameState.hsHistory[playerId].reduce((sum, entry) => sum + entry.kills, 0);
  const totalHS = gameState.hsHistory[playerId].reduce((sum, entry) => sum + entry.hs, 0);
  
  // HS% = (HS / Kills) * 100
  const hsPercent = totalKills > 0 ? Math.round((totalHS / totalKills) * 100) : 0;
  
  // Отладочная информация
  if (totalKills > 0 || totalHS > 0) {
    //console.log(`HS% для ${playerData.name}: ${hsPercent}% (kills: ${totalKills}, hs: ${totalHS})`);
  }
  
  return hsPercent;
}

// Функция очистки истории урона при смене карты
function cleanupDamageHistory(newMapName) {
  if (gameState.lastMapName && gameState.lastMapName !== newMapName) {
    console.log(`Очистка истории урона: ${gameState.lastMapName} -> ${newMapName}`);
    gameState.damageHistory = {};
    gameState.lastMapName = newMapName;
  }
}

function cleanupHSHistory(newMapName) {
  if (gameState.lastMapName && gameState.lastMapName !== newMapName) {
    console.log(`Очистка истории HS: ${gameState.lastMapName} -> ${newMapName}`);
    gameState.hsHistory = {};
    gameState.lastMapName = newMapName;
  }
}

// Функция для определения MVP раунда
function determineRoundMVP(data, gameState) {
  let winningTeam = null;
  
  // Определяем команду-победителя раунда
  if (data.map && data.map.round_wins) {
    const currentRound = data.map.round;
    const roundWin = data.map.round_wins[currentRound];
    
    if (roundWin) {
      if (roundWin.includes('ct_win')) {
        winningTeam = 'CT';
      } else if (roundWin.includes('t_win')) {
        winningTeam = 'T';
      }
    }
  }
  
  // Ищем игрока с 3+ убийствами из команды-победителя
  if (winningTeam && gameState.allplayers) {
    for (const [playerId, playerData] of Object.entries(gameState.allplayers)) {
      const roundKills = playerData.state?.round_kills || 0;
      
      // Если игрок из команды-победителя и сделал 3+ убийства в раунде
      if (playerData.team === winningTeam && roundKills >= 3) {
        return {
          steamid: playerData.steamid || playerId,
          name: playerData.name,
          team: playerData.team,
          avatar: playerData.avatar,
          mvps: playerData.match_stats?.mvps || 0,
          kills: playerData.match_stats?.kills || 0,
          assists: playerData.match_stats?.assists || 0,
          adr: playerData.state?.adr || 0,
          hs: playerData.state?.hs || 0,
          round_kills: roundKills
        };
      }
    }
  }
  
  return null; // Нет MVP
}

// Функция для проверки, является ли игрок из команды-победителя
function isPlayerFromWinningTeam(playerData, data) {
  let winningTeam = null;
  
  // Определяем команду-победителя раунда
  if (data.map && data.map.round_wins) {
    const currentRound = data.map.round;
    const roundWin = data.map.round_wins[currentRound];
    
    if (roundWin) {
      if (roundWin.includes('ct_win')) {
        winningTeam = 'CT';
      } else if (roundWin.includes('t_win')) {
        winningTeam = 'T';
      }
    }
  }
  
  return winningTeam && playerData.team === winningTeam;
}

// Универсальная функция добавления записи в киллфид и рассылки клиентам
function addKillToKillfeed(kill) {
  try {
    if (!Array.isArray(gameState.killfeed)) gameState.killfeed = [];
    gameState.killfeed.push(kill);
    // Ограничиваем длину хранилища
    if (gameState.killfeed.length > 50) gameState.killfeed.shift();

    // Совместимость с разными клиентами: отправляем оба события
    const payload = { type: 'new_kill', kill };
    broadcastToAllClients('killfeed', payload);
    broadcastToAllClients('killfeed_update', payload);
  } catch (e) {
    console.error('Ошибка добавления в killfeed:', e);
  }
}

// Делаем доступной для других модулей (например, HLAE websocket)
global.addKillToKillfeed = addKillToKillfeed;

gsiApp.post("/gsi", async (req, res) => {
  try {
    //console.log('=== ПОЛУЧЕН GSI ЗАПРОС ===');
    //console.log(`Время: ${new Date().toISOString()}`);
    //console.log(`IP-адрес: ${req.ip || req.connection.remoteAddress}`);
    //console.log('Заголовки:');
    //console.log(JSON.stringify(req.headers, null, 2));

    const data = req.body;
    if (!data) {
      //console.log('Ошибка: Нет данных в GSI запросе');
      return res.sendStatus(400);
    }

    // Проверяем тип игры по provider.name
    const gameType = data.provider?.name;
    console.log(`GSI: получены данные от ${gameType || 'неизвестной игры'}`);
    
    if (gameType === "Dota 2") {
      console.log('GSI: обрабатываем данные Dota 2');
      // Обработка Dota 2
      try {
        // Сначала сбрасываем данные команд, чтобы избежать сохранения старых логотипов
        if (data.league && data.league.radiant) {
          gameState.dota.radiant_team.name = data.league.radiant.name || 'Radiant';
        }
        if (data.league && data.league.dire) {
          gameState.dota.dire_team.name = data.league.dire.name || 'Dire';
        }
        gameState.dota.radiant_team.logo = '';
        gameState.dota.dire_team.logo = '';

        // Обновляем данные Dota 2
        if (data.map) {
          // Обновляем основные данные карты
          gameState.map = data.map;
          
          // Копируем данные в структуру dota для удобства
          gameState.dota.game_state = data.map.game_state || '';
          gameState.dota.game_time = data.map.game_time || 0;
          gameState.dota.clock_time = data.map.clock_time || 0;
          gameState.dota.roshan_state = data.map.roshan_state || '';
          gameState.dota.match_id = data.map.matchid || '';
          
          // Обновляем счет команд
          gameState.dota.radiant_team.score = data.map.radiant_score || 0;
          gameState.dota.dire_team.score = data.map.dire_score || 0;
        }

        // Получаем активный матч с дополнительной информацией
        const match = await new Promise((resolve, reject) => {
          db.get(`
            SELECT 
              m.*,
              t1.name as team1_name, t1.logo as team1_logo,
              t2.name as team2_name, t2.logo as team2_logo
            FROM matches m
            LEFT JOIN teams t1 ON m.team1_id = t1.id
            LEFT JOIN teams t2 ON m.team2_id = t2.id
            WHERE m.status = 'active'
            LIMIT 1
          `, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        // Добавляем флаг matchup в gameState
        gameState.matchupis = !!match;
        
        // Если нет активного матча, очищаем данные матча
        if (!match) {
          gameState.match = null;
        } else {
          // Добавляем формат матча в gameState
          gameState.match = {
            format: match.format || 'bo1',
            status: match.status,
            score_team1_map: match.score_team1 || 0,
            score_team2_map: match.score_team2 || 0,
            matchupis: gameState.matchupis
          };
          
          // Устанавливаем названия команд и логотипы только если есть активный матч
          gameState.dota.radiant_team.name = match.team1_name || 'Radiant';
          gameState.dota.radiant_team.logo = match.team1_logo || '';
          gameState.dota.dire_team.name = match.team2_name || 'Dire';
          gameState.dota.dire_team.logo = match.team2_logo || '';
        }

        // Обрабатываем другие данные Dota 2
        if (data.radiant_team) {
          gameState.radiant_team = data.radiant_team;
          // Если нет активного матча, используем имена из игры
          if (!match) {
            gameState.dota.radiant_team.name = data.radiant_team.name || 'Radiant';
            gameState.dota.radiant_team.logo = data.radiant_team.logo || '';
          }
        }

        if (data.dire_team) {
          gameState.dire_team = data.dire_team;
          // Если нет активного матча, используем имена из игры
          if (!match) {
            gameState.dota.dire_team.name = data.dire_team.name || 'Dire';
            gameState.dota.dire_team.logo = data.dire_team.logo || '';
          }
        }

        // Обрабатываем остальные данные
        if (data.abilities) gameState.abilities = data.abilities;
        if (data.buildings) gameState.buildings = data.buildings;
        
        // Обработка данных игроков с добавлением курьеров и героев
        if (data.player) {
          // Сначала копируем оригинальные данные
          gameState.player = data.player;
          
          // Обрабатываем игроков команды Radiant (team2)
          if (data.player.team2) {
            for (let i = 0; i < 5; i++) {
              const slot = `player${i}`;
              const player = data.player.team2[slot];
              
              if (player) {
                // Добавляем данные о герое
                if (data.hero && data.hero.team2 && data.hero.team2[slot]) {
                  player.hero = data.hero.team2[slot];
                }
                
                // Добавляем данные о предметах
                if (data.items && data.items.team2 && data.items.team2[slot]) {
                  const items = data.items.team2[slot];
                  player.items = {
                    slot0: items.slot0 || { name: "empty" },
                    slot1: items.slot1 || { name: "empty" },
                    slot2: items.slot2 || { name: "empty" },
                    slot3: items.slot3 || { name: "empty" },
                    slot4: items.slot4 || { name: "empty" },
                    slot5: items.slot5 || { name: "empty" },
                    slot6: items.slot6 || { name: "empty" },
                    slot7: items.slot7 || { name: "empty" },
                    slot8: items.slot8 || { name: "empty" },
                    stash0: items.stash0 || { name: "empty" },
                    stash1: items.stash1 || { name: "empty" },
                    stash2: items.stash2 || { name: "empty" },
                    stash3: items.stash3 || { name: "empty" },
                    stash4: items.stash4 || { name: "empty" },
                    stash5: items.stash5 || { name: "empty" },
                    teleport0: items.teleport0 || { name: "empty" },
                    neutral0: items.neutral0 || { name: "empty" },
                  };
                }
                
                // Назначаем курьеров для Radiant
                if (data.couriers) {
                  switch (i) {
                    case 0:
                      player.courier2 = data.couriers.courier2; // player0
                      break;
                    case 1:
                      player.courier3 = data.couriers.courier3; // player1
                      break;
                    case 2:
                      player.courier4 = data.couriers.courier4; // player2
                      break;
                    case 3:
                      player.courier5 = data.couriers.courier5; // player3
                      break;
                    case 4:
                      player.courier6 = data.couriers.courier6; // player4
                      break;
                  }
                }
              }
            }
          }
          
          // Обрабатываем игроков команды Dire (team3)
          if (data.player.team3) {
            for (let i = 5; i < 10; i++) {
              const slot = `player${i}`;
              const player = data.player.team3[slot];
              
              if (player) {
                // Добавляем данные о герое
                if (data.hero && data.hero.team3 && data.hero.team3[slot]) {
                  player.hero = data.hero.team3[slot];
                }
                
                // Добавляем данные о предметах
                if (data.items && data.items.team3 && data.items.team3[slot]) {
                  const items = data.items.team3[slot];
                  player.items = {
                    slot0: items.slot0 || { name: "empty" },
                    slot1: items.slot1 || { name: "empty" },
                    slot2: items.slot2 || { name: "empty" },
                    slot3: items.slot3 || { name: "empty" },
                    slot4: items.slot4 || { name: "empty" },
                    slot5: items.slot5 || { name: "empty" },
                    slot6: items.slot6 || { name: "empty" },
                    slot7: items.slot7 || { name: "empty" },
                    slot8: items.slot8 || { name: "empty" },
                    stash0: items.stash0 || { name: "empty" },
                    stash1: items.stash1 || { name: "empty" },
                    stash2: items.stash2 || { name: "empty" },
                    stash3: items.stash3 || { name: "empty" },
                    stash4: items.stash4 || { name: "empty" },
                    stash5: items.stash5 || { name: "empty" },
                    teleport0: items.teleport0 || { name: "empty" },
                    neutral0: items.neutral0 || { name: "empty" },
                  };
                }
                
                // Назначаем курьеров для Dire
                if (data.couriers) {
                  switch (i) {
                    case 5:
                      player.courier7 = data.couriers.courier7; // player5
                      break;
                    case 6:
                      player.courier8 = data.couriers.courier8; // player6
                      break;
                    case 7:
                      player.courier9 = data.couriers.courier9; // player7
                      break;
                    case 8:
                      player.courier0 = data.couriers.courier0; // player8
                      break;
                    case 9:
                      player.courier1 = data.couriers.courier1; // player9
                      break;
                  }
                }
              }
            }
          }
        }
        
        if (data.hero) gameState.hero = data.hero;
        if (data.provider) gameState.provider = data.provider;
        if (data.items) gameState.items = data.items;
        if (data.draft) gameState.draft = data.draft;
        if (data.wearables) gameState.wearables = data.wearables;
        if (data.league) gameState.league = data.league;
        if (data.couriers) gameState.couriers = data.couriers;
        if (data.neutralitems) gameState.neutralitems = data.neutralitems;
        if (data.roshan) gameState.roshan = data.roshan;
        if (data.events) gameState.events = data.events;
        if (data.minimap) gameState.minimap = data.minimap;
        if (data.phase_countdowns) gameState.phase_countdowns = data.phase_countdowns;
        if (data.buyback) gameState.buyback = data.buyback;
        
        // Сначала сохраняем данные observer из GSI, если они есть
        if (data.observer) {
          gameState.observer = data.observer;
        }

        // Затем проверяем выбранного игрока и обновляем observer
        gameState.observer = null; // Сбрасываем observer перед проверкой
        
        // Проверяем данные героев для определения выбранного юнита
        if (data.hero) {
          // Проверяем команду Radiant (team2)
          if (data.hero.team2) {
            for (let i = 0; i < 5; i++) {
              const playerKey = `player${i}`;
              if (data.hero.team2[playerKey] && 
                  data.hero.team2[playerKey].selected_unit === true) {
                
                // Нашли выбранного игрока в команде Radiant
                const steamId = data.player?.team2?.[playerKey]?.steamid;
                const playerName = data.player?.team2?.[playerKey]?.name;
                
                gameState.observer = {
                  team: 'team2',
                  player_index: i,
                  steamid: steamId,
                  name: playerName
                };
                
                // Если есть steamId, ищем аватарку в базе данных
                if (steamId) {
                  try {
                    const playerData = await new Promise((resolve, reject) => {
                      db.get('SELECT avatar, nickname FROM players WHERE steam64 = ?', [steamId], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                      });
                    });
                    
                    if (playerData) {
                      if (playerData.avatar) {
                        // Убираем префикс /uploads/ из пути к аватару
                        let avatar = playerData.avatar;
                        if (avatar.startsWith('/uploads/')) {
                          avatar = avatar.substring(9); 
                        }
                        gameState.observer.avatar = avatar;
                      }
                      
                      // Используем nickname из базы данных, если он существует
                      if (playerData.nickname) {
                        gameState.observer.name = playerData.nickname;
                      }
                    }
                  } catch (error) {
                    console.error('Ошибка при получении данных игрока:', error);
                  }
                }
                
                break; // Прерываем цикл, так как нашли выбранного игрока
              }
            }
          }
          
          // Если не нашли в команде Radiant, проверяем команду Dire (team3)
          if (!gameState.observer && data.hero.team3) {
            // Для команды Dire индексы игроков начинаются с 5
            for (let i = 5; i < 10; i++) {
              const playerKey = `player${i}`;
              if (data.hero.team3[playerKey] && 
                  data.hero.team3[playerKey].selected_unit === true) {
                
                // Нашли выбранного игрока в команде Dire
                const steamId = data.player?.team3?.[playerKey]?.steamid;
                const playerName = data.player?.team3?.[playerKey]?.name;
                
                gameState.observer = {
                  team: 'team3',
                  player_index: i,
                  steamid: steamId,
                  name: playerName
                };
                
                // Если есть steamId, ищем аватарку в базе данных
                if (steamId) {
                  try {
                    const playerData = await new Promise((resolve, reject) => {
                      db.get('SELECT avatar, nickname FROM players WHERE steam64 = ?', [steamId], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                      });
                    });
                    
                    if (playerData) {
                      if (playerData.avatar) {
                        // Убираем префикс /uploads/ из пути к аватару
                        let avatar = playerData.avatar;
                        if (avatar.startsWith('/uploads/')) {
                          avatar = avatar.substring(9); 
                        }
                        gameState.observer.avatar = avatar;
                      }
                      
                      // Используем nickname из базы данных, если он существует
                      if (playerData.nickname) {
                        gameState.observer.name = playerData.nickname;
                      }
                    }
                  } catch (error) {
                    console.error('Ошибка при получении данных игрока:', error);
                  }
                }
                
                break; // Прерываем цикл, так как нашли выбранного игрока
              }
            }
          }
        }

        // Отправка обновленных данных клиентам для Dota 2
        console.log('GSI: отправляем данные Dota 2 клиентам через Socket.IO');
        io.emit('gsi', gameState);
        res.sendStatus(200);
        return; // Выходим из функции для Dota 2
      } catch (error) {
        console.error('Ошибка при обработке Dota 2 GSI данных:', error);
        res.sendStatus(500);
        return;
      }
    }

    // Обработка CS2 (существующий код)
    console.log('GSI: обрабатываем данные CS2');
    // Кормим данные в csgogsi (если доступен)
    try {
      if (GSI && typeof GSI.digest === 'function') {
        // Приводим к строке и обратно, как рекомендует csgogsi для player/owner числовых id, если нужно
        const text = JSON.stringify(data);
        GSI.digest(JSON.parse(text));
      }
    } catch (e) {
      // Тихо игнорируем сбои парсера, используем локальные метрики
    }

    // Выводим частичную информацию о данных
    //console.log('Данные GSI (частично):');
    //console.log(JSON.stringify({
    //    provider: data.provider,
    //    map: data.map ? {
    //        name: data.map.name,
    //        phase: data.map.phase
    //    } : null,
    //    player_id: data.player ? data.player.steamid : null
    //}, null, 2));
    //console.log('=== КОНЕЦ GSI ЗАПРОСА ===');

    // Получаем активный матч с дополнительной информацией
    const match = await new Promise((resolve, reject) => {
      db.get(
        `
                SELECT 
                    m.*,
                    t1.name as team1_name, t1.logo as team1_logo,
                    t2.name as team2_name, t2.logo as team2_logo
                FROM matches m
                LEFT JOIN teams t1 ON m.team1_id = t1.id
                LEFT JOIN teams t2 ON m.team2_id = t2.id
                WHERE m.status = 'active'
                LIMIT 1
            `,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Добавляем флаг matchup в gameState
    gameState.matchupis = !!match;

    if (match) {
      // Добавляем формат матча в gameState
      gameState.match = {
        format: match.format || "bo1", // bo1, bo2, bo3, bo5
        status: match.status, // pending, active, completed
        //score_team1_map: match.score_team1 || 0, // Исправлено с team1Score на score_team1
        //score_team2_map: match.score_team2 || 0,  // Исправлено с team2Score на score_team2
        matchupis: gameState.matchupis,
      };

      //const currentRound = data.map.round || 0;

      // ... existing code ...

      // ... existing code ...

      // Основное время (0-27 раундов)
      /*if (currentRound >= 0) {
                // Определяем, нужно ли менять счет местами
                const shouldSwapScores = (
                    // Основное время: вторая половина (12-26)
                    (currentRound >= 12 && currentRound <= 26) ||
                    // Овертаймы: каждая вторая половина (33-38, 46-51, 59-64, ...)
                    (currentRound >= 27 && ((Math.floor((currentRound - 27) / 6) % 2) === 1))
                );
                
                // Специальная обработка для 27 раунда (первый раунд овертайма)
                const isFirstOvertimeRound = currentRound === 27;
                
                // Добавляем проверку на фазу игры - меняем счет только после окончания перерыва
                // Для 27 раунда (первый раунд овертайма) НЕ исключаем фазу intermission
                if (shouldSwapScores && 
                    (isFirstOvertimeRound || 
                     (data.map.phase !== "intermission" && data.round.phase !== "over"))) {
                    const tempScore = gameState.match.score_team1_map;
                    gameState.match.score_team1_map = gameState.match.score_team2_map;
                    gameState.match.score_team2_map = tempScore;
                }
            }*/

      // ... existing code ...

      // ... existing code ...

      // ... existing code ...

      // Получаем данные о картах матча
      const matchMaps = await new Promise((resolve, reject) => {
        db.all(
          `
                    SELECT 
                        mm.*,
                        t1.name as team1_name,
                        t2.name as team2_name
                    FROM match_maps mm
                    LEFT JOIN teams t1 ON mm.pick_team = t1.id
                    LEFT JOIN teams t2 ON mm.side_pick_team = t2.id
                    WHERE match_id = ?
                    ORDER BY order_number
                `,
          [match.id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      if (matchMaps && matchMaps.length > 0) {
        // Добавляем информацию о картах в gameState
        gameState.match_maps = matchMaps.map((map) => ({
          id: map.id,
          map_name: map.map_name,
          pick_team: map.pick_team,
          side_pick_team: map.side_pick_team,
          status: map.status || "pending",
          score_team1: map.score_team1 || 0,
          score_team2: map.score_team2 || 0,
          order_number: map.order_number,
          name_team_pick:
            map.original_pick_team_name ||
            (map.pick_team === "team1" ? match.team1_name : match.team2_name),
          logo_team_pick:
            map.original_pick_team_logo ||
            (map.pick_team === "team1" ? match.team1_logo : match.team2_logo),
          winner_team: map.winner_team || null,
          winner_logo: map.winner_logo || null,
          original_winner_team:
            map.original_winner_team || map.winner_team || null,
          original_winner_logo:
            map.original_winner_logo || map.winner_logo || null,
        }));

        // Находим текущую карту в match_maps
        const currentMap = gameState.match_maps.find(
          (map) => map.map_name.toLowerCase() === data.map.name.toLowerCase()
        );

        if (currentMap) {
          // Проверяем фазу игры для определения завершения карты
          const isGameOver =
            data.map.phase === "gameover" || data.round?.phase === "gameover";

          // Обновляем статусы карт
          gameState.match_maps.forEach((map) => {
            if (map.map_name.toLowerCase() === data.map.name.toLowerCase()) {
              if (!isGameOver) {
                map.status = "active";
              }
            }
          });

          // Всегда обновляем счет
          currentMap.score_team1 = data.map.team_ct?.score || 0;
          currentMap.score_team2 = data.map.team_t?.score || 0;

          // Сначала обновляем счет в БД
          await new Promise((resolve, reject) => {
            db.run(
              `
                            UPDATE match_maps 
                            SET 
                                score_team1 = ?, 
                                score_team2 = ?
                            WHERE id = ?
                        `,
              [currentMap.score_team1, currentMap.score_team2, currentMap.id],
              (err) => {
                if (err) {
                  console.error("Ошибка обновления счета:", err);
                  reject(err);
                } else {
                  resolve();
                }
              }
            );
          });

          // Если игра завершена и статус еще не completed, определяем победителя
          if (isGameOver && currentMap.status !== "completed") {
            // Небольшая задержка для гарантии получения финального счета
            setTimeout(async () => {
              const winnerTeamId =
                currentMap.score_team1 > currentMap.score_team2
                  ? match.team1_id
                  : match.team2_id;

              if (winnerTeamId) {
                const winnerTeam = await new Promise((resolve, reject) => {
                  db.get(
                    "SELECT name, logo FROM teams WHERE id = ?",
                    [winnerTeamId],
                    (err, row) => {
                      if (err) reject(err);
                      else resolve(row);
                    }
                  );
                });

                if (winnerTeam) {
                  // Сохраняем информацию о победителе
                  currentMap.winner_team = winnerTeam.name;
                  currentMap.winner_logo = winnerTeam.logo
                    ? winnerTeam.logo.replace("/uploads/", "")
                    : null;
                  currentMap.status = "completed";

                  // Сохраняем original_winner только если они еще не установлены
                  if (!currentMap.original_winner_team) {
                    currentMap.original_winner_team = winnerTeam.name;
                    currentMap.original_winner_logo = winnerTeam.logo
                      ? winnerTeam.logo.replace("/uploads/", "")
                      : null;
                  }

                  console.log(
                    `Установлен победитель карты: ${currentMap.map_name}, team=${currentMap.winner_team}, original_team=${currentMap.original_winner_team}`
                  );

                  // Обновляем БД с финальным счетом и победителем
                  await new Promise((resolve, reject) => {
                    db.run(
                      `
                                            UPDATE match_maps 
                                            SET 
                                                score_team1 = ?,
                                                score_team2 = ?,
                                                status = ?, 
                                                winner_team = ?,
                                                winner_logo = ?,
                                                original_winner_team = COALESCE(original_winner_team, ?),
                                                original_winner_logo = COALESCE(original_winner_logo, ?)
                                            WHERE id = ? AND winner_team IS NULL
                                        `,
                      [
                        currentMap.score_team1,
                        currentMap.score_team2,
                        "completed",
                        currentMap.winner_team,
                        currentMap.winner_logo,
                        currentMap.winner_team, // Сохраняем original_winner_team, если он еще не установлен
                        currentMap.winner_logo, // Сохраняем original_winner_logo, если он еще не установлен
                        currentMap.id,
                      ],
                      (err) => {
                        if (err) {
                          console.error("Ошибка обновления победителя:", err);
                          reject(err);
                        } else {
                          //console.log('Победитель карты определен:', {
                          //mapId: currentMap.id,
                          //winner: currentMap.winner_team,
                          //finalScore: `${currentMap.score_team1}:${currentMap.score_team2}`
                          //});
                          resolve();
                        }
                      }
                    );
                  });
                }
              }
            }, 1000); // Задержка в 1 секунду для получения финального счета
          }

          // Логируем обновление
          //console.log('Данные карты обновлены:', {
          //    map: currentMap.map_name,
          //    score_team1: currentMap.score_team1,
          //    score_team2: currentMap.score_team2,
          //    status: currentMap.status,
          //    winner_team: currentMap.winner_team,
          //    winner_logo: currentMap.winner_logo,
          //    name_team_pick: currentMap.name_team_pick,
          //    logo_team_pick: currentMap.logo_team_pick
          //});

          // Отправляем обновленные данные в GSI
          broadcastGsiData(gameState);
        }
      }
    } else {
      // Если нет активного матча, очищаем связанные с матчем данные
      //gameState.match = null;
      gameState.match_maps = null;
    }

    /*    if (data.map) {
      // Очищаем историю урона при смене карты
      if (gameState.map && gameState.map.name !== data.map.name) {
        cleanupDamageHistory(data.map.name);
      }
      gameState.map = data.map;
    }*/

    // Обновление состояния игры
    if (data.map) {
      // Очищаем историю урона при смене карты
      if (gameState.lastMapName && gameState.lastMapName !== data.map.name) {
        console.log(`Смена карты обнаружена: ${gameState.lastMapName} -> ${data.map.name}`);
        cleanupDamageHistory(data.map.name);
        cleanupHSHistory(data.map.name);
      } else if (!gameState.lastMapName) {
        // Первое подключение к карте
        console.log(`Первое подключение к карте: ${data.map.name}`);
        gameState.lastMapName = data.map.name;
      }
      gameState.map = data.map;

      const currentRound = data.map.round || 0;

      // Проверяем, есть ли активный матч
      const activeMatch = await new Promise((resolve, reject) => {
        db.get(
          `
                    SELECT 
                        m.*,
                        t1.name as team1_name, t1.logo as team1_logo, t1.short_name as team1_short_name,
                        t2.name as team2_name, t2.logo as team2_logo, t2.short_name as team2_short_name
                    FROM matches m
                    LEFT JOIN teams t1 ON m.team1_id = t1.id
                    LEFT JOIN teams t2 ON m.team2_id = t2.id
                    WHERE m.status = 'active'
                    LIMIT 1
                `,
          [],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      // Для активного матча также учитываем фазу игры при смене сторон
      if (activeMatch) {
        // Логика смены сторон
        let shouldSwap = false;

        // Определяем текущую сторону команд
        let currentCTTeam = activeMatch.team1_name;
        let currentCTShortName = activeMatch.team1_short_name;
        let currentCTLogo = activeMatch.team1_logo;
        let score_team1_map = activeMatch.score_team1;
        let score_team2_map = activeMatch.score_team2;
        let currentTTeam = activeMatch.team2_name;
        let currentTShortName = activeMatch.team2_short_name;
        let currentTLogo = activeMatch.team2_logo;

        // Основное время (0-27 раундов)
        if (currentRound >= 0) {
          // Основное время: первая половина (0-11): CT/T
          if (currentRound <= 11) {
            currentCTTeam = activeMatch.team1_name;
            currentCTShortName = activeMatch.team1_short_name;
            currentCTLogo = activeMatch.team1_logo;
            score_team1_map = activeMatch.score_team1;
            score_team2_map = activeMatch.score_team2;
            currentTTeam = activeMatch.team2_name;
            currentTShortName = activeMatch.team2_short_name;
            currentTLogo = activeMatch.team2_logo;
          }
          // Основное время: вторая половина (12-26): T/CT
          // Добавляем проверку на фазу игры - меняем стороны только после окончания перерыва
          else if (
            currentRound >= 12 &&
            currentRound <= 26 &&
            data.map.phase !== "intermission"
          ) {
            currentCTTeam = activeMatch.team2_name;
            currentCTShortName = activeMatch.team2_short_name;
            currentCTLogo = activeMatch.team2_logo;
            score_team1_map = activeMatch.score_team2;
            score_team2_map = activeMatch.score_team1;
            currentTTeam = activeMatch.team1_name;
            currentTShortName = activeMatch.team1_short_name;
            currentTLogo = activeMatch.team1_logo;
          }

          // Овертаймы (27+)
          else if (currentRound >= 27) {
            // Определяем номер овертайма (0 для первого, 1 для второго и т.д.)
            const overtimeNumber = Math.floor((currentRound - 27) / 6);
            // Определяем номер раунда внутри текущего овертайма (0-5)
            const roundInOvertime = (currentRound - 27) % 6;

            // Проверяем фазу игры
            const isIntermission = data.map.phase === "intermission";

            // Специальная обработка для первого раунда первого овертайма (раунд 27)
            if (currentRound === 27 && isIntermission) {
              //console.log(`Раунд 27 (первый раунд первого овертайма) в фазе перерыва. Сохраняем предыдущие стороны.`);

              // Для раунда 27 в фазе перерыва сохраняем стороны как в последнем раунде основного времени
              // (т.е. team2 = CT, team1 = T)
              currentCTTeam = activeMatch.team2_name;
              currentCTShortName = activeMatch.team2_short_name;
              currentCTLogo = activeMatch.team2_logo;
              score_team1_map = activeMatch.score_team2;
              score_team2_map = activeMatch.score_team1;
              currentTTeam = activeMatch.team1_name;
              currentTShortName = activeMatch.team1_short_name;
              currentTLogo = activeMatch.team1_logo;
            }
            // Для всех остальных случаев или когда перерыв закончился
            else {
              // Четные овертаймы (0, 2, 4...) - team1 CT, team2 T
              if (
                overtimeNumber % 2 === 0 &&
                (!isIntermission || currentRound > 27)
              ) {
                currentCTTeam = activeMatch.team1_name;
                currentCTShortName = activeMatch.team1_short_name;
                currentCTLogo = activeMatch.team1_logo;
                score_team1_map = activeMatch.score_team1;
                score_team2_map = activeMatch.score_team2;
                currentTTeam = activeMatch.team2_name;
                currentTShortName = activeMatch.team2_short_name;
                currentTLogo = activeMatch.team2_logo;
                //console.log(`Четный овертайм ${overtimeNumber + 1}, CT: ${currentCTTeam}, T: ${currentTTeam}`);
              }
              // Нечетные овертаймы (1, 3, 5...) - team2 CT, team1 T
              else if (overtimeNumber % 2 === 1 && !isIntermission) {
                currentCTTeam = activeMatch.team2_name;
                currentCTShortName = activeMatch.team2_short_name;
                currentCTLogo = activeMatch.team2_logo;
                score_team1_map = activeMatch.score_team2;
                score_team2_map = activeMatch.score_team1;
                currentTTeam = activeMatch.team1_name;
                currentTShortName = activeMatch.team1_short_name;
                currentTLogo = activeMatch.team1_logo;
                //console.log(`Нечетный овертайм ${overtimeNumber + 1}, CT: ${currentCTTeam}, T: ${currentTTeam}`);
              }
            }
          }
        }

        // Устанавливаем актуальные названия команд
        // Для раунда 27 в фазе перерыва используем специальную логику
        if (currentRound === 27 && data.map.phase === "intermission") {
          // Не меняем стороны в gameState, сохраняем как было в последнем раунде основного времени
          console.log(
            `Сохраняем стороны для раунда 27 в перерыве: CT=${currentCTTeam}, T=${currentTTeam}`
          );
          gameState.map.team_ct.name = currentCTTeam;
          gameState.map.team_ct.short_name = currentCTShortName;
          gameState.map.team_ct.logo = currentCTLogo;
          gameState.map.team_ct.matches_won_this_series = score_team1_map;
          gameState.map.team_t.matches_won_this_series = score_team2_map;
          gameState.map.team_t.name = currentTTeam;
          gameState.map.team_t.short_name = currentTShortName;
          gameState.map.team_t.logo = currentTLogo;
        }
        // Для всех остальных случаев

        gameState.map.team_ct.name = currentCTTeam;
        gameState.map.team_ct.short_name = currentCTShortName;
        gameState.map.team_ct.logo = currentCTLogo;
        gameState.map.team_t.name = currentTTeam;
        gameState.map.team_t.short_name = currentTShortName;
        gameState.map.team_t.logo = currentTLogo;
        gameState.map.team_ct.matches_won_this_series = score_team1_map;
        gameState.map.team_t.matches_won_this_series = score_team2_map;

        // Логика определения победителя
        const ctScore = data.map.team_ct?.score || 0;
        const tScore = data.map.team_t?.score || 0;
        let winner = null;

        // Проверяем статус игры для определения победителя
        if (data.map.phase === "gameover") {
          // Определяем победителя просто по большему счету
          if (ctScore > tScore) {
            winner = "CT";
            winnerTeam = currentCTTeam;
            winnerLogo = currentCTLogo;
          } else if (tScore > ctScore) {
            winner = "T";
            winnerTeam = currentTTeam;
            winnerLogo = currentTLogo;
          }

          //console.log(`Определен победитель при gameover: ${winnerTeam}, счет ${ctScore}:${tScore}`);

          // Если есть победитель, обновляем данные
          if (winner) {
            //console.log(`Обновляем информацию о победителе: ${winnerTeam}, лого: ${winnerLogo}`);

            // Обновляем gameState с информацией о победителе
            gameState.map.winner = {
              team: winnerTeam,
              logo: winnerLogo,
              // Добавляем оригинальные данные для клиента
              original_team: winnerTeam,
              original_logo: winnerLogo,
            };

            // Находим текущую карту
            const currentMap = gameState.match_maps?.find(
              (map) =>
                map.map_name.toLowerCase() === data.map.name.toLowerCase()
            );

            if (currentMap) {
              currentMap.status = "completed";
              // Устанавливаем победителя
              currentMap.winner_team = winnerTeam;
              currentMap.winner_logo = winnerLogo;
              // Сохраняем оригинальные значения только при первом определении победителя
              if (currentMap.status !== "completed") {
                currentMap.original_winner_team = winnerTeam;
                currentMap.original_winner_logo = winnerLogo;
                console.log(
                  `Карта ${currentMap.map_name} завершена впервые, устанавливаем winner_team=${winnerTeam}, winner_logo=${winnerLogo}`
                );
              } else {
                console.log(
                  `Карта ${currentMap.map_name} уже была завершена, сохраняем только winner_team=${winnerTeam}, winner_logo=${winnerLogo}`
                );
              }

              console.log(
                `Обновляем статус карты ${currentMap.map_name} на completed, победитель: ${winnerTeam}, оригинал: ${currentMap.original_winner_team}`
              );

              // Обновляем базу данных с информацией о победителе и статусом карты
              await new Promise((resolve, reject) => {
                db.run(
                  `
                                    UPDATE match_maps 
                                    SET winner_team = ?, 
                                        winner_logo = ?,
                                        status = 'completed',
                                        -- Устанавливаем original_winner_* поля только если статус не был completed
                                        original_winner_team = CASE WHEN status != 'completed' THEN ? ELSE original_winner_team END,
                                        original_winner_logo = CASE WHEN status != 'completed' THEN ? ELSE original_winner_logo END
                                    WHERE map_name = ? AND match_id = ?
                                `,
                  [
                    winnerTeam,
                    winnerLogo,
                    winnerTeam,
                    winnerLogo,
                    activeMatch.id,
                    data.map.name,
                  ],
                  (err) => {
                    if (err) {
                      console.error(
                        "Ошибка при обновлении данных о победителе:",
                        err
                      );
                      reject(err);
                    } else {
                      //console.log('Данные о победителе успешно обновлены в базе данных');
                      resolve();
                    }
                  }
                );
              });
            } else {
              //console.log(`Не удалось найти текущую карту ${data.map.name} в списке карт матча`);
            }
          }
        }
      } else {
        // Если нет активного матча, используем имена команд из игры
        gameState.map.team_ct.name = data.map.team_ct?.name || "CT";
        gameState.map.team_ct.logo = data.map.team_ct?.logo || "";
        gameState.map.team_t.name = data.map.team_t?.name || "T";
        gameState.map.team_t.logo = data.map.team_t?.logo || "";
      }

      // Проверяем, есть ли информация о победителе
      if (data.map.winner) {
        // Используем оригинальные данные, если они есть
        const winnerTeam =
          data.map.winner.original_team || data.map.winner.team;
        const winnerLogo =
          data.map.winner.original_logo || data.map.winner.logo;

        // Логируем для отладки
        console.log(
          `GSI: Получены данные о победителе: team=${winnerTeam}, logo=${winnerLogo}, original_team=${
            data.map.winner.original_team || "не задано"
          }, original_logo=${data.map.winner.original_logo || "не задано"}`
        );

        console.log(
          `Получены данные о победителе из GSI: team=${winnerTeam}, logo=${winnerLogo}`
        );

        // Обновляем базу данных с информацией о победителе
        await new Promise((resolve, reject) => {
          db.run(
            `
                    UPDATE match_maps 
                    SET winner_team = ?, 
                        winner_logo = ?,
                        status = 'completed',  /* Добавляем изменение статуса на completed */
                        -- Всегда устанавливаем original_winner_* поля, если они пустые
                        original_winner_team = CASE WHEN original_winner_team IS NULL THEN ? ELSE original_winner_team END,
                        original_winner_logo = CASE WHEN original_winner_logo IS NULL THEN ? ELSE original_winner_logo END
                    WHERE map_name = ? AND match_id = ?
                `,
            [
              winnerTeam,
              winnerLogo,
              winnerTeam,
              winnerLogo,
              data.map.name,
              activeMatch.id,
            ],
            (err) => {
              if (err) {
                console.error(
                  "Ошибка при обновлении данных о победителе:",
                  err
                );
                reject(err);
              } else {
                //console.log('Данные о победителе обновлены:', {
                //winnerTeam,
                //winnerLogo,
                //status: 'completed',
                //mapName: data.map.name
                //});
                resolve();
              }
            }
          );
        });

        // Также обновляем статус и информацию о победителе в gameState
        if (gameState.match_maps) {
          const currentMap = gameState.match_maps.find(
            (map) => map.map_name.toLowerCase() === data.map.name.toLowerCase()
          );
          if (currentMap) {
            currentMap.status = "completed";
            // Обновляем данные о победителе с оригинальными значениями
            currentMap.winner_team = winnerTeam;
            currentMap.winner_logo = winnerLogo;
            currentMap.original_winner_team = winnerTeam;
            currentMap.original_winner_logo = winnerLogo;
            console.log(
              `GSI: Обновлен статус и победитель карты ${currentMap.map_name}: ${winnerTeam}`
            );
          }
        }
      }

      // Отправляем обновленные данные клиентам
      broadcastGsiData(gameState);
    }

    if (data.player) {
      // Логируем SteamID игрока
      //console.log('Обработка игрока:', data.player.steamid);

      // Получаем аватар из базы данных по SteamID
      const playerAvatar = await new Promise((resolve, reject) => {
        db.get(
          "SELECT avatar FROM players WHERE steam64 = ?",
          [data.player.steamid],
          (err, row) => {
            if (err) {
              console.error("Ошибка при запросе аватара из базы:", err);
              reject(err);
            } else {
              //console.log('Аватар из базы для', data.player.steamid, ':', row?.avatar || 'не найден');
              resolve(row?.avatar || null);
            }
          }
        );
      });

      // Логируем аватар из GSI данных
      //console.log('Аватар из GSI для', data.player.steamid, ':', data.player.avatar || 'не предоставлен');

      // Проверяем, существует ли data.player.state
      const playerState = data.player.state || {};

      // Получаем имя игрока из базы данных по SteamID
      const playerName = await new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM players WHERE steam64 = ?",
          [data.player.steamid],
          (err, row) => {
            if (err) {
              console.error("Ошибка при получении имени игрока из базы:", err);
              reject(err);
            } else {
              resolve(row?.nickname || null);
            }
          }
        );
      });

      // Находим игрока в allplayers по steamid
      const playerInAllPlayers = data.allplayers?.[data.player.steamid];
      
      // Рассчитываем ADR для текущего игрока
      const currentRound = data.map?.round || 0;
      const calculatedPlayerADR = calculateADR(data.player, currentRound, data.map);
      const calculatedPlayerHSPercent = calculateHSPercent(data.player, currentRound, data.map);
      const playerADRValueRaw = data.map && data.map.phase === "warmup" ? 0 : calculatedPlayerADR;
      const playerADRValue = getAdrFromCsgogsi(data.player.steamid, playerADRValueRaw);
      const playerHSValueRaw = data.map && data.map.phase === "warmup" ? 0 : calculatedPlayerHSPercent;
      //const playerHSValue = getHsFromCsgogsi(data.player.steamid, playerHSValueRaw);

      // Record per-round HS for current player
      recordRoundHeadshots(data.player.steamid, currentRound, playerState.round_killhs, data.map);

      gameState.player = {
        // Используем имя из базы данных, если оно есть, иначе из GSI
        name: playerName || data.player.name || gameState.player.name,
        team: data.player.team || gameState.player.team,
        state: {
          health: playerState.health ?? gameState.player.state.health,
          armor: playerState.armor ?? gameState.player.state.armor,
          money: playerState.money ?? gameState.player.state.money,
          // Используем только значение из allplayers для текущего игрока
          defusekit: playerInAllPlayers?.state?.defusekit || false,
          burning: playerState.burning,
          flashed: playerState.flashed,
          smoked: playerState.smoked,
          round_killhs: playerState.round_killhs,
          round_kills: playerState.round_kills,
          round_totaldmg: playerState.round_totaldmg,
          round_hs: playerState.round_hs,
          adr: playerADRValue,
          //hs: playerHSValue,
          kill_hs: (data.map?.phase === 'warmup') ? 0 : getTotalHeadshotsForSteam(data.player.steamid),
        },
        slot: data.player.observer_slot,
        spectarget: gameState.player.steam64,
        steamid: data.player.steamid,
        teamid: gameState.player.team,
        position: data.player.position,
        match_stats: data.player.match_stats,
        weapons: data.player.weapons,
        camera_link: data.player.camera_link,
        // Используем аватар из базы данных или из GSI, убираем /uploads/ из пути
        avatar: playerAvatar
          ? playerAvatar.replace("/uploads/", "")
          : data.player.avatar
          ? data.player.avatar.replace("/uploads/", "")
          : null,
        cameraLink: cameraLinks[data.player.steamid] || "", // <-- добавляем ссылку камеры
      };

      // Добавляем флаг MVP для текущего игрока на основе 3+ убийств в раунде из команды-победителя
      const roundKills = data.player.state?.round_kills || 0;
      const isWinningTeam = isPlayerFromWinningTeam(data.player, data);
      gameState.player.is_round_mvp = (isWinningTeam && roundKills >= 3);

      // Логируем итоговый аватар
      //console.log('Итоговый аватар для', data.player.steamid, ':', gameState.player.avatar || 'не установлен');
    }

    if (data.allplayers) {
      gameState.allplayers = {};
      
      // Очищаем историю урона при смене карты
      if (data.map && data.map.name && gameState.lastMapName && gameState.lastMapName !== data.map.name) {
        cleanupDamageHistory(data.map.name);
        cleanupHSHistory(data.map.name);
      }
      
      // Очищаем историю урона и HS при warmup
      if (data.map && data.map.phase === "warmup") {
        if (gameState.damageHistory) {
          Object.keys(gameState.damageHistory).forEach(playerId => {
            gameState.damageHistory[playerId] = [];
          });
        }
        if (gameState.hsHistory) {
          Object.keys(gameState.hsHistory).forEach(playerId => {
            gameState.hsHistory[playerId] = [];
          });
        }
      }
      
      const currentRound = data.map?.round || 0;
      
      for (const [steamId, playerData] of Object.entries(data.allplayers)) {
        // Используем steamid, если доступен, иначе используем только имя игрока
        let playerId = steamId;
        if (!playerId || playerId === "undefined") {
          playerId = playerData.name;
        }
        
        // Получаем данные игрока из базы данных по SteamID
        const playerInfo = await new Promise((resolve, reject) => {
          db.get(
            "SELECT avatar, nickname, realName FROM players WHERE steam64 = ?",
            [steamId],
            (err, row) => {
              if (err) reject(err);
              else resolve(row || {});
            }
          );
        });

        // Рассчитываем ADR для каждого игрока
        const calculatedADR = calculateADR(playerData, currentRound, data.map);
        const calculatedHSPercent = calculateHSPercent(playerData, currentRound, data.map);
        const adrValueRaw = data.map && data.map.phase === "warmup" ? 0 : calculatedADR;
        const adrValue = getAdrFromCsgogsi(steamId, adrValueRaw);
        const hsValue = data.map && data.map.phase === "warmup" ? 0 : calculatedHSPercent;

        // Record per-round HS for each player
        recordRoundHeadshots(steamId, currentRound, playerData.state?.round_killhs || 0, data.map);

        gameState.allplayers[playerId] = {
          ...playerData,
          avatar: playerInfo.avatar
            ? playerInfo.avatar.replace("/uploads/", "")
            : playerData.avatar
            ? playerData.avatar.replace("/uploads/", "")
            : null,
          name: playerInfo.nickname || playerData.name || "",
          realName: playerInfo.realName || playerData.realName || "",
          match_stats: {
            ...playerData.match_stats,
            kd: (
              playerData.match_stats?.kills / playerData.match_stats?.deaths ||
              0
            ).toFixed(2),
          },
          // Добавляем рассчитанный ADR в состояние игрока
          state: {
            ...playerData.state,
            adr: adrValue,
            hs: hsValue,
            kill_hs: (data.map?.phase === 'warmup') ? 0 : getTotalHeadshotsForSteam(steamId),
          },
          cameraLink: cameraLinks[steamId] || "", // <-- добавляем ссылку камеры
          steamid: playerData.steamid || steamId, // Сохраняем оригинальный steamid
        };
        
        // Добавляем флаг MVP на основе 3+ убийств в раунде из команды-победителя
        const roundKills = playerData.state?.round_kills || 0;
        const isWinningTeam = isPlayerFromWinningTeam(playerData, data);
        gameState.allplayers[playerId].is_round_mvp = (isWinningTeam && roundKills >= 3);
      }
      
      // Определяем MVP раунда в отдельной функции
      gameState.round_mvp = determineRoundMVP(data, gameState);
    }

    if (data.bomb) {
      gameState.bomb = data.bomb;
    }

    if (data.grenades) {
      gameState.grenades = data.grenades;
    }

    if (data.previously) {
      gameState.previously = data.previously;
    }

    if (data.provider) {
      gameState.provider = data.provider;
    }

    if (data.round) {
      // Сбрасываем MVP данные при окончании фризтайма (переход в live)
      if (gameState.round?.phase === 'freezetime' && data.round.phase === 'live') {
        gameState.round_mvp = null;
        // Сбрасываем флаги MVP у всех игроков
        for (const [playerId, playerData] of Object.entries(gameState.allplayers)) {
          gameState.allplayers[playerId].is_round_mvp = false;
        }
        gameState.player.is_round_mvp = false;
      }
      gameState.round = data.round;
    }

    if (data.phase_countdowns) {
      gameState.phase_countdowns = {
        phase: data.phase_countdowns.phase || gameState.phase_countdowns.phase,
        phase_ends_in:
          data.phase_countdowns.phase_ends_in ??
          gameState.phase_countdowns.phase_ends_in,
      };
    }

    // Детектим киллы и отправляем киллфид (после сборки allplayers)
    detectAndEmitKillfeed(data);

    // Отправка обновленных данных клиентам
    broadcastGsiData(gameState);
    //  console.log('9. Данные отправлены клиентам');
    res.sendStatus(200);
  } catch (error) {
    //console.error('Ошибка при обработке GSI данных:', error);
    res.sendStatus(500);
  }
});

// Socket.IO подключения
io.on("connection", (socket) => {
  //console.log('Клиент подключился');

  socket.on("ready", () => {
    // Отправляем текущее состояние игры
    socket.emit("gsi", gameState);

    // Получаем активный матч и данные команд
    db.get(
      `
            SELECT 
                m.*,
                t1.name as team1_name, t1.logo as team1_logo,
                t2.name as team2_name, t2.logo as team2_logo
            FROM matches m
            LEFT JOIN teams t1 ON m.team1_id = t1.id
            LEFT JOIN teams t2 ON m.team2_id = t2.id
            WHERE m.status = 'active'
            ORDER BY m.created_at DESC
            LIMIT 1
        `,
      [],
      (err, match) => {
        if (err) {
          //console.error('Ошибка при получении данных матча:', err);
          return;
        }

        if (match) {
          // Отправляем информацию о командах
          socket.emit("match_data", {
            teams: {
              team_1: {
                team: {
                  name: match.team1_name,
                  logo: match.team1_logo,
                },
                score: match.score_team1 || 0,
              },
              team_2: {
                team: {
                  name: match.team2_name,
                  logo: match.team2_logo,
                },
                score: match.score_team2 || 0,
              },
            },
            match_status: "active",
            format: match.format || "bo1",
          });
        } else {
          // Если нет активного матча, проверяем наличие ожидающих матчей
          db.get(
            `
                    SELECT 
                        m.*,
                        t1.name as team1_name, t1.logo as team1_logo,
                        t2.name as team2_name, t2.logo as team2_logo
                    FROM matches m
                    LEFT JOIN teams t1 ON m.team1_id = t1.id
                    LEFT JOIN teams t2 ON m.team2_id = t2.id
                    WHERE m.status = 'pending'
                    ORDER BY m.created_at DESC
                    LIMIT 1
                `,
            [],
            (err, pendingMatch) => {
              if (err || !pendingMatch) return;

              // Отправляем информацию о командах из ожидающего матча
              socket.emit("match_data", {
                teams: {
                  team_1: {
                    team: {
                      name: pendingMatch.team1_name,
                      logo: pendingMatch.team1_logo,
                    },
                    score: pendingMatch.score_team1 || 0,
                  },
                  team_2: {
                    team: {
                      name: pendingMatch.team2_name,
                      logo: pendingMatch.team2_logo,
                    },
                    score: pendingMatch.score_team2 || 0,
                  },
                },
                match_status: "pending",
                format: "bo1", // Всегда bo1 для pending матчей
              });
            }
          );
        }
      }
    );
  });

  // Обработчик для принятия данных от клиента и пересылки их всем подключенным клиентам
  socket.on("hud_data", (data) => {
    console.log("Получены данные для HUD:", data.type);
    // Пересылаем всем клиентам
    io.emit("hud_data", data);
  });

  socket.on("disconnect", () => {
    //console.log('Клиент отключился');
  });
});

// Проверяем, что GSI сервер запущен на правильном порту
// Запускаем основной сервер

// Порты для серверов
const PORT = 2626;
const GSI_PORT = 1350;

// Функция запуска серверов
const startServers = async () => {
  try {
    // Запускаем основной сервер
    await new Promise((resolve) => {
      http.listen(PORT, () => {
        console.log("=================================");
        console.log(`Сервер запущен на http://${serverIP}:${PORT}`);
        console.log(`Socket.IO готов к подключениям`);
        console.log("=================================");

        // Открываем браузер только если не запущено через Electron
        if (!process.env.ELECTRON_APP) {
          const { exec } = require("child_process");
          const platform = process.platform;
          const url = `http://${serverIP}:${PORT}`;

          let command;
          switch (platform) {
            case "win32":
              command = `start ${url}`;
              break;
            case "darwin":
              command = `open ${url}`;
              break;
            case "linux":
              command = `xdg-open ${url}`;
              break;
            default:
              console.log(
                `Платформа ${platform} не поддерживается для автоматического открытия браузера`
              );
              return;
          }

          exec(command, (err) => {
            if (err) {
              console.error("Ошибка при открытии браузера:", err);
            }
          });
        } else {
          console.log(
            "Запущено через Electron, браузер не открывается автоматически"
          );
        }

        resolve();
      });
    });

    // Запускаем GSI сервер
    await new Promise((resolve) => {
      gsiServer.listen(GSI_PORT, () => {
        console.log(`GSI сервер запущен на порту ${GSI_PORT}`);
        resolve();
      });
    });

    /*
    if (httpsServer) {
      const HTTPS_PORT = PORT + 1; // 2627
      await new Promise((resolve) => {
        httpsServer.listen(HTTPS_PORT, () => {
          console.log(
            `HTTPS сервер запущен на https://${serverIP}:${HTTPS_PORT}`
          );
          resolve();
        });
      });
    }

    if (httpsGsiServer) {
      const HTTPS_GSI_PORT = GSI_PORT + 1; // 1351
      await new Promise((resolve) => {
        httpsGsiServer.listen(HTTPS_GSI_PORT, () => {
          console.log(`HTTPS GSI сервер запущен на порту ${HTTPS_GSI_PORT}`);
          resolve();
        });
      });
    }*/
  } catch (error) {
    console.error("Ошибка при запуске серверов:", error);
    process.exit(1);
  }
};

// Запускаем серверы
startServers();

// Обработка ошибок процесса
process.on("uncaughtException", (error) => {
  console.error("Необработанное исключение:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Необработанное отклонение промиса:", error);
});

// Перед отправкой обновлений GSI
if (!global.lastGsiUpdate) {
  global.lastGsiUpdate = 300;
  global.gsiThrottleInterval = 300; // Интервал в мс (30 fps)
}

// Отправка обновленных данных клиентам с дросселированием
const now = Date.now();
if (now - global.lastGsiUpdate > global.gsiThrottleInterval) {
  global.lastGsiUpdate = now;
  console.log('GSI: отправляем данные CS2 клиентам через Socket.IO');
  io.emit("gsi", gameState);
}

// Добавьте эти переменные в начало модуля радара
const NodeCache = require("node-cache");
const radarCache = new NodeCache({ stdTTL: 5, checkperiod: 10 });
const throttle = require("lodash.throttle");

// Кэширование данных игроков и буферизация обновлений
let playersBuffer = {};
let updatesPending = false;

// Дросселирование функции обновления позиций
const updateRadarPositions = throttle(function () {
  // Код обновления позиций игроков на радаре
  for (const steamId in playersBuffer) {
    const playerData = playersBuffer[steamId];
    // Обновление DOM
  }
  playersBuffer = {};
  updatesPending = false;
}, 16); // ~60fps

// Безопасный планировщик вместо requestAnimationFrame в Node.js
const scheduleFrame = (cb) => setTimeout(cb, 16);

// Вместо прямого обновления при получении данных
function handleGsiUpdate(data) {
  // Принудительная очистка при смене карты
  if (data.map && data.map.name && gameState.lastMapName && gameState.lastMapName !== data.map.name) {
    console.log(`Принудительная очистка при смене карты: ${gameState.lastMapName} -> ${data.map.name}`);
    gameState.damageHistory = {};
    gameState.hsHistory = {};
    gameState.lastMapName = data.map.name;
  }
  
  // Буферизация данных
  if (data.allplayers) {
    for (const [steamId, player] of Object.entries(data.allplayers)) {
      // Кэшируем предыдущую позицию для сравнения
      const prevPos = radarCache.get(`player_${steamId}_pos`);
      const currentPos = player.position;

      // Обновляем только при значительном изменении позиции
      if (
        !prevPos ||
        Math.abs(prevPos.x - currentPos.x) > 5 ||
        Math.abs(prevPos.y - currentPos.y) > 5
      ) {
        // Сохраняем в буфер и кэш
        playersBuffer[steamId] = player;
        radarCache.set(`player_${steamId}_pos`, currentPos);

        if (!updatesPending) {
          updatesPending = true;
          scheduleFrame(updateRadarPositions);
        }
      }
    }
  }
  
  // Сохраняем данные о бомбе, если они есть
  if (data.bomb && data.bomb.position) {
    radarCache.set('bomb_position', data.bomb.position);
  }
  
  // Сохраняем название карты
  if (data.map && data.map.name) {
    radarCache.set('map_name', data.map.name);
  }
}

// Оптимизация очистки неиспользуемых элементов
// Вызывайте эту функцию реже, например каждые 30 кадров
let cleanupCounter = 0;
function cleanupUnusedElements() {
  cleanupCounter++;
  if (cleanupCounter < 30) return;
  cleanupCounter = 0;

  // Код очистки неиспользуемых элементов
}

// Удаление конфигов CS2
app.get("/api/remove-cs2-configs", (req, res) => {
  try {
    const customPath = req.query.path;
    let cs2Path = customPath;

    if (!cs2Path) {
      cs2Path = findCS2Path();
    }

    if (!cs2Path || !fs.existsSync(cs2Path)) {
      return res.json({
        success: false,
        message: "CS2 не найден по стандартным путям. Укажите путь вручную.",
      });
    }

    const allConfigDirs = getAllCs2ConfigDirs();
    const configDir = path.join(cs2Path, "game", "csgo", "cfg");

    // Пути к файлам конфигов (относительные имена)
    const files = {
      gsi: "gamestate_integration_fhud.cfg",
      observer: "observer.cfg",
      observer_off: "observer_off.cfg",
      observer2: "observer2.cfg",
      observer_hlae_kill: "observer_HLAE_kill.cfg",
    };

    let removed = {
      gsi: false,
      observer: false,
      observer_off: false,
      observer2: false,
      observer_hlae_kill: false,
    };

    // Удаляем из основного configDir
    for (const [key, fname] of Object.entries(files)) {
      const p = path.join(configDir, fname);
      try { if (fs.existsSync(p)) { fs.unlinkSync(p); removed[key] = true; } } catch {}
    }

    // И дополнительно из всех найденных директорий
    for (const dir of allConfigDirs) {
      for (const [key, fname] of Object.entries(files)) {
        const p = path.join(dir, fname);
        try { if (fs.existsSync(p)) { fs.unlinkSync(p); removed[key] = true; } } catch {}
      }
    }

    return res.json({
      success: true,
      message: "Конфиги успешно удалены",
      removed: removed,
      configPath: configDir,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Ошибка при удалении конфигов" });
  }
});

// Добавьте в server/server.js следующие маршруты

// Маршруты для OBS интеграции - только маршруты HTML страниц
app.get("/obs/match-ticker", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/obs/match-ticker.html"));
});

app.get("/obs/match-scoreboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/obs/match-scoreboard.html"));
});

app.get("/obs/map-veto", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/obs/map-veto.html"));
});

app.get("/obs/match/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/obs/match-detail.html"));
});

// API эндпоинты для получения данных
app.get("/api/obs/matches", (req, res) => {
  // Получаем данные о всех матчах из базы данных
  db.getMatches()
    .then((matches) => res.json(matches))
    .catch((err) => {
      console.error("Ошибка при получении матчей:", err);
      res.status(500).json({ error: "Ошибка при получении списка матчей" });
    });
});

app.get("/api/obs/match/:id", (req, res) => {
  const matchId = req.params.id;
  db.getMatch(matchId)
    .then((match) => {
      if (!match) {
        return res.status(404).json({ error: "Матч не найден" });
      }
      res.json(match);
    })
    .catch((err) => {
      console.error("Ошибка при получении данных матча:", err);
      res.status(500).json({ error: "Ошибка при получении данных матча" });
    });
});

app.get("/api/obs/active-match", (req, res) => {
  // Получаем данные активного матча
  db.getActiveMatch()
    .then((match) => {
      if (!match) {
        return res.status(404).json({ error: "Активный матч не найден" });
      }
      res.json(match);
    })
    .catch((err) => {
      console.error("Ошибка при получении активного матча:", err);
      res.status(500).json({ error: "Ошибка при получении активного матча" });
    });
});

// Функция для пересоздания таблицы match_maps при запуске сервера
async function recreateMatchMapsTable() {
  try {
    // Сначала проверяем, существует ли таблица
    const tableExists = await new Promise((resolve, reject) => {
      db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='match_maps'",
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? true : false);
        }
      );
    });

    if (!tableExists) {
      console.log("Таблица match_maps не существует. Создаем...");
      // Создаем таблицу
      await new Promise((resolve, reject) => {
        db.run(
          `
                    CREATE TABLE IF NOT EXISTS match_maps (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        match_id INTEGER,
                        map_name TEXT,
                        pick_team INTEGER,
                        side_pick_team INTEGER,
                        order_number INTEGER,
                        score_team1 INTEGER DEFAULT 0,
                        score_team2 INTEGER DEFAULT 0,
                        status TEXT DEFAULT 'pending',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        winner_team TEXT,
                        winner_logo TEXT,
                        original_winner_team TEXT,
                        original_winner_logo TEXT,
                        original_pick_team_name TEXT,
                        original_pick_team_logo TEXT,
                        map_type TEXT DEFAULT 'pick',
                        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
                    )
                `,
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      console.log("Таблица match_maps создана");
      return;
    }

    // Далее продолжается существующий код проверки колонок и т.д.
    const columns = await new Promise((resolve, reject) => {
      // ... существующий код
    });

    // ... остальной код функции
  } catch (error) {
    console.error("Ошибка при пересоздании таблицы match_maps:", error);
  }
}

// Вызываем функцию в начале запуска сервера
(async () => {
  await recreateMatchMapsTable();
})();

// В начале файла server.js
db.run(
  "ALTER TABLE match_maps ADD COLUMN map_type TEXT DEFAULT 'pick'",
  (err) => {
    if (err) {
      // Игнорируем ошибку, если колонка уже существует
      console.log(
        "Информация: колонка map_type уже существует или произошла другая ошибка:",
        err.message
      );
    } else {
      console.log("Колонка map_type успешно добавлена в таблицу match_maps");
    }
  }
);

// Добавляем колонки для хранения оригинальной информации о победителе
db.run("ALTER TABLE match_maps ADD COLUMN original_winner_team TEXT", (err) => {
  if (err) {
    // Игнорируем ошибку, если колонка уже существует
    console.log(
      "Информация: колонка original_winner_team уже существует или произошла другая ошибка:",
      err.message
    );
  } else {
    console.log(
      "Колонка original_winner_team успешно добавлена в таблицу match_maps"
    );
  }
});

db.run("ALTER TABLE match_maps ADD COLUMN original_winner_logo TEXT", (err) => {
  if (err) {
    // Игнорируем ошибку, если колонка уже существует
    console.log(
      "Информация: колонка original_winner_logo уже существует или произошла другая ошибка:",
      err.message
    );
  } else {
    console.log(
      "Колонка original_winner_logo успешно добавлена в таблицу match_maps"
    );
  }
});

// Диагностический API-эндпоинт для проверки данных о картах матча
app.get("/api/matches/:id/maps-debug", async (req, res) => {
  try {
    const matchId = req.params.id;

    // Получаем информацию о матче
    const match = await new Promise((resolve, reject) => {
      db.get(
        `
                SELECT 
                    m.*,
                    t1.name as team1_name, t1.logo as team1_logo,
                    t2.name as team2_name, t2.logo as team2_logo
                FROM matches m
                LEFT JOIN teams t1 ON m.team1_id = t1.id
                LEFT JOIN teams t2 ON m.team2_id = t2.id
                WHERE m.id = ?
            `,
        [matchId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!match) {
      return res.status(404).json({ error: "Матч не найден" });
    }

    // Получаем исходные данные карт
    const rawMaps = await new Promise((resolve, reject) => {
      db.all(
        `
                SELECT * FROM match_maps
                WHERE match_id = ?
                ORDER BY order_number ASC
            `,
        [matchId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Получаем обработанные данные карт
    const processedMaps = await new Promise((resolve, reject) => {
      db.all(
        `
                                SELECT 
                    mm.*,
                    COALESCE(mm.original_pick_team_name, 
                        CASE 
                            WHEN mm.pick_team = 'team1' THEN t1.name
                            WHEN mm.pick_team = 'team2' THEN t2.name
                            ELSE NULL
                        END
                    ) as name_team_pick,
                    COALESCE(mm.original_pick_team_logo, 
                        CASE 
                            WHEN mm.pick_team = 'team1' THEN t1.logo
                            WHEN mm.pick_team = 'team2' THEN t2.logo
                            ELSE NULL
                        END
                    ) as logo_team_pick,
                    COALESCE(mm.original_winner_team, mm.winner_team) as winner_team,
                    COALESCE(mm.original_winner_logo, mm.winner_logo) as winner_logo
                FROM match_maps mm
                LEFT JOIN matches m ON mm.match_id = m.id
                LEFT JOIN teams t1 ON m.team1_id = t1.id
                LEFT JOIN teams t2 ON m.team2_id = t2.id
                WHERE mm.match_id = ? 
                ORDER BY mm.order_number ASC
            `,
        [matchId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Формируем объект ответа с данными для диагностики
    const response = {
      match: {
        id: match.id,
        team1_id: match.team1_id,
        team2_id: match.team2_id,
        team1_name: match.team1_name,
        team2_name: match.team2_name,
        team1_logo: match.team1_logo,
        team2_logo: match.team2_logo,
      },
      rawMaps: rawMaps,
      processedMaps: processedMaps,
    };

    res.json(response);
  } catch (error) {
    console.error("Ошибка при диагностике данных карт:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// API-эндпоинт для обновления команды, пикнувшей карту
app.post("/api/maps/:mapId/update-pick-team", async (req, res) => {
  try {
    const mapId = req.params.mapId;
    const { name_team_pick, logo_team_pick } = req.body;

    // Проверяем существование карты
    const map = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM match_maps WHERE id = ?", [mapId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!map) {
      return res.status(404).json({ error: "Карта не найдена" });
    }

    // Обновляем данные о команде, пикнувшей карту
    await new Promise((resolve, reject) => {
      db.run(
        `
                UPDATE match_maps 
                SET original_pick_team_name = ?, original_pick_team_logo = ?
                WHERE id = ?
            `,
        [name_team_pick, logo_team_pick, mapId],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });

    // Получаем обновленные данные карты
    const updatedMap = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM match_maps WHERE id = ?", [mapId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json({
      success: true,
      message: "Данные о команде, пикнувшей карту, успешно обновлены",
      map: updatedMap,
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных карты:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// API-эндпоинт для фиксации команд, пикнувших карты, для всего матча
app.post("/api/matches/:matchId/fix-pick-teams", async (req, res) => {
  try {
    const matchId = req.params.matchId;

    // Получаем информацию о матче
    const match = await new Promise((resolve, reject) => {
      db.get(
        `
                SELECT 
                    m.*,
                    t1.name as team1_name, t1.logo as team1_logo,
                    t2.name as team2_name, t2.logo as team2_logo
                FROM matches m
                LEFT JOIN teams t1 ON m.team1_id = t1.id
                LEFT JOIN teams t2 ON m.team2_id = t2.id
                WHERE m.id = ?
            `,
        [matchId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!match) {
      return res.status(404).json({ error: "Матч не найден" });
    }

    // Получаем все карты матча
    const maps = await new Promise((resolve, reject) => {
      db.all(
        `
                SELECT * FROM match_maps
                WHERE match_id = ?
                ORDER BY order_number ASC
            `,
        [matchId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    if (!maps || !maps.length) {
      return res.status(404).json({ error: "Карты матча не найдены" });
    }

    // Обновляем оригинальные данные о командах, пикнувших карты
    const updatePromises = maps.map((map) => {
      // Определяем имя и лого команды
      let pickTeamName = null;
      let pickTeamLogo = null;

      if (map.pick_team === "team1") {
        pickTeamName = match.team1_name;
        pickTeamLogo = match.team1_logo;
      } else if (map.pick_team === "team2") {
        pickTeamName = match.team2_name;
        pickTeamLogo = match.team2_logo;
      } else if (map.pick_team === "DECIDER") {
        pickTeamName = null;
        pickTeamLogo = null;
      }

      // Сохраняем данные только если их нет или если параметр force=true
      return new Promise((resolve, reject) => {
        if (!map.original_pick_team_name || req.query.force === "true") {
          db.run(
            `
                        UPDATE match_maps 
                        SET original_pick_team_name = ?, original_pick_team_logo = ?
                        WHERE id = ?
                    `,
            [pickTeamName, pickTeamLogo, map.id],
            function (err) {
              if (err) reject(err);
              else resolve({ id: map.id, updated: true });
            }
          );
        } else {
          resolve({ id: map.id, updated: false });
        }
      });
    });

    // Ждем завершения всех обновлений
    const results = await Promise.all(updatePromises);

    // Получаем обновленные данные карт
    const updatedMaps = await new Promise((resolve, reject) => {
      db.all(
        `
                SELECT * FROM match_maps
                WHERE match_id = ?
                ORDER BY order_number ASC
            `,
        [matchId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      success: true,
      message: "Данные о командах, пикнувших карты, успешно зафиксированы",
      updateResults: results,
      maps: updatedMaps,
    });
  } catch (error) {
    console.error("Ошибка при фиксации данных о командах:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// API-эндпоинт для обновления информации о победителе карты
app.post("/api/maps/:mapId/update-winner", async (req, res) => {
  try {
    const mapId = req.params.mapId;
    const { winner_team, winner_logo } = req.body;

    // Проверяем существование карты
    const map = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM match_maps WHERE id = ?", [mapId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!map) {
      return res.status(404).json({ error: "Карта не найдена" });
    }

    // Обновляем данные о победителе карты
    await new Promise((resolve, reject) => {
      db.run(
        `
                UPDATE match_maps 
                SET winner_team = ?, winner_logo = ?, 
                    original_winner_team = ?, original_winner_logo = ?,
                    status = CASE WHEN ? IS NOT NULL THEN 'completed' ELSE status END
                WHERE id = ?
            `,
        [
          winner_team,
          winner_logo,
          winner_team,
          winner_logo,
          winner_team,
          mapId,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });

    // Получаем обновленные данные карты
    const updatedMap = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM match_maps WHERE id = ?", [mapId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json({
      success: true,
      message: "Данные о победителе карты успешно обновлены",
      map: updatedMap,
    });
  } catch (error) {
    console.error("Ошибка при обновлении данных победителя:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// API-эндпоинт для фиксации данных о победителях карт в матче
app.post("/api/matches/:matchId/fix-winner-teams", async (req, res) => {
  try {
    const matchId = req.params.matchId;

    // Получаем все карты матча
    const maps = await new Promise((resolve, reject) => {
      db.all(
        `
                SELECT * FROM match_maps
                WHERE match_id = ?
                ORDER BY order_number ASC
            `,
        [matchId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    if (!maps || !maps.length) {
      return res.status(404).json({ error: "Карты матча не найдены" });
    }

    // Обновляем оригинальные данные о победителях карт
    const updatePromises = maps.map((map) => {
      return new Promise((resolve, reject) => {
        // Обновляем только если есть победитель и нет оригинальных данных или force=true
        if (
          (map.winner_team && !map.original_winner_team) ||
          req.query.force === "true"
        ) {
          db.run(
            `
                        UPDATE match_maps 
                        SET original_winner_team = ?, original_winner_logo = ?
                        WHERE id = ?
                    `,
            [map.winner_team, map.winner_logo, map.id],
            function (err) {
              if (err) reject(err);
              else resolve({ id: map.id, updated: true });
            }
          );
        } else {
          resolve({ id: map.id, updated: false });
        }
      });
    });

    // Ждем завершения всех обновлений
    const results = await Promise.all(updatePromises);

    // Получаем обновленные данные карт
    const updatedMaps = await new Promise((resolve, reject) => {
      db.all(
        `
                SELECT * FROM match_maps
                WHERE match_id = ?
                ORDER BY order_number ASC
            `,
        [matchId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      success: true,
      message: "Данные о победителях карт успешно зафиксированы",
      updateResults: results,
      maps: updatedMaps,
    });
  } catch (error) {
    console.error("Ошибка при фиксации данных о победителях:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// Продолжение существующего кода...

const cameraLinks = {}; // steamid -> ссылка камеры

app.post("/api/cameras", (req, res) => {
  const { steamid, camera_link } = req.body;
  if (steamid && typeof camera_link === "string") {
    cameraLinks[steamid] = camera_link;
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, message: "Некорректные данные" });
  }
});

// Обработчик для проксирования VDO.Ninja
app.use("/ninja-proxy", (req, res) => {
  // Устанавливаем заголовки CORS
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  // Проксируем запрос на VDO.Ninja
  const ninjaUrl = `https://vdo.ninja${req.url}`;

  // Простая проксировка через запрос
  https
    .get(ninjaUrl, (response) => {
      response.pipe(res);
    })
    .on("error", (err) => {
      console.error("Ошибка при проксировании запроса:", err);
      res.status(500).send("Ошибка при проксировании");
    });
});

// Добавьте в server.js после строки 3852

// Функция для отправки данных всем клиентам через WebSocket
function broadcastGsiData(data) {
  // Делегируем в общий метод рассылки
  broadcastToAllClients("gsi", data);
}

// Добавьте после строки 3867

// Создаем отдельный обработчик GSI для HTTPS, если он настроен
/*if (httpsGsiServer) {
  gsiApp.post("/gsi-https", async (req, res) => {
    try {
      console.log("Получен GSI запрос на HTTPS порт");
      // Такая же обработка как в обычном GSI эндпоинте
      const data = req.body;
      if (!data) {
        return res.sendStatus(400);
      }

      // Обработка данных и обновление gameState
      // ...

      // В конце обязательно вызываем broadcastGsiData
      broadcastGsiData(gameState);
      res.sendStatus(200);
    } catch (error) {
      console.error("Ошибка при обработке HTTPS GSI данных:", error);
      res.sendStatus(500);
    }
  });

  console.log("HTTPS GSI эндпоинт настроен на /gsi-https");
}

// После строки с console.log('HTTPS сервер запущен на https://${serverIP}:${HTTPS_PORT}');
// добавьте:

//console.log("Настраиваем обработчики подключений для HTTPS WebSocket");

// Логирование подключений к HTTPS WebSocket
if (ioHttps) {
  console.log("ioHttps инициализирован, настраиваем обработчики");

  ioHttps.on("connection", (socket) => {
    console.log("Новое подключение к HTTPS WebSocket");

    socket.on("disconnect", () => {
      console.log("Клиент отключился от HTTPS WebSocket");
    });

    socket.on("ready", () => {
      console.log("Клиент на HTTPS WebSocket отправил ready");
      socket.emit("gsi", gameState);
      console.log("Отправлены начальные GSI данные через HTTPS WebSocket");
    });

    // Другие обработчики...
  });

  console.log("Обработчики для HTTPS WebSocket настроены");
}

// Настройте CORS для HTTPS сервера явно
if (httpsServer) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });
}

// То же самое для GSI сервера
if (httpsGsiServer) {
  gsiApp.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });
}*/

// Добавьте перенаправление с HTTP на HTTPS
/*app.use((req, res, next) => {
  if (!req.secure) {
    console.log(`Перенаправление с HTTP на HTTPS: ${req.url}`);
    return res.redirect(`https://${serverIP}:${PORT + 1}${req.url}`);
  }
  next();
});*/

app.get("/steam-frame", (req, res) => {
  const url = req.query.url;

  if (!url || !url.includes("steamcommunity.com/broadcast")) {
    return res.status(400).send("Неверная ссылка на трансляцию");
  }

  // Отправляем HTML с iframe, который будет показывать только видео
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body, html {
          margin: 0;
          padding: 0;
          overflow: hidden;
          width: 100%;
          height: 100%;
          background: transparent;
        }
        
        .container {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
        
        iframe {
          position: absolute;
          top: -80px;  /* Скрываем верхнюю часть с меню */
          left: 0;
          width: 100%;
          height: calc(100% + 160px);  /* Увеличиваем высоту, чтобы скрыть нижнюю часть */
          border: none;
          transform: scale(1.2);  /* Немного увеличиваем, чтобы скрыть боковые элементы */
          transform-origin: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <iframe src="${url}" frameborder="0" allowfullscreen></iframe>
      </div>
      
      <script>
        // Скрипт для удаления ненужных элементов из iframe
        document.addEventListener('DOMContentLoaded', () => {
          const iframe = document.querySelector('iframe');
          
          iframe.onload = function() {
            try {
              const doc = iframe.contentDocument || iframe.contentWindow.document;
              
              // Создаем стиль для скрытия ненужных элементов
              const style = doc.createElement('style');
              style.textContent = 
                .broadcast_chat_container, .broadcast_status_container, 
                .broadcast_info_container, .broadcast_title_container,
                .broadcast_thumbnail_container, .broadcast_footer,
                .broadcast_viewers_container, .broadcast_controls,
                .responsive_header, .responsive_page_template_content {
                  display: none !important;
                }
                
                .broadcast_viewer_container {
                  width: 100% !important;
                  height: 100% !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                
                .broadcast_actual_broadcast {
                  width: 100% !important;
                  height: 100% !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                
                body {
                  overflow: hidden !important;
                  background: transparent !important;
                }
              ;
              
              doc.head.appendChild(style);
            } catch (e) {
              console.error('Ошибка при настройке iframe:', e);
            }
          };
        });
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

// В начале server.js после импортов
const packageInfo = require("../package.json");
const currentVersion = packageInfo.version;

// Функция для сравнения версий (семантическое версионирование)
function compareVersions(v1, v2) {
  const v1parts = v1.split(".").map(Number);
  const v2parts = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;

    if (v1part > v2part) return 1;
    if (v1part < v2part) return -1;
  }
  return 0;
}

// Функция для проверки наличия обновлений
async function checkForUpdates() {
  try {
    console.log("Проверка обновлений...");
    console.log(`Текущая версия: ${currentVersion}`);

    if (!fetchFn) {
      console.warn("fetch недоступен. Пропускаем проверку обновлений (нужен Node 18+ или node-fetch)");
      return false;
    }

    // Получаем последнюю версию с GitHub
    const response = await fetchFn(
      "https://raw.githubusercontent.com/fyflo/CS2_Manager_HUD/main/package.json",
      {
        headers: { "Cache-Control": "no-cache" },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const repoPackage = await response.json();
    const latestVersion = repoPackage.version;
    console.log(`Последняя доступная версия: ${latestVersion}`);

    // Сравниваем версии
    if (compareVersions(currentVersion, latestVersion) < 0) {
      console.log(`=================================`);
      console.log(`Доступна новая версия: ${latestVersion}`);
      console.log(`Ваша текущая версия: ${currentVersion}`);
      console.log(`Пожалуйста, обновите приложение:`);
      console.log(`https://github.com/fyflo/CS2_Manager_HUD/releases/latest`);
      console.log(`=================================`);

      // Добавляем информацию об обновлении в gameState для отображения в HUD
      gameState.update_available = {
        current: currentVersion,
        latest: latestVersion,
        update_url: "https://github.com/fyflo/CS2_Manager_HUD/releases/latest",
      };

      return true;
    } else {
      console.log("У вас установлена последняя версия приложения");
      return false;
    }
  } catch (error) {
    console.error("Ошибка при проверке обновлений:", error);
    console.log("Детали ошибки:", error.message);
    return false;
  }
}

// Вызываем функцию проверки обновлений при запуске
(async () => {
  await checkForUpdates();
})();

// Добавьте этот маршрут в server.js
app.get("/api/check-updates", async (req, res) => {
  try {
    const updateAvailable = await checkForUpdates();

    if (updateAvailable) {
      res.json({
        update_available: true,
        current_version: currentVersion,
        latest_version: gameState.update_available.latest,
        update_url: "https://github.com/fyflo/CS2_Manager_HUD/releases/latest",
      });
    } else {
      res.json({
        update_available: false,
        current_version: currentVersion,
      });
    }
  } catch (error) {
    console.error("Ошибка при проверке обновлений:", error);
    res.status(500).json({ error: "Ошибка при проверке обновлений" });
  }
});

// Добавьте этот маршрут в server.js
app.get("/api/update-info", (req, res) => {
  if (gameState.update_available) {
    res.json({
      update_available: true,
      current_version: currentVersion,
      latest_version: gameState.update_available.latest,
      update_url: "https://github.com/fyflo/CS2_Manager_HUD/releases/latest",
    });
  } else {
    res.json({
      update_available: false,
      current_version: currentVersion,
    });
  }
});

// В server.js, где вы рендерите основной HTML
app.get("/", (req, res) => {
  res.render("index", {
    gameState: gameState,
    currentVersion: currentVersion,
  });
});

// Добавьте в server.js
app.get("/package-version", (req, res) => {
  const packageInfo = require("../package.json");
  res.json({ version: packageInfo.version });
});

// Добавьте этот маршрут в server.js
app.get("/api/version", (req, res) => {
  try {
    const packageInfo = require("../package.json");
    res.json({ version: packageInfo.version });
  } catch (error) {
    console.error("Ошибка при чтении package.json:", error);
    res
      .status(500)
      .json({ version: "0.0.0", error: "Не удалось прочитать версию" });
  }
});

// Добавляем колонку format в таблицу matches, если она не существует
db.run("PRAGMA table_info(matches)", function (err, rows) {
  if (err) {
    console.error("Ошибка при получении информации о таблице matches:", err);
    return;
  }

  // Проверяем, есть ли колонка format
  let hasFormatColumn = false;

  if (Array.isArray(rows)) {
    hasFormatColumn = rows.some((row) => row.name === "format");
  } else {
    // Если rows не массив, используем другой подход
    db.all("PRAGMA table_info(matches)", function (err, rows) {
      if (err) {
        console.error(
          "Ошибка при получении информации о таблице matches:",
          err
        );
        return;
      }

      hasFormatColumn = rows.some((row) => row.name === "format");

      if (!hasFormatColumn) {
        addFormatColumn();
      }
    });
    return;
  }

  if (!hasFormatColumn) {
    addFormatColumn();
  }
});

function addFormatColumn() {
  // Добавляем колонку format
  db.run(
    "ALTER TABLE matches ADD COLUMN format TEXT DEFAULT 'bo1'",
    function (err) {
      if (err) {
        console.error("Ошибка при добавлении колонки format:", err);
      } else {
        console.log("Колонка format успешно добавлена в таблицу matches");
      }
    }
  );

  // Создаем временную таблицу с нужной структурой
  db.run(
    `
        CREATE TABLE IF NOT EXISTS matches_temp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team1_id INTEGER,
            team2_id INTEGER,
            score_team1 INTEGER DEFAULT 0,
            score_team2 INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            format TEXT DEFAULT 'bo1'
        )
    `,
    function (err) {
      if (err) {
        console.error("Ошибка при создании временной таблицы:", err);
        return;
      }

      // Копируем данные из старой таблицы во временную
      db.run(
        `
            INSERT INTO matches_temp (id, team1_id, team2_id, score_team1, score_team2, status, created_at, format)
            SELECT id, team1_id, team2_id, score_team1, score_team2, status, created_at, 
                   COALESCE(format, 'bo1') as format
            FROM matches
        `,
        function (err) {
          if (err) {
            console.error(
              "Ошибка при копировании данных во временную таблицу:",
              err
            );
            return;
          }

          // Удаляем старую таблицу
          db.run("DROP TABLE matches", function (err) {
            if (err) {
              console.error("Ошибка при удалении старой таблицы:", err);
              return;
            }

            // Переименовываем временную таблицу
            db.run(
              "ALTER TABLE matches_temp RENAME TO matches",
              function (err) {
                if (err) {
                  console.error(
                    "Ошибка при переименовании временной таблицы:",
                    err
                  );
                } else {
                  console.log(
                    "Таблица matches успешно пересоздана со столбцом format"
                  );
                }
              }
            );
          });
        }
      );
    }
  );
}

const matchesApiLogPath = path.join(__dirname, "../matches-api.log");
function logMatchesApi(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(matchesApiLogPath, `[${timestamp}] ${message}\n`);
}

// API для получения позиций игроков для калькулятора координат
app.get("/api/positions", (req, res) => {
  // CORS заголовки для доступа из браузера
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  try {
    // Получаем текущие данные GSI
    const players = {};
    
    // Если есть данные о игроках в кэше
    radarCache.forEach((value, key) => {
      if (key.startsWith('player_') && key.endsWith('_pos')) {
        const steamId = key.replace('player_', '').replace('_pos', '');
        
        // Получаем дополнительную информацию о игроке, если доступна
        const playerInfo = playersBuffer[steamId] || {};
        
        players[steamId] = {
          position: value, // Позиция из кэша
          team: playerInfo.team || 'T', // Команда (по умолчанию T)
          name: playerInfo.name || `Player ${steamId.substring(0, 5)}`, // Имя игрока
          observer_slot: playerInfo.observer_slot || 0 // Слот наблюдателя
        };
      }
    });
    
    // Получаем данные о бомбе, если есть
    const bombPosition = radarCache.get('bomb_position');
    
    // Формируем ответ
    const response = {
      players: players,
      bomb: bombPosition ? { position: bombPosition } : null,
      map: radarCache.get('map_name') || 'unknown'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Ошибка при получении позиций игроков:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Вспомогательная функция для получения ADR из csgogsi с запасным вариантом
function getAdrFromCsgogsi(steamid, fallbackAdr) {
  try {
    if (!lastCsgogsiParsed || !Array.isArray(lastCsgogsiParsed.players)) return fallbackAdr;
    const p = lastCsgogsiParsed.players.find((pl) => pl.steamid === steamid);
    const adr = p?.state?.adr;
    return typeof adr === "number" && !Number.isNaN(adr) ? adr : fallbackAdr;
  } catch {
    return fallbackAdr;
  }
}

// Вспомогательная функция для получения HS% из csgogsi с запасным вариантом
/*function getHsFromCsgogsi(steamid, fallbackHs) {
  try {
    if (!lastCsgogsiParsed || !Array.isArray(lastCsgogsiParsed.players)) return fallbackHs;
    const p = lastCsgogsiParsed.players.find((pl) => pl.steamid === steamid);
    const hs = p?.state?.hs ?? p?.match_stats?.hsPercent;
    return typeof hs === "number" && !Number.isNaN(hs) ? hs : fallbackHs;
  } catch {
    return fallbackHs;
  }
}*/

// Simple per-round HS accumulation store and helpers
if (!gameState.playerHsRounds) {
  gameState.playerHsRounds = {}; // { [steamid]: { [roundNumber]: number } }
}

function recordRoundHeadshots(steamid, roundNumber, roundKillHs, mapData) {
  if (!steamid) return;
  if (!mapData || mapData.phase === 'warmup') return;
  const round = Number(roundNumber || 0);
  const hs = Number(roundKillHs || 0);
  if (!gameState.playerHsRounds[steamid]) gameState.playerHsRounds[steamid] = {};
  // Overwrite current round value with latest snapshot (no accumulation here)
  gameState.playerHsRounds[steamid][round] = hs;
}

function getTotalHeadshotsForSteam(steamid) {
  const perRound = gameState.playerHsRounds?.[steamid];
  if (!perRound) return 0;
  let total = 0;
  for (const v of Object.values(perRound)) {
    total += Number(v || 0);
  }
  return total;
}

// Helper: find Steam executable on Windows
function findSteamExePath() {
  try {
    if (process.env.STEAM_EXE && fs.existsSync(process.env.STEAM_EXE)) return process.env.STEAM_EXE;
    const candidates = [
      'C:/Program Files (x86)/Steam/steam.exe',
      'C:/Program Files/Steam/steam.exe',
      (process.env.PROGRAMFILES_X86 || process.env['ProgramFiles(x86)']) ? `${process.env.PROGRAMFILES_X86 || process.env['ProgramFiles(x86)']}/Steam/steam.exe` : null,
      process.env.PROGRAMFILES ? `${process.env.PROGRAMFILES}/Steam/steam.exe` : null,
    ].filter(Boolean);
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    // Try registry query (Windows only)
    if (process.platform === 'win32') {
      try {
        const { execSync } = require('child_process');
        const out = execSync('reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
        const match = out.match(/SteamPath\s+REG_SZ\s+(.+)/i);
        if (match && match[1]) {
          const base = match[1].trim().replace(/\\/g, '/');
          const full = `${base}/steam.exe`;
          if (fs.existsSync(full)) return full;
        }
      } catch {}
    }
  } catch {}
  return null;
}

// POST /api/launch-cs2-exec { configName?: string }
app.post('/api/launch-cs2-exec', (req, res) => {
  try {
    const steamExe = findSteamExePath();
    if (!steamExe) return res.status(500).json({ error: 'Steam не найден. Укажите путь в переменной окружения STEAM_EXE.' });

    const raw = String(req.body?.configName || 'observer');
    const safe = raw.match(/^[A-Za-z0-9_\-.]+$/) ? raw : null;
    if (!safe) return res.status(400).json({ error: 'Некорректное имя конфига' });

    const cmd = `"${steamExe}" -applaunch 730 -novid +exec ${safe}`;
    const child = exec(cmd, { windowsHide: true, detached: true });
    if (child && child.unref) child.unref();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Не удалось запустить CS2' });``
  }
});

// Новый эндпоинт: запуск HLAE
app.post('/api/launch-hlae', (req, res) => {
  try {
    const hlaePath = path.join(__dirname, '../public/hlae/HLAE.exe');
    if (!fs.existsSync(hlaePath)) {
      return res.status(404).json({ error: 'HLAE.exe не найден по пути public/hlae/HLAE.exe' });
    }

    // Определяем путь к cs2.exe
    const cs2Root = findCS2Path();
    if (!cs2Root) {
      return res.status(500).json({ error: 'Не удалось определить путь к CS2' });
    }
    const cs2Exe = path.join(cs2Root, 'game', 'bin', 'win64', 'cs2.exe');
    if (!fs.existsSync(cs2Exe)) {
      return res.status(404).json({ error: 'cs2.exe не найден по ожидаемому пути game/bin/win64/cs2.exe' });
    }

    // Путь к AfxHookSource2.dll
    const hookDll = path.join(__dirname, '../public/hlae/x64/AfxHookSource2.dll');
    if (!fs.existsSync(hookDll)) {
      return res.status(404).json({ error: 'AfxHookSource2.dll не найден по пути public/hlae/x64/AfxHookSource2.dll' });
    }

    // Имя exec-конфига можно передать в теле запроса, по умолчанию myhud
    const rawExec = String(req.body?.configName || 'observer_HLAE_kill');
    const safeExec = rawExec.match(/^[A-Za-z0-9_\-.]+$/) ? rawExec : 'observer_HLAE_kill';

    // Формируем команду запуска HLAE c customLoader
    // Важно корректно экранировать кавычки в -cmdLine
    // Принудительно используем DX11, чтобы AfxHookSource2 корректно подцепился
    const cmdLineInner = `-steam -insecure -console -dx11 -afxDisableSteamStorage +exec ${safeExec}`;
    const noGuiFlag = req.body?.showGui ? '' : ' -noGui';
    const cmd = `"${hlaePath}" -customLoader${noGuiFlag} -autoStart -hookDllPath "${hookDll}" -programPath "${cs2Exe}" -cmdLine "${cmdLineInner}"`;

    const child = exec(cmd, { windowsHide: true, detached: true });
    if (child && child.unref) child.unref();

    // Сообщаем в UI через сокет
    try { if (io) io.emit('CS2HLAEStarted', { exec: safeExec }); } catch {}

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Не удалось запустить HLAE' });
  }
});

// ... existing code ...
function getTotalHeadshotsForSteam(steamid) {
  const perRound = gameState.playerHsRounds?.[steamid];
  if (!perRound) return 0;
  let total = 0;
  for (const v of Object.values(perRound)) {
    total += Number(v || 0);
  }
  return total;
}

// Детекция киллов из GSI (по диффам deaths/round_kills)
if (!gameState.prevRoundStats) {
  gameState.prevRoundStats = {}; // { [steamid]: { deaths, round_kills, round_killhs, assists } }
}
if (!gameState.prevHealth) {
  gameState.prevHealth = {}; // { [steamid]: number }
}
if (!gameState.lastFlashTs) {
  gameState.lastFlashTs = {}; // { [steamid]: number (epoch ms) }
}
if (!gameState.lastActiveWeapon) {
  gameState.lastActiveWeapon = {}; // { [steamid]: { name: string, ts: number } }
}
if (!gameState.lastFlashStartTs) {
  gameState.lastFlashStartTs = {}; // { [steamid]: number (epoch ms) }
}
if (!gameState.lastFlashEndTs) {
  gameState.lastFlashEndTs = {}; // { [steamid]: number (epoch ms) }
}
if (!gameState.prevInSmoke) {
  gameState.prevInSmoke = {}; // { [steamid]: boolean }
}
if (!gameState.lastSmokeEndTs) {
  gameState.lastSmokeEndTs = {}; // { [steamid]: number (epoch ms) }
}

function detectAndEmitKillfeed(data) {
  try {
    if (!data || !data.allplayers) return;
    const allplayers = data.allplayers;
    const prev = gameState.prevRoundStats || {};
    const prevHealth = gameState.prevHealth || {};
    const nowMs = Date.now();

    // Если новый раунд начался (freezetime), сбрасываем локальные маркеры для чистоты
    if (data.map && data.map.phase === 'freezetime') {
      gameState.prevRoundStats = {};
      gameState.prevHealth = {};
    }

    // --- SMOKE: собрать активные смоки из GSI ---
    const SMOKE_RADIUS = 150; // приближённый радиус в игровых координатах
    const getPos2D = (obj) => {
      const p = obj?.position || obj?.pos || obj;
      if (!p) return null;
      if (typeof p.x === 'number' && typeof p.y === 'number') return { x: p.x, y: p.y };
      if (Array.isArray(p) && p.length >= 2) return { x: Number(p[0]) || 0, y: Number(p[1]) || 0 };
      return null;
    };
    const extractSmokes = (grenades) => {
      const list = [];
      if (!grenades) return list;
      const entries = Array.isArray(grenades) ? grenades : Object.values(grenades);
      for (const g of entries) {
        const type = String(g?.type || '').toLowerCase();
        if (type.includes('smoke')) {
          const life = Number(g?.lifetime ?? g?.effecttime ?? 1);
          if (life > 0) {
            const pos = getPos2D(g);
            if (pos) list.push({ x: pos.x, y: pos.y });
          }
        }
      }
      return list;
    };
    const distance2D = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));
    const isPointInAnySmoke = (pos, smokes) => {
      if (!pos || !smokes || !smokes.length) return false;
      for (const s of smokes) {
        if (distance2D(pos, s) <= SMOKE_RADIUS) return true;
      }
      return false;
    };
    const smokes = extractSmokes(data.grenades);

    // 1) Составляем списки жертв (по падению здоровья до 0 или росту deaths) и киллеров (рост round_kills)
    const victims = [];
    const killers = [];
    const inSmokeNow = {}; // steamid -> bool
    for (const [steamId, player] of Object.entries(allplayers)) {
      const curDeaths = Number(player?.match_stats?.deaths || 0);
      const curKills = Number(player?.state?.round_kills || 0);
      const curKillsTotal = Number(player?.match_stats?.kills || 0);
      const curHs = Number(player?.state?.round_killhs || 0);
      const curHealth = Number(player?.state?.health ?? 0);
      const curFlashed = Number(player?.state?.flashed || 0);
      const prevEntry = prev[steamId] || { deaths: 0, round_kills: 0, round_killhs: 0, assists: 0, flashed: 0, kills: 0 };
      const prevHp = Number(prevHealth[steamId] ?? curHealth);

      // Обновляем отметку последнего ослепления
      if (curFlashed > 0) {
        gameState.lastFlashTs[steamId] = nowMs;
      }
      // Фиксируем моменты начала/окончания ослепления по переходам 0->1 и 1->0
      const prevFlashed = Number(prevEntry.flashed || 0);
      if (curFlashed > 0 && prevFlashed === 0) {
        gameState.lastFlashStartTs[steamId] = nowMs;
      }
      if (curFlashed === 0 && prevFlashed > 0) {
        gameState.lastFlashEndTs[steamId] = nowMs;
      }

      // Определяем нахождение игрока в смоке (2D)
      const p2 = getPos2D(player);
      const curSmokedFlag = Number(player?.state?.smoked || 0) > 0;
      const curInSmoke = curSmokedFlag || isPointInAnySmoke(p2, smokes);
      inSmokeNow[steamId] = curInSmoke;
      const prevInSmoke = !!gameState.prevInSmoke[steamId];
      if (!curInSmoke && prevInSmoke) {
        gameState.lastSmokeEndTs[steamId] = nowMs;
      }

      const deathIncreased = curDeaths > prevEntry.deaths;
      const droppedToZero = prevHp > 0 && curHealth === 0;
      if (deathIncreased || droppedToZero) {
        victims.push({ steamId, player });
      }

      // Детекция киллера: сперва по round_kills, при отсутствии — по match_stats.kills
      if (curKills > prevEntry.round_kills || curKillsTotal > (prevEntry.kills || 0)) {
        killers.push({ steamId, player });
      }
    }
    // Обновляем предыдущие значения in-smoke
    gameState.prevInSmoke = inSmokeNow;

    // 2) Пытаемся смэтчить жертву с киллером (противоположная команда, был рост round_kills)
    for (const vic of victims) {
      let matched = null;
      for (const kil of killers) {
        if (kil.steamId === vic.steamId) continue;
        matched = kil;
        break;
      }

      if (matched) {
        const killer = matched.player;
        const killerPrev = prev[matched.steamId] || { round_kills: 0, round_killhs: 0, assists: 0, flashed: 0 };
        const killerCurKills = Number(killer?.state?.round_kills || 0);
        const killerCurHs = Number(killer?.state?.round_killhs || 0);
        const killerTeam = killer?.team || '';
        const victimTeam = vic.player?.team || '';
        const isTeamkill = !!(killerTeam && victimTeam && killerTeam === victimTeam);

        // Определяем оружие килла, устойчиво к моментальному свитчу на нож
        const getCurrentActive = () => {
          try {
            const weapons = killer?.weapons || {};
            for (const key of Object.keys(weapons)) {
              const w = weapons[key];
              if (w && w.state === 'active') {
                return String(w.name || w.type || 'ak47');
              }
            }
          } catch {}
          return 'ak47';
        };
        const prevActive = prev[matched.steamId]?.activeWeapon || null;
        const lastActiveObj = gameState.lastActiveWeapon[matched.steamId];
        const recentActive = (lastActiveObj && (nowMs - lastActiveObj.ts) <= 2000) ? lastActiveObj.name : null;
        let weaponName = prevActive || recentActive || getCurrentActive();

        const simpleName = String(weaponName).replace(/^weapon_/i, '');
        const isKnife = /knife/i.test(weaponName);
        const isGrenade = /grenade/i.test(weaponName);
        const isBomb = /c4/i.test(weaponName);
        const headshot = killerCurHs > (killerPrev.round_killhs || 0) && killerCurKills > (killerPrev.round_kills || 0);

        // Жертва: ослеплена сейчас (flashed>0) или в течение 1с после перехода 1->0
        const victimFlashedNow = Number(vic.player?.state?.flashed || 0) > 0;
        const victimEndTs = gameState.lastFlashEndTs[vic.steamId] || 0;
        const victimInGrace = victimEndTs > 0 && (nowMs - victimEndTs) <= 1000;

        // Определяем ассистов: рост общего assists у союзников киллера в этот тик
        const assists = [];
        for (const [sid, pl] of Object.entries(allplayers)) {
          if (sid === matched.steamId) continue; // не считаем самого киллера
          if (sid === vic.steamId) continue; // не считаем жертву
          const curA = Number(pl?.match_stats?.assists || 0);
          const prevA = Number(prev[sid]?.assists || 0);
          if (curA > prevA) {
            assists.push({ steamid: sid, name: pl?.name || sid, team: pl?.team || '' });
          }
        }

        // Киллер считается ослеплённым только если сейчас flashed > 0 (без запаса)
        const killerFlashedNow = Number(killer?.state?.flashed || 0) > 0;

        // --- SMOKE flags ---
        const killerInSmokeNow = !!inSmokeNow[matched.steamId];
        const victimInSmokeNow = !!inSmokeNow[vic.steamId];
        const victimSmokeEndTs = gameState.lastSmokeEndTs[vic.steamId] || 0;
        const victimInSmokeGrace = victimInSmokeNow || (victimSmokeEndTs > 0 && (nowMs - victimSmokeEndTs) <= 1000);
        let assistInSmokeNow = false;
        if (assists && assists.length) {
          assistInSmokeNow = assists.some(a => !!inSmokeNow[a.steamid]);
        }

        // Геометрический анализ «прострела через смок» отключен: учитываем только факт нахождения в смоке
        let throughSmoke = false;
        const smokeInvolvedFlag = !!(killerInSmokeNow || victimInSmokeGrace || assistInSmokeNow);
         
        const kill = {
          killer: killer?.name || matched.steamId,
          killer_team: killer?.team || '',
          killer_side: killer?.team || '',
          killer_steamid: matched.steamId,
          victim: vic.player?.name || vic.steamId,
          victim_team: vic.player?.team || '',
          victim_steamid: vic.steamId,
          // Жертва была ослеплена сейчас или в течение 1с после окончания ослепления
          victim_flashed: !!(victimFlashedNow || victimInGrace),
          weapon: simpleName,
          knife: isKnife,
          grenade: isGrenade,
          bomb: isBomb,
          headshot: !!headshot,
          // Киллер ослеплён только если прямо сейчас flashed > 0
          killer_flashed: !!killerFlashedNow,
          teamkill: isTeamkill,
          // SMOKE flags
          smoke: {
            killer: !!killerInSmokeNow,
            victim: !!victimInSmokeGrace,
            assist: !!assistInSmokeNow,
            through: false,
          },
          smoke_involved: smokeInvolvedFlag,
          assists,
        };

        if (typeof addKillToKillfeed === 'function') {
          addKillToKillfeed(kill);
        }
      }
    }

    // Обновляем prev снапшот
    const nextPrev = {};
    for (const [sid, pl] of Object.entries(allplayers)) {
      // Запоминаем активное оружие на этот тик
      let activeWeaponSnap = null;
      try {
        const weapons = pl?.weapons || {};
        for (const key of Object.keys(weapons)) {
          const w = weapons[key];
          if (w && w.state === 'active') {
            activeWeaponSnap = String(w.name || w.type || '').replace(/^weapon_/i, '') || null;
            break;
          }
        }
      } catch {}
      nextPrev[sid] = {
        deaths: Number(pl?.match_stats?.deaths || 0),
        round_kills: Number(pl?.state?.round_kills || 0),
        round_killhs: Number(pl?.state?.round_killhs || 0),
        assists: Number(pl?.match_stats?.assists || 0),
        flashed: Number(pl?.state?.flashed || 0),
        kills: Number(pl?.match_stats?.kills || 0),
        activeWeapon: activeWeaponSnap,
      };
      gameState.prevHealth[sid] = Number(pl?.state?.health ?? 0);
    }
    gameState.prevRoundStats = nextPrev;
  } catch (e) {
    console.error('detectAndEmitKillfeed error:', e);
  }
}
// ... existing code ...

// Редактирование CS2 cfg файлов: чтение/запись ограниченного списка
const ALLOWED_CFG_FILES = new Set([
  'gamestate_integration_fhud.cfg',
  'observer.cfg',
  'observer_off.cfg',
  'observer2.cfg',
  'observer_HLAE_kill.cfg'
]);

function resolveProjectCfgDir() {
  const candidates = [
    path.join(process.cwd(), 'cfg'),
    path.join(__dirname, '../cfg')
  ];
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return candidates[0];
}
const PROJECT_CFG_DIR = resolveProjectCfgDir();

function isSafeCfgName(name) {
  return /^[A-Za-z0-9_\-.]+\.cfg$/i.test(name);
}

// Список доступных cfg файлов из project/cfg
app.get('/api/cs2-config/list', (req, res) => {
  try {
    const dir = resolveProjectCfgDir();
    if (!fs.existsSync(dir)) {
      return res.json({ success: true, files: [] });
    }
    const files = fs
      .readdirSync(dir)
      .filter((fname) => isSafeCfgName(fname));
    return res.json({ success: true, files });
  } catch (e) {
    return res.status(500).json({ error: 'Ошибка чтения списка файлов' });
  }
});

app.get('/api/cs2-config', (req, res) => {
  try {
    const name = String(req.query.name || '').trim();
    if (!isSafeCfgName(name)) {
      return res.status(400).json({ error: 'Недопустимое имя файла' });
    }
    const dir = resolveProjectCfgDir();
    const filePath = path.join(dir, name);
    if (!fs.existsSync(filePath)) {
      return res.json({ success: true, name, content: '' });
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return res.json({ success: true, name, content });
  } catch (e) {
    return res.status(500).json({ error: 'Ошибка чтения файла' });
  }
});

app.post('/api/cs2-config', (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const content = String(req.body?.content || '');
    if (!isSafeCfgName(name)) {
      return res.status(400).json({ error: 'Недопустимое имя файла' });
    }
    const dir = resolveProjectCfgDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, name);
    fs.writeFileSync(filePath, content, 'utf8');
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Ошибка записи файла' });
  }
});

// ... existing code ...
// Настройка статических файлов
app.use(express.static("public"));

// Fallback: HUD preview.png → default image if missing
app.get('/huds/:hudId/preview.png', (req, res) => {
  try {
    const hudId = req.params.hudId;
    const previewPath = path.join(__dirname, '../public/huds', hudId, 'preview.png');
    if (fs.existsSync(previewPath)) {
      return res.sendFile(previewPath);
    }
    const fallback = path.join(__dirname, '../public/images/default-hud.png');
    return res.sendFile(fallback);
  } catch (e) {
    return res.status(404).end();
  }
});

// Fallback: requests like /logo-12345.png → serve from /uploads if exists, else default
app.get(/^\/logo-\d+\.png$/, (req, res) => {
  try {
    const filename = req.path.replace(/^\//, '');
    const uploadPath = path.join(__dirname, '../public/uploads', filename);
    if (fs.existsSync(uploadPath)) {
      return res.sendFile(uploadPath);
    }
    const fallback = path.join(__dirname, '../public/images/default-hud.png');
    return res.sendFile(fallback);
  } catch (e) {
    return res.status(404).end();
  }
});

// Настройка кэширования для статических файлов
app.use(
  express.static("public", {
    maxAge: "1h",
    etag: true,
    lastModified: true,
  })
);
// ... existing code ...

// API endpoint для popup word
app.post('/api/popup-word', (req, res) => {
  try {
    const { type, action, word, timestamp } = req.body;
    
    if (type === 'popup_word' && action === 'show') {
      // Отправляем команду всем подключенным HUD клиентам
      io.emit('popup_word', {
        type: 'popup_word',
        action: 'show',
        word: word || 'POPUP!',
        timestamp: timestamp || Date.now()
      });
      
      console.log(`Popup word sent to HUD: ${word}`);
      res.json({ success: true, message: 'Popup word sent to HUD' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid popup word data' });
    }
  } catch (error) {
    console.error('Error handling popup word:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// API endpoint для kills-leaderboard
app.post('/api/kills-leaderboard', (req, res) => {
  try {
    const { type, action, timestamp } = req.body;
    
    if (type === 'kills_leaderboard' && (action === 'show' || action === 'hide')) {
      // Отправляем команду всем подключенным HUD клиентам
      io.emit('kills_leaderboard', {
        type: 'kills_leaderboard',
        action: action, // 'show' или 'hide'
        timestamp: timestamp || Date.now()
      });
      
      console.log(`Kills leaderboard ${action} command sent to HUD`);
      res.json({ success: true, message: `Kills leaderboard ${action} command sent to HUD` });
    } else {
      res.status(400).json({ success: false, message: 'Invalid kills-leaderboard data' });
    }
  } catch (error) {
    console.error('Error handling kills-leaderboard:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// API endpoint для проверки установки CFG файла Dota 2
app.get('/api/dota2-cfg-check', (req, res) => {
  try {
    const result = checkDota2CfgInstallation();
    res.json(result);
  } catch (error) {
    console.error('Error checking Dota 2 CFG installation:', error);
    res.status(500).json({ 
      installed: false, 
      error: 'Ошибка при проверке установки CFG файла Dota 2' 
    });
  }
});

// API endpoint для установки CFG файла Dota 2
app.post('/api/dota2-cfg-install', (req, res) => {
  try {
    const result = installDota2Cfg();
    res.json(result);
  } catch (error) {
    console.error('Error installing Dota 2 CFG:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при установке CFG файла Dota 2' 
    });
  }
});

// API endpoint для удаления CFG файла Dota 2
app.get('/api/dota2-cfg-remove', (req, res) => {
  try {
    const result = removeDota2Cfg();
    res.json(result);
  } catch (error) {
    console.error('Error removing Dota 2 CFG:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при удалении CFG файла Dota 2' 
    });
  }
});

// API endpoint для получения информации о Dota 2
app.get('/api/dota2-info', (req, res) => {
  try {
    const dota2Path = findDota2Path();
    const cfgPath = findDota2CfgPath();
    const gsiPath = findDota2GsiPath();
    
    res.json({
      dota2Found: !!dota2Path,
      dota2Path: dota2Path,
      cfgPath: cfgPath,
      gsiPath: gsiPath,
      cfgExists: !!cfgPath,
      gsiExists: !!gsiPath
    });
  } catch (error) {
    console.error('Error getting Dota 2 info:', error);
    res.status(500).json({ 
      error: 'Ошибка при получении информации о Dota 2' 
    });
  }
});
