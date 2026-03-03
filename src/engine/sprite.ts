export class SpriteManager {
    public image: HTMLImageElement;
    public frameWidth: number = 0;
    public frameHeight: number = 0;
    public maxFrames: number;
    public isLoaded: boolean = false;

    // Animation state
    public currentFrame: number = 0;
    public frameTimer: number = 0;
    public frameDurationSecs: number = 0.15; // Speed of animation
    public animOffset: number = 0; // Simple bobbing offset for single-frame sprites

    constructor(imageSrc: string, maxFrames: number = 1) {
        this.maxFrames = maxFrames;

        this.image = new Image();
        this.image.onload = () => {
            this.frameWidth = this.image.width / this.maxFrames;
            this.frameHeight = this.image.height;
            this.isLoaded = true;
        };
        this.image.src = imageSrc;
    }

    update(dt: number, isMoving: boolean) {
        if (this.maxFrames === 1) {
            this.animOffset = 0;
            return;
        }

        if (!isMoving) {
            this.currentFrame = 0; // Idle frame
            this.frameTimer = 0;
            return;
        }

        this.frameTimer += dt;
        if (this.frameTimer >= this.frameDurationSecs) {
            this.frameTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % this.maxFrames;
        }
    }

    // Renders the current frame at the exact center of the provided coordinates
    render(ctx: CanvasRenderingContext2D, isoX: number, isoY: number, scaleWidth: number, scaleHeight: number) {
        if (!this.isLoaded) return;

        const sourceX = this.currentFrame * this.frameWidth;
        const sourceY = 0; // Assuming a single row sprite sheet for now

        // We want the sprite to stand "up" on the isometric grid.
        // So the anchor point (bottom center of the sprite) should hit the isoX/isoY.
        const drawX = isoX - (scaleWidth / 2);
        const drawY = isoY - scaleHeight + this.animOffset;

        ctx.drawImage(
            this.image,
            sourceX, sourceY,
            this.frameWidth, this.frameHeight,
            drawX, drawY,
            scaleWidth, scaleHeight
        );
    }
}
