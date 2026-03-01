import type { GameState } from '../engine/core';
import { Game } from '../engine/game';
import { InputManager } from '../engine/input';

export class GameOverState implements GameState {
    private game: Game;
    private winnerIndex: number;

    constructor(game: Game, winnerIndex: number) {
        this.game = game;
        this.winnerIndex = winnerIndex;
    }

    enter(): void {
        console.log(`Player ${this.winnerIndex} Wins!`);
    }

    update(_dt: number): void {
        const input = InputManager.getInstance();

        // Any player press A or B to return to menu
        for (let i = 0; i < 4; i++) {
            const state = input.getInputState(i);
            if (state.connected && (state.superBtn || state.fire)) {
                // Return to Main Menu
                import('./MainMenuState').then(module => {
                    this.game.changeState(new module.MainMenuState(this.game));
                });
                break;
            }
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        const cw = ctx.canvas.width;
        const ch = ctx.canvas.height;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, cw, ch);

        ctx.fillStyle = '#f1c40f'; // Gold
        ctx.font = 'bold 72px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (this.winnerIndex >= 0) {
            // Re-use player colors logically, or just yellow.
            ctx.fillText(`PLAYER ${this.winnerIndex + 1} WINS!`, cw / 2, ch / 2 - 50);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.fillText(`DRAW!`, cw / 2, ch / 2 - 50);
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px "Trebuchet MS", sans-serif';
        ctx.fillText('Press A or B to Return to Menu', cw / 2, ch / 2 + 50);
    }

    exit(): void { }
}
