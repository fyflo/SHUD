// state.js - Управление состоянием приложения
export const state = {
    gsiDataBuffer: null,
    serverInfo: {
        ip: 'localhost',
        port: 2626
    },
    selectedMaps: [],
    currentTeam: 1,
    matchFormat: 'bo1',
    matchTeams: { team1: null, team2: null },
    pauseUpdates: false,
    lastTableHTML: '',
    previousScores: {
        ct: '0',
        t: '0'
    }
};

export const updateState = (key, value) => {
    state[key] = value;
};