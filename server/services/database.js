const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class DatabaseManager {
  constructor() {
    this.dbPath = path.join(__dirname, "../database.db");
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error("Ошибка при открытии базы данных:", err);
          reject(err);
        } else {
          console.log("База данных подключена успешно");
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    const tables = [
      // Таблица игроков
      `CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        short_name TEXT,
        avatar TEXT,
        team_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Таблица команд
      `CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        short_name TEXT,
        logo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Таблица матчей
      `CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team1_id INTEGER,
        team2_id INTEGER,
        team1_score INTEGER DEFAULT 0,
        team2_score INTEGER DEFAULT 0,
        map TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team1_id) REFERENCES teams (id),
        FOREIGN KEY (team2_id) REFERENCES teams (id)
      )`,

      // Таблица игроков в матчах
      `CREATE TABLE IF NOT EXISTS match_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER,
        player_id INTEGER,
        team_id INTEGER,
        kills INTEGER DEFAULT 0,
        deaths INTEGER DEFAULT 0,
        assists INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (match_id) REFERENCES matches (id),
        FOREIGN KEY (player_id) REFERENCES players (id),
        FOREIGN KEY (team_id) REFERENCES teams (id)
      )`,

      // Таблица карт
      `CREATE TABLE IF NOT EXISTS maps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        display_name TEXT,
        image TEXT,
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Таблица настроек
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Вставляем базовые карты
    await this.insertDefaultMaps();
    
    console.log("Таблицы базы данных созданы успешно");
  }

  async insertDefaultMaps() {
    const maps = [
      { name: "de_dust2", display_name: "Dust II", image: "maps/de_dust2.png" },
      { name: "de_mirage", display_name: "Mirage", image: "maps/de_mirage.png" },
      { name: "de_inferno", display_name: "Inferno", image: "maps/de_inferno.png" },
      { name: "de_overpass", display_name: "Overpass", image: "maps/de_overpass.png" },
      { name: "de_nuke", display_name: "Nuke", image: "maps/de_nuke.png" },
      { name: "de_train", display_name: "Train", image: "maps/de_train.png" },
      { name: "de_cache", display_name: "Cache", image: "maps/de_cache.png" },
      { name: "de_ancient", display_name: "Ancient", image: "maps/de_ancient.png" },
      { name: "de_anubis", display_name: "Anubis", image: "maps/de_anubis.png" },
      { name: "de_vertigo", display_name: "Vertigo", image: "maps/de_vertigo.png" }
    ];

    for (const map of maps) {
      await this.run(
        "INSERT OR IGNORE INTO maps (name, display_name, image) VALUES (?, ?, ?)",
        [map.name, map.display_name, map.image]
      );
    }
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error("Ошибка при закрытии базы данных:", err);
          } else {
            console.log("База данных закрыта");
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Методы для работы с игроками
  async createPlayer(name, shortName = null, avatar = null, teamId = null) {
    const result = await this.run(
      "INSERT INTO players (name, short_name, avatar, team_id) VALUES (?, ?, ?, ?)",
      [name, shortName, avatar, teamId]
    );
    return result.id;
  }

  async getPlayer(id) {
    return await this.get(
      "SELECT p.*, t.name as team_name FROM players p LEFT JOIN teams t ON p.team_id = t.id WHERE p.id = ?",
      [id]
    );
  }

  async getAllPlayers() {
    return await this.all(
      "SELECT p.*, t.name as team_name FROM players p LEFT JOIN teams t ON p.team_id = t.id ORDER BY p.name"
    );
  }

  async updatePlayer(id, data) {
    const fields = [];
    const values = [];
    
    Object.keys(data).forEach(key => {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });
    
    values.push(id);
    
    return await this.run(
      `UPDATE players SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  }

  async deletePlayer(id) {
    return await this.run("DELETE FROM players WHERE id = ?", [id]);
  }

  // Методы для работы с командами
  async createTeam(name, shortName = null, logo = null) {
    const result = await this.run(
      "INSERT INTO teams (name, short_name, logo) VALUES (?, ?, ?)",
      [name, shortName, logo]
    );
    return result.id;
  }

  async getTeam(id) {
    return await this.get("SELECT * FROM teams WHERE id = ?", [id]);
  }

  async getAllTeams() {
    return await this.all("SELECT * FROM teams ORDER BY name");
  }

  async updateTeam(id, data) {
    const fields = [];
    const values = [];
    
    Object.keys(data).forEach(key => {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });
    
    values.push(id);
    
    return await this.run(
      `UPDATE teams SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  }

  async deleteTeam(id) {
    return await this.run("DELETE FROM teams WHERE id = ?", [id]);
  }

  // Методы для работы с матчами
  async createMatch(team1Id, team2Id, map = null) {
    const result = await this.run(
      "INSERT INTO matches (team1_id, team2_id, map) VALUES (?, ?, ?)",
      [team1Id, team2Id, map]
    );
    return result.id;
  }

  async getMatch(id) {
    return await this.get(
      `SELECT m.*, 
              t1.name as team1_name, t1.short_name as team1_short_name,
              t2.name as team2_name, t2.short_name as team2_short_name
       FROM matches m 
       LEFT JOIN teams t1 ON m.team1_id = t1.id 
       LEFT JOIN teams t2 ON m.team2_id = t2.id 
       WHERE m.id = ?`,
      [id]
    );
  }

  async getAllMatches() {
    return await this.all(
      `SELECT m.*, 
              t1.name as team1_name, t1.short_name as team1_short_name,
              t2.name as team2_name, t2.short_name as team2_short_name
       FROM matches m 
       LEFT JOIN teams t1 ON m.team1_id = t1.id 
       LEFT JOIN teams t2 ON m.team2_id = t2.id 
       ORDER BY m.created_at DESC`
    );
  }

  async updateMatch(id, data) {
    const fields = [];
    const values = [];
    
    Object.keys(data).forEach(key => {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });
    
    values.push(id);
    
    return await this.run(
      `UPDATE matches SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  }

  async deleteMatch(id) {
    return await this.run("DELETE FROM matches WHERE id = ?", [id]);
  }
}

module.exports = DatabaseManager; 