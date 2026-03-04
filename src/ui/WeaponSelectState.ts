import type { GameState } from '../engine/core';
import { Game } from '../engine/game';
import { InputManager } from '../engine/input';
import { CONFIG } from '../config/constants';

export class WeaponSelectState implements GameState {
    private game: Game;
    private weaponKeys = Object.keys(CONFIG.WEAPONS);
    private gadgetKeys = Object.keys(CONFIG.GADGETS);
    private selections: number[] = [0, 0, 0, 0];
    private gadgetSelections: number[] = [0, 0, 0, 0];
    private ready: boolean[] = [false, false, false, false];
    private cooldowns: number[] = [0, 0, 0, 0];
    private inputDelay: number = 0.5; // Prevent instant-confirm from previous screen
    private handleClickRef: (e: MouseEvent | TouchEvent) => void;

    constructor(game: Game) {
        this.game = game;
        this.handleClickRef = this.handleScreenClick.bind(this);
    }

    enter(): void {
        console.log("Entered Weapon Selection State");
        this.game.canvas.addEventListener('click', this.handleClickRef);
        this.game.canvas.addEventListener('touchstart', this.handleClickRef, { passive: false });
    }

    private handleScreenClick(e: MouseEvent | TouchEvent) {
        if (!this.game.isPhoneMode || this.ready[0]) return;
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

        // Player 0 slot width
        const totalOpponents = this.game.numPlayers + this.game.numBots;
        const drawSlots = this.game.isPhoneMode ? 1 : totalOpponents;
        const slotWidth = cw / drawSlots;
        const pCenterX = slotWidth / 2;

        if (px >= 0 && px <= slotWidth && this.inputDelay <= 0) {
            // Lock in: Bottom of screen (check first so gadget toggle doesn't steal touches on short screens)
            if (py > ch - 80) {
                this.ready[0] = true;
                this.game.playerWeapons[0] = this.weaponKeys[this.selections[0]];
                this.game.playerGadgets[0] = this.gadgetKeys[this.gadgetSelections[0]];
            }
            // Weapon toggle: Y around ch/2
            else if (py > ch / 2 - 80 && py < ch / 2 + 40) {
                if (px < pCenterX) this.selections[0] = (this.selections[0] - 1 + this.weaponKeys.length) % this.weaponKeys.length;
                else this.selections[0] = (this.selections[0] + 1) % this.weaponKeys.length;
            }
            // Gadget toggle: below weapon toggle but above lock in
            else if (py >= ch / 2 + 30 && py <= ch - 80) {
                if (px < pCenterX) this.gadgetSelections[0] = (this.gadgetSelections[0] - 1 + this.gadgetKeys.length) % this.gadgetKeys.length;
                else this.gadgetSelections[0] = (this.gadgetSelections[0] + 1) % this.gadgetKeys.length;
            }
        }
    }

    update(dt: number): void {
        if (this.inputDelay > 0) this.inputDelay -= dt;

        const input = InputManager.getInstance();
        let allReady = true;

        const totalOpponents = this.game.numPlayers + this.game.numBots;

        for (let i = 0; i < totalOpponents; i++) {
            if (this.cooldowns[i] !== undefined && this.cooldowns[i] > 0) this.cooldowns[i] -= dt;

            // Initialize parallel array states if bots expanded past 4
            if (this.ready[i] === undefined) this.ready[i] = false;
            if (this.selections[i] === undefined) this.selections[i] = 0;
            if (this.gadgetSelections[i] === undefined) this.gadgetSelections[i] = 0;
            if (this.game.playerTeams[i] === undefined) this.game.playerTeams[i] = this.game.gameMode === 'TEAM' ? i % 2 : i;

            // If a required player isn't ready, the game can't start
            if (!this.ready[i]) allReady = false;

            const isBot = i >= this.game.numPlayers; // Bot indices are after human ones
            if (isBot) {
                if (!this.ready[i] && this.inputDelay <= 0) {
                    this.selections[i] = Math.floor(Math.random() * this.weaponKeys.length);
                    this.gadgetSelections[i] = Math.floor(Math.random() * this.gadgetKeys.length);
                    // Bot Team Defaults
                    this.game.playerTeams[i] = this.game.gameMode === 'TEAM' ? i % 2 : i;
                    this.ready[i] = true;
                    this.game.playerWeapons[i] = this.weaponKeys[this.selections[i]];
                    this.game.playerGadgets[i] = this.gadgetKeys[this.gadgetSelections[i]];
                }
                continue;
            }

            // In Phone Mode, we rely on the custom custom handleScreenClick taps for Weapon Selection, not virtual joysticks
            if (this.game.isPhoneMode && i === 0) {
                // We still check if they are ready from the screen tap to progress
                if (this.inputDelay <= 0 && this.ready[i]) {
                    // Logic already handled by the tap lock-in
                }
                continue;
            }

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

                if (state.gadgetNext) {
                    this.gadgetSelections[i] = (this.gadgetSelections[i] + 1) % this.gadgetKeys.length;
                    this.cooldowns[i] = 0.2;
                } else if (state.gadgetPrev) {
                    this.gadgetSelections[i] = (this.gadgetSelections[i] - 1 + this.gadgetKeys.length) % this.gadgetKeys.length;
                    this.cooldowns[i] = 0.2;
                }

                // Team switching (if TEAM mode is active, allow swapping. Otherwise it maps to their index anyway)
                if (this.game.gameMode === 'TEAM') {
                    if (state.moveY > 0.5) {
                        this.game.playerTeams[i] = (this.game.playerTeams[i] + 1) % 4;
                        this.cooldowns[i] = 0.2;
                    } else if (state.moveY < -0.5) {
                        this.game.playerTeams[i] = (this.game.playerTeams[i] - 1 + 4) % 4;
                        this.cooldowns[i] = 0.2;
                    }
                }
            }

            if (this.inputDelay <= 0 && (state.superBtn || state.fire)) {
                this.ready[i] = true;
                this.game.playerWeapons[i] = this.weaponKeys[this.selections[i]];
                this.game.playerGadgets[i] = this.gadgetKeys[this.gadgetSelections[i]];
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

        const totalOpponents = this.game.numPlayers + this.game.numBots;
        const drawSlots = this.game.isPhoneMode ? 1 : totalOpponents;
        const slotWidth = cw / drawSlots;

        for (let i = 0; i < drawSlots; i++) {
            const startX = i * slotWidth;
            const centerX = startX + slotWidth / 2;

            ctx.fillStyle = i % 2 === 0 ? '#16213E' : '#0F3460';
            ctx.fillRect(startX, 80, slotWidth, ch - 80);

            if (!this.game.isPhoneMode) {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '24px "Trebuchet MS", sans-serif';
                ctx.textAlign = 'center';
                const label = i < this.game.numPlayers ? `Player ${i + 1}` : `Bot ${i - this.game.numPlayers + 1}`;
                ctx.fillText(label, centerX, 120);
            }

            if (this.ready[i]) {
                ctx.fillStyle = '#2ecc71';
                ctx.font = 'bold 32px "Trebuchet MS", sans-serif';
                ctx.fillText('READY', centerX, ch / 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '24px "Trebuchet MS", sans-serif';
                ctx.fillText(this.weaponKeys[this.selections[i]], centerX, ch / 2 + 50);

                ctx.fillStyle = '#f1c40f'; // Gold
                ctx.fillText(this.gadgetKeys[this.gadgetSelections[i]], centerX, ch / 2 + 80);
            } else {
                ctx.fillStyle = '#E94560';
                ctx.font = 'bold 32px "Trebuchet MS", sans-serif';
                ctx.fillText(`< ${this.weaponKeys[this.selections[i]]} >`, centerX, ch / 2 - 40);

                const wpn = CONFIG.WEAPONS[this.weaponKeys[this.selections[i]] as keyof typeof CONFIG.WEAPONS];
                ctx.font = '18px "Trebuchet MS", sans-serif';
                ctx.fillStyle = '#bdc3c7';
                ctx.fillText(`Damage: ${wpn.damage}`, centerX, ch / 2);
                ctx.fillText(`Reload: ${wpn.reloadSecs}s`, centerX, ch / 2 + 30);

                ctx.fillStyle = '#f1c40f'; // Gold
                ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
                const gadgetLabel = this.game.isPhoneMode ? `< Gadget: ${this.gadgetKeys[this.gadgetSelections[i]]} >` : `[LB] < Gadget: ${this.gadgetKeys[this.gadgetSelections[i]]} > [RB]`;
                ctx.fillText(gadgetLabel, centerX, ch / 2 + 65);

                if (this.game.gameMode === 'TEAM') {
                    ctx.font = '20px "Trebuchet MS", sans-serif';
                    ctx.fillStyle = '#f39c12';
                    ctx.fillText(`Team: ${this.game.playerTeams[i] + 1}`, centerX, ch / 2 - 80);
                    ctx.fillStyle = '#aaaaaa';
                    ctx.font = '16px "Trebuchet MS", sans-serif';
                    ctx.fillText('(Up/Down to Change Team)', centerX, ch / 2 - 60);
                }

                ctx.fillStyle = '#aaaaaa';
                const lockInText = this.game.isPhoneMode ? 'Tap Here to Lock In' : 'Press [B] to Lock In';
                ctx.fillText(lockInText, centerX, ch - 50);
            }
        }
    }

    exit(): void {
        this.game.canvas.removeEventListener('click', this.handleClickRef);
        this.game.canvas.removeEventListener('touchstart', this.handleClickRef);
    }
}
