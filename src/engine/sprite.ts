export class SpriteManager {
    public image: HTMLImageElement;
    public frameWidth: number;
    public frameHeight: number;
    public maxFrames: number;
    public isLoaded: boolean = false;

    // Animation state
    public currentFrame: number = 0;
    public frameTimer: number = 0;
    public frameDurationSecs: number = 0.15; // Speed of animation

    constructor(imageSrc: string, frameWidth: number, frameHeight: number, maxFrames: number) {
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.maxFrames = maxFrames;

        this.image = new Image();
        this.image.onload = () => {
            this.isLoaded = true;
        };
        this.image.src = imageSrc;
    }

    update(dt: number, isMoving: boolean) {
        if (!isMoving) {
            this.currentFrame = 0; // Idle frame
            this.frameTimer = 0;
            return;
        }

        this.frameTimer += dt;
        if (this.frameTimer >= this.frameDurationSecs) {
            this.frameTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % this.maxFrames;

            // If frame 0 is strictly idle, we might want to loop 1-3. 
            // For a simple 4-frame sheet (0,1,2,3), looping all is usually fine.
        }
    }

    // Renders the current frame at the exact center of the provided coordinates
    render(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scaleWidth: number, scaleHeight: number) {
        if (!this.isLoaded) return;

        const sourceX = this.currentFrame * this.frameWidth;
        const sourceY = 0; // Assuming a single row sprite sheet for now

        // We want the sprite to stand "up" on the isometric grid.
        // So the anchor point (bottom center of the sprite) should hit the centerX/centerY.
        const drawX = centerX - (scaleWidth / 2);
        const drawY = centerY - scaleHeight;

        ctx.drawImage(
            this.image,
            sourceX, sourceY,
            this.frameWidth, this.frameHeight,
            drawX, drawY,
            scaleWidth, scaleHeight
        );
    }
}
