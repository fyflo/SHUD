// modules/hud.js - Модуль для работы с HUD
import { fetchAPI } from '../utils.js';

export const hudModule = {
    async loadHUDs() {
        try {
            const huds = await fetchAPI('/api/huds');
            this.renderHUDsList(huds);
            return huds;
        } catch (error) {
            console.error('Ошибка при загрузке HUD:', error);
            throw error;
        }
    },

    renderHUDsList(huds) {
        const hudsList = document.getElementById('huds-list');
        if (!hudsList) return;

        hudsList.innerHTML = this.generateHUDsHTML(huds);
        this.initializeHUDControls();
    },

    generateHUDsHTML(huds) {
        return `
            <div class="players-controls">
                <input type="text" id="hudSearch" placeholder="Поиск по названию HUD" class="search-input">
            </div>
            <div class="players-table-container">
                <table class="players-table">
                    <thead>
                        <tr>
                            <th width="60">Превью</th>
                            <th>Название</th>
                            <th>Описание</th>
                            <th width="300">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${huds.map(hud => this.generateHUDRowHTML(hud)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    generateHUDRowHTML(hud) {
        return `
            <tr class="hud-row" data-hud-id="${hud.id}">
                <td class="preview-cell">
                    <div class="preview-container">
                        <img src="/huds/${hud.id}/preview.png" 
                            class="hud-preview" 
                            alt="${hud.name}"
                            onerror="this.src='/images/default-hud.png'">
                    </div>
                </td>
                <td>${hud.name}</td>
                <td>${hud.description || '-'}</td>
                <td class="hud-actions">
                    <button class="copy-url-btn" onclick="hudModule.copyHUDUrl('${hud.id}')">
                        Копировать ссылку для OBS
                    </button>
                    <a href="/hud/${hud.id}" target="_blank" class="button">
                        Открыть в браузере
                    </a>
                    <button class="overlay-button" data-hud="${hud.id}">
                        Запустить оверлей на главном мониторе
                    </button>
                </td>
            </tr>
        `;
    },

    initializeHUDControls() {
        this.initializeHUDSearch();
        this.initializeOverlayButtons();
    },

    initializeHUDSearch() {
        const searchInput = document.getElementById('hudSearch');
        if (!searchInput) return;

        const debouncedSearch = debounce((e) => {
            this.searchHUDs(e.target.value);
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);
    },

    searchHUDs(query) {
        const searchQuery = query.toLowerCase();
        document.querySelectorAll('.hud-row').forEach(row => {
            const nameElement = row.children[1];
            const descElement = row.children[2];
            
            if (!nameElement || !descElement) return;
            
            const name = nameElement.textContent.toLowerCase();
            const description = descElement.textContent.toLowerCase();
            
            row.style.display = (name.includes(searchQuery) || 
                               description.includes(searchQuery)) ? '' : 'none';
        });
    },

    initializeOverlayButtons() {
        document.querySelectorAll('.overlay-button').forEach(button => {
            button.addEventListener('click', () => {
                const hudId = button.dataset.hud;
                if (window.overlayManager) {
                    window.overlayManager.startOverlay(hudId);
                }
            });
        });
    },

    copyHUDUrl(hudId) {
        const url = `${window.location.origin}/hud/${hudId}`;
        
        const tempInput = document.createElement('input');
        tempInput.style.position = 'absolute';
        tempInput.style.left = '-9999px';
        tempInput.value = url;
        document.body.appendChild(tempInput);

        try {
            tempInput.select();
            tempInput.setSelectionRange(0, 99999);
            const successful = document.execCommand('copy');
            
            if (successful) {
                alert('Ссылка скопирована в буфер обмена!');
            } else {
                throw new Error('Не удалось скопировать автоматически');
            }
        } catch (err) {
            console.error('Ошибка при копировании:', err);
            prompt('Пожалуйста, скопируйте ссылку вручную (Ctrl+C):', url);
        } finally {
            document.body.removeChild(tempInput);
        }
    }
};