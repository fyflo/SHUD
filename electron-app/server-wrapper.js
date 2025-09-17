const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

// Функция для записи логов в файл
function writeLog(message) {
  const logPath = path.join(__dirname, "server-log.txt");
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  try {
    fs.appendFileSync(logPath, logMessage);
  } catch (error) {
    console.error("Ошибка при записи в лог-файл:", error);
  }

  // Дублируем в консоль
  console.log(message);
}

// Создание package.json для сервера, если его нет
function createPackageJsonIfNeeded(serverDir) {
  const packageJsonPath = path.join(serverDir, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    writeLog(`Создание package.json в ${serverDir}`);

    const packageJson = {
      name: "SHUD",
      version: "1.0.0",
      description: "SHUD Server",
      main: "server.js",
      dependencies: {
        express: "^4.18.2",
        "socket.io": "^4.6.1",
        sqlite3: "^5.1.6",
        multer: "^1.4.5-lts.1",
        cors: "^2.8.5",
        "body-parser": "^1.20.2",
        "fs-extra": "^11.1.1",
      },
    };

    try {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      writeLog("package.json создан успешно");
      return true;
    } catch (error) {
      writeLog(`Ошибка при создании package.json: ${error.message}`);
      return false;
    }
  }

  return true;
}

// Функция для запуска сервера через Node.js, встроенный в Electron
function launchServerWithElectron(serverPath, serverDir) {
  writeLog("Запуск сервера через встроенный Node.js Electron...");

  try {
    // Сохраняем текущую директорию
    const originalCwd = process.cwd();

    // Меняем рабочую директорию на директорию сервера
    process.chdir(serverDir);
    writeLog(`Рабочая директория изменена на: ${process.cwd()}`);

    // Прямое выполнение сервера в текущем процессе
    writeLog("Загрузка сервера через require...");
    try {
      // Очищаем кэш require для случая перезапуска
      Object.keys(require.cache).forEach((key) => {
        if (key.includes("server.js")) {
          delete require.cache[key];
        }
      });

      // Устанавливаем переменные окружения
      process.env.ELECTRON_APP = "true";
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      process.env.DEBUG = "true";

      // Устанавливаем путь к базе данных, если он задан
      if (process.env.DB_PATH) {
        writeLog(
          `Используется путь к базе данных из переменной окружения: ${process.env.DB_PATH}`
        );
      } else {
        // По умолчанию используем базу данных в корне проекта
        process.env.DB_PATH = path.join(originalCwd, "database.db"); // Use originalCwd here
        writeLog(
          `Установлен путь к базе данных по умолчанию: ${process.env.DB_PATH}`
        );
      }

      // Патчим API маршрутов перед запуском сервера
      patchApiRoutes(serverDir);

      // Запускаем сервер через require
      const server = require(serverPath);
      writeLog("Сервер успешно запущен через require");

      // Восстанавливаем оригинальную рабочую директорию
      process.chdir(originalCwd);

      // Создаем простой объект для эмуляции процесса
      return {
        pid: process.pid,
        kill: () => {
          writeLog("Попытка остановки сервера...");
          if (server && typeof server.close === "function") {
            server.close();
            writeLog("Сервер успешно остановлен");
          } else {
            writeLog("Не удалось остановить сервер (метод close не найден)");
          }
        },
      };
    } catch (requireError) {
      writeLog(
        `Ошибка при загрузке сервера через require: ${requireError.message}`
      );
      writeLog(requireError.stack);

      // Возвращаемся к оригинальной директории
      process.chdir(originalCwd);

      // Пробуем альтернативный метод через fork
      writeLog("Пробуем запустить сервер через fork...");
      const { fork } = require("child_process");

      // Устанавливаем путь к базе данных, если он задан
      const env = {
        ...process.env,
        ELECTRON_APP: "true",
        NODE_TLS_REJECT_UNAUTHORIZED: "0",
        DEBUG: "true",
      };

      if (process.env.DB_PATH) {
        writeLog(
          `Используется путь к базе данных из переменной окружения: ${process.env.DB_PATH}`
        );
        env.DB_PATH = process.env.DB_PATH;
      } else {
        // По умолчанию используем базу данных в корне проекта
        env.DB_PATH = path.join(originalCwd, "database.db");
        writeLog(`Установлен путь к базе данных по умолчанию: ${env.DB_PATH}`);
      }

      // Патчим API маршрутов перед запуском сервера
      patchApiRoutes(serverDir);

      const serverProcess = fork(serverPath, [], {
        cwd: serverDir,
        env: env,
        silent: true, // Перехватываем stdout/stderr
      });

      // Обработчики сообщений и ошибок
      serverProcess.stdout?.on("data", (data) => {
        const output = data.toString().trim();
        if (output) {
          writeLog(`Сервер [stdout]: ${output}`);
        }
      });

      serverProcess.stderr?.on("data", (data) => {
        const output = data.toString().trim();
        if (output) {
          writeLog(`Сервер [stderr]: ${output}`);
        }
      });

      serverProcess.on("error", (error) => {
        writeLog(`Ошибка запуска сервера через fork: ${error.message}`);
      });

      serverProcess.on("close", (code) => {
        writeLog(`Сервер завершил работу с кодом ${code}`);
      });

      writeLog(`Сервер запущен через fork, PID: ${serverProcess.pid}`);
      return serverProcess;
    }
  } catch (error) {
    writeLog(`Ошибка при запуске сервера: ${error.message}`);
    writeLog(error.stack);
    return null;
  }
}

// Функция для патчинга API маршрутов
function patchApiRoutes(serverDir) {
  try {
    writeLog("Патчинг API маршрутов для Electron-приложения...");

    // Путь к файлу API маршрутов
    const apiRoutesPath = path.join(serverDir, "routes", "api.js");

    // Проверяем существование файла
    if (!fs.existsSync(apiRoutesPath)) {
      writeLog(`Файл API маршрутов не найден: ${apiRoutesPath}`);
      return;
    }

    // Читаем содержимое файла
    let apiContent = fs.readFileSync(apiRoutesPath, "utf8");

    // Проверяем, содержит ли файл уже маршрут для /matches
    if (apiContent.includes("router.get('/matches'")) {
      writeLog("Маршрут /matches уже существует в API");
      return;
    }

    // Добавляем маршрут для /matches
    const matchesRouteCode = `
    // Маршрут для получения списка матчей (добавлен для Electron-приложения)
    router.get('/matches', (req, res) => {
        const query = \`
            SELECT 
                m.*,
                t1.name as team1_name,
                t2.name as team2_name,
                GROUP_CONCAT(mm.map_name) as maps
            FROM matches m
            LEFT JOIN teams t1 ON m.team1_id = t1.id
            LEFT JOIN teams t2 ON m.team2_id = t2.id
            LEFT JOIN match_maps mm ON m.id = mm.match_id
            GROUP BY m.id
            ORDER BY m.created_at DESC
        \`;

        db.all(query, [], (err, matches) => {
            if (err) {
                console.error('Ошибка при получении списка матчей:', err);
                return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
            }
            res.json(matches);
        });
    });`;

    // Находим место для вставки нового маршрута
    const insertPosition = apiContent.indexOf(
      "module.exports = (db, gameState) => {"
    );
    if (insertPosition === -1) {
      writeLog("Не удалось найти подходящее место для вставки маршрута");
      return;
    }

    // Находим позицию для вставки маршрута (после первого router.get)
    const routerGetPosition = apiContent.indexOf("router.get(", insertPosition);
    if (routerGetPosition === -1) {
      writeLog("Не удалось найти подходящее место для вставки маршрута");
      return;
    }

    // Находим конец строки с router.get
    const endOfLine = apiContent.indexOf(";", routerGetPosition);
    if (endOfLine === -1) {
      writeLog("Не удалось найти конец строки для вставки маршрута");
      return;
    }

    // Вставляем новый маршрут
    const newApiContent =
      apiContent.slice(0, endOfLine + 1) +
      matchesRouteCode +
      apiContent.slice(endOfLine + 1);

    // Записываем обновленный файл
    fs.writeFileSync(apiRoutesPath, newApiContent, "utf8");
    writeLog("Маршрут /matches успешно добавлен в API");
  } catch (error) {
    writeLog(`Ошибка при патчинге API маршрутов: ${error.message}`);
  }
}

// Функция для запуска сервера - обеспечивает обратную совместимость
function runServer(projectRoot) {
  const serverPath = path.join(projectRoot, "server", "server.js");
  const serverProcess = spawn("node", [serverPath], {
    cwd: path.join(projectRoot, "server"),
    env: {
      ...process.env,
      ELECTRON_APP: "1",
    },
    stdio: "inherit",
  });
  return serverProcess;
}

module.exports = { runServer };
