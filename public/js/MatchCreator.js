class MatchCreator {
    constructor() {
        this.maps = ['Ancient', 'Anubis', 'Inferno', 'Mirage', 'Nuke', 'Overpass', 'Vertigo', 'Dust2', 'Train', 'Cobblestone'];
        this.selectedTeams = { team1: null, team2: null };
        this.selectedMaps = [];
        this.initializeUI();
    }

    initializeUI() {
        this.createSearchInputs();
        this.createMapSelection();
        this.createControls();
    }

    createSearchInputs() {
        // Создаем поля поиска команд с автозаполнением
        const teamInputs = document.querySelectorAll('.team-search');
        teamInputs.forEach(input => {
            input.addEventListener('input', debounce(async (e) => {
                const query = e.target.value;
                if (query.length < 2) return;

                const teams = await this.searchTeams(query);
                this.showTeamSuggestions(teams, input);
            }, 300));
        });
    }

    async searchTeams(query) {
        const response = await fetch(`/api/teams/search?query=${encodeURIComponent(query)}`);
        return await response.json();
    }

    createMapSelection() {
        // Создаем интерфейс выбора карт
        const mapPool = document.createElement('div');
        mapPool.className = 'map-pool';
        
        this.maps.forEach(map => {
            const mapElement = document.createElement('div');
            mapElement.className = 'map-item';
            mapElement.innerHTML = `
                <img src="/images/maps/${map.toLowerCase()}.jpg" alt="${map}">
                <div class="map-controls">
                    <button class="pick-ban" data-team="1">Pick T1</button>
                    <button class="pick-ban" data-team="2">Pick T2</button>
                    <button class="pick-ban" data-type="ban">Ban</button>
                </div>
            `;
            mapPool.appendChild(mapElement);
        });
    }

    createControls() {
        // Создаем кнопки управления
        const controls = document.createElement('div');
        controls.className = 'match-controls';
        controls.innerHTML = `
            <button id="swapTeams">SWAP</button>
            <button id="createMatch">Создать матч</button>
        `;

        document.getElementById('swapTeams').addEventListener('click', () => {
            this.swapTeams();
        });

        document.getElementById('createMatch').addEventListener('click', () => {
            this.createMatch();
        });
    }

    swapTeams() {
        // Меняем команды местами
        const temp = this.selectedTeams.team1;
        this.selectedTeams.team1 = this.selectedTeams.team2;
        this.selectedTeams.team2 = temp;
        this.updateTeamsDisplay();
    }

    async createMatch() {
        if (!this.selectedTeams.team1 || !this.selectedTeams.team2) {
            alert('Выберите обе команды');
            return;
        }

        if (this.selectedMaps.length === 0) {
            alert('Выберите карты');
            return;
        }

        const matchData = {
            team1_id: this.selectedTeams.team1.id,
            team2_id: this.selectedTeams.team2.id,
            maps: this.selectedMaps,
            match_date: new Date().toISOString()
        };

        try {
            const response = await fetch('/api/matches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(matchData)
            });

            const result = await response.json();
            if (result.id) {
                window.location.href = `/match/${result.id}`;
            }
        } catch (error) {
            console.error('Ошибка при создании матча:', error);
            alert('Ошибка при создании матча');
        }
    }
}