import { CONFIG } from '../config/constants';
import { Camera } from '../engine/camera';
import { IsoUtils } from '../engine/iso';
import { GameObject } from './GameObject';

export class PowerBox extends GameObject {
    public health: number = CONFIG.POWER_BOX_HEALTH;
    private color: string = '#f1c40f'; // Yellow/Gold

    constructor(x: number, y: number) {
        super(x, y, 40, 40);
    }

    update(_dt: number): void {
        if (this.health <= 0) {
            this.isDead = true;
            // The state manager should detect this and spawn a token
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
            40 // Box height
        );

        // Draw health bar
        this.drawHealthBar(ctx, centerX, centerY);
    }

    private drawHealthBar(ctx: CanvasRenderingContext2D, logicX: number, logicY: number) {
        const { x, y } = IsoUtils.cartToIso(logicX, logicY);
        const barWidth = 40;
        const barHeight = 4;
        const floatOffsetY = 45;

        const drawX = x - barWidth / 2;
        const drawY = y - floatOffsetY;

        ctx.fillStyle = '#000';
        ctx.fillRect(drawX - 1, drawY - 1, barWidth + 2, barHeight + 2);

        const healthPercent = Math.max(0, this.health / CONFIG.POWER_BOX_HEALTH);
        ctx.fillStyle = '#f39c12';
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
