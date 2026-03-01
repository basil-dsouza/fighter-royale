export class Camera {
    public x: number = 0;
    public y: number = 0;

    // The dimensions of the camera's viewport on the screen
    public width: number = 0;
    public height: number = 0;

    // Screen coordinates where this camera should start drawing
    public screenX: number = 0;
    public screenY: number = 0;

    // Follow target (uses logical Cartesian coordinates)
    private target: { x: number; y: number } | null = null;

    constructor(width: number, height: number, screenX: number, screenY: number) {
        this.width = width;
        this.height = height;
        this.screenX = screenX;
        this.screenY = screenY;
    }

    setTarget(target: { x: number; y: number }) {
        this.target = target;
    }

    // Hard clamp for now, could add smoothing
    update(_dt: number) {
        if (this.target) {
            // The target's coordinates are in logical Cartesian space (x, y grid)
            // But the Camera tracks in Isometric Screen space to center the viewport.
            // We need to derive the screen position of the target first.
            const isoX = this.target.x - this.target.y;
            const isoY = (this.target.x + this.target.y) / 2;

            // Center the camera on the target's translated screen position
            this.x = isoX - this.width / 2;
            this.y = isoY - this.height / 2;
        }
    }

    // Set up the canvas context for this camera's viewport
    begin(ctx: CanvasRenderingContext2D) {
        ctx.save();

        // Establish the viewport boundaries
        ctx.beginPath();
        ctx.rect(this.screenX, this.screenY, this.width, this.height);
        ctx.clip();

        // Translate such that (0,0) in logical world space draws correctly on screen
        ctx.translate(this.screenX - this.x, this.screenY - this.y);
    }

    // Restore the context back to full screen drawing
    end(ctx: CanvasRenderingContext2D) {
        ctx.restore();
    }
}
