const socket = io('http://192.168.0.199:2626', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

socket.on('gsi', (data) => {
  if (!data || !data.map) return;

  try {
      updateHUD({
          map: data.map.name,
          mode: data.map.mode,
          phase: data.map.phase,
          round: data.map.round,
          score_ct: data.map.team_ct?.score || 0,
          score_t: data.map.team_t?.score || 0,
          phase_countdown: {
              phase: data.phase_countdowns.phase,
              phase_ends_in: data.phase_countdowns.phase_ends_in
          },
          player: {
              name: data.player.name,
              team: data.player.team,
              steamid: data.player.steamid
          }
      });
  } catch (error) {
      console.error('Error updating HUD:', error);
  }
});

function updateHUD(gameState) {
  // Обновление счета
  document.querySelector('.score-ct').textContent = gameState.score_ct;
  document.querySelector('.score-t').textContent = gameState.score_t;
  
  // Обновление информации о карте
  document.querySelector('.map-name').textContent = gameState.map;
  
  // Обновление информации о раунде
  document.querySelector('.round-number').textContent = gameState.round;
  document.querySelector('.phase-name').textContent = gameState.phase_countdown.phase;
  document.querySelector('.phase-timer').textContent = 
      Math.max(0, Math.floor(gameState.phase_countdown.phase_ends_in));
  
  // Обновление информации об игроке
  if (gameState.player) {
      document.querySelector('.player-name').textContent = gameState.player.name;
      document.querySelector('.player-team').textContent = gameState.player.team;
  }
}