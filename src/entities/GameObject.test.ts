import { describe, it, expect } from 'vitest';
import { GameObject } from './GameObject';
import { Camera } from '../engine/camera';

// Create a concrete dummy implementation of the abstract GameObject for testing
class DummyObject extends GameObject {
    update(_dt: number, ..._args: any[]): void { }
    render(_ctx: CanvasRenderingContext2D, _camera: Camera): void { }
}

describe('GameObject Physics & State', () => {

    it('should assign a unique id upon creation', () => {
        const obj1 = new DummyObject(0, 0, 10, 10);
        const obj2 = new DummyObject(0, 0, 10, 10);

        expect(obj1.id).toBeDefined();
        expect(obj2.id).toBeDefined();
        expect(obj1.id).not.toEqual(obj2.id);
    });

    it('should accurately detect AABB collisions', () => {
        // Obj1 is a 10x10 box at origin
        const obj1 = new DummyObject(0, 0, 10, 10);

        // Obj2 is a 10x10 box at (5, 5), overlapping bottom-right quadrant of obj1
        const obj2 = new DummyObject(5, 5, 10, 10);

        // Obj3 is a 10x10 box at (20, 20), completely separate
        const obj3 = new DummyObject(20, 20, 10, 10);

        expect(obj1.collidesWith(obj2)).toBe(true);
        expect(obj2.collidesWith(obj1)).toBe(true); // Commutative

        expect(obj1.collidesWith(obj3)).toBe(false);
        expect(obj2.collidesWith(obj3)).toBe(false);
    });

    it('should handle edge-touching boundaries as non-collisions', () => {
        // Exact touching on the right edge
        const obj1 = new DummyObject(0, 0, 10, 10);
        const objRight = new DummyObject(10, 0, 10, 10);

        // In most AABB logic < vs <= dictates if borders collide.
        // Our logic uses `<` and `>` strictly, meaning touching edges do NOT register as overlapping.
        expect(obj1.collidesWith(objRight)).toBe(false);

        // Sub-pixel overlap should trigger collision
        const objSlightOverlap = new DummyObject(9.9, 0, 10, 10);
        expect(obj1.collidesWith(objSlightOverlap)).toBe(true);
    });
});
