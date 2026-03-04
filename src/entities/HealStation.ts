import { CONFIG } from '../config/constants';
import { Camera } from '../engine/camera';
import { IsoUtils } from '../engine/iso';
import { SpriteManager } from '../engine/sprite';
import { GameObject } from './GameObject';
import { Player } from './Player';

export class HealStation extends GameObject {
    public ownerId: string;
    public teamId: number;
    public health: number = CONFIG.GADGETS.HEAL_STATION.health;
    public isDead: boolean = false;
    public color: string;

    private healTimer: number = 0;
    private sprite: SpriteManager;

    constructor(x: number, y: number, ownerId: string, teamId: number, color: string) {
        super(x, y, CONFIG.BLOCK_SIZE * 0.8, CONFIG.BLOCK_SIZE * 0.8);
        this.ownerId = ownerId;
        this.teamId = teamId;
        this.color = color;
        this.sprite = new SpriteManager('/assets/heal_station.png', 1);
    }

    update(dt: number, entities: GameObject[]): void {
        this.healTimer -= dt;

        if (this.healTimer <= 0) {
            this.healTimer = CONFIG.GADGETS.HEAL_STATION.tickRateSecs;
            this.healRadius(entities);
        }
    }

    private healRadius(entities: GameObject[]) {
        const radius = CONFIG.GADGETS.HEAL_STATION.radiusBlocks * CONFIG.BLOCK_SIZE;

        for (const p of entities) {
            if (!(p instanceof Player) || p.isDead) continue;

            const isAlly = (this.teamId !== -1 && p.teamId === this.teamId) || p.id === this.ownerId;
            if (isAlly) {
                const dist = Math.hypot((p.x + p.width / 2) - (this.x + this.width / 2), (p.y + p.height / 2) - (this.y + this.height / 2));
                if (dist <= radius) {
                    p.health = Math.min(CONFIG.PLAYER_MAX_HEALTH, p.health + CONFIG.GADGETS.HEAL_STATION.healAmount);
                }
            }
        }
    }

    render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.save();

        // Draw radius circle
        const { x, y } = IsoUtils.cartToIso(centerX, centerY);
        ctx.beginPath();
        // Just an elliptical projection to look somewhat isometric on the floor
        const drawRadius = CONFIG.GADGETS.HEAL_STATION.radiusBlocks * CONFIG.BLOCK_SIZE;
        ctx.ellipse(x, y, drawRadius, drawRadius / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46, 204, 113, 0.2)'; // Faint green circle
        ctx.fill();

        if (this.sprite.isLoaded) {
            this.sprite.render(ctx, x, y - 10, 120, 160);
        } else {
            // Base of the heal station
            ctx.fillStyle = this.color;
            IsoUtils.drawIsoBlock(
                ctx,
                centerX,
                centerY,
                this.width / 2,
                this.color,
                this.darken(this.color, 0.2),
                this.darken(this.color, 0.4),
                20 // Shorter than turret
            );

            // A plus sign or glowing top
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(x, y - 25, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        this.drawHealthBar(ctx, centerX, centerY);
        ctx.restore();
    }

    private drawHealthBar(ctx: CanvasRenderingContext2D, logicX: number, logicY: number) {
        ctx.save();
        const { x, y } = IsoUtils.cartToIso(logicX, logicY);

        const barWidth = 30;
        const barHeight = 4;
        const floatOffsetY = 45;

        const drawX = x - barWidth / 2;
        const drawY = y - floatOffsetY;

        ctx.fillStyle = '#000'; // Background for the bar
        ctx.fillRect(drawX - 1, drawY - 1, barWidth + 2, barHeight + 2);

        const healthPercent = Math.max(0, this.health / CONFIG.GADGETS.HEAL_STATION.health);
        ctx.fillStyle = '#2ecc71'; // Actual health bar color
        ctx.fillRect(drawX, drawY, barWidth * healthPercent, barHeight);

        // Health text
        ctx.fillStyle = '#fff';
        ctx.font = '12px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`HP: ${Math.floor(this.health)} / ${CONFIG.GADGETS.HEAL_STATION.health}`, x, y - floatOffsetY - 10);
        ctx.restore();
    }

    private darken(color: string, amount: number): string {
        // Simple darken for hex color (assumes #RRGGBB format)
        if (color.startsWith('#') && color.length === 7) {
            let r = parseInt(color.slice(1, 3), 16);
            let g = parseInt(color.slice(3, 5), 16);
            let b = parseInt(color.slice(5, 7), 16);
            r = Math.max(0, Math.floor(r * (1 - amount)));
            g = Math.max(0, Math.floor(g * (1 - amount)));
            b = Math.max(0, Math.floor(b * (1 - amount)));
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        return color; // Fallback
    }
}
