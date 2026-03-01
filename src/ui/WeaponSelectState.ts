import type { GameState } from '../engine/core';
import { Game } from '../engine/game';
import { InputManager } from '../engine/input';
import { CONFIG } from '../config/constants';

export class WeaponSelectState implements GameState {
    private game: Game;
    private weaponKeys = Object.keys(CONFIG.WEAPONS);
    private selections: number[] = [0, 0, 0, 0];
    private ready: boolean[] = [false, false, false, false];
    private cooldowns: number[] = [0, 0, 0, 0];
    private inputDelay: number = 0.5; // Prevent instant-confirm from previous screen

    constructor(game: Game) {
        this.game = game;
    }

    enter(): void {
        console.log("Entered Weapon Selection State");
    }

    update(dt: number): void {
        if (this.inputDelay > 0) this.inputDelay -= dt;

        const input = InputManager.getInstance();
        let allReady = true;

        for (let i = 0; i < this.game.numPlayers; i++) {
            if (this.cooldowns[i] > 0) this.cooldowns[i] -= dt;

            // If a required player isn't ready, the game can't start
            if (!this.ready[i]) allReady = false;

            const state = input.getInputState(i);
            if (!state.connected || this.ready[i]) continue;

            if (this.cooldowns[i] <= 0) {
                if (state.moveX > 0.5) {
                    this.selections[i] = (this.selections[i] + 1) % this.weaponKeys.length;
                    this.cooldowns[i] = 0.2;
                } else if (state.moveX < -0.5) {
                    this.selections[i] = (this.selections[i] - 1 + this.weaponKeys.length) % this.weaponKeys.length;
                    this.cooldowns[i] = 0.2;
                }
            }

            if (this.inputDelay <= 0 && (state.superBtn || state.fire)) {
                this.ready[i] = true;
                this.game.playerWeapons[i] = this.weaponKeys[this.selections[i]];
            }
        }

        if (allReady) {
            import('./PlayingState').then(module => {
                this.game.changeState(new module.PlayingState(this.game));
            });
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        const cw = ctx.canvas.width;
        const ch = ctx.canvas.height;

        ctx.fillStyle = '#1A1A2E';
        ctx.fillRect(0, 0, cw, ch);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Select Your Weapon', cw / 2, 50);

        const slotWidth = cw / this.game.numPlayers;

        for (let i = 0; i < this.game.numPlayers; i++) {
            const startX = i * slotWidth;
            const centerX = startX + slotWidth / 2;

            ctx.fillStyle = i % 2 === 0 ? '#16213E' : '#0F3460';
            ctx.fillRect(startX, 100, slotWidth, ch - 100);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '24px "Trebuchet MS", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Player ${i + 1}`, centerX, 150);

            if (this.ready[i]) {
                ctx.fillStyle = '#2ecc71';
                ctx.font = 'bold 32px "Trebuchet MS", sans-serif';
                ctx.fillText('READY', centerX, ch / 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(this.weaponKeys[this.selections[i]], centerX, ch / 2 + 50);
            } else {
                ctx.fillStyle = '#E94560';
                ctx.font = 'bold 32px "Trebuchet MS", sans-serif';
                ctx.fillText(`< ${this.weaponKeys[this.selections[i]]} >`, centerX, ch / 2);

                const wpn = CONFIG.WEAPONS[this.weaponKeys[this.selections[i]] as keyof typeof CONFIG.WEAPONS];
                ctx.font = '18px "Trebuchet MS", sans-serif';
                ctx.fillStyle = '#bdc3c7';
                ctx.fillText(`Damage: ${wpn.damage}`, centerX, ch / 2 + 50);
                ctx.fillText(`Reload: ${wpn.reloadSecs}s`, centerX, ch / 2 + 80);

                ctx.fillStyle = '#aaaaaa';
                ctx.fillText('Press [B] to Lock In', centerX, ch - 50);
            }
        }
    }

    exit(): void { }
}
