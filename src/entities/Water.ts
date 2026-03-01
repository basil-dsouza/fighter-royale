import { CONFIG } from '../config/constants';
import { Camera } from '../engine/camera';
import { IsoUtils } from '../engine/iso';
import { GameObject } from './GameObject';

export class Water extends GameObject {
    public isSolid: boolean = true;
    public blocksBullets: boolean = false;

    constructor(x: number, y: number) {
        super(x, y, CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE);
    }

    update(_dt: number) { }

    render(ctx: CanvasRenderingContext2D, _camera: Camera) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        // Water is flat and shouldn't occlude players, but we still draw it
        // We could just draw it as a block with height 0 or use drawIsoFloor.
        // For consistency in Z-sorting, drawing a flat block is fine.
        IsoUtils.drawIsoBlock(
            ctx,
            centerX,
            centerY,
            this.width / 2,
            '#3498db',
            '#2980b9',
            '#2980b9',
            0
        );
    }
}
