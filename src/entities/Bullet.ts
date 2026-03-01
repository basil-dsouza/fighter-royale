import { CONFIG } from '../config/constants';
import { Camera } from '../engine/camera';
import { IsoUtils } from '../engine/iso';
import { GameObject } from './GameObject';

export interface BulletOptions {
    x: number;
    y: number;
    dirX: number;
    dirY: number;
    speed: number;
    damage: number;
    ownerId: string;
    color: string;
    stunDur?: number;
    range: number; // Max distance in logic pixels
}

export class Bullet extends GameObject {
    public ownerId: string;
    public damage: number;
    public stunDur: number;
    public color: string;

    private dirX: number;
    private dirY: number;
    private speed: number;
    private distanceTraveled: number = 0;
    private maxDistance: number;

    constructor(options: BulletOptions) {
        // Bullets are small, e.g. 10x10 logical size
        super(options.x - 5, options.y - 5, 10, 10);
        this.ownerId = options.ownerId;
        this.damage = options.damage;
        this.stunDur = options.stunDur || 0;
        this.color = options.color;
        this.dirX = options.dirX;
        this.dirY = options.dirY;
        this.speed = options.speed;
        this.maxDistance = options.range;
    }

    update(dt: number): void {
        const moveDist = this.speed * dt;
        this.x += this.dirX * moveDist;
        this.y += this.dirY * moveDist;
        this.distanceTraveled += moveDist;

        if (this.distanceTraveled >= this.maxDistance) {
            this.isDead = true;
        }

        // World bounds check
        const mapPixelWidth = CONFIG.MAP_WIDTH * CONFIG.BLOCK_SIZE;
        const mapPixelHeight = CONFIG.MAP_HEIGHT * CONFIG.BLOCK_SIZE;
        if (this.x < 0 || this.x > mapPixelWidth || this.y < 0 || this.y > mapPixelHeight) {
            this.isDead = true;
        }
    }

    render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        const { x, y } = IsoUtils.cartToIso(centerX, centerY);

        ctx.save();
        ctx.translate(x, y - 5); // float slightly above ground

        ctx.beginPath();
        // Simple isometric diamond/circle representation for a glowing bullet
        ctx.arc(0, 0, 5, 0, Math.PI * 2);

        ctx.fillStyle = this.color;
        ctx.fill();

        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();

        ctx.restore();
    }
}
