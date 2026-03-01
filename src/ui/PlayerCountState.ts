import type { GameState } from '../engine/core';
import { Game } from '../engine/game';
import { InputManager } from '../engine/input';

export class PlayerCountState implements GameState {
    private game: Game;
    private selectedCount: number = 2;
    private inputCooldown: number = 0;

    constructor(game: Game) {
        this.game = game;
    }

    enter(): void {
        console.log("Entered Player Count State");
    }

    update(dt: number): void {
        if (this.inputCooldown > 0) {
            this.inputCooldown -= dt;
        }

        const input = InputManager.getInstance();

        // Let Player 0 control the menu for simplicity
        const p1 = input.getInputState(0);

        if (p1.connected) {
            if (this.inputCooldown <= 0) {
                if (p1.moveX > 0.5) {
                    this.selectedCount = Math.min(4, this.selectedCount + 1);
                    this.inputCooldown = 0.2;
                } else if (p1.moveX < -0.5) {
                    this.selectedCount = Math.max(2, this.selectedCount - 1);
                    this.inputCooldown = 0.2;
                }
            }

            if (p1.superBtn || p1.fire) { // B or Trigger to confirm
                this.game.numPlayers = this.selectedCount;
                import('./WeaponSelectState').then(module => {
                    this.game.changeState(new module.WeaponSelectState(this.game));
                });
            }
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        const cw = ctx.canvas.width;
        const ch = ctx.canvas.height;

        ctx.fillStyle = '#1A1A2E';
        ctx.fillRect(0, 0, cw, ch);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Select Number of Players', cw / 2, ch / 3);

        // Draw options
        const options = [2, 3, 4];
        const gap = 150;
        const startX = cw / 2 - gap;
        const y = ch / 2 + 50;

        options.forEach((opt, i) => {
            const x = startX + i * gap;

            if (this.selectedCount === opt) {
                ctx.fillStyle = '#E94560'; // Highlight
                ctx.font = 'bold 64px "Trebuchet MS", sans-serif';
            } else {
                ctx.fillStyle = '#888888';
                ctx.font = '48px "Trebuchet MS", sans-serif';
            }

            ctx.fillText(opt.toString(), x, y);
        });

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px "Trebuchet MS", sans-serif';
        ctx.fillText('P1: Left Stick to select, [B] or Trigger to Confirm', cw / 2, ch - 100);
    }

    exit(): void { }
}
