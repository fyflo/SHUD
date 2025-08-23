// modules/player.js - Модуль для работы с игроками
import { fetchAPI, debounce } from '../utils.js';

export const playerModule = {
    async loadPlayers() {
        try {
            const players = await fetchAPI('/api/players');
            this.renderPlayersList(players);
            return players;
        } catch (error) {
            console.error('Ошибка при загрузке игроков:', error);
            throw error;
        }
    },

    async createPlayer(playerData) {
        return await fetchAPI('/api/players', {
            method: 'POST',
            body: JSON.stringify(playerData)
        });
    },

    async updatePlayer(playerId, playerData) {
        return await fetchAPI(`/api/players/${playerId}`, {
            method: 'PUT',
            body: JSON.stringify(playerData)
        });
    },

    async deletePlayer(playerId) {
        if (!confirm('Вы уверены, что хотите удалить этого игрока?')) return;
        
        return await fetchAPI(`/api/players/${playerId}`, {
            method: 'DELETE'
        });
    },

    renderPlayersList(players) {
        const playersList = document.getElementById('players-list');
        if (!playersList) return;

        playersList.innerHTML = this.generatePlayersHTML(players);
        this.initializePlayerControls();
    },

    generatePlayersHTML(players) {
        return `
            <div class="players-controls">
                <input type="text" id="playerSearch" placeholder="Поиск по никнейму или Steam64" class="search-input">
            </div>
            <div class="players-table-container">
                <table class="players-table">
                    <thead>
                        <tr>
                            <th width="60">Аватар</th>
                            <th>Никнейм</th>
                            <th>Реальное имя</th>
                            <th>Steam64</th>
                            <th>Команда</th>
                            <th width="150">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${players.map(player => this.generatePlayerRowHTML(player)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    generatePlayerRowHTML(player) {
        return `
            <tr class="player-row" data-id="${player.id}">
                <td class="avatar-cell">
                    <div class="avatar-container">
                        <img src="${player.avatar || '/images/default-avatar.png'}" 
                             class="player-avatar" 
                             alt="${player.nickname}"
                             onerror="this.src='/images/default-avatar.png'">
                    </div>
                </td>
                <td class="player-nickname">${player.nickname}</td>
                <td>${player.realName || '-'}</td>
                <td class="player-steam64">${player.steam64}</td>
                <td>${player.teamName || '-'}</td>
                <td class="player-actions">
                    <button class="edit-btn" onclick="playerModule.editPlayer(${player.id})">Редактировать</button>
                    <button class="delete-btn" onclick="playerModule.deletePlayer(${player.id})">Удалить</button>
                </td>
            </tr>
        `;
    },

    initializePlayerControls() {
        this.initializePlayerSearch();
    },

    initializePlayerSearch() {
        const searchInput = document.getElementById('playerSearch');
        if (!searchInput) return;

        const debouncedSearch = debounce((e) => {
            this.searchPlayers(e.target.value);
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);
    },

    searchPlayers(query) {
        const searchQuery = query.toLowerCase();
        document.querySelectorAll('.player-row').forEach(row => {
            const nicknameElement = row.querySelector('.player-nickname');
            const steam64Element = row.querySelector('.player-steam64');
            
            if (!nicknameElement || !steam64Element) return;
            
            const nickname = nicknameElement.textContent.toLowerCase();
            const steam64 = steam64Element.textContent.toLowerCase();
            
            row.style.display = (nickname.includes(searchQuery) || 
                               steam64.includes(searchQuery)) ? '' : 'none';
        });
    }
};