const db = require('../db');

// Получить все карты для матча
function getByMatchId(match_id, callback) {
  db.all('SELECT * FROM match_maps WHERE match_id = ? ORDER BY order_number ASC', [match_id], callback);
}

// Создать карту для матча
function create(data, callback) {
  const { match_id, map_name, pick_team, order_number, map_type } = data;
  db.run(
    `INSERT INTO match_maps (match_id, map_name, pick_team, order_number, map_type)
     VALUES (?, ?, ?, ?, ?)`,
    [match_id, map_name, pick_team, order_number, map_type],
    callback
  );
}

// Удалить все карты для матча
function removeByMatchId(match_id, callback) {
  db.run('DELETE FROM match_maps WHERE match_id = ?', [match_id], callback);
}

module.exports = {
  getByMatchId,
  create,
  removeByMatchId,
}; 