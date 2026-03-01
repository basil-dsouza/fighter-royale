import { describe, it, expect } from 'vitest';
import { IsoUtils } from './iso';

describe('IsoUtils', () => {
    it('should correctly convert Cartesian to Isometric coordinates', () => {
        // Test Origin
        const origin = IsoUtils.cartToIso(0, 0);
        expect(origin.x).toBe(0);
        expect(origin.y).toBe(0);

        // Test arbitrary point
        // math for x, y is:
        // isoX = cartX - cartY
        // isoY = (cartX + cartY) / 2
        const cartX = 100;
        const cartY = 50;
        const iso = IsoUtils.cartToIso(cartX, cartY);

        expect(iso.x).toBe(100 - 50); // 50
        expect(iso.y).toBe((100 + 50) / 2); // 75
    });

    it('should correctly project a screen movement vector into a cartesian plane', () => {
        // Right Movement on Screen
        // We push right on joystick: scrX = 1, scrY = 0
        // Expected projected map movement vector:
        const rightVec = IsoUtils.screenToIsoVec(1, 0);
        expect(rightVec.x).toBeGreaterThan(0);
        expect(rightVec.y).toBeLessThan(0); // Note that due to how the mapping works: screen +x -> map +x, -y

        // Down Movement on Screen
        // scrX = 0, scrY = 1
        const downVec = IsoUtils.screenToIsoVec(0, 1);
        expect(downVec.x).toBeGreaterThan(0);
        expect(downVec.y).toBeGreaterThan(0);

        // Let's test normalization length
        const mag = Math.sqrt(rightVec.x * rightVec.x + rightVec.y * rightVec.y);
        // Expect magnitude to be ~1 (it's normalized in the function)
        expect(mag).toBeCloseTo(1, 4);
    });
});
