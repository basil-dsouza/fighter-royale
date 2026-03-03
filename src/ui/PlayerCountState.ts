import type { GameState } from '../engine/core';
import { Game } from '../engine/game';
import { InputManager } from '../engine/input';

export class PlayerCountState implements GameState {
    private game: Game;
    private selectedCount: number = 2;
    private selectedBots: number = 0;

    private gameModes = ['FFA', 'TEAM'];
    private selectedModeIdx: number = 0;

    private botStyles = ['NORMAL', 'AGGRESSIVE', 'DEFENSIVE', 'RANDOM'];
    private selectedStyleIdx: number = 0;

    private menuIndex: number = 0; // 0 for Players, 1 for Bots, 2 for Mode, 3 for Style
    private inputCooldown: number = 0;
    private initialDelay: number = 0.5; // Prevent instant skip

    constructor(game: Game) {
        this.game = game;
    }

    enter(): void {
        console.log("Entered Player Setup State");
    }

    update(dt: number): void {
        if (this.initialDelay > 0) this.initialDelay -= dt;
        if (this.inputCooldown > 0) {
            this.inputCooldown -= dt;
        }

        const input = InputManager.getInstance();
        const p1 = input.getInputState(0);

        if (p1.connected && this.inputCooldown <= 0) {
            // Vertical movement to swap rows
            if (p1.moveY > 0.5) {
                this.menuIndex = Math.min(3, this.menuIndex + 1);
                this.inputCooldown = 0.2;
            } else if (p1.moveY < -0.5) {
                this.menuIndex = Math.max(0, this.menuIndex - 1);
                this.inputCooldown = 0.2;
            }

            // Horizontal to change value
            if (p1.moveX > 0.5) {
                if (this.menuIndex === 0) {
                    this.selectedCount = Math.min(4, this.selectedCount + 1);
                } else if (this.menuIndex === 1) {
                    this.selectedBots = Math.min(4, this.selectedBots + 1); // Allow up to 4 bots
                } else if (this.menuIndex === 2) {
                    this.selectedModeIdx = (this.selectedModeIdx + 1) % this.gameModes.length;
                } else if (this.menuIndex === 3) {
                    this.selectedStyleIdx = (this.selectedStyleIdx + 1) % this.botStyles.length;
                }
                this.inputCooldown = 0.2;
            } else if (p1.moveX < -0.5) {
                if (this.menuIndex === 0) {
                    this.selectedCount = Math.max(1, this.selectedCount - 1); // Allow 1 human (single-player)
                } else if (this.menuIndex === 1) {
                    this.selectedBots = Math.max(0, this.selectedBots - 1);
                } else if (this.menuIndex === 2) {
                    this.selectedModeIdx = (this.selectedModeIdx - 1 + this.gameModes.length) % this.gameModes.length;
                } else if (this.menuIndex === 3) {
                    this.selectedStyleIdx = (this.selectedStyleIdx - 1 + this.botStyles.length) % this.botStyles.length;
                }
                this.inputCooldown = 0.2;
            }

            if (this.initialDelay <= 0 && (p1.superBtn || p1.fire)) {
                this.game.numPlayers = this.selectedCount;
                this.game.numBots = this.selectedBots;
                this.game.gameMode = this.gameModes[this.selectedModeIdx] as any;
                this.game.botStyle = this.botStyles[this.selectedStyleIdx] as any;
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

        // Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Lobby Setup', cw / 2, ch / 5);

        const startY = ch / 3;
        const gapY = 60;

        // Row 1: Total Players
        ctx.fillStyle = this.menuIndex === 0 ? '#E94560' : '#888888';
        ctx.font = '36px "Trebuchet MS", sans-serif';
        ctx.fillText(`Total Players: < ${this.selectedCount} >`, cw / 2, startY);

        // Row 2: Bots
        ctx.fillStyle = this.menuIndex === 1 ? '#E94560' : '#888888';
        ctx.fillText(`Computer Bots: < ${this.selectedBots} >`, cw / 2, startY + gapY);

        // Row 3: Game Mode
        ctx.fillStyle = this.menuIndex === 2 ? '#E94560' : '#888888';
        ctx.fillText(`Game Mode: < ${this.gameModes[this.selectedModeIdx]} >`, cw / 2, startY + gapY * 2);

        // Row 4: Bot Style
        ctx.fillStyle = this.menuIndex === 3 ? '#E94560' : '#888888';
        ctx.fillText(`Bot Playstyle: < ${this.botStyles[this.selectedStyleIdx]} >`, cw / 2, startY + gapY * 3);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px "Trebuchet MS", sans-serif';
        ctx.fillText('P1: Left Stick to configure, [B] or Trigger to Confirm', cw / 2, ch - 80);
    }

    exit(): void { }
}
