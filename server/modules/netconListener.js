const net = require("net");

class NetconListener {
  constructor(opts = {}) {
    this.host = opts.host || "127.0.0.1";
    this.port = opts.port || 2121;
    this.client = null;
    this.buffer = "";
    this.connected = false;
    this.reconnectDelayMs = 2000;
    this.onEvent = typeof opts.onEvent === "function" ? opts.onEvent : null;
    this.currentEvent = null; // { name, tick, fields }
    this.userIdToName = {}; // { userid -> name }
    this.userIdToSteam = {}; // { userid -> steamid }
    this.steamToName = {}; // { steamid -> name }
    this.getNameBySteam =
      typeof opts.getNameBySteam === "function" ? opts.getNameBySteam : null;
    this.inStatusTable = false;
    this._statusProbeInterval = null;
  }

  _setIdentity(userid, name, steamid) {
    try {
      if (userid == null) return;
      const uid = String(userid);
      if (name && String(name).length) {
        this.userIdToName[uid] = String(name);
      }
      if (steamid && String(steamid).length) {
        const sid = String(steamid);
        this.userIdToSteam[uid] = sid;
        if (name && String(name).length) this.steamToName[sid] = String(name);
      }
      if (name || steamid) {
        //console.log(
        //`[NETCON] identity: userid=${uid} name=${name || ""} steamid=${
        //steamid || ""
        //}`
        //);
      }
    } catch {}
  }

  _resolveNameByUserId(userid) {
    if (!userid && userid !== 0) return "";
    const uid = String(userid);
    // direct by userid
    const byUid = this.userIdToName[uid];
    if (byUid) return byUid;
    // through steamid
    const sid = this.userIdToSteam[uid];
    if (sid) {
      const bySid = this.steamToName[sid];
      if (bySid) return bySid;
      if (this.getNameBySteam) {
        const byGsi = this.getNameBySteam(sid);
        if (byGsi) return byGsi;
      }
    }
    return "";
  }

  start() {
    if (this.connected) return;
    this._connect();
  }

  stop() {
    try {
      if (this.client) this.client.destroy();
    } catch {}
    this.client = null;
    this.connected = false;
  }

  _connect() {
    try {
      this.client = net.createConnection(
        { host: this.host, port: this.port },
        () => {
          this.connected = true;
          //console.log(`[NETCON] connected to ${this.host}:${this.port}`);
          try {
            global.gameState = global.gameState || {};
            global.gameState.hlae_status = global.gameState.hlae_status || {};
            global.gameState.hlae_status.netcon_connected = true;
          } catch {}
          // Запрашиваем статус для первичного заполнения имен / userid
          this.send("status");
          // Периодически пока нет кэша
          if (!this._statusProbeInterval) {
            this._statusProbeInterval = setInterval(() => {
              try {
                if (Object.keys(this.userIdToName).length >= 5) {
                  clearInterval(this._statusProbeInterval);
                  this._statusProbeInterval = null;
                } else {
                  this.send("status");
                }
              } catch {}
            }, 7000);
          }
        }
      );

      this.client.setEncoding("utf8");

      this.client.on("data", (chunk) => {
        this.buffer += chunk;
        let idx;
        while ((idx = this.buffer.indexOf("\n")) !== -1) {
          const line = this.buffer.slice(0, idx).trim();
          this.buffer = this.buffer.slice(idx + 1);
          if (!line) continue;
          this._handleLine(line);
        }
      });

      this.client.on("error", (err) => {
        //console.log("[NETCON] error:", err?.message || err);
      });

      this.client.on("close", () => {
        //if (this.connected) console.log("[NETCON] connection closed");
        this.connected = false;
        try {
          global.gameState = global.gameState || {};
          global.gameState.hlae_status = global.gameState.hlae_status || {};
          global.gameState.hlae_status.netcon_connected = false;
        } catch {}
        setTimeout(() => this._connect(), this.reconnectDelayMs);
      });
    } catch (e) {
      //console.log("[NETCON] connect failed:", e?.message || e);
      setTimeout(() => this._connect(), this.reconnectDelayMs);
    }
  }

  _handleLine(line) {
    try {
      // Парсинг вывода status для построения userid->name(steam)
      if (
        /(^|\b)userid(\b|\s).*\bname\b.*(uniqueid|steam|xuid|networkid)/i.test(
          line
        )
      ) {
        this.inStatusTable = true;
        //console.log("[NETCON] status header detected");
        return;
      }
      if (this.inStatusTable) {
        // Примеры форматов:
        // # 2 15 "qw1nk1" 7656119....... 00:10 35 0 active 786432
        //   15  "qw1nk1"  [U:1:123456]
        const tableMatch1 = line.match(/^#\s*\d+\s+\"([^\"]+)\"\s+(\S+)/);
        const tableMatch2 = line.match(/^\s*(\d+)\s+\"([^\"]+)\"\s+(\S+)/);
        const m = tableMatch1 || tableMatch2;
        if (m) {
          const uid = m[1];
          const name = m[2];
          const steamish = m[3];
          this._setIdentity(uid, name, steamish);
          //console.log(
          //`[NETCON] status row: uid=${uid} name=${name} steam=${steamish}`
          //);
          return;
        }
        // Завершение таблицы при встрече пустой строки или другой секции
        if (!line || /^\S+/.test(line)) {
          this.inStatusTable = false;
        }
      }

      // Начало события: Game event "NAME", Tick NNN:
      const startMatch = line.match(/^Game event \"([^\"]+)\", Tick\s+(\d+)/);
      if (startMatch) {
        this._finalizeCurrentEvent();
        this.currentEvent = {
          name: startMatch[1],
          tick: parseInt(startMatch[2], 10) || 0,
          fields: {},
        };
        return;
      }

      // Строки с ключ-значение из блока события
      if (this.currentEvent && /^-\s+/.test(line)) {
        const kvMatch = line.match(
          /^-[\s]+\"?([A-Za-z0-9_]+)\"?\s*=\s*\"?([^\"]*)\"?/
        );
        if (kvMatch) {
          const key = kvMatch[1];
          const lowerKey = key.toLowerCase();
          let value = kvMatch[2];
          // Не конвертируем steam/xuid идентификаторы в Number, чтобы не терять точность
          const isSteamLike =
            lowerKey.includes("steam") ||
            lowerKey === "xuid" ||
            lowerKey === "networkid";
          if (!isSteamLike && /^-?\d+$/.test(value)) value = Number(value);
          this.currentEvent.fields[key] = value;
          return;
        }
      }

      // Иные строки завершают текущий блок
      this._finalizeCurrentEvent();
      //if (Math.random() < 0.01)
      //console.log("[NETCON] line:", line.slice(0, 160));
    } catch {}
  }

  _finalizeCurrentEvent() {
    if (!this.currentEvent) return;
    try {
      //console.log(
      //`[NETCON] event: ${this.currentEvent.name} (tick=${this.currentEvent.tick})`
      //);
      const name = this.currentEvent.name;
      const tick = this.currentEvent.tick;
      const fields = this.currentEvent.fields || {};

      if (
        (name === "player_connect" ||
          name === "player_connect_full" ||
          name === "player_info" ||
          name === "player_spawn" ||
          name === "player_activate" ||
          name === "player_team") &&
        fields.userid !== undefined &&
        fields.userid !== null
      ) {
        const nm =
          fields.name ||
          fields.username ||
          fields.playername ||
          fields.player_name ||
          fields.newname;
        const sid = fields.steamid || fields.playersteamid || fields.steam;
        this._setIdentity(fields.userid, nm, sid);
      }

      if (
        name === "player_changename" &&
        fields.userid !== undefined &&
        fields.userid !== null
      ) {
        const newNm = fields.newname || fields.name;
        this._setIdentity(
          fields.userid,
          newNm,
          this.userIdToSteam[String(fields.userid)]
        );
      }

      let payload = { type: name, name, tick, fields };
      if (name === "player_death") {
        const num = (v) => v === 1 || v === "1" || v === true;
        const killerId = fields.attacker;
        const victimId = fields.userid;
        const assisterId = fields.assister;
        let attackerName = fields.attackername || fields.attacker_name;
        let victimName = fields.victimname || fields.victim_name;

        // Если имя отсутствует, пробуем через маппинги и GSI
        if (!attackerName && killerId)
          attackerName = this._resolveNameByUserId(killerId);
        if (!victimName && victimId)
          victimName = this._resolveNameByUserId(victimId);

        if (!attackerName || !victimName) {
          //console.log(
          //`[NETCON] resolve names: killerId=${killerId} -> "${attackerName}" | victimId=${victimId} -> "${victimName}"`
          //);
          // Триггерим status для пополнения кэша, с троттлингом
          const now = Date.now();
          this._lastStatusReq = this._lastStatusReq || 0;
          if (now - this._lastStatusReq > 5000) {
            this._lastStatusReq = now;
            this.send("status");
          }
        }
        const killerSteam = this.userIdToSteam[String(killerId)] || "";
        const victimSteam = this.userIdToSteam[String(victimId)] || "";
        const assisterSteam = this.userIdToSteam[String(assisterId)] || "";
        payload.norm = {
          killer_id: killerId,
          victim_id: victimId,
          assister_id: assisterId,
          killer_name:
            attackerName || this.userIdToName[String(killerId)] || "",
          victim_name: victimName || this.userIdToName[String(victimId)] || "",
          killer_steamid: killerSteam,
          victim_steamid: victimSteam,
          assister_steamid: assisterSteam,
          weapon: fields.weapon,
          headshot: num(fields.headshot),
          noscope: num(fields.noscope),
          throughsmoke: num(fields.thrusmoke || fields.throughsmoke),
          flashed: num(fields.assistedflash || fields.attackerblind),
          penetrated: Number(fields.penetrated || 0),
          // Доп. поля для последующей аналитики
          assistedflash: num(fields.assistedflash),
          dominated: num(fields.dominated),
          revenge: num(fields.revenge),
          wipe: num(fields.wipe),
          noreplay: num(fields.noreplay),
          thrusmoke: num(fields.thrusmoke),
          attackerblind: num(fields.attackerblind),
          distance:
            fields.distance != null ? Number(fields.distance) : undefined,
          dmg_health:
            fields.dmg_health != null ? Number(fields.dmg_health) : undefined,
          dmg_armor:
            fields.dmg_armor != null ? Number(fields.dmg_armor) : undefined,
          hitgroup:
            fields.hitgroup != null ? Number(fields.hitgroup) : undefined,
          attackerinair: num(fields.attackerinair),
          tick,
          source: "netcon",
        };
      }

      if (this.onEvent) this.onEvent(payload);
    } catch {}
    this.currentEvent = null;
  }

  send(cmd) {
    try {
      if (!this.client) return;
      const line = String(cmd).endsWith("\n")
        ? String(cmd)
        : String(cmd) + "\n";
      this.client.write(line, "utf8");
    } catch {}
  }
}

module.exports = NetconListener;
