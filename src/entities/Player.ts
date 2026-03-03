import { CONFIG } from '../config/constants';
import { Camera } from '../engine/camera';
import { InputManager } from '../engine/input';
import { IsoUtils } from '../engine/iso';
import { SpriteManager } from '../engine/sprite';
import { GameObject } from './GameObject';

export class Player extends GameObject {
    public playerIndex: number;
    public isBot: boolean = false;
    public teamId: number = -1;
    public isHidden: boolean = false;
    public health: number = CONFIG.PLAYER_MAX_HEALTH;

    // Visuals
    public color: string;
    private colors = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a'];

    // Combat Stats
    public ammo: number = 3;
    private ammoRegenTimer: number = 0;

    public superHits: number = 0;
    public superActive: boolean = false;
    private superDurationTimer: number = 0;

    public gadgetCooldownTimer: number = 0;
    public timeSinceLastCombat: number = 0;

    public weaponType: keyof typeof CONFIG.WEAPONS = 'SPREAD';
    public gadgetType: keyof typeof CONFIG.GADGETS = 'TURRET';
    private fireCooldown: number = 0;

    // Actions
    private onFire: (player: Player, aimX: number, aimY: number) => void;
    private onGadget: (player: Player) => void;
    private sprite: SpriteManager;

    constructor(x: number, y: number, playerIndex: number, onFire: (p: Player, axeX: number, axY: number) => void, onGadget: (p: Player) => void) {
        super(x, y, 40, 40); // 40 logical size inside a 64 block
        this.playerIndex = playerIndex;
        this.color = this.colors[playerIndex % this.colors.length];
        this.onFire = onFire;
        this.onGadget = onGadget;
        this.sprite = new SpriteManager('/assets/player.png', 1);
    }

    update(dt: number, entities?: GameObject[]): void {
        const input = InputManager.getInstance().getInputState(this.playerIndex);

        if (!input.connected && !this.isBot) return;

        // Calculate movement vector
        const speed = CONFIG.PLAYER_SPEED * CONFIG.BLOCK_SIZE * dt;

        // We need to translate the screen-space gamepad input into logical cartesian movement
        // so that pushing UP on the stick moves the character visually UP on the screen.
        const cartVec = IsoUtils.screenToIsoVec(input.moveX, input.moveY);

        // Update logical cartesian coordinates
        // We multiply by the original stick magnitude to keep analog pressure working
        const inputMag = Math.min(1, Math.sqrt(input.moveX * input.moveX + input.moveY * input.moveY));
        const moveX = cartVec.x * speed * inputMag;
        const moveY = cartVec.y * speed * inputMag;

        // Try X
        this.x += moveX;
        if (this.checkEnvironmentCollision(entities)) {
            this.x -= moveX;
        }

        // Try Y
        this.y += moveY;
        if (this.checkEnvironmentCollision(entities)) {
            this.y -= moveY;
        }

        // Boundary clamp (assuming 0 to MAP_WIDTH * BLOCK_SIZE)
        const mapPixelWidth = CONFIG.MAP_WIDTH * CONFIG.BLOCK_SIZE;
        const mapPixelHeight = CONFIG.MAP_HEIGHT * CONFIG.BLOCK_SIZE;

        this.x = Math.max(0, Math.min(this.x, mapPixelWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, mapPixelHeight - this.height));

        // --- Combat Timers & Regen ---
        this.timeSinceLastCombat += dt * 1000;

        // Health Regen
        if (this.timeSinceLastCombat >= CONFIG.HEALTH_REGEN_DELAY && this.health < CONFIG.PLAYER_MAX_HEALTH) {
            this.health = Math.min(CONFIG.PLAYER_MAX_HEALTH, this.health + CONFIG.HEALTH_REGEN_RATE * dt);
        }

        // Ammo Regen
        if (!this.superActive && this.ammo < 3) {
            this.ammoRegenTimer += dt;
            const reloadTime = CONFIG.WEAPONS[this.weaponType].reloadSecs;
            if (this.ammoRegenTimer >= reloadTime) {
                this.ammo++;
                this.ammoRegenTimer = 0;
            }
        }

        // Super Duration
        if (this.superActive) {
            this.superDurationTimer -= dt;
            if (this.superDurationTimer <= 0) {
                this.superActive = false;
                this.superHits = 0;
            }
        }

        if (this.gadgetCooldownTimer > 0) {
            this.gadgetCooldownTimer -= dt;
        }

        if (this.fireCooldown > 0) {
            this.fireCooldown -= dt;
        }

        // Stealth check
        this.isHidden = false;
        if (this.timeSinceLastCombat > 1000 && entities) {
            for (const e of entities) {
                if (e.constructor.name === 'Bush' && this.collidesWith(e)) {
                    this.isHidden = true;
                    break;
                }
            }
        }

        const isMoving = inputMag > 0.1;
        this.sprite.update(dt, isMoving);

        // --- Actions ---
        const aimMag = Math.sqrt(input.aimX * input.aimX + input.aimY * input.aimY);

        // Firing: Need either standard ammo or super active, and cooldown ready, and input fire pressed
        if (input.fire && this.fireCooldown <= 0) {
            let aimIso: { x: number; y: number } | null = null;

            if (aimMag > 0.1) {
                aimIso = IsoUtils.screenToIsoVec(input.aimX, input.aimY);
            } else {
                const closest = this.getClosestEnemy(entities);
                if (closest) {
                    const dx = (closest.x + closest.width / 2) - (this.x + this.width / 2);
                    const dy = (closest.y + closest.height / 2) - (this.y + this.height / 2);
                    const mag = Math.hypot(dx, dy);
                    if (mag > 0) {
                        aimIso = { x: dx / mag, y: dy / mag };
                    }
                }
            }

            if (aimIso && (this.superActive || this.ammo > 0)) {

                if (!this.superActive) {
                    this.ammo--;
                    // For standard shots, apply a small cooldown so analog stick doesn't fire 
                    // on consecutive frames and drain all 3 ammo instantly. 
                    this.fireCooldown = 0.25;
                } else {
                    // During super, it's 'semi-automatic' 1 shot per click, but we simulate this by 
                    // a short fire cooldown. True semi-auto would require tracking previous tick's button state.
                    this.fireCooldown = 0.2;
                }

                this.timeSinceLastCombat = 0;
                this.onFire(this, aimIso.x, aimIso.y);
            }
        }

        // Super Activation
        if (input.superBtn && this.superHits >= CONFIG.SUPER_HITS_REQUIRED && !this.superActive) {
            this.superActive = true;
            this.superDurationTimer = CONFIG.SUPER_DURATION_SECS;
            this.ammo = 3; // Fill ammo on super?
        }

        // Gadget Deployment
        if (input.gadgetBtn && this.gadgetCooldownTimer <= 0) {
            if (this.onGadget) {
                this.onGadget(this);
                this.gadgetCooldownTimer = CONFIG.GADGETS[this.gadgetType].cooldownSecs;
                this.timeSinceLastCombat = 0;
            }
        }
    }

    render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
        // Draw the player as an isometric shape
        // We use the center of our bounding box for rendering
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        this.drawAimIndicators(ctx, centerX, centerY);

        const { x: isoX, y: isoY } = IsoUtils.cartToIso(centerX, centerY);

        if (this.sprite.isLoaded) {
            // Give players a colored circle underneath them to show team/player color
            ctx.save();
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.ellipse(isoX, isoY, 30, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            this.sprite.render(ctx, isoX, isoY, 128, 128);
        } else {
            // Top color is main, sides are darkened
            ctx.fillStyle = this.color;
            IsoUtils.drawIsoBlock(
                ctx,
                centerX,
                centerY,
                this.width / 2, // 'size' for isometric draw is half-width
                this.color,     // top
                this.darken(this.color, 0.2), // left
                this.darken(this.color, 0.4), // right
                this.height // height adjust (makes the block stand up TALL)
            );
        }

        // Draw health bar and ammo floating above
        this.drawHealthBar(ctx, centerX, centerY);
        this.drawAmmoBar(ctx, centerX, centerY);
    }

    private drawAimIndicators(ctx: CanvasRenderingContext2D, logicX: number, logicY: number) {
        if (this.isBot) return;
        const input = InputManager.getInstance().getInputState(this.playerIndex);
        if (!input.connected) return;

        const aimMag = Math.sqrt(input.aimX * input.aimX + input.aimY * input.aimY);
        if (aimMag > 0.1) {
            const aimIso = IsoUtils.screenToIsoVec(input.aimX, input.aimY);
            const wpnConfig = CONFIG.WEAPONS[this.weaponType] || CONFIG.WEAPONS.SPREAD;

            let shots = 1;
            let spreadAngle = 0;
            if (wpnConfig.type === 'spread') {
                shots = 3;
                spreadAngle = 0.2;
            }

            const baseAngle = Math.atan2(aimIso.y, aimIso.x);
            // Default range logic we use for bullets
            const range = (wpnConfig.rangeBlocks || 8) * CONFIG.BLOCK_SIZE;

            ctx.save();
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
            ctx.lineCap = 'round';
            // Dashed line for aimed path
            ctx.setLineDash([10, 15]);

            for (let i = 0; i < shots; i++) {
                let angle = baseAngle;
                if (shots > 1) {
                    angle += (i - 1) * spreadAngle;
                }

                const dirX = Math.cos(angle);
                const dirY = Math.sin(angle);

                const endLogicX = logicX + dirX * range;
                const endLogicY = logicY + dirY * range;

                const startIso = IsoUtils.cartToIso(logicX, logicY);
                const endIso = IsoUtils.cartToIso(endLogicX, endLogicY);

                ctx.beginPath();
                ctx.moveTo(startIso.x, startIso.y - 20); // slightly above ground
                ctx.lineTo(endIso.x, endIso.y - 20);
                // Animate dashed lines based on time
                const timeOffset = (Date.now() / 20) % 25;
                ctx.lineDashOffset = -timeOffset;
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    private drawHealthBar(ctx: CanvasRenderingContext2D, logicX: number, logicY: number) {
        const { x, y } = IsoUtils.cartToIso({ cartX: logicX, cartY: logicY }.cartX, { cartX: logicX, cartY: logicY }.cartY);

        const barWidth = 40;
        const barHeight = 6;
        const floatOffsetY = this.height + 25; // Float above the character height

        const drawX = x - barWidth / 2;
        const drawY = y - floatOffsetY;

        ctx.save();
        ctx.fillStyle = '#000';
        ctx.fillRect(drawX - 1, drawY - 1, barWidth + 2, barHeight + 2);

        const healthPercent = Math.max(0, this.health / CONFIG.PLAYER_MAX_HEALTH);
        ctx.fillStyle = healthPercent > 0.3 ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(drawX, drawY, barWidth * healthPercent, barHeight);
        ctx.restore();
    }

    private checkEnvironmentCollision(entities?: GameObject[]): boolean {
        if (!entities) return false;

        for (const e of entities) {
            // Avoid self-collision and only check solids
            if (e !== this && (e as any).isSolid && this.collidesWith(e)) {
                return true;
            }
        }
        return false;
    }

    private getClosestEnemy(entities?: GameObject[]): Player | null {
        if (!entities) return null;
        let closest: Player | null = null;
        let minDist = Infinity;
        for (const e of entities) {
            if (e instanceof Player && !e.isDead && e !== this) {
                if (this.teamId !== -1 && e.teamId === this.teamId) continue;
                if (e.isHidden) continue;

                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < minDist) {
                    minDist = dist;
                    closest = e;
                }
            }
        }
        return closest;
    }

    private drawAmmoBar(ctx: CanvasRenderingContext2D, logicX: number, logicY: number) {
        const { x, y } = IsoUtils.cartToIso({ cartX: logicX, cartY: logicY }.cartX, { cartX: logicX, cartY: logicY }.cartY);

        const maxAmmo = 3;
        const barWidth = 40;
        const gap = 2; // Gap between ammo segments
        const segmentWidth = (barWidth - (gap * (maxAmmo - 1))) / maxAmmo;
        const barHeight = 4;

        // Float just below the health bar
        const floatOffsetY = this.height + 15;

        const drawX = x - barWidth / 2;
        const drawY = y - floatOffsetY;

        ctx.save();

        for (let i = 0; i < maxAmmo; i++) {
            const segX = drawX + (segmentWidth + gap) * i;

            ctx.fillStyle = '#000';
            ctx.fillRect(segX - 1, drawY - 1, segmentWidth + 2, barHeight + 2);

            if (this.superActive) {
                // If super is active, fill all segments with glowing gold
                ctx.fillStyle = '#f1c40f'; // Gold
                ctx.fillRect(segX, drawY, segmentWidth, barHeight);
            } else if (i < Math.floor(this.ammo)) {
                // Fully loaded weapon segment
                ctx.fillStyle = '#3498db'; // Bright blue
                ctx.fillRect(segX, drawY, segmentWidth, barHeight);
            } else if (i === Math.floor(this.ammo)) {
                // Currently reloading segment
                const reloadTime = CONFIG.WEAPONS[this.weaponType]?.reloadSecs || 1;
                const reloadPercent = this.ammoRegenTimer / reloadTime;

                ctx.fillStyle = '#2980b9'; // Darker blue for reloading
                ctx.fillRect(segX, drawY, segmentWidth * reloadPercent, barHeight);
            } else {
                // Empty segment
                ctx.fillStyle = '#333';
                ctx.fillRect(segX, drawY, segmentWidth, barHeight);
            }
        }

        ctx.restore();
    }

    private darken(color: string, amount: number): string {
        // Simple utility to darken a hex string #RRGGBB
        let c = color.substring(1);
        let rgb = parseInt(c, 16);
        let r = Math.max(0, (rgb >> 16) * (1 - amount));
        let g = Math.max(0, ((rgb >> 8) & 0x00FF) * (1 - amount));
        let b = Math.max(0, (rgb & 0x0000FF) * (1 - amount));

        return "#" + (
            (1 << 24) +
            (Math.round(r) << 16) +
            (Math.round(g) << 8) +
            Math.round(b)
        ).toString(16).slice(1);
    }
}
