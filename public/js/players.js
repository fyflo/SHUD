// Функция для загрузки и отображения игроков
function loadPlayers() {
    fetch('/api/players')
        .then(response => response.json())
        .then(players => {
            const playersList = document.getElementById('players-list');
            if (!playersList) return;
            
            playersList.innerHTML = '';
            
            players.forEach(player => {
                // Формируем правильный URL для аватарки
                let avatarUrl = '/images/default-avatar.png'; // Аватарка по умолчанию
                
                if (player.avatar) {
                    // Проверяем, начинается ли путь с /uploads/
                    if (player.avatar.startsWith('/uploads/')) {
                        avatarUrl = player.avatar;
                    } else {
                        avatarUrl = `/uploads/${player.avatar}`;
                    }
                }
                
                const playerCard = `
                    <div class="player-card" data-id="${player.id}">
                        <div class="player-avatar">
                            <img src="${avatarUrl}" alt="${player.nickname}" onerror="this.src='/images/default-avatar.png'">
                        </div>
                        <div class="player-info">
                            <h3>${player.nickname}</h3>
                            <p>${player.realName || '-'}</p>
                            <p>${player.teamName || 'без команды'}</p>
                        </div>
                        <div class="player-actions">
                            <button class="edit-player-btn" data-id="${player.id}"><i class="fas fa-edit"></i></button>
                            <button class="delete-player-btn" data-id="${player.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
                
                playersList.insertAdjacentHTML('beforeend', playerCard);
            });
            
            // Добавляем обработчики событий для кнопок редактирования и удаления
            setupPlayerActions();
        })
        .catch(error => {
            console.error('Ошибка при загрузке игроков:', error);
        });
}

// Функция для настройки обработчиков событий
function setupPlayerActions() {
    // Обработчики для кнопок редактирования
    document.querySelectorAll('.edit-player-btn').forEach(button => {
        button.addEventListener('click', function() {
            const playerId = this.getAttribute('data-id');
            editPlayer(playerId);
        });
    });
    
    // Обработчики для кнопок удаления
    document.querySelectorAll('.delete-player-btn').forEach(button => {
        button.addEventListener('click', function() {
            const playerId = this.getAttribute('data-id');
            deletePlayer(playerId);
        });
    });
}

// Функция для редактирования игрока
function editPlayer(playerId) {
    // Получаем данные игрока
    fetch(`/api/players/${playerId}`)
        .then(response => response.json())
        .then(player => {
            // Здесь можно открыть модальное окно с формой редактирования
            console.log('Редактирование игрока:', player);
            // Реализация зависит от вашего UI
        })
        .catch(error => {
            console.error('Ошибка при получении данных игрока:', error);
        });
}

// Функция для удаления игрока
function deletePlayer(playerId) {
    if (confirm('Вы уверены, что хотите удалить этого игрока?')) {
        fetch(`/api/players/${playerId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            console.log('Игрок удален:', result);
            // Перезагружаем список игроков
            loadPlayers();
        })
        .catch(error => {
            console.error('Ошибка при удалении игрока:', error);
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем список игроков
    loadPlayers();
    
    // Обработчик для формы добавления игрока
    const playerForm = document.getElementById('player-form');
    if (playerForm) {
        playerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            fetch('/api/players', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(result => {
                console.log('Игрок добавлен:', result);
                // Очищаем форму
                playerForm.reset();
                // Перезагружаем список игроков
                loadPlayers();
            })
            .catch(error => {
                console.error('Ошибка при добавлении игрока:', error);
            });
        });
    }
    
    // Обработчик для отображения имени выбранного файла аватарки
    const avatarInput = document.getElementById('player-avatar');
    const avatarDisplay = document.getElementById('avatar-file-display');
    
    if (avatarInput && avatarDisplay) {
        avatarInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                avatarDisplay.textContent = this.files[0].name;
            } else {
                avatarDisplay.textContent = '';
            }
        });
    }
});

// Функция для исправления путей к аватаркам на странице
function fixAvatarPaths() {
    // Ищем все изображения аватарок
    const avatarImages = document.querySelectorAll('.player-avatar img, .avatar-image');
    
    avatarImages.forEach(img => {
        if (img.src && !img.src.includes('/uploads/') && !img.src.includes('default-avatar.png')) {
            // Получаем имя файла из пути
            const filename = img.src.split('/').pop();
            
            // Устанавливаем новый путь с префиксом /uploads/
            img.src = `/uploads/${filename}`;
            console.log('Исправлен путь к аватарке:', img.src);
        }
    });
}

// Запускаем функцию исправления путей после загрузки страницы и через интервалы
document.addEventListener('DOMContentLoaded', function() {
    // Запускаем сразу
    fixAvatarPaths();
    
    // Запускаем с интервалами для обработки динамически добавленных элементов
    setTimeout(fixAvatarPaths, 500);
    setTimeout(fixAvatarPaths, 1500);
    setTimeout(fixAvatarPaths, 3000);
}); 