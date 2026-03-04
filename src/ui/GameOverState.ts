import type { GameState } from '../engine/core';
import { Game } from '../engine/game';
import { InputManager } from '../engine/input';

export class GameOverState implements GameState {
    private game: Game;
    private winnerIndex: number;
    private handleClickRef: (e: MouseEvent | TouchEvent) => void;

    constructor(game: Game, winnerIndex: number) {
        this.game = game;
        this.winnerIndex = winnerIndex;
        this.handleClickRef = this.handleScreenClick.bind(this);
    }

    enter(): void {
        console.log(`Player ${this.winnerIndex} Wins!`);
        this.game.canvas.addEventListener('click', this.handleClickRef);
        this.game.canvas.addEventListener('touchstart', this.handleClickRef, { passive: false });
    }

    private handleScreenClick(e: MouseEvent | TouchEvent) {
        if (e.type === 'touchstart') e.preventDefault();

        let clientX = 0, clientY = 0;
        if (e instanceof MouseEvent) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.type === 'touchstart' && (e as TouchEvent).touches.length > 0) {
            clientX = (e as TouchEvent).touches[0].clientX;
            clientY = (e as TouchEvent).touches[0].clientY;
        }

        const rect = this.game.canvas.getBoundingClientRect();
        const px = clientX - rect.left;
        const py = clientY - rect.top;

        const cw = this.game.canvas.width;
        const ch = this.game.canvas.height;

        const btnW = 300;
        const btnH = 60;
        const btnX = cw / 2 - btnW / 2;
        const btnY = ch / 2 + 80;

        if (px >= btnX && px <= btnX + btnW && py >= btnY && py <= btnY + btnH) {
            // Play Again
            import('./PlayingState').then(module => {
                this.game.changeState(new module.PlayingState(this.game));
            });
        } else {
            // Tap Anywhere Else
            import('./MainMenuState').then(module => {
                this.game.changeState(new module.MainMenuState(this.game));
            });
        }
    }

    update(_dt: number): void {
        const input = InputManager.getInstance();

        // Xbox Leader only Play Again
        if (!this.game.isPhoneMode) {
            const leaderState = input.getInputState(0);
            if (leaderState.connected && leaderState.gadgetBtn) { // Button X generally maps to gadget
                import('./PlayingState').then(module => {
                    this.game.changeState(new module.PlayingState(this.game));
                });
                return;
            }
        }

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
            ctx.fillText(`PLAYER ${this.winnerIndex + 1} WINS!`, cw / 2, ch / 2 - 50);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.fillText(`DRAW!`, cw / 2, ch / 2 - 50);
        }

        // Play Again Button
        const btnW = 300;
        const btnH = 60;
        const btnX = cw / 2 - btnW / 2;
        const btnY = ch / 2 + 80;

        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 10);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
        ctx.fillText('Play Again', cw / 2, btnY + btnH / 2);

        if (this.game.isPhoneMode) {
            ctx.font = '20px "Trebuchet MS", sans-serif';
            ctx.fillText('Tap anywhere to continue', cw / 2, ch / 2 + 40);
        } else {
            ctx.font = '20px "Trebuchet MS", sans-serif';
            ctx.fillText('Press X to Play Again (Leader Only)', cw / 2, ch / 2 + 40);
            ctx.fillText('Press A or B to Return to Menu', cw / 2, ch / 2 + 160);
        }
    }

    exit(): void {
        this.game.canvas.removeEventListener('click', this.handleClickRef);
        this.game.canvas.removeEventListener('touchstart', this.handleClickRef);
    }
}
