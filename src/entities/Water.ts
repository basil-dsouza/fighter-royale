import { CONFIG } from '../config/constants';
import { Camera } from '../engine/camera';
import { IsoUtils } from '../engine/iso';
import { SpriteManager } from '../engine/sprite';
import { GameObject } from './GameObject';

export class Water extends GameObject {
    public isSolid: boolean = true;
    public blocksBullets: boolean = false;
    private sprite: SpriteManager;

    constructor(x: number, y: number) {
        super(x, y, CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE);
        this.sprite = new SpriteManager('/assets/water.png', 1);
    }

    update(_dt: number) { }

    render(ctx: CanvasRenderingContext2D, _camera: Camera) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const { x: isoX, y: isoY } = IsoUtils.cartToIso(centerX, centerY);

        if (this.sprite?.isLoaded) {
            ctx.save();
            IsoUtils.clipIsoFloor(ctx, this.x, this.y, CONFIG.BLOCK_SIZE, 0.5);
            this.sprite.render(ctx, isoX, isoY + 32, 130, 66);
            ctx.restore();
        } else {
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
}
