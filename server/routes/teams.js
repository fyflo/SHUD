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

// Получение списка всех команд
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    
    db.all('SELECT * FROM teams ORDER BY name', [], (err, teams) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(teams);
    });
});

// Создание новой команды
router.post('/', upload.single('logo'), (req, res) => {
    const db = req.app.locals.db;
    const { name, region, short_name } = req.body;
    // Сохраняем только имя файла, без /uploads/
    const logo = req.file ? req.file.filename : null;

    db.run('INSERT INTO teams (name, region, logo, short_name) VALUES (?, ?, ?, ?)',
        [name, region, logo, short_name || ''],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});

// Получение данных одной команды
router.get('/:id', (req, res) => {
    const db = req.app.locals.db;
    const teamId = req.params.id;
    
    const query = `
        SELECT * FROM teams WHERE id = ?
    `;
    
    db.get(query, [teamId], (err, team) => {
        if (err) {
            return res.status(500).json({ 
                message: 'Ошибка при получении данных команды',
                error: err.message 
            });
        }
        
        if (!team) {
            return res.status(404).json({ 
                message: `Команда с ID ${teamId} не найдена` 
            });
        }
        
        res.json(team);
    });
});

// Обновление данных команды
router.put('/:id', upload.single('logo'), (req, res) => {
    const db = req.app.locals.db;
    const teamId = req.params.id;
    const { name, region, short_name } = req.body;
    
    db.get('SELECT id FROM teams WHERE id = ?', [teamId], (err, team) => {
        if (err) {
            return res.status(500).json({ message: 'Ошибка сервера' });
        }
        
        if (!team) {
            return res.status(404).json({ message: `Команда с ID ${teamId} не найдена` });
        }
        
        // Сохраняем только имя файла, без /uploads/
        const logo = req.file ? req.file.filename : null;
        let updateQuery = 'UPDATE teams SET name = ?, region = ?, short_name = ?';
        let params = [name, region, short_name || ''];

        if (logo) {
            updateQuery += ', logo = ?';
            params.push(logo);
        }

        updateQuery += ' WHERE id = ?';
        params.push(teamId);

        db.run(updateQuery, params, function(err) {
            if (err) {
                return res.status(500).json({ message: 'Ошибка при обновлении команды' });
            }

            res.json({ 
                message: 'Команда успешно обновлена',
                teamId: teamId
            });
        });
    });
});

// Удаление команды
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const teamId = req.params.id;
    
    db.run('DELETE FROM teams WHERE id = ?', [teamId], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Ошибка при удалении команды' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ message: `Команда с ID ${teamId} не найдена` });
        }
        
        res.json({ message: 'Команда успешно удалена' });
    });
});

// Исправление путей к логотипам
router.get('/fix-logo-paths', (req, res) => {
    const db = req.app.locals.db;
    
    db.all('SELECT id, logo FROM teams', [], (err, teams) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        teams.forEach(team => {
            if (team.logo && team.logo.startsWith('/uploads/')) {
                const fixedLogo = team.logo.replace('/uploads/', '');
                db.run('UPDATE teams SET logo = ? WHERE id = ?', [fixedLogo, team.id]);
            }
        });
        
        res.json({ message: 'Пути к логотипам исправлены' });
    });
});

module.exports = router;
