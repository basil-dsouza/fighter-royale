import { Camera } from './camera';

export class SplitScreenEngine {
    private cameras: Camera[] = [];

    constructor(playerCount: number, canvasWidth: number, canvasHeight: number) {
        this.setupCameras(playerCount, canvasWidth, canvasHeight);
    }

    setupCameras(playerCount: number, canvasWidth: number, canvasHeight: number) {
        this.cameras = [];
        const halfW = canvasWidth / 2;
        const halfH = canvasHeight / 2;

        // Ensure we draw borders between screens
        const borderSize = 2; // For visual separation

        if (playerCount === 2) {
            // Vertical split
            this.cameras.push(new Camera(halfW - borderSize, canvasHeight, 0, 0));
            this.cameras.push(new Camera(halfW - borderSize, canvasHeight, halfW + borderSize, 0));
        } else if (playerCount === 3 || playerCount === 4) {
            // 4-quadrants
            this.cameras.push(new Camera(halfW - borderSize, halfH - borderSize, 0, 0)); // Top Left
            this.cameras.push(new Camera(halfW - borderSize, halfH - borderSize, halfW + borderSize, 0)); // Top Right
            this.cameras.push(new Camera(halfW - borderSize, halfH - borderSize, 0, halfH + borderSize)); // Bottom Left

            if (playerCount === 4) {
                this.cameras.push(new Camera(halfW - borderSize, halfH - borderSize, halfW + borderSize, halfH + borderSize)); // Bottom Right
            } else {
                // For 3 players, we still create the 4th quadrant but it might be left empty or used for stats
                this.cameras.push(new Camera(halfW - borderSize, halfH - borderSize, halfW + borderSize, halfH + borderSize)); // Bottom Right (Unused directly)
            }
        } else {
            // Fallback to single player testing
            this.cameras.push(new Camera(canvasWidth, canvasHeight, 0, 0));
        }
    }

    getCamera(index: number): Camera | undefined {
        return this.cameras[index];
    }

    update(dt: number) {
        this.cameras.forEach(cam => cam.update(dt));
    }

    // Takes a render function and calls it for EVERY camera
    // The render function is responsible for drawing the whole world.
    // The Camera object sets up the `clip()` and `translate()` to make it look right.
    render(ctx: CanvasRenderingContext2D, renderWorldFn: (ctx: CanvasRenderingContext2D, camera: Camera) => void, renderHUDFn?: (ctx: CanvasRenderingContext2D, camera: Camera, idx: number) => void) {

        // Draw splitscreen borders underneath
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        this.cameras.forEach((cam, idx) => {
            // Don't render the 4th screen if there are only 3 players
            if (this.cameras.length === 4 && idx === 3 && /* condition for 3 players */ false) {
                // Logic for empty 4th quadrant
                return;
            }

            cam.begin(ctx);
            renderWorldFn(ctx, cam);
            cam.end(ctx);

            if (renderHUDFn) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(cam.screenX, cam.screenY, cam.width, cam.height);
                ctx.clip();
                // Translate so (0,0) is the top-left of this specific camera's screen area
                ctx.translate(cam.screenX, cam.screenY);
                renderHUDFn(ctx, cam, idx);
                ctx.restore();
            }
        });
    }
}
