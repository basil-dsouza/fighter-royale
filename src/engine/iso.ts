// import { CONFIG } from '../config/constants';
import { GameObject } from '../entities/GameObject';

export class IsoUtils {

    // Converts Cartesian (logic) coordinates to Isometric (screen) coordinates
    static cartToIso(cartX: number, cartY: number): { x: number, y: number } {
        // Standard isometric projection relative to a 2:1 tile ratio
        const isoX = cartX - cartY;
        const isoY = (cartX + cartY) / 2;
        return { x: isoX, y: isoY };
    }

    // Converts a desired screen-space movement vector (e.g. from a gamepad) 
    // into the corresponding Cartesian (logic) movement vector.
    // Inverse of: [isoX, isoY]^T = [1, -1; 0.5, 0.5] * [cartX, cartY]^T
    static screenToIsoVec(screenX: number, screenY: number): { x: number, y: number } {
        // cartX = (isoX + 2*isoY) / 2
        // cartY = (2*isoY - isoX) / 2

        // However, standard gamepad Y is positive-down. Up is negative-Y.
        // We want Stick Up (screenY = -1) to move visually UP (-isoY).
        const cartX = (screenX + 2 * screenY) / 2;
        const cartY = (2 * screenY - screenX) / 2;

        // Normalize the resulting vector so diagonal movement isn't faster
        const len = Math.sqrt(cartX * cartX + cartY * cartY);
        if (len === 0) return { x: 0, y: 0 };

        return {
            x: cartX / len,
            y: cartY / len
        };
    }

    // Note: For Z-sorting isometric objects, simply sorting by logical Y (or X+Y depending on exact orientation)
    // is usually sufficient. We'll use X + Y for a perfectly diagonal depth axis.
    static sortEntities(entities: GameObject[]): void {
        entities.sort((a, b) => {
            return (a.x + a.y) - (b.x + b.y);
        });
    }

    // Utility to draw an isometric block at given logical coordinates
    static drawIsoBlock(ctx: CanvasRenderingContext2D, logicX: number, logicY: number, size: number, colorTop: string, colorLeft: string, colorRight: string, heightAdjust = 0) {

        const { x: drawX, y: baseDrawY } = this.cartToIso(logicX, logicY);

        // Height adjustment pulls the block "up" on the Y axis visually
        const drawY = baseDrawY - heightAdjust;

        const halfW = size; // In isometric, width is 2x height visually
        const halfH = size / 2;

        ctx.save();
        // Translate to the center top of the tile
        ctx.translate(drawX, drawY);

        // Top Face
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(halfW, halfH);
        ctx.lineTo(0, size);
        ctx.lineTo(-halfW, halfH);
        ctx.closePath();
        ctx.fillStyle = colorTop;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.stroke();

        // Left Face
        ctx.beginPath();
        ctx.moveTo(-halfW, halfH);
        ctx.lineTo(0, size);
        ctx.lineTo(0, size + size); // The height of the wall is `size`
        ctx.lineTo(-halfW, halfH + size);
        ctx.closePath();
        ctx.fillStyle = colorLeft;
        ctx.fill();
        ctx.stroke();

        // Right Face
        ctx.beginPath();
        ctx.moveTo(0, size);
        ctx.lineTo(halfW, halfH);
        ctx.lineTo(halfW, halfH + size);
        ctx.lineTo(0, size + size);
        ctx.closePath();
        ctx.fillStyle = colorRight;
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    // Draw a flat isometric tile (like floor or water)
    static drawIsoFloor(ctx: CanvasRenderingContext2D, logicX: number, logicY: number, size: number, color: string) {
        const { x: drawX, y: drawY } = this.cartToIso(logicX, logicY);
        const halfW = size;
        const halfH = size / 2;

        ctx.save();
        ctx.translate(drawX, drawY);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(halfW, halfH);
        ctx.lineTo(0, size);
        ctx.lineTo(-halfW, halfH);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        // Optional subtle grid line
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.stroke();

        ctx.restore();
    }
}
