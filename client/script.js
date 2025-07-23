const text = document.querySelector('.game-text');
const startButton = document.querySelector('.start-game');
const settingsButton = document.querySelector('.settings');
const exitButton = document.querySelector('.exit-game');
const gameMenu = document.querySelector('.game-menu');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = {
  isGameOver: false,
  isGameStarted: false,
  isSettingsOpen: false,
};

// When JS gets loaded, initalized the canvas and hide the text
setTimeout(() => {
  canvas.classList.remove('hidden-canvas');
  text.classList.add('hidden-text');
}, 400);

function startGame() {
  gameState.isGameStarted = true;
  gameMenu.classList.add('hidden');
  canvas.classList.remove('hidden-canvas');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Initialize game logic here
}
function openSettings() {
  gameState.isSettingsOpen = true;
  gameMenu.classList.add('hidden');
  // Open settings logic here
}
function exitGame() {
  gameState.isGameOver = true;
  gameMenu.classList.remove('hidden');
  canvas.classList.add('hidden-canvas');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Reset game logic here
}
