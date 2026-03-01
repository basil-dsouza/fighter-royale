import { CONFIG } from '../config/constants';
import { Camera } from '../engine/camera';
import { IsoUtils } from '../engine/iso';
import { GameObject } from './GameObject';

export class Wall extends GameObject {
    public isSolid: boolean = true;
    public blocksBullets: boolean = true;

    constructor(x: number, y: number) {
        super(x, y, CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE);
    }

    update(_dt: number) { }

    render(ctx: CanvasRenderingContext2D, _camera: Camera) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        IsoUtils.drawIsoBlock(
            ctx,
            centerX,
            centerY,
            this.width / 2,
            '#95a5a6',
            '#7f8c8d',
            '#bdc3c7',
            CONFIG.BLOCK_SIZE
        );
    }
}
