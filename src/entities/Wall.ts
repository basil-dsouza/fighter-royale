import { CONFIG } from '../config/constants';
import { Camera } from '../engine/camera';
import { IsoUtils } from '../engine/iso';
import { SpriteManager } from '../engine/sprite';
import { GameObject } from './GameObject';

export class Wall extends GameObject {
    public isSolid: boolean = true;
    public blocksBullets: boolean = true;
    private sprite: SpriteManager;

    constructor(x: number, y: number) {
        super(x, y, CONFIG.BLOCK_SIZE, CONFIG.BLOCK_SIZE);
        this.sprite = new SpriteManager('/assets/wall.png', 1);
    }

    update(_dt: number) { }

    render(ctx: CanvasRenderingContext2D, _camera: Camera) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const { x: isoX, y: isoY } = IsoUtils.cartToIso(centerX, centerY);

        if (this.sprite?.isLoaded) {
            // A square Minecraft-style block isometric tile is roughly W:128, H:128.
            // But we need to offset it to stand up precisely on the grid.
            this.sprite.render(ctx, isoX, isoY + 32, 128, 128);
        } else {
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
}
