import { CONFIG } from '../config/constants';
import { Camera } from '../engine/camera';
import { IsoUtils } from '../engine/iso';
import { SpriteManager } from '../engine/sprite';
import { GameObject } from './GameObject';

export class Bush extends GameObject {
    public isSolid: boolean = false;
    public blocksBullets: boolean = false;
    private sprite: SpriteManager;

    constructor(x: number, y: number) {
        super(x, y, CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE);
        this.sprite = new SpriteManager('/assets/bush.png', 1);
    }

    update(_dt: number) { }

    render(ctx: CanvasRenderingContext2D, _camera: Camera) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const { x: isoX, y: isoY } = IsoUtils.cartToIso(centerX, centerY);

        ctx.save();
        ctx.globalAlpha = 0.8; // Semi-transparent so players can hide inside
        if (this.sprite?.isLoaded) {
            // Define a clipping region to hide the dirt base of the bush.
            // The sprite renders at (isoX, isoY + 48) anchored at bottom-center.
            // Width 128, Height 128. Top-left is (isoX - 64, isoY - 80).
            // We'll clip the bottom 58 pixels off.
            ctx.beginPath();
            ctx.rect(isoX - 64, isoY - 80, 128, 128 - 58);
            ctx.clip();

            this.sprite.render(ctx, isoX, isoY + 48, 128, 128); // Push down to hide grid lines fully
        } else {
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
        }
        ctx.restore();
    }
}
