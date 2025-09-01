module.exports = (db, gameState) => {
    const express = require('express');
    const router = express.Router();
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');

    // Настройка загрузки файлов
    const storage = multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, 'public/uploads/');
        },
        filename: function(req, file, cb) {
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    });

    const upload = multer({ storage: storage });

    // Маршруты
    router.get('/server-info', (req, res) => {
        res.json({
            ip: serverIP,
            port: PORT
        });
    });

    // Маршрут для получения списка матчей
    router.get('/matches', (req, res) => {
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
                console.error('Ошибка при получении списка матчей:', err);
                return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
            }
            res.json(matches);
        });
    });

    // ... другие маршруты

    return router;
};