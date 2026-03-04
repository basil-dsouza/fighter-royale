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
    private target: GameObject | null = null;
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

    update(dt: number, entities?: GameObject[]): void {
        if (this.health <= 0) {
            this.isDead = true;
            return;
        }

        this.fireRateTimer -= dt;

        // Auto-aim logic if entities are provided
        if (entities) {
            let closestEnemy: GameObject | null = null;
            let closestEnemyDist = Infinity;

            let closestBox: GameObject | null = null;
            let closestBoxDist = Infinity;

            for (const e of entities) {
                if (e === this || e.isDead || (e as any).isSolid) continue;

                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist >= 10 * CONFIG.BLOCK_SIZE) continue;

                let isEnemy = false;
                if (e instanceof Player) {
                    if (this.teamId !== -1 && (e.teamId === this.teamId || e.isHidden)) continue;
                    isEnemy = true;
                } else if (e.constructor.name === 'Turret' || e.constructor.name === 'HealStation' || e.constructor.name === 'ProximityMine') {
                    if (this.teamId !== -1 && (e as any).teamId === this.teamId) continue;
                    if ((e as any).ownerId === this.ownerId) continue;
                    isEnemy = true;
                }

                if (isEnemy && dist < closestEnemyDist) {
                    closestEnemyDist = dist;
                    closestEnemy = e;
                } else if (e.constructor.name === 'PowerBox' && dist < closestBoxDist) {
                    closestBoxDist = dist;
                    closestBox = e;
                }
            }

            this.target = closestEnemy || closestBox;
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

            let flipX = 1;
            if (this.target) {
                const dx = (this.target.x + this.target.width / 2) - centerX;
                if (dx > 0) {
                    flipX = -1; // Assuming the default sprite faces left-ish, flip it to face right
                }
            }

            ctx.save();
            ctx.translate(isoX, isoY);
            ctx.scale(flipX, 1);

            this.sprite.render(ctx, 0, 0, 90, 120);
            ctx.restore();
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
        ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        const textStr = `HP: ${Math.floor(this.health)} / ${CONFIG.GADGETS.TURRET.health}`;
        const textY = y - floatOffsetY - 10;

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.strokeText(textStr, x, textY);
        ctx.fillText(textStr, x, textY);

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
