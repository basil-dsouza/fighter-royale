import { CONFIG } from '../config/constants';
import { Camera } from '../engine/camera';
import { IsoUtils } from '../engine/iso';
import { GameObject } from './GameObject';

export class Bush extends GameObject {
    public isSolid: boolean = false;
    public blocksBullets: boolean = false;

    constructor(x: number, y: number) {
        super(x, y, CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE);
    }

    update(_dt: number) { }

    render(ctx: CanvasRenderingContext2D, _camera: Camera) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.save();
        ctx.globalAlpha = 0.8; // Semi-transparent so players can hide inside
        IsoUtils.drawIsoBlock(
            ctx,
            centerX,
            centerY,
            this.width / 2,
            '#2ecc71',
            '#27ae60',
            '#2ecc71',
            CONFIG.BLOCK_SIZE * 0.8
        );
        ctx.restore();
    }
}
