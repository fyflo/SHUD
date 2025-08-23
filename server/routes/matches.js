const express = require("express");
const router = express.Router();
// Удаляем подключение к базе данных здесь
// const sqlite3 = require("sqlite3").verbose();
// const db = new sqlite3.Database("database.db");

// Создание индексов для оптимизации запросов
router.use((req, res, next) => {
  const db = req.app.locals.db;
  if (!db._indexesCreated) {
    db.serialize(() => {
      db.run(
        "CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status)"
      );
      db.run(
        "CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(team1_id, team2_id)"
      );
      db.run(
        "CREATE INDEX IF NOT EXISTS idx_matches_created ON matches(created_at)"
      );
      db.run(
        "CREATE INDEX IF NOT EXISTS idx_match_maps ON match_maps(match_id)"
      );
    });
    db._indexesCreated = true;
  }
  next();
});

// Кэш для хранения данных матчей
const matchCache = new Map();
const CACHE_TTL = 1000; // 1 секунда (было 5 минут)

// Очистка устаревших данных из кэша
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of matchCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      matchCache.delete(key);
    }
  }
}, 5000); // Проверка каждые 5 секунд (было 60000 - каждую минуту)

// Получение матча по ID с кэшированием
router.get("/:id", async (req, res) => {
  const db = req.app.locals.db;
  const matchId = req.params.id;

  // Если передан параметр _t, игнорируем кэш
  const bypassCache = req.query._t !== undefined;

  // Проверяем кэш, если не нужно его обходить
  const cachedMatch = matchCache.get(matchId);
  if (
    !bypassCache &&
    cachedMatch &&
    Date.now() - cachedMatch.timestamp < CACHE_TTL
  ) {
    return res.json(cachedMatch.data);
  }

  try {
    // Получаем основную информацию о матче
    const matchQuery = `
            SELECT 
                m.*,
                t1.name as team1_name,
                t2.name as team2_name
            FROM matches m
            LEFT JOIN teams t1 ON m.team1_id = t1.id
            LEFT JOIN teams t2 ON m.team2_id = t2.id
            WHERE m.id = ?
        `;

    const match = await new Promise((resolve, reject) => {
      db.get(matchQuery, [matchId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!match) {
      return res.status(404).json({ error: "Матч не найден" });
    }

    // Получаем информацию о картах матча
    const mapsQuery = `
            SELECT 
                id, map_name, pick_team, order_number, map_type,
                score_team1, score_team2, status,
                winner_team, winner_logo, original_winner_team, original_winner_logo
            FROM match_maps
            WHERE match_id = ?
            ORDER BY order_number ASC
        `;

    const maps = await new Promise((resolve, reject) => {
      db.all(mapsQuery, [matchId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Добавляем карты к данным матча
    match.maps = maps;

    // Сохраняем в кэш
    matchCache.set(matchId, {
      data: match,
      timestamp: Date.now(),
    });

    res.json(match);
  } catch (err) {
    console.error("Ошибка при получении матча:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// Обновление счета матча
router.post("/update-score", async (req, res) => {
  const db = req.app.locals.db;
  const { matchId, teamNumber, change } = req.body;

  // Валидация входных данных
  if (!matchId || !teamNumber || change === undefined) {
    return res.status(400).json({ error: "Неверные параметры запроса" });
  }

  const column = teamNumber === 1 ? "score_team1" : "score_team2";

  // Используем транзакцию для атомарного обновления
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const updateQuery = `
            UPDATE matches 
            SET ${column} = ${column} + ? 
            WHERE id = ?
        `;

    db.run(updateQuery, [change, matchId], function (err) {
      if (err) {
        db.run("ROLLBACK");
        console.error("Ошибка при обновлении счета:", err);
        return res.status(500).json({ error: "Ошибка при обновлении счета" });
      }

      // Удаляем матч из кэша
      matchCache.delete(matchId);

      db.run("COMMIT");
      res.json({ success: true });
    });
  });
});

// Получение списка активных матчей
router.get("/", async (req, res) => {
  const db = req.app.locals.db;
  // Если передан параметр _t, игнорируем кэш
  const bypassCache = req.query._t !== undefined;

  // Ключ кэша для списка всех матчей
  const cacheKey = "all_matches";

  // Проверяем кэш, если не нужно его обходить
  const cachedMatches = matchCache.get(cacheKey);
  if (
    !bypassCache &&
    cachedMatches &&
    Date.now() - cachedMatches.timestamp < CACHE_TTL
  ) {
    return res.json(cachedMatches.data);
  }

  const query = `
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
    `;

  db.all(query, [], (err, matches) => {
    if (err) {
      console.error("Ошибка при получении списка матчей:", err);
      return res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }

    // Сохраняем результат в кэш
    matchCache.set(cacheKey, {
      data: matches,
      timestamp: Date.now(),
    });

    res.json(matches);
  });
});

// Обновление данных матча (формат, карты и т.д.)
router.post("/:id/update", async (req, res) => {
  const db = req.app.locals.db;
  const matchId = req.params.id;
  const { format, maps, team1_id, team2_id, match_time } = req.body;

  console.log("=== ОБНОВЛЕНИЕ МАТЧА В ROUTES ===");
  console.log("Match ID:", matchId);
  console.log("Request body:", req.body);
  console.log("match_time:", match_time);

  if (!matchId) {
    return res.status(400).json({ error: "ID матча не указан" });
  }

  // Начинаем транзакцию
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    try {
      // Обновляем основные данные матча, если они указаны
      if (format !== undefined || team1_id || team2_id || match_time !== undefined) {
        let updateFields = [];
        let updateParams = [];

        if (format !== undefined) {
          updateFields.push("format = ?");
          updateParams.push(format);
        }

        if (team1_id) {
          updateFields.push("team1_id = ?");
          updateParams.push(team1_id);
        }

        if (team2_id) {
          updateFields.push("team2_id = ?");
          updateParams.push(team2_id);
        }

        if (match_time !== undefined) {
          updateFields.push("match_time = ?");
          updateParams.push(match_time);
        }

        // Добавляем ID матча в параметры
        updateParams.push(matchId);

        const updateQuery = `UPDATE matches SET ${updateFields.join(
          ", "
        )} WHERE id = ?`;
        db.run(updateQuery, updateParams);

        console.log(
          `Обновлены данные матча ${matchId}: формат=${format}, team1_id=${team1_id}, team2_id=${team2_id}, match_time=${match_time}`
        );
      }

      // Обновляем карты матча, если они указаны
      if (maps && Array.isArray(maps)) {
        // Сначала удаляем все существующие карты для этого матча
        db.run("DELETE FROM match_maps WHERE match_id = ?", [matchId]);
        console.log(`Удалены существующие карты для матча ${matchId}`);

        // Затем добавляем новые карты
        const insertMapStmt = db.prepare(`
                    INSERT INTO match_maps (
                        match_id, map_name, pick_team, order_number, map_type
                    ) VALUES (?, ?, ?, ?, ?)
                `);

        maps.forEach((map) => {
          if (!map.mapId) return; // Пропускаем карты без ID

          insertMapStmt.run(
            matchId,
            map.mapId,
            map.pickTeam,
            map.order_number,
            map.mapType
          );

          console.log(
            `Добавлена карта для матча ${matchId}: ${map.mapId}, тип=${map.mapType}, команда=${map.pickTeam}`
          );
        });

        insertMapStmt.finalize();
      }

      // Удаляем матч из кэша
      matchCache.delete(matchId);
      // Удаляем также кэш списка всех матчей
      matchCache.delete("all_matches");

      // Завершаем транзакцию
      db.run("COMMIT", [], () => {
        res.json({
          success: true,
          message: "Данные матча успешно обновлены",
          matchId: matchId,
          format: format,
          mapsCount: maps ? maps.length : 0,
        });
      });
    } catch (error) {
      // Откатываем транзакцию в случае ошибки
      db.run("ROLLBACK");
      console.error("Ошибка при обновлении данных матча:", error);
      res.status(500).json({ error: "Ошибка при обновлении данных матча" });
    }
  });
});

module.exports = router;
