import { CONFIG } from '../config/constants';
import { Camera } from '../engine/camera';
import { IsoUtils } from '../engine/iso';
import { SpriteManager } from '../engine/sprite';
import { GameObject } from './GameObject';
import { Player } from './Player';

export class ProximityMine extends GameObject {
    public ownerId: string;
    public teamId: number;
    public health: number = CONFIG.GADGETS.PROXIMITY_MINE.health;
    public isDead: boolean = false;
    public color: string;
    private hasDetonated: boolean = false;
    private sprite: SpriteManager;

    // We keep a reference to a detonation callback to apply damage via PlayingState
    private onDetonate: (mine: ProximityMine, x: number, y: number) => void;

    constructor(x: number, y: number, ownerId: string, teamId: number, color: string, onDetonate: (mine: ProximityMine, x: number, y: number) => void) {
        super(x, y, CONFIG.BLOCK_SIZE * 0.5, CONFIG.BLOCK_SIZE * 0.5); // Smaller profile
        this.ownerId = ownerId;
        this.teamId = teamId;
        this.color = color;
        this.onDetonate = onDetonate;
        this.sprite = new SpriteManager('/assets/mine.png', 1);
    }

    update(_dt: number, entities: GameObject[]): void {
        if (this.hasDetonated || this.isDead) return;

        const triggerRadius = CONFIG.GADGETS.PROXIMITY_MINE.triggerRadiusBlocks * CONFIG.BLOCK_SIZE;

        for (const p of entities) {
            if (!(p instanceof Player) || p.isDead) continue;

            const isEnemy = this.teamId === -1 ? p.id !== this.ownerId : p.teamId !== this.teamId;

            if (isEnemy) {
                const dist = Math.hypot(p.x - this.x, p.y - this.y);
                if (dist <= triggerRadius) {
                    this.detonate();
                    break;
                }
            }
        }
    }

    public detonate() {
        if (this.hasDetonated) return;
        this.hasDetonated = true;
        this.isDead = true; // Remove from game loop
        this.onDetonate(this, this.x + this.width / 2, this.y + this.height / 2);
    }

    render(ctx: CanvasRenderingContext2D, camera: Camera): void {
        if (this.hasDetonated) return;

        const viewer = camera.target;
        const isEnemyViewer = viewer instanceof Player &&
            ((this.teamId === -1 && viewer.id !== this.ownerId) ||
                (this.teamId !== -1 && viewer.teamId !== this.teamId));

        if (isEnemyViewer) {
            // Invisible to enemies!
            return;
        }

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const { x, y } = IsoUtils.cartToIso(centerX, centerY);

        ctx.save();
        ctx.globalAlpha = 0.6; // Slightly transparent to allies

        if (this.sprite.isLoaded) {
            this.sprite.render(ctx, x, y, 40, 40);
        } else {
            // Base of the mine
            ctx.fillStyle = this.color;
            IsoUtils.drawIsoBlock(
                ctx,
                centerX,
                centerY,
                this.width / 2,
                this.color,
                this.darken(this.color, 0.2),
                this.darken(this.color, 0.4),
                5 // Very flat on the ground
            );

            // Blinking red light
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            // A slow blink mapping to Date.now()
            ctx.globalAlpha = Math.abs(Math.sin(Date.now() / 500)) > 0.5 ? 0.8 : 0.2;
            ctx.arc(x, y - 5, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    private darken(color: string, amount: number): string {
        if (color.startsWith('#') && color.length === 7) {
            let r = parseInt(color.slice(1, 3), 16);
            let g = parseInt(color.slice(3, 5), 16);
            let b = parseInt(color.slice(5, 7), 16);
            r = Math.max(0, Math.floor(r * (1 - amount)));
            g = Math.max(0, Math.floor(g * (1 - amount)));
            b = Math.max(0, Math.floor(b * (1 - amount)));
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        return color;
    }
}
