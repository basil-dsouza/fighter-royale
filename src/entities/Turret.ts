import { CONFIG } from '../config/constants';
import { Camera } from '../engine/camera';
import { IsoUtils } from '../engine/iso';
import { SpriteManager } from '../engine/sprite';
import { GameObject } from './GameObject';
import { Player } from './Player';

export class Turret extends GameObject {
    public ownerId: string;
    public teamId: number;
    public health: number = CONFIG.GADGETS.TURRET.health;
    public isDead: boolean = false;
    public color: string;

    private fireRateTimer: number = 0;
    private target: Player | null = null;
    private onFire: (turret: Turret, x: number, y: number) => void;
    private sprite: SpriteManager;

    constructor(x: number, y: number, ownerId: string, teamId: number, color: string, onFire: (turret: Turret, x: number, y: number) => void) {
        super(x, y, CONFIG.BLOCK_SIZE * 0.8, CONFIG.BLOCK_SIZE * 0.8);
        this.ownerId = ownerId;
        this.teamId = teamId;
        this.color = color;
        this.onFire = onFire;
        this.sprite = new SpriteManager('/assets/turret.png', 1);
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
                // Don't target the owner, dead players, or teammates
                if (p.isDead || p.teamId === this.teamId) continue;

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
            this.onFire(this, this.target.x + this.target.width / 2, this.target.y + this.target.height / 2);
            this.fireRateTimer = CONFIG.GADGETS.TURRET.fireRateSecs;
        }
    }

    render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const { x: isoX, y: isoY } = IsoUtils.cartToIso(centerX, centerY);

        if (this.sprite.isLoaded) {
            ctx.save();
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.ellipse(isoX, isoY, 25, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            this.sprite.render(ctx, isoX, isoY, 60, 80);
        } else {
            // Base of the turret maps to team/owner color
            ctx.fillStyle = this.color;
            IsoUtils.drawIsoBlock(
                ctx,
                centerX,
                centerY,
                this.width / 2,
                this.color,
                this.darken(this.color, 0.2),
                this.darken(this.color, 0.4),
                25 // Turret height
            );

            // A plus sign or glowing top
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(isoX, isoY - 25, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        this.drawHealthBar(ctx, centerX, centerY);
    }

    private drawHealthBar(ctx: CanvasRenderingContext2D, logicX: number, logicY: number) {
        ctx.save();
        const { x, y } = IsoUtils.cartToIso(logicX, logicY);

        const barWidth = 30;
        const barHeight = 4;
        const floatOffsetY = 30;

        const drawX = x - barWidth / 2;
        const drawY = y - floatOffsetY;

        ctx.fillStyle = '#000'; // Background for the bar
        ctx.fillRect(drawX - 1, drawY - 1, barWidth + 2, barHeight + 2);

        const healthPercent = Math.max(0, this.health / CONFIG.GADGETS.TURRET.health);
        ctx.fillStyle = '#2ecc71'; // Actual health bar color
        ctx.fillRect(drawX, drawY, barWidth * healthPercent, barHeight);

        // Health text
        ctx.fillStyle = '#fff';
        ctx.font = '12px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`HP: ${Math.floor(this.health)} / ${CONFIG.GADGETS.TURRET.health}`, x, y - floatOffsetY - 10); // Above the bar
        ctx.restore();
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
