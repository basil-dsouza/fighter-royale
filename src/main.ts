import './style.css';
import { Game } from './engine/game';
import { MainMenuState } from './ui/MainMenuState';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="gameCanvas"></canvas>
`;

const init = () => {
  try {
    const game = new Game('gameCanvas');
    const initialState = new MainMenuState(game);
    game.start(initialState);
  } catch (e) {
    console.error("Failed to start game:", e);
  }
};

window.addEventListener('load', init);
