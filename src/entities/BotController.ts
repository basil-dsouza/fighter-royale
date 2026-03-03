import { GameObject } from './GameObject';
import { Player } from './Player';
import { Turret } from './Turret';
import { PowerBox } from './PowerBox';
import { InputManager } from '../engine/input';
import { IsoUtils } from '../engine/iso';

export class BotController {
    private player: Player;

    private targetWaypoint: { x: number, y: number } | null = null;
    private waypointTimer: number = 0;
    private style: string;

    constructor(player: Player, style: string = 'NORMAL') {
        this.player = player;
        this.style = style;
    }

    update(dt: number, entities: GameObject[]) {
        const input = InputManager.getInstance().getInputState(this.player.playerIndex);

        // Pretend gamepad is connected
        input.connected = true;
        input.moveX = 0;
        input.moveY = 0;
        input.aimX = 0;
        input.aimY = 0;
        input.fire = false;
        input.superBtn = false;
        input.gadgetBtn = false;

        // Death check
        if (this.player.isDead) return;

        // Threat Assessment
        let closestTarget: GameObject | null = null;
        let closestDist = Infinity;

        for (const e of entities) {
            if (e === this.player || e.isDead) continue;

            let isEnemy = false;
            let priorityMulti = 1.0;

            if (e instanceof Player && e.playerIndex !== this.player.playerIndex) {
                // If they are on the same team, ignore
                if (this.player.teamId !== -1 && e.teamId === this.player.teamId) continue;
                // If they are in a bush and haven't fired recently, ignore
                if (e.isHidden) continue;

                isEnemy = true;
            } else if (e instanceof Turret && e.ownerId !== this.player.id) {
                isEnemy = true;
                priorityMulti = 1.5; // Slightly lower priority than players
            } else if (e instanceof PowerBox) {
                isEnemy = true;
                priorityMulti = 2.0; // Lowest priority
            }

            if (isEnemy) {
                const dx = e.x + e.width / 2 - (this.player.x + this.player.width / 2);
                const dy = e.y + e.height / 2 - (this.player.y + this.player.height / 2);
                const dist = Math.hypot(dx, dy) * priorityMulti;

                if (dist < closestDist) {
                    closestDist = dist;
                    closestTarget = e;
                }
            }
        }

        let logicRange = 500; // ~8 blocks
        let backAwayDist = 150;
        let strafeDist = 300;

        if (this.style === 'AGGRESSIVE') {
            logicRange = 600;
            backAwayDist = 50; // Barely backs away
            strafeDist = 200; // Charges closer
        } else if (this.style === 'DEFENSIVE') {
            logicRange = 800; // Looks for targets further out
            backAwayDist = 300; // Keeps away
            strafeDist = 450;
        } else if (this.style === 'RANDOM') {
            // Randomly fluctuate ranges (evaluated every frame, creating chaotic movement)
            logicRange = 300 + Math.random() * 500;
            backAwayDist = 50 + Math.random() * 200;
            strafeDist = backAwayDist + 100 + Math.random() * 200;
        }

        if (closestTarget && closestDist < logicRange * 1.5) {
            // ENGAGE
            const tCenterX = closestTarget.x + closestTarget.width / 2;
            const tCenterY = closestTarget.y + closestTarget.height / 2;
            const myX = this.player.x + this.player.width / 2;
            const myY = this.player.y + this.player.height / 2;

            const dx = tCenterX - myX;
            const dy = tCenterY - myY;
            const rawDist = Math.hypot(dx, dy);

            // Calculate Aim Vector (Screen Space)
            const aimScreen = IsoUtils.cartToIso(dx, dy);
            const aimMag = Math.hypot(aimScreen.x, aimScreen.y);
            if (aimMag > 0) {
                input.aimX = aimScreen.x / aimMag;
                input.aimY = aimScreen.y / aimMag;
            }

            // Movement Logic
            // If too close, strafe or back up. If too far, move towards.
            let moveDx = dx;
            let moveDy = dy;

            if (rawDist < backAwayDist) {
                // Back away
                moveDx = -dx;
                moveDy = -dy;
            } else if (rawDist < strafeDist) {
                // Strafe slowly
                moveDx = -dy;
                moveDy = dx;
            }

            const moveScreen = IsoUtils.cartToIso(moveDx, moveDy);
            const moveMag = Math.hypot(moveScreen.x, moveScreen.y);

            if (moveMag > 0) {
                input.moveX = moveScreen.x / moveMag;
                input.moveY = moveScreen.y / moveMag;
            }

            // Firing Logic
            if (rawDist <= logicRange) {
                input.fire = true;
                // Use super if charged
                if (this.player.superHits >= 10 && !this.player.superActive) {
                    input.superBtn = true;
                }
                // Use gadget intelligently based on type
                if (this.player.gadgetCooldownTimer <= 0) {
                    if (this.player.gadgetType === 'PROXIMITY_MINE') {
                        // Drop mine if backing up or enemy is close
                        if (rawDist < backAwayDist || rawDist < strafeDist) {
                            input.gadgetBtn = true;
                        }
                    } else {
                        // Drop Turret simply if we are fighting
                        input.gadgetBtn = true;
                    }
                }
            }

            // Invalidate waypoint since we are in combat
            this.targetWaypoint = null;

        } else {
            // ROAM
            this.waypointTimer -= dt;
            if (this.waypointTimer <= 0 || !this.targetWaypoint) {
                // Pick a new random point within logical map approx range
                this.targetWaypoint = {
                    x: Math.random() * 20 * 64 + 300,
                    y: Math.random() * 20 * 64 + 300
                };
                this.waypointTimer = 3 + Math.random() * 3;
            }

            const myX = this.player.x + this.player.width / 2;
            const myY = this.player.y + this.player.height / 2;
            const dx = this.targetWaypoint.x - myX;
            const dy = this.targetWaypoint.y - myY;

            if (Math.hypot(dx, dy) > 50) {
                const moveScreen = IsoUtils.cartToIso(dx, dy);
                const moveMag = Math.hypot(moveScreen.x, moveScreen.y);
                if (moveMag > 0) {
                    input.moveX = moveScreen.x / moveMag;
                    input.moveY = moveScreen.y / moveMag;
                }
            } else {
                this.targetWaypoint = null; // Reached
            }
        }
    }
}
