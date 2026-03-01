import { CONFIG } from '../config/constants';
import { Camera } from '../engine/camera';
import { IsoUtils } from '../engine/iso';
import { GameObject } from './GameObject';
import { Player } from './Player';

export class Turret extends GameObject {
    public ownerId: string;
    public health: number = CONFIG.TURRET_HEALTH;

    private fireRateTimer: number = 0;
    private target: Player | null = null;
    private onFire: (turret: Turret, targetX: number, targetY: number) => void;

    // Visuals
    private color: string = '#888888';

    constructor(x: number, y: number, ownerId: string, onFire: (turret: Turret, targetX: number, targetY: number) => void) {
        super(x, y, 30, 30); // Turret is slightly smaller than a player
        this.ownerId = ownerId;
        this.onFire = onFire;
    }

    update(dt: number, players?: Player[]): void {
        if (this.health <= 0) {
            this.isDead = true;
            return;
        }

        this.fireRateTimer -= dt;

        // Auto-aim logic if players are provided
        if (players) {
            let closestDist = Infinity;
            this.target = null;

            for (const p of players) {
                // Don't target the owner or dead players
                if (p.id === this.ownerId || p.isDead) continue;

                const dist = Math.hypot(p.x - this.x, p.y - this.y);
                // Turrets have a reasonable range, e.g. 10 blocks
                if (dist < closestDist && dist < 10 * CONFIG.BLOCK_SIZE) {
                    closestDist = dist;
                    this.target = p;
                }
            }
        }

        // Fire if ready and we have a target
        if (this.fireRateTimer <= 0 && this.target) {
            this.fireRateTimer = CONFIG.TURRET_FIRE_RATE_SECS;
            // Target the center of the player
            this.onFire(this, this.target.x + this.target.width / 2, this.target.y + this.target.height / 2);
        }
    }

    render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        IsoUtils.drawIsoBlock(
            ctx,
            centerX,
            centerY,
            this.width / 2,
            this.color,
            this.darken(this.color, 0.2),
            this.darken(this.color, 0.4),
            20 // Shorter than player
        );

        // Health bar
        this.drawHealthBar(ctx, centerX, centerY);
    }

    private drawHealthBar(ctx: CanvasRenderingContext2D, logicX: number, logicY: number) {
        const { x, y } = IsoUtils.cartToIso(logicX, logicY);

        const barWidth = 30;
        const barHeight = 4;
        const floatOffsetY = 30;

        const drawX = x - barWidth / 2;
        const drawY = y - floatOffsetY;

        ctx.fillStyle = '#000';
        ctx.fillRect(drawX - 1, drawY - 1, barWidth + 2, barHeight + 2);

        const healthPercent = Math.max(0, this.health / CONFIG.TURRET_HEALTH);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(drawX, drawY, barWidth * healthPercent, barHeight);
    }

    private darken(color: string, amount: number): string {
        let c = color.substring(1);
        let rgb = parseInt(c, 16);
        let r = Math.max(0, (rgb >> 16) * (1 - amount));
        let g = Math.max(0, ((rgb >> 8) & 0x00FF) * (1 - amount));
        let b = Math.max(0, (rgb & 0x0000FF) * (1 - amount));
        return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
    }
}
