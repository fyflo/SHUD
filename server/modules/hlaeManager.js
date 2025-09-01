const { exec } = require("child_process");
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { Server: IOServer } = require("socket.io");

class HLAEManager {
  constructor() {
    this.isAvailable = false;
    this.isActive = false;
    this.wsServer = null;
    this.hlaeProcess = null;
    this.cs2Process = null;
    this.connectedClients = new Set();
    this.killEvents = [];
    this.eventBuffer = [];
    this.ioAliasServerHttp = null;
    this.ioHlaeAlias = null;
    this.ioAliasPort = 1349;
    this.interopExe =
      process.env.AFX_INTEROP_EXE ||
      path.join(
        __dirname,
        "../../public/afx-cefhud-interop/afx-cefhud-interop.exe"
      );
    this.interopProcess = null;

    // Пути к файлам HLAE (относительно проекта)
    this.hlaePath = path.join(__dirname, "../../public/hlae");
    this.hlaeExe = path.join(this.hlaePath, "HLAE.exe");
    this.afxHookDll = path.join(this.hlaePath, "x64/AfxHookSource2.dll");
    this.configPath = path.join(
      __dirname,
      "../../cfg/fyflo_observer_killfeed.cfg"
    );

    // Проверяем доступность HLAE при создании
    this.checkAvailability();
  }

  // Проверка доступности HLAE
  async checkAvailability() {
    try {
      const hlaeExists = fs.existsSync(this.hlaeExe);
      const afxExists = fs.existsSync(this.afxHookDll);
      const configExists = fs.existsSync(this.configPath);

      this.isAvailable = hlaeExists && afxExists && configExists;

      if (this.isAvailable) {
        //console.log("[HLAE] ✅ HLAE доступен");
        //console.log(`[HLAE] Путь к HLAE: ${this.hlaeExe}`);
        //console.log(`[HLAE] Путь к AfxHook: ${this.afxHookDll}`);
        //console.log(`[HLAE] Путь к конфигу: ${this.configPath}`);
      } else {
        console.log("[HLAE] ❌ HLAE недоступен");
        if (!hlaeExists)
          if (!afxExists)
            if (!configExists)
              //console.log("[HLAE] Не найден HLAE.exe");
              console.log("[HLAE] Не найден AfxHookSource2.dll");
        //console.log("[HLAE] Не найден конфиг fyflo_observer_killfeed.cfg");
      }

      return this.isAvailable;
    } catch (error) {
      //console.error("[HLAE] Ошибка проверки доступности:", error);
      this.isAvailable = false;
      return false;
    }
  }

  // Запуск WebSocket сервера для получения данных от HLAE
  startWebSocketServer(port = 31337) {
    if (this.wsServer) {
      //console.log("[HLAE] WebSocket сервер уже запущен");
      return;
    }

    try {
      // Создаем WebSocket сервер без пути, чтобы принимать подключения с любого пути
      this.wsServer = new WebSocket.Server({
        port,
      });

      this.wsServer.on("connection", (ws, req) => {
        //console.log("[HLAE] Новое WebSocket подключение от HLAE");
        //console.log("[HLAE] IP адрес клиента:", req.socket.remoteAddress);
        //console.log("[HLAE] User-Agent:", req.headers["user-agent"]);
        this.connectedClients.add(ws);

        // Отправляем тестовое сообщение клиенту
        ws.send(
          JSON.stringify({
            type: "connection_test",
            message: "HLAE WebSocket сервер готов к приему данных",
            timestamp: Date.now(),
          })
        );

        ws.on("message", (data) => {
          try {
            //console.log(
            //"[HLAE] Получены сырые данные:",
            data.toString().substring(0, 200) + "...";
            //);
            const event = JSON.parse(data.toString());
            //console.log("[HLAE] ws event type:", event?.type || typeof event);
            this.processHLAEEvent(event);
          } catch (error) {
            //console.error("[HLAE] Ошибка парсинга события:", error);
            //console.error("[HLAE] Сырые данные:", data.toString());
          }
        });

        ws.on("close", () => {
          //console.log("[HLAE] WebSocket соединение с HLAE закрыто");
          this.connectedClients.delete(ws);
        });

        ws.on("error", (error) => {
          //console.error("[HLAE] WebSocket ошибка:", error);
          this.connectedClients.delete(ws);
        });
      });

      this.wsServer.on("listening", () => {
        //console.log(`[HLAE] WebSocket сервер запущен на порту ${port}`);
      });

      this.wsServer.on("error", (error) => {
        //console.error("[HLAE] Ошибка WebSocket сервера:", error);
      });
    } catch (error) {
      //console.error("[HLAE] Ошибка запуска WebSocket сервера:", error);
    }
  }

  // Запуск Socket.IO алиаса
  startSocketIOAlias(port = 1349) {
    if (this.ioHlaeAlias) return;
    try {
      this.ioAliasPort = port;
      this.ioAliasServerHttp = http.createServer((req, res) => {
        try {
          //console.log("[HLAE] alias HTTP request:", req.method, req.url);
        } catch {}
        res.statusCode = 200;
        res.end("HLAE Socket.IO alias running\n");
      });
      // Логируем upgrade (WebSocket) попытки
      try {
        this.ioAliasServerHttp.on("upgrade", (req) => {
          //console.log("[HLAE] alias HTTP upgrade:", req.url);
        });
      } catch {}
      this.ioHlaeAlias = new IOServer(this.ioAliasServerHttp, {
        cors: { origin: "*", methods: ["GET", "POST"] },
        allowEIO3: true,
        path: "/socket.io",
      });

      this.ioHlaeAlias.on("connection", (socket) => {
        //console.log("[HLAE] Socket.IO alias: клиент подключился");
        if (typeof socket.onAny === "function") {
          socket.onAny((event, ...args) => {
            try {
              const preview =
                args && args.length > 0
                  ? JSON.stringify(args[0]).substring(0, 200)
                  : "(no args)";
              //console.log(`[HLAE] alias onAny → ${event}:`, preview);
            } catch {
              //console.log(`[HLAE] alias onAny → ${event} (unserializable)`);
            }
          });
        }
        socket.on("ready", () => {
          try {
            if (global.io) socket.emit("gsi", global.gameState);
          } catch {}
        });
        socket.on("hud_data", (data) => {
          try {
            if (global.io) global.io.emit("hud_data", data);
          } catch {}
        });
        socket.on("message", (data) => {
          try {
            //console.log("[HLAE] alias/message:", typeof data);
          } catch {}
        });
        socket.on("disconnect", (reason) => {
          //console.log("[HLAE] alias disconnect:", reason);
        });
        socket.on("error", (err) => {
          //console.log("[HLAE] alias error:", err?.message || err);
        });
        socket.on("mirv", (event) => {
          try {
            //console.log("[HLAE] alias/mirv:", event?.type || typeof event);
            global.gameState = global.gameState || {};
            global.gameState.hlae = global.gameState.hlae || {};
            global.gameState.hlae.mirv_last = event;
            try {
              if (global.broadcastToAllClients)
                global.broadcastToAllClients("gsi", global.gameState);
              else if (global.io) global.io.emit("gsi", global.gameState);
              const kfLen = Array.isArray(global.gameState.killfeed)
                ? global.gameState.killfeed.length
                : 0;
              //console.log(`[HLAE] alias -> gsi broadcast (killfeed=${kfLen})`);
            } catch {}
          } catch {}
        });
        socket.on("update_mirv", (event) => {
          try {
            //console.log(
            //"[HLAE] alias/update_mirv:",
            event?.type || typeof event;
            //);
            global.gameState = global.gameState || {};
            global.gameState.hlae = global.gameState.hlae || {};
            global.gameState.hlae.death_last = event;
            try {
              if (global.broadcastToAllClients)
                global.broadcastToAllClients("gsi", global.gameState);
              else if (global.io) global.io.emit("gsi", global.gameState);
              const kfLen = Array.isArray(global.gameState.killfeed)
                ? global.gameState.killfeed.length
                : 0;
              //console.log(`[HLAE] alias -> gsi broadcast (killfeed=${kfLen})`);
            } catch {}
          } catch {}
        });

        socket.on("mirv_pgl", (payload) => {
          try {
            //console.log("[HLAE] alias/mirv_pgl", typeof payload);
            global.gameState = global.gameState || {};
            global.gameState.hlae = global.gameState.hlae || {};
            global.gameState.hlae.mirv_pgl = payload;
            if (global.broadcastToAllClients)
              global.broadcastToAllClients("gsi", global.gameState);
            else if (global.io) global.io.emit("gsi", global.gameState);
          } catch {}
        });
      });

      this.ioAliasServerHttp.listen(this.ioAliasPort, () => {
        //console.log(
        //`[HLAE] Socket.IO alias listening on ${this.ioAliasPort} (EIO3 allowed)`
        //);
      });
    } catch (error) {
      //console.error("[HLAE] Ошибка запуска Socket.IO алиаса:", error);
    }
  }

  stopSocketIOAlias() {
    try {
      if (this.ioHlaeAlias) {
        this.ioHlaeAlias.close();
        this.ioHlaeAlias = null;
      }
      if (this.ioAliasServerHttp) {
        this.ioAliasServerHttp.close();
        this.ioAliasServerHttp = null;
      }
    } catch (e) {}
  }

  // Обработка событий от HLAE
  processHLAEEvent(event) {
    try {
      //console.log("[HLAE] Получено событие:", event.type);

      // Добавляем в буфер событий
      this.eventBuffer.push({
        ...event,
        timestamp: Date.now(),
      });

      // Ограничиваем размер буфера
      if (this.eventBuffer.length > 100) {
        this.eventBuffer.shift();
      }

      // Отправляем событие в csgogsi для обработки
      this.sendToCSGOGSI(event);
    } catch (error) {
      //console.error("[HLAE] Ошибка обработки события:", error);
    }
  }

  // Отправка события в csgogsi для обработки
  sendToCSGOGSI(event) {
    try {
      // Проверяем, доступен ли csgogsi
      if (global.GSI && global.GSI.digestMIRV) {
        //console.log("[HLAE] Отправляем событие в csgogsi:", event.type);

        // Определяем тип события для digestMIRV
        let eventType = "player_death"; // по умолчанию

        switch (event.type) {
          case "player_death":
            eventType = "player_death";
            break;
          case "player_hurt":
            eventType = "player_hurt";
            break;
          case "grenade_detonate":
          case "bomb_exploded":
          case "weapon_fire":
            // Для других событий используем player_death
            eventType = "player_death";
            break;
        }

        // Отправляем в csgogsi
        global.GSI.digestMIRV(event, eventType);

        //console.log("[HLAE] Событие отправлено в csgogsi:", eventType);
      } else {
        //console.log(
        //"[HLAE] csgogsi недоступен, событие будет обработано позже в GSI цикле"
        //);
      }
    } catch (error) {
      //console.error("[HLAE] Ошибка отправки в csgogsi:", error);
    }
  }

  // Запуск CS2 с HLAE
  async launchCS2WithHLAE(cs2Path, execCfgName = "observer_HLAE_kill") {
    if (!this.isAvailable) {
      throw new Error("HLAE недоступен");
    }
    if (this.isActive || this.hlaeProcess) {
      //console.log("[HLAE] Запуск отклонен: уже активен");
      return true;
    }

    try {
      // Сначала запускаем WebSocket сервер
      this.startWebSocketServer();

      // Команда для запуска HLAE с CS2
      const cmd = `"${this.hlaeExe}" -customLoader -autoStart -hookDllPath "${this.afxHookDll}" -programPath "${cs2Path}" -cmdLine "-steam -insecure -console -tools -noassetbrowser -novid +hideconsole +mirv_cvar_unhide_all +exec ${execCfgName} -netconport 2121"`;

      //console.log("[HLAE] Запуск команды:", cmd);

      this.hlaeProcess = exec(cmd, {
        windowsHide: true,
        detached: true,
      });

      if (this.hlaeProcess && this.hlaeProcess.unref) {
        this.hlaeProcess.unref();
      }

      this.isActive = true;
      //console.log("[HLAE] CS2 с HLAE запущен");

      return true;
    } catch (error) {
      //console.error("[HLAE] Ошибка запуска CS2 с HLAE:", error);
      this.isActive = false;
      throw error;
    }
  }

  // Запуск afx-cefhud-interop.exe (если существует)
  startInterop(overridePath) {
    try {
      const exePath = overridePath || this.interopExe;
      if (!exePath || !fs.existsSync(exePath)) {
        //console.warn("[HLAE] afx-cefhud-interop.exe не найден:", exePath);
        return false;
      }
      if (this.interopProcess) return true;
      //console.log("[HLAE] Запуск afx-cefhud-interop:", exePath);
      this.interopProcess = exec(`"${exePath}"`, {
        windowsHide: true,
        detached: true,
      });
      if (this.interopProcess && this.interopProcess.unref)
        this.interopProcess.unref();
      return true;
    } catch (e) {
      console.error("[HLAE] Ошибка запуска afx-cefhud-interop:", e);
      return false;
    }
  }

  // Остановка HLAE
  stopHLAE() {
    try {
      if (this.hlaeProcess) {
        this.hlaeProcess.kill();
        this.hlaeProcess = null;
      }

      if (this.wsServer) {
        this.wsServer.close();
        this.wsServer = null;
      }
      this.stopSocketIOAlias();
      try {
        if (this.interopProcess) {
          this.interopProcess.kill();
          this.interopProcess = null;
        }
      } catch {}

      this.isActive = false;
      this.connectedClients.clear();
      //console.log("[HLAE] HLAE остановлен");
    } catch (error) {
      //console.error("[HLAE] Ошибка остановки HLAE:", error);
    }
  }

  // Получение статуса HLAE
  getStatus() {
    return {
      available: this.isAvailable,
      active: this.isActive,
      wsServer: !!this.wsServer,
      connectedClients: this.connectedClients.size,
      eventBufferSize: this.eventBuffer.length,
      killEventsCount: this.killEvents.length,
      paths: {
        hlae: this.hlaeExe,
        afxHook: this.afxHookDll,
        config: this.configPath,
      },
    };
  }

  // Получение последних событий
  getRecentEvents(limit = 10) {
    return this.eventBuffer.slice(-limit);
  }

  // Получение событий убийств
  getKillEvents() {
    return this.killEvents;
  }

  // Очистка буфера событий
  clearEventBuffer() {
    this.eventBuffer = [];
    this.killEvents = [];
    //console.log("[HLAE] Буфер событий очищен");
  }

  // Генерация CFG
  generateKillfeedCfg(cs2RootPath, opts = {}) {
    try {
      const cfgDir = path.join(cs2RootPath, "game", "csgo", "cfg");
      if (!fs.existsSync(cfgDir)) fs.mkdirSync(cfgDir, { recursive: true });
      const cfgName = opts.cfgName || "lhm_killfeed";
      const safezoney =
        typeof opts.killfeedOffset === "number" ? opts.killfeedOffset : null;
      const mirvUrl =
        opts.mirvUrl ||
        `ws://localhost:${this.ioAliasPort}/socket.io/?EIO=3&transport=websocket`;
      const lines = [
        "sv_cheats 1",
        "cl_drawhud_force_teamid_overhead 1",
        "cl_draw_only_deathnotices 1",
        "cl_drawhud_force_deathnotices -1",
        "spec_show_xray 1",
        "cl_drawhud_force_radar 0",
        "cl_sanitize_muted_players 0",
        "spec_allow_roaming 1",
        "cl_drawhud 1",
        "voice_enable 0",
        "cl_obs_interp_enable 0",
      ];
      if (safezoney) lines.push(`safezoney ${safezoney}`);
      // mirv_pgl может быть недоступен в CS2, но сохраняем для совместимости с CS:GO/HLAE сборками
      lines.push(`mirv_pgl url "${mirvUrl}"`);
      lines.push("mirv_pgl start");
      const filePath = path.join(cfgDir, `${cfgName}.cfg`);
      fs.writeFileSync(filePath, lines.join("\n") + "\n", "utf8");
      return { cfgName, filePath };
    } catch (e) {
      console.error("[HLAE] Ошибка генерации CFG:", e);
      throw e;
    }
  }

  // Полный запуск
  async runLikeLHM(params = {}) {
    const {
      cs2Path,
      killfeed = true,
      killfeedOffset,
      showGui,
      execCfgName,
    } = params;
    if (!cs2Path || !fs.existsSync(cs2Path))
      throw new Error("Неверный путь CS2");
    // Поднимаем алиас
    this.startSocketIOAlias(this.ioAliasPort);
    // Если указан готовый cfg, пробуем использовать его; иначе генерируем
    let cfgToExec = execCfgName;
    if (!cfgToExec) {
      const preferCfg = path.join(
        cs2Path,
        "game",
        "csgo",
        "cfg",
        "hud_radar_killfeed_aco_interop.cfg"
      );
      if (fs.existsSync(preferCfg)) {
        cfgToExec = "hud_radar_killfeed_aco_interop";
        //console.log("[HLAE] Найден prefer cfg, используем +exec", cfgToExec);
      }
    }
    if (!cfgToExec) {
      const { cfgName } = this.generateKillfeedCfg(cs2Path, {
        cfgName: "lhm_killfeed",
        killfeedOffset,
      });
      cfgToExec = cfgName;
    }
    // Запуск через HLAE с -tools и выбранным cfg
    await this.launchCS2WithHLAE(
      path.join(cs2Path, "game", "bin", "win64", "cs2.exe"),
      cfgToExec
    );
    // Пытаемся запустить interop (если присутствует)
    this.startInterop(params.interopPath);
    return true;
  }

  // Проверка, есть ли новые события от HLAE
  hasNewEvents() {
    return this.eventBuffer.length > 0;
  }

  // Получение последнего события определенного типа
  getLastEventByType(type) {
    for (let i = this.eventBuffer.length - 1; i >= 0; i--) {
      if (this.eventBuffer[i].type === type) {
        return this.eventBuffer[i];
      }
    }
    return null;
  }
}

module.exports = HLAEManager;
