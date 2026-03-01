import { describe, it, expect } from 'vitest';
import { Bullet } from './Bullet';

describe('Bullet Logic', () => {

    it('should move along its direction vector over time (dt)', () => {
        const bullet = new Bullet({
            x: 500,
            y: 500,
            dirX: 1, // Moving right
            dirY: 0,
            speed: 100, // 100 pixels per second
            damage: 10,
            ownerId: 'player1',
            color: '#fff',
            range: 500,
            stunDur: 0
        });

        // Update by 1 second
        bullet.update(1.0);

        // Initial logical x is start - 5 (width/2 centering) => 495
        // After 1 sec moving at 100px/s => 595
        expect(bullet.x).toBe(595);
        expect(bullet.y).toBe(495);
        expect(bullet.isDead).toBe(false);
    });

    it('should die after exceeding its max range', () => {
        const bullet = new Bullet({
            x: 500,
            y: 500,
            dirX: 0,
            dirY: 1, // Moving down
            speed: 100,
            damage: 10,
            ownerId: 'player1',
            color: '#fff',
            range: 150, // Short range
            stunDur: 0
        });

        // Initial y = 495
        // Update by 1 second => moved 100px down (+y) => 595
        bullet.update(1.0);
        expect(bullet.isDead).toBe(false);
        expect(bullet.y).toBe(595);

        // Update by another 1 second => moved 200px total => 695
        bullet.update(1.0);
        // It should have died since total movement (200) > range (150)
        expect(bullet.isDead).toBe(true);
        expect(bullet.y).toBe(695);
    });
});
