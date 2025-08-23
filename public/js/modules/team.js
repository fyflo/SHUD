// modules/team.js - Модуль для работы с командами
import { fetchAPI } from '../utils.js';

export const teamModule = {
    async loadTeams() {
        try {
            const teams = await fetchAPI('/api/teams');
            this.renderTeamsList(teams);
            return teams;
        } catch (error) {
            console.error('Ошибка при загрузке команд:', error);
            throw error;
        }
    },

    async createTeam(teamData) {
        return await fetchAPI('/api/teams', {
            method: 'POST',
            body: JSON.stringify(teamData)
        });
    },

    async updateTeam(teamId, teamData) {
        return await fetchAPI(`/api/teams/${teamId}`, {
            method: 'PUT',
            body: JSON.stringify(teamData)
        });
    },

    async deleteTeam(teamId) {
        if (!confirm('Вы уверены, что хотите удалить эту команду?')) return;
        
        return await fetchAPI(`/api/teams/${teamId}`, {
            method: 'DELETE'
        });
    },

    renderTeamsList(teams) {
        const teamsList = document.getElementById('teams-list');
        if (!teamsList) return;

        teamsList.innerHTML = this.generateTeamsHTML(teams);
        this.initializeTeamControls();
    },

    generateTeamsHTML(teams) {
        return `
            <div class="search-bar">
                <input type="text" id="teamSearch" placeholder="Поиск по названию или региону" class="search-input">
            </div>
            <div class="teams-container">
                ${teams.map(team => this.generateTeamCardHTML(team)).join('')}
            </div>
        `;
    },

    generateTeamCardHTML(team) {
        const logoPath = team.logo 
            ? (team.logo.startsWith('/uploads/') ? team.logo : `/uploads/${team.logo}`)
            : '/images/default-team-logo.png';
            
        return `
            <div class="team-card" data-team-id="${team.id}">
                <div class="team-info">
                    <img src="${logoPath}" 
                         class="team-logo" 
                         alt="${team.name}"
                         onerror="this.onerror=null; this.src='/images/default-team-logo.png';">
                    <div class="team-details">
                        <h3 class="team-name">${team.name}</h3>
                        <p class="team-region">${team.region || 'Регион не указан'}</p>
                    </div>
                </div>
                <div class="team-actions">
                    <button class="edit-team-btn" onclick="teamModule.editTeam(${team.id})">Редактировать</button>
                    <button class="delete-team-btn" onclick="teamModule.deleteTeam(${team.id})">Удалить</button>
                </div>
            </div>
        `;
    },

    initializeTeamControls() {
        // Инициализация обработчиков событий для элементов управления командами
        this.initializeTeamSearch();
    },

    initializeTeamSearch() {
        const searchInput = document.getElementById('teamSearch');
        if (!searchInput) return;

        const debouncedSearch = debounce((e) => {
            this.searchTeams(e.target.value);
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);
    },

    searchTeams(query) {
        const searchQuery = query.toLowerCase();
        document.querySelectorAll('.team-card').forEach(card => {
            const nameElement = card.querySelector('.team-name');
            const regionElement = card.querySelector('.team-region');
            
            if (!nameElement || !regionElement) return;
            
            const name = nameElement.textContent.toLowerCase();
            const region = regionElement.textContent.toLowerCase();
            
            card.style.display = (name.includes(searchQuery) || 
                                region.includes(searchQuery)) ? '' : 'none';
        });
    }
};