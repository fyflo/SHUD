// modules/match.js - Модуль для работы с матчами
import { fetchAPI } from "../utils.js";
import { state } from "../state.js";

export const matchModule = {
  async createMatch(matchData) {
    return await fetchAPI("/api/matches", {
      method: "POST",
      body: JSON.stringify(matchData),
    });
  },

  async updateMatch(matchId, matchData) {
    return await fetchAPI(`/api/matches/${matchId}`, {
      method: "PUT",
      body: JSON.stringify(matchData),
    });
  },

  async deleteMatch(matchId) {
    if (!confirm("Вы уверены, что хотите удалить этот матч?")) return;

    return await fetchAPI(`/api/matches/${matchId}`, {
      method: "DELETE",
    });
  },

  async loadMatchesList() {
    try {
      const matches = await fetchAPI("/api/matches");
      this.renderMatchesList(matches);
    } catch (error) {
      console.error("Ошибка при загрузке списка матчей:", error);
    }
  },

  renderMatchesList(matches) {
    const matchesContainer = document.getElementById("matches-list");
    if (!matchesContainer) return;

    matchesContainer.innerHTML = matches.length
      ? this.generateMatchesHTML(matches)
      : "<p>Нет активных матчей</p>";
    this.initializeMatchControls();
  },

  generateMatchesHTML(matches) {
    return matches
      .map(
        (match) => `
            <div class="match-item">
                <div class="match-header">
                    <span class="match-name">${match.match_name}</span>
                    <span class="match-map">${match.map}</span>
                    <span class="match-status ${match.status}">${
          match.status
        }</span>
                </div>
                <div class="match-teams">
                    <div class="team team1">${match.team1_name}</div>
                    <div class="match-score">
                        <span>${match.score_team1 || 0}</span>
                        <span>:</span>
                        <span>${match.score_team2 || 0}</span>
                    </div>
                    <div class="team team2">${match.team2_name}</div>
                </div>
                <div class="match-actions">
                    ${this.generateMatchActionsHTML(match)}
                </div>
            </div>
        `
      )
      .join("");
  },

  generateMatchActionsHTML(match) {
    return `
            <div class="action-buttons">
                ${
                  match.status === "active"
                    ? `<button onclick="matchModule.stopMatch(${match.id})" class="stop-match-btn">
                        <i class="fas fa-stop"></i> Стоп матч
                       </button>`
                    : `<button onclick="matchModule.startMatch(${match.id})" class="start-match-btn">
                        <i class="fas fa-play"></i> Начать матч
                       </button>`
                }
                <button onclick="matchModule.editMatch(${
                  match.id
                })" class="edit-match-btn">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button type="button" class="swap-teams-btn" onclick="matchModule.swapMatchTeams(${
                  match.id
                })">
                    <i class="fas fa-exchange-alt"></i>
                </button>
                <button onclick="matchModule.deleteMatch(${
                  match.id
                })" class="delete-match-btn">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        `;
  },

  initializeMatchControls() {
    // Инициализация обработчиков событий для элементов управления матчами
  },

  updateGameInfo() {
    const scoreboardSection = document.getElementById("scoreboard-section");
    if (
      !scoreboardSection?.classList.contains("active") ||
      !state.gsiDataBuffer
    ) {
      return;
    }

    try {
      const data = state.gsiDataBuffer;
      if (!state.pauseUpdates) {
        this.updateScoreboard(data);
      }
    } catch (error) {
      console.error("Ошибка обновления данных:", error);
    }
  },

  updateScoreboard(data) {
    // Логика обновления скорборда
  },
};
