import { CONFIG } from '../config/constants';
import type { GameState } from '../engine/core';
import { Game } from '../engine/game';
import { IsoUtils } from '../engine/iso';
import { SplitScreenEngine } from '../engine/splitscreen';
import { GameObject } from '../entities/GameObject';
import { Player } from '../entities/Player';
import { Bullet } from '../entities/Bullet';
import { Turret } from '../entities/Turret';
import { PowerBox } from '../entities/PowerBox';
import { MapManager } from '../levels/MapManager';

export class PlayingState implements GameState {
    private game: Game;
    private splitScreen: SplitScreenEngine;
    private players: Player[] = [];
    private mapManager: MapManager;
    private entities: GameObject[] = [];
    private gameOverTimer: number = -1;

    constructor(game: Game) {
        this.game = game;
        this.splitScreen = new SplitScreenEngine(game.numPlayers, game['canvas'].width, game['canvas'].height);
        this.mapManager = new MapManager(CONFIG.MAP_WIDTH, CONFIG.MAP_HEIGHT);
    }

    enter(): void {
        console.log(`Starting match with ${this.game.numPlayers} players`);

        // Spawn players in corners
        const corners = [
            { x: 2, y: 2 },
            { x: CONFIG.MAP_WIDTH - 3, y: CONFIG.MAP_HEIGHT - 3 },
            { x: 2, y: CONFIG.MAP_HEIGHT - 3 },
            { x: CONFIG.MAP_WIDTH - 3, y: 2 }
        ];

        for (let i = 0; i < this.game.numPlayers; i++) {
            const spawn = corners[i];
            const p = new Player(
                spawn.x * CONFIG.BLOCK_SIZE,
                spawn.y * CONFIG.BLOCK_SIZE,
                i,
                this.handlePlayerFire.bind(this),
                this.handlePlayerGadget.bind(this)
            );
            p.weaponType = this.game.playerWeapons[i] as keyof typeof CONFIG.WEAPONS;
            this.players.push(p);
            this.entities.push(p);

            // Link camera to player
            const cam = this.splitScreen.getCamera(i);
            if (cam) cam.setTarget(p);
        }

        // Generate environment
        const mapEntities = this.mapManager.generateMap();
        this.entities.push(...mapEntities);

        // Spawn some initial power boxes for testing
        this.entities.push(new PowerBox(10 * CONFIG.BLOCK_SIZE, 10 * CONFIG.BLOCK_SIZE));
        this.entities.push(new PowerBox(20 * CONFIG.BLOCK_SIZE, 20 * CONFIG.BLOCK_SIZE));
    }

    private handlePlayerFire(player: Player, aimX: number, aimY: number) {
        // Look up weapon stats
        // We ensure weaponType is safely casted if needed, or fallback
        const wpnConfig = CONFIG.WEAPONS[player.weaponType as keyof typeof CONFIG.WEAPONS] || CONFIG.WEAPONS.SPREAD;
        const damage = player.superActive ? CONFIG.SUPER_DAMAGE : wpnConfig.damage;

        let shots = 1;
        let spreadAngle = 0;

        if (wpnConfig.type === 'spread') {
            shots = 3;
            spreadAngle = 0.2; // roughly 11 degrees spread
        }

        const baseAngle = Math.atan2(aimY, aimX);

        for (let i = 0; i < shots; i++) {
            let angle = baseAngle;
            if (shots > 1) {
                // Offset angles: -spread, 0, +spread
                angle += (i - 1) * spreadAngle;
            }

            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);

            const b = new Bullet({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                dirX,
                dirY,
                speed: 15 * CONFIG.BLOCK_SIZE, // Fast bullet
                damage: damage,
                ownerId: player.id,
                color: player.color,
                range: (wpnConfig as any).rangeBlocks * CONFIG.BLOCK_SIZE || 8 * CONFIG.BLOCK_SIZE,
                stunDur: ('stunDur' in wpnConfig) ? (wpnConfig as any).stunDur : 0
            });
            this.entities.push(b);
        }
    }

    private handleTurretFire(turret: Turret, targetX: number, targetY: number) {
        const dx = targetX - (turret.x + turret.width / 2);
        const dy = targetY - (turret.y + turret.height / 2);
        const dist = Math.hypot(dx, dy);

        if (dist === 0) return;

        const b = new Bullet({
            x: turret.x + turret.width / 2,
            y: turret.y + turret.height / 2,
            dirX: dx / dist,
            dirY: dy / dist,
            speed: 12 * CONFIG.BLOCK_SIZE,
            damage: CONFIG.TURRET_DAMAGE,
            ownerId: turret.ownerId, // Turret shares owner ID so it doesn't hit the player
            color: '#ffffff',
            range: 10 * CONFIG.BLOCK_SIZE,
            stunDur: 0
        });
        this.entities.push(b);
    }

    private handlePlayerGadget(player: Player) {
        // Deploy turret at player's feet
        const t = new Turret(player.x, player.y, player.id, this.handleTurretFire.bind(this));
        this.entities.push(t);
    }

    update(dt: number): void {
        // Update all entities
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const current = this.entities[i];

            if (current instanceof Player) {
                current.update(dt, this.entities);
            } else if (current instanceof Turret) {
                current.update(dt, this.players);
            } else {
                current.update(dt);
            }

            if (current.isDead) {
                this.entities.splice(i, 1);
            }
        }

        this.handleCollisions();

        // Check for Game Over (Last Man Standing)
        const alivePlayers = this.players.filter(p => !p.isDead);
        if (alivePlayers.length <= 1 && this.players.length > 1 && this.gameOverTimer === -1) {
            this.gameOverTimer = 3.0; // Wait 3 seconds before ending match
        }

        if (this.gameOverTimer > 0) {
            this.gameOverTimer -= dt;
            if (this.gameOverTimer <= 0) {
                const winnerId = alivePlayers.length === 1 ? alivePlayers[0].playerIndex : -1;
                import('./GameOverState').then(module => {
                    this.game.changeState(new module.GameOverState(this.game, winnerId));
                });
            }
        }

        // Update camera targets
        this.splitScreen.update(dt);
    }

    private handleCollisions() {
        // Simple O(N^2) collision for now. Can optimize with grid later if needed.
        const bullets = this.entities.filter(e => e instanceof Bullet) as Bullet[];
        const targets = this.entities.filter(e => e instanceof Player || e instanceof Turret || e instanceof PowerBox || (e as any).blocksBullets);

        for (const b of bullets) {
            if (b.isDead) continue;

            for (const t of targets) {
                if (t.isDead) continue;

                // Prevent hitting yourself or your own turret
                if (t instanceof Player && t.id === b.ownerId) continue;
                if (t instanceof Turret && t.ownerId === b.ownerId) continue;

                if (b.collidesWith(t)) {
                    b.isDead = true; // Bullet consumed
                    this.applyDamage(t, b);
                    break;
                }
            }
        }
    }

    private applyDamage(target: GameObject, bullet: Bullet) {
        if (target instanceof Player) {
            target.health -= bullet.damage;
            target.timeSinceLastCombat = 0; // Reset regen timer

            // Note: In a real architecture, we'd lookup the Bullet's owner to credit Super hits.
            // But we know the ownerId. We search for the player.
            const attacker = this.players.find(p => p.id === bullet.ownerId);
            if (attacker && !attacker.superActive) {
                attacker.superHits++;
            }

            if (target.health <= 0) target.isDead = true;
            // Handle stun visually later
        }
        else if (target instanceof Turret) {
            target.health -= bullet.damage;
            if (target.health <= 0) target.isDead = true;
        }
        else if (target instanceof PowerBox) {
            target.health -= bullet.damage;
            if (target.health <= 0) target.isDead = true; // Might drop a token
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        // Render the world for each camera viewport
        this.splitScreen.render(ctx, (context, camera) => {

            // 1. Draw floor (background)
            this.mapManager.renderFloor(context, camera);

            // 2. Sort all objects by depth (X+Y)
            IsoUtils.sortEntities(this.entities);

            // 3. Draw entities back-to-front
            for (const entity of this.entities) {
                entity.render(context, camera);
            }
        },
            (context, _camera, idx) => {
                // Draw HUD for this camera's player
                const p = this.players[idx];
                if (!p) return;

                // Health Text
                context.fillStyle = '#fff';
                context.font = '20px "Trebuchet MS", sans-serif';
                context.textAlign = 'left';
                context.fillText(`HP: ${Math.floor(p.health)} / ${CONFIG.PLAYER_MAX_HEALTH}`, 20, 30);

                // Ammo
                context.fillText(`Ammo: ${p.superActive ? 'SUPER (∞)' : p.ammo + ' / 3'}`, 20, 60);

                // Gadget
                const gadgetReady = p.gadgetCooldownTimer <= 0;
                context.fillStyle = gadgetReady ? '#2ecc71' : '#e74c3c';
                context.fillText(`Gadget: ${gadgetReady ? 'READY (X)' : Math.ceil(p.gadgetCooldownTimer) + 's'}`, 20, 90);

                // Super
                const superReady = p.superHits >= CONFIG.SUPER_HITS_REQUIRED;
                if (p.superActive) {
                    context.fillStyle = '#f1c40f'; // Gold
                    context.fillText(`SUPER ACTIVE: ${Math.ceil((p as any).superDurationTimer || 0)}s`, 20, 120);
                } else {
                    context.fillStyle = superReady ? '#f1c40f' : '#fff';
                    context.fillText(`Super: ${superReady ? 'READY (B)' : p.superHits + ' / ' + CONFIG.SUPER_HITS_REQUIRED}`, 20, 120);
                }
            });
    }

    exit(): void {
        console.log("Exited Playing State");
    }
}
