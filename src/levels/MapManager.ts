import { CONFIG } from '../config/constants';
import { Camera } from '../engine/camera';
import { IsoUtils } from '../engine/iso';
import { GameObject } from '../entities/GameObject';
import { Wall } from '../entities/Wall';
import { Water } from '../entities/Water';
import { Bush } from '../entities/Bush';

export class MapManager {
    private width: number;
    private height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    // Draw the floor tiles
    renderFloor(ctx: CanvasRenderingContext2D, camera: Camera) {
        // Very basic floor rendering. 
        // Optimization: Only draw tiles within the camera's viewport

        // Determine logical coords of screen corners:
        // A quick hack for now is to just draw a reasonable area around the camera center
        const camCenterX = camera.x + camera.width / 2;
        const camCenterY = camera.y + camera.height / 2;

        // Convert screen center to approximate logical map center
        // (This is the inverse of the isometric projection, simplified for floor culling)
        // isoX = cartX - cartY
        // isoY = (cartX + cartY) / 2
        // => cartY = isoY - isoX/2
        // => cartX = isoY + isoX/2

        const logicX = camCenterY + camCenterX / 2;
        const logicY = camCenterY - camCenterX / 2;

        const blockRadius = 15; // Render 15 blocks in any direction from center

        const startX = Math.max(0, Math.floor(logicX / CONFIG.BLOCK_SIZE - blockRadius));
        const endX = Math.min(this.width, Math.floor(logicX / CONFIG.BLOCK_SIZE + blockRadius));
        const startY = Math.max(0, Math.floor(logicY / CONFIG.BLOCK_SIZE - blockRadius));
        const endY = Math.min(this.height, Math.floor(logicY / CONFIG.BLOCK_SIZE + blockRadius));

        // Draw floor tiles back to front (bottom to top logical Y, then X)
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const pixelX = x * CONFIG.BLOCK_SIZE;
                const pixelY = y * CONFIG.BLOCK_SIZE;

                // Checkerboard pattern for floor depth perception
                const color = (x + y) % 2 === 0 ? '#34495e' : '#2c3e50';

                IsoUtils.drawIsoFloor(
                    ctx,
                    pixelX,
                    pixelY,
                    CONFIG.BLOCK_SIZE,
                    color
                );
            }
        }
    }

    generateMap(): GameObject[] {
        const obs: GameObject[] = [];

        // 1. Edges
        for (let x = 0; x < this.width; x++) {
            obs.push(new Wall(x * CONFIG.BLOCK_SIZE, 0));
            obs.push(new Wall(x * CONFIG.BLOCK_SIZE, (this.height - 1) * CONFIG.BLOCK_SIZE));
        }
        for (let y = 1; y < this.height - 1; y++) {
            obs.push(new Wall(0, y * CONFIG.BLOCK_SIZE));
            obs.push(new Wall((this.width - 1) * CONFIG.BLOCK_SIZE, y * CONFIG.BLOCK_SIZE));
        }

        // 2. Random Obstacles
        // Let's create a few clusters of walls, water, and bushes
        const numClusters = 10;
        for (let i = 0; i < numClusters; i++) {
            const cx = Math.floor(Math.random() * (this.width - 10)) + 5;
            const cy = Math.floor(Math.random() * (this.height - 10)) + 5;

            // Avoid spawning on top of the 4 corners (player spawns)
            const isNearSpawn = (Math.abs(cx - 2) < 4 && Math.abs(cy - 2) < 4) ||
                (Math.abs(cx - (this.width - 3)) < 4 && Math.abs(cy - (this.height - 3)) < 4) ||
                (Math.abs(cx - 2) < 4 && Math.abs(cy - (this.height - 3)) < 4) ||
                (Math.abs(cx - (this.width - 3)) < 4 && Math.abs(cy - 2) < 4);

            if (isNearSpawn) continue;

            const type = Math.random();
            const clusterSize = Math.floor(Math.random() * 4) + 2;

            for (let j = 0; j < clusterSize; j++) {
                const ox = cx + Math.floor(Math.random() * 3) - 1;
                const oy = cy + Math.floor(Math.random() * 3) - 1;

                const blockX = ox * CONFIG.BLOCK_SIZE;
                const blockY = oy * CONFIG.BLOCK_SIZE;

                if (type < 0.33) {
                    obs.push(new Wall(blockX, blockY));
                } else if (type < 0.66) {
                    obs.push(new Water(blockX, blockY));
                } else {
                    obs.push(new Bush(blockX, blockY));
                }
            }
        }

        return obs;
    }
}
