const db = require('../db');

// Получить все матчи
function getAll(callback) {
  db.all('SELECT * FROM matches', callback);
}

// Получить матч по id
function getById(id, callback) {
  db.get('SELECT * FROM matches WHERE id = ?', [id], callback);
}

// Создать новый матч
function create(data, callback) {
  const { team1_id, team2_id, format, match_time, status } = data;
  db.run(
    `INSERT INTO matches (team1_id, team2_id, format, match_time, status)
     VALUES (?, ?, ?, ?, ?)`,
    [team1_id, team2_id, format, match_time, status],
    callback
  );
}

// Обновить матч
function update(id, data, callback) {
  const { team1_id, team2_id, format, match_time, status } = data;
  db.run(
    `UPDATE matches SET team1_id=?, team2_id=?, format=?, match_time=?, status=? WHERE id=?`,
    [team1_id, team2_id, format, match_time, status, id],
    callback
  );
}

// Удалить матч
function remove(id, callback) {
  db.run('DELETE FROM matches WHERE id = ?', [id], callback);
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
}; 