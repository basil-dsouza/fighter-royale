import type { GameState } from '../engine/core';
import { Game } from '../engine/game';
import { InputManager } from '../engine/input';

export class MainMenuState implements GameState {
    private _game: Game;
    private handleClickRef: (e: MouseEvent | TouchEvent) => void;

    constructor(game: Game) {
        this._game = game;
        this.handleClickRef = this.handleScreenClick.bind(this);
    }

    enter(): void {
        console.log("Entered Main Menu State");
        this._game.canvas.addEventListener('click', this.handleClickRef);
        this._game.canvas.addEventListener('touchstart', this.handleClickRef, { passive: false });
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

        const rect = this._game.canvas.getBoundingClientRect();
        const px = clientX - rect.left;
        const py = clientY - rect.top;

        const cw = this._game.canvas.width;
        const ch = this._game.canvas.height;

        // Button roughly at: cx=cw/2, cy=ch/2 + 120, w=300, h=50
        // btnTopLeftX = cw/2 - 150, btnTopLeftY = ch/2 + 120 - 25
        const bx = cw / 2 - 150;
        const by = ch / 2 + 120 - 25;

        if (px >= bx && px <= bx + 300 && py >= by && py <= by + 50) {
            // Trigger Phone Mode
            this._game.isPhoneMode = true;
            this._game.numPlayers = 1;
            this._game.numBots = 3;
            InputManager.getInstance().isPhoneMode = true;

            import('./WeaponSelectState').then(module => {
                this._game.changeState(new module.WeaponSelectState(this._game));
            });
        }

        // Fullscreen Toggle Icon
        const fsX = cw - 60;
        const fsY = 20;
        if (px >= fsX && px <= fsX + 40 && py >= fsY && py <= fsY + 40) {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch((err: any) => {
                    console.error("Error attempting to enable fullscreen:", err);
                });
            } else {
                document.exitFullscreen();
            }
        }
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

        ctx.fillStyle = '#f39c12'; // Gold/orange
        ctx.font = 'italic 32px "Brush Script MT", "Comic Sans MS", cursive';
        ctx.fillText('Made by Raphael Dsouza', cw / 2, ch / 3 + 45);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px "Trebuchet MS", sans-serif';

        const connectedPads = InputManager.getInstance().getConnectedCount();

        if (connectedPads > 0) {
            ctx.fillText(`Connected Gamepads: ${connectedPads} (Press 'B' to log)`, cw / 2, ch / 2 + 50);
        } else {
            ctx.fillText('Press any button on an Xbox Controller to connect...', cw / 2, ch / 2 + 50);
        }

        // Phone Mode Button
        const by = ch / 2 + 120;
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.roundRect(cw / 2 - 150, by - 25, 300, 50, 10);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
        ctx.fillText('Tap for Phone Mode (1v3)', cw / 2, by);

        // Fullscreen Toggle Icon
        const fsX = cw - 60;
        const fsY = 20;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(fsX, fsY, 40, 40);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fsX + 5, fsY + 15); ctx.lineTo(fsX + 5, fsY + 5); ctx.lineTo(fsX + 15, fsY + 5);
        ctx.moveTo(fsX + 35, fsY + 15); ctx.lineTo(fsX + 35, fsY + 5); ctx.lineTo(fsX + 25, fsY + 5);
        ctx.moveTo(fsX + 5, fsY + 25); ctx.lineTo(fsX + 5, fsY + 35); ctx.lineTo(fsX + 15, fsY + 35);
        ctx.moveTo(fsX + 35, fsY + 25); ctx.lineTo(fsX + 35, fsY + 35); ctx.lineTo(fsX + 25, fsY + 35);
        ctx.stroke();
    }

    exit(): void {
        console.log("Exited Main Menu State");
        this._game.canvas.removeEventListener('click', this.handleClickRef);
        this._game.canvas.removeEventListener('touchstart', this.handleClickRef);
    }
}
