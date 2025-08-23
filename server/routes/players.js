const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка хранения файлов
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = path.join(__dirname, '../../public/uploads/');
        // Проверяем существование директории
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Функция для форматирования пути к аватарке
function formatAvatarPath(avatar) {
    if (!avatar) return null;
    
    // Если путь уже содержит /uploads/, возвращаем как есть
    if (avatar.startsWith('/uploads/')) {
        return avatar;
    }
    
    // Иначе добавляем префикс /uploads/
    return `/uploads/${avatar}`;
}

// Получение всех игроков
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    
    db.all(`
        SELECT p.id, p.nickname, p.realName, p.steam64, p.teamId, p.avatar, p.created_at, p.cameraLink,
               t.name as teamName
        FROM players p
        LEFT JOIN teams t ON p.teamId = t.id
        ORDER BY p.nickname
    `, (err, rows) => {
        if (err) {
            console.error('Ошибка при получении игроков:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        // Форматируем пути к аватаркам
        const players = rows.map(player => ({
            ...player,
            avatarUrl: formatAvatarPath(player.avatar) // Добавляем полный URL аватарки
        }));
        
        res.json(players);
    });
});

// Получение одного игрока по ID
router.get('/:id', (req, res) => {
    const db = req.app.locals.db;
    const playerId = req.params.id;
    
    db.get(`
        SELECT p.id, p.nickname, p.realName, p.steam64, p.teamId, p.avatar, p.created_at, p.cameraLink,
               t.name as teamName
        FROM players p
        LEFT JOIN teams t ON p.teamId = t.id
        WHERE p.id = ?
    `, [playerId], (err, player) => {
        if (err) {
            console.error('Ошибка при получении игрока:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        if (!player) {
            return res.status(404).json({ error: 'Игрок не найден' });
        }
        
        // Форматируем путь к аватарке
        player.avatarUrl = formatAvatarPath(player.avatar);
        
        res.json(player);
    });
});

// Создание нового игрока
router.post('/', upload.single('avatar'), (req, res) => {
    const db = req.app.locals.db;
    const { nickname, realName, steam64, teamId, cameraLink } = req.body;
    
    // Получаем имя файла аватарки, если она была загружена
    let avatar = null;
    if (req.file) {
        avatar = path.basename(req.file.path);
    }
    
    db.run(`
        INSERT INTO players (nickname, realName, steam64, teamId, avatar, cameraLink)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [nickname, realName, steam64, teamId || null, avatar, cameraLink || null], function(err) {
        if (err) {
            console.error('Ошибка при создании игрока:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        const playerId = this.lastID;
        
        // Получаем созданного игрока
        db.get(`
            SELECT p.id, p.nickname, p.realName, p.steam64, p.teamId, p.avatar, p.created_at, p.cameraLink,
                   t.name as teamName
            FROM players p
            LEFT JOIN teams t ON p.teamId = t.id
            WHERE p.id = ?
        `, [playerId], (err, player) => {
            if (err) {
                console.error('Ошибка при получении созданного игрока:', err);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }
            
            // Форматируем путь к аватарке
            player.avatarUrl = formatAvatarPath(player.avatar);
            
            res.status(201).json(player);
        });
    });
});

// Обновление игрока
router.put('/:id', upload.single('avatar'), (req, res) => {
    const db = req.app.locals.db;
    const playerId = req.params.id;
    const { nickname, realName, steam64, teamId, cameraLink } = req.body;
    
    // Сначала получаем текущие данные игрока
    db.get('SELECT avatar FROM players WHERE id = ?', [playerId], (err, player) => {
        if (err) {
            console.error('Ошибка при получении игрока для обновления:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        if (!player) {
            return res.status(404).json({ error: 'Игрок не найден' });
        }
        
        // Определяем, нужно ли обновлять аватарку
        let avatar = player.avatar;
        if (req.file) {
            avatar = path.basename(req.file.path);
            
            // Удаляем старую аватарку, если она существует
            if (player.avatar) {
                const oldAvatarPath = path.join(__dirname, '../../public/uploads/', player.avatar);
                if (fs.existsSync(oldAvatarPath)) {
                    try {
                        fs.unlinkSync(oldAvatarPath);
                    } catch (err) {
                        console.error('Ошибка при удалении старой аватарки:', err);
                    }
                }
            }
        }
        
        // Обновляем данные игрока
        db.run(`
            UPDATE players
            SET nickname = ?, realName = ?, steam64 = ?, teamId = ?, avatar = ?, cameraLink = ?
            WHERE id = ?
        `, [nickname, realName, steam64, teamId || null, avatar, cameraLink || null, playerId], function(err) {
            if (err) {
                console.error('Ошибка при обновлении игрока:', err);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }
            
            // Получаем обновленного игрока
            db.get(`
                SELECT p.id, p.nickname, p.realName, p.steam64, p.teamId, p.avatar, p.created_at, p.cameraLink,
                       t.name as teamName
                FROM players p
                LEFT JOIN teams t ON p.teamId = t.id
                WHERE p.id = ?
            `, [playerId], (err, updatedPlayer) => {
                if (err) {
                    console.error('Ошибка при получении обновленного игрока:', err);
                    return res.status(500).json({ error: 'Ошибка сервера' });
                }
                
                // Форматируем путь к аватарке
                updatedPlayer.avatarUrl = formatAvatarPath(updatedPlayer.avatar);
                
                res.json(updatedPlayer);
            });
        });
    });
});

// Удаление игрока
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const playerId = req.params.id;
    
    // Сначала получаем данные игрока для удаления аватарки
    db.get('SELECT avatar FROM players WHERE id = ?', [playerId], (err, player) => {
        if (err) {
            console.error('Ошибка при получении игрока для удаления:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        
        if (!player) {
            return res.status(404).json({ error: 'Игрок не найден' });
        }
        
        // Удаляем аватарку, если она существует
        if (player.avatar) {
            const avatarPath = path.join(__dirname, '../../public/uploads/', player.avatar);
            if (fs.existsSync(avatarPath)) {
                try {
                    fs.unlinkSync(avatarPath);
                } catch (err) {
                    console.error('Ошибка при удалении аватарки:', err);
                }
            }
        }
        
        // Удаляем игрока из базы данных
        db.run('DELETE FROM players WHERE id = ?', [playerId], function(err) {
            if (err) {
                console.error('Ошибка при удалении игрока:', err);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }
            
            res.json({ message: 'Игрок успешно удален', id: playerId });
        });
    });
});

module.exports = router;
