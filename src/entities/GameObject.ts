import { Camera } from '../engine/camera';

export abstract class GameObject {
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public id: string;
    public isDead: boolean = false;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.id = Math.random().toString(36).substr(2, 9);
    }

    // Common AABB collision check in Cartesian space
    collidesWith(other: GameObject): boolean {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }

    abstract update(dt: number, ...args: any[]): void;
    // Render receives the logical cartesian coordinates translated into screen context by the SplitScreenEngine
    abstract render(ctx: CanvasRenderingContext2D, camera: Camera): void;
}
