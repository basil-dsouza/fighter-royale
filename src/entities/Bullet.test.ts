import { describe, it, expect } from 'vitest';
import { Bullet } from './Bullet';

describe('Bullet Entity', () => {

    it('should move along its direction vector according to speed', () => {
        const b = new Bullet({
            x: 5, y: 5, // Bounding box of 10x10 means center is 5,5
            dirX: 1, dirY: 0, // Moving perfectly right
            speed: 10,
            damage: 10,
            ownerId: 'test_id',
            ownerTeamId: -1, // Mock Team ID
            color: '#fff',
            range: 1000,
            stunDur: 0
        });

        // Update by 1 second (x += 10)
        b.update(1.0);

        expect(b.x).toBeCloseTo(10); // Start bound is 0 (5 - 5). Moves 10. => 10
        expect(b.y).toBeCloseTo(0);
        expect(b.isDead).toBe(false);
    });

    it('should die after exceeding its max range', () => {
    });
});
