const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Функция для исправления базы данных
function fixDatabase() {
  console.log('Запуск функции исправления базы данных...');
  
  // Определяем путь к базе данных
  const dbPath = path.join(process.cwd(), '..', 'database.db');
  console.log('Путь к базе данных:', dbPath);
  
  // Проверяем существование базы данных
  if (!fs.existsSync(dbPath)) {
    console.error('База данных не найдена:', dbPath);
    return;
  }
  
  // Создаем подключение к базе данных
  const db = new sqlite3.Database(dbPath);
  
  // Проверяем наличие колонки format в таблице matches
  db.all("PRAGMA table_info(matches)", (err, rows) => {
    if (err) {
      console.error('Ошибка при получении информации о таблице matches:', err);
      db.close();
      return;
    }
    
    // Проверяем наличие колонки format
    const hasFormatColumn = Array.isArray(rows) && rows.some(row => row.name === 'format');
    
    if (!hasFormatColumn) {
      console.log('Добавление колонки format в таблицу matches...');
      
      // Добавляем колонку format
      db.run("ALTER TABLE matches ADD COLUMN format TEXT DEFAULT 'BO1'", (err) => {
        if (err) {
          console.error('Ошибка при добавлении колонки format:', err);
        } else {
          console.log('Колонка format успешно добавлена');
        }
        
        db.close();
      });
    } else {
      console.log('Колонка format уже существует в таблице matches');
      db.close();
    }
  });
}

// Функция для выполнения SQL запроса
function runQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        console.error('Ошибка SQL:', query, err);
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

// Функция для выполнения SQL запроса с получением результатов
function getQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Ошибка SQL:', query, err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Создание основных таблиц
async function createTables(db) {
  console.log('Создание основных таблиц...');
  
  // Таблица teams
  await runQuery(db, `
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo TEXT,
      region TEXT,
      short_name TEXT
    )
  `);
  
  // Таблица players
  await runQuery(db, `
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT NOT NULL,
      realName TEXT,
      steam64 TEXT,
      teamId INTEGER,
      avatar TEXT,
      cameraLink TEXT,
      FOREIGN KEY(teamId) REFERENCES teams(id)
    )
  `);
  
  // Таблица matches
  await runQuery(db, `
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team1_id INTEGER,
      team2_id INTEGER,
      format TEXT DEFAULT 'bo1',
      status TEXT DEFAULT 'pending',
      score_team1 INTEGER DEFAULT 0,
      score_team2 INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(team1_id) REFERENCES teams(id),
      FOREIGN KEY(team2_id) REFERENCES teams(id)
    )
  `);
  
  // Таблица match_maps
  await runQuery(db, `
    CREATE TABLE IF NOT EXISTS match_maps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER,
      map_name TEXT,
      pick_team TEXT,
      side_pick_team TEXT,
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
  `);
}

// Проверка и добавление недостающих колонок
async function checkColumns(db) {
  console.log('Проверка структуры таблиц...');
  
  // Проверка таблицы teams
  const teamsColumns = await getQuery(db, "PRAGMA table_info(teams)");
  if (!teamsColumns.some(col => col.name === 'short_name')) {
    console.log('Добавление колонки short_name в таблицу teams');
    await runQuery(db, "ALTER TABLE teams ADD COLUMN short_name TEXT");
  }
  
  // Проверка таблицы players
  const playersColumns = await getQuery(db, "PRAGMA table_info(players)");
  if (!playersColumns.some(col => col.name === 'cameraLink')) {
    console.log('Добавление колонки cameraLink в таблицу players');
    await runQuery(db, "ALTER TABLE players ADD COLUMN cameraLink TEXT");
  }
  
  // Проверка таблицы matches
  const matchesColumns = await getQuery(db, "PRAGMA table_info(matches)");
  if (!matchesColumns.some(col => col.name === 'format')) {
    console.log('Добавление колонки format в таблицу matches');
    await runQuery(db, "ALTER TABLE matches ADD COLUMN format TEXT DEFAULT 'bo1'");
  }
  
  // Проверка таблицы match_maps
  const matchMapsColumns = await getQuery(db, "PRAGMA table_info(match_maps)");
  if (!matchMapsColumns.some(col => col.name === 'map_type')) {
    console.log('Добавление колонки map_type в таблицу match_maps');
    await runQuery(db, "ALTER TABLE match_maps ADD COLUMN map_type TEXT DEFAULT 'pick'");
  }
  if (!matchMapsColumns.some(col => col.name === 'original_winner_team')) {
    console.log('Добавление колонки original_winner_team в таблицу match_maps');
    await runQuery(db, "ALTER TABLE match_maps ADD COLUMN original_winner_team TEXT");
  }
  if (!matchMapsColumns.some(col => col.name === 'original_winner_logo')) {
    console.log('Добавление колонки original_winner_logo в таблицу match_maps');
    await runQuery(db, "ALTER TABLE match_maps ADD COLUMN original_winner_logo TEXT");
  }
  if (!matchMapsColumns.some(col => col.name === 'original_pick_team_name')) {
    console.log('Добавление колонки original_pick_team_name в таблицу match_maps');
    await runQuery(db, "ALTER TABLE match_maps ADD COLUMN original_pick_team_name TEXT");
  }
  if (!matchMapsColumns.some(col => col.name === 'original_pick_team_logo')) {
    console.log('Добавление колонки original_pick_team_logo в таблицу match_maps');
    await runQuery(db, "ALTER TABLE match_maps ADD COLUMN original_pick_team_logo TEXT");
  }
}

module.exports = { fixDatabase };
