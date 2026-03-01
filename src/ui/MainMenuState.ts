import type { GameState } from '../engine/core';
import { Game } from '../engine/game';
import { InputManager } from '../engine/input';

export class MainMenuState implements GameState {
    private _game: Game;

    constructor(game: Game) {
        this._game = game;
    }

    enter(): void {
        console.log("Entered Main Menu State");
    }

    update(_dt: number): void {
        const input = InputManager.getInstance();

        // Minimal logic: Pressing B on any connected controller advances
        // For testing we will just log for now
        for (let i = 0; i < 4; i++) {
            const state = input.getInputState(i);
            if (state.connected && state.superBtn) {
                console.log(`Player ${i} pressed B`);
                // Count connections to set player count automatically for now
                this._game.numPlayers = Math.max(2, input.getConnectedCount());

                // Transition to setup lobby
                import('./PlayerCountState').then(module => {
                    this._game.changeState(new module.PlayerCountState(this._game));
                });
                break; // Prevent multiple loads
            }
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        const cw = ctx.canvas.width;
        const ch = ctx.canvas.height;

        ctx.fillStyle = '#1A1A2E'; // Dark blueish background
        ctx.fillRect(0, 0, cw, ch);

        ctx.fillStyle = '#E94560'; // Bright red/pink title
        ctx.font = 'bold 72px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText('FIGHTER ROYALE', cw / 2, ch / 3);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px "Trebuchet MS", sans-serif';

        const connectedPads = InputManager.getInstance().getConnectedCount();

        if (connectedPads > 0) {
            ctx.fillText(`Connected Gamepads: ${connectedPads} (Press 'B' to log)`, cw / 2, ch / 2 + 50);
        } else {
            ctx.fillText('Press any button on an Xbox Controller to connect...', cw / 2, ch / 2 + 50);
        }
    }

    exit(): void {
        console.log("Exited Main Menu State");
    }
}
