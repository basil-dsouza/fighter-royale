import type { PlayerInput } from './input';
import type { Player } from '../entities/Player';
import { CONFIG } from '../config/constants';

interface TouchJoy {
    identifier: number | null;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    active: boolean;
    startTime: number;
}

export class TouchInputManager {
    private static instance: TouchInputManager;
    private canvas: HTMLCanvasElement;

    // Left joystick (Move)
    private leftJoy: TouchJoy = { identifier: null, startX: 0, startY: 0, currentX: 0, currentY: 0, active: false, startTime: 0 };
    // Right joystick (Aim)
    private rightJoy: TouchJoy = { identifier: null, startX: 0, startY: 0, currentX: 0, currentY: 0, active: false, startTime: 0 };

    private superPressed: boolean = false;
    private gadgetPressed: boolean = false;
    private autoAimBurst: boolean = false;
    private aimReleasedBurst: boolean = false;
    private lastAimVec: { x: number, y: number } = { x: 0, y: 0 };

    private superTouchId: number | null = null;
    private gadgetTouchId: number | null = null;

    // Define touch zones
    private superCenter = { x: 0, y: 0, radius: 40 };
    private gadgetCenter = { x: 0, y: 0, radius: 40 };

    private constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });

        window.addEventListener('resize', this.updateButtonPositions.bind(this));
        this.updateButtonPositions();
    }

    public static initialize(canvas: HTMLCanvasElement): TouchInputManager {
        if (!TouchInputManager.instance) {
            TouchInputManager.instance = new TouchInputManager(canvas);
        }
        return TouchInputManager.instance;
    }

    public static getInstance(): TouchInputManager {
        if (!TouchInputManager.instance) {
            throw new Error("TouchInputManager not initialized");
        }
        return TouchInputManager.instance;
    }

    private updateButtonPositions() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        // Super button: bottom right, slightly inwards
        this.superCenter = { x: w - 150, y: h - 80, radius: 40 };
        // Gadget button: above Super
        this.gadgetCenter = { x: w - 80, y: h - 150, radius: 40 };
    }

    private checkButtonHit(x: number, y: number, btn: { x: number, y: number, radius: number }): boolean {
        const dist = Math.hypot(x - btn.x, y - btn.y);
        return dist <= btn.radius;
    }

    private handleTouchStart(e: TouchEvent) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const px = touch.clientX - rect.left;
            const py = touch.clientY - rect.top;

            // Check specific buttons first
            if (this.checkButtonHit(px, py, this.superCenter)) {
                this.superTouchId = touch.identifier;
                this.superPressed = true;
                continue;
            }
            if (this.checkButtonHit(px, py, this.gadgetCenter)) {
                this.gadgetTouchId = touch.identifier;
                this.gadgetPressed = true;
                continue;
            }

            // Left side = Blue Movement Joystick
            if (px < window.innerWidth / 2 && !this.leftJoy.active) {
                this.leftJoy.active = true;
                this.leftJoy.identifier = touch.identifier;
                this.leftJoy.startX = px;
                this.leftJoy.startY = py;
                this.leftJoy.currentX = px;
                this.leftJoy.currentY = py;
                this.leftJoy.startTime = performance.now();
            }
            // Right side = Red Attack Joystick
            else if (px >= window.innerWidth / 2 && !this.rightJoy.active) {
                this.rightJoy.active = true;
                this.rightJoy.identifier = touch.identifier;
                this.rightJoy.startX = px;
                this.rightJoy.startY = py;
                this.rightJoy.currentX = px;
                this.rightJoy.currentY = py;
                this.rightJoy.startTime = performance.now();
            }
        }
    }

    private handleTouchMove(e: TouchEvent) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const px = touch.clientX - rect.left;
            const py = touch.clientY - rect.top;

            if (this.leftJoy.identifier === touch.identifier) {
                this.leftJoy.currentX = px;
                this.leftJoy.currentY = py;
            } else if (this.rightJoy.identifier === touch.identifier) {
                this.rightJoy.currentX = px;
                this.rightJoy.currentY = py;
            }
        }
    }

    private handleTouchEnd(e: TouchEvent) {
        e.preventDefault();
        // Since players can tap very quickly between frames, we CANNOT unset superPressed
        // here, otherwise the game engine entirely misses the click! It will be unset inside getTouchInput().

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];

            if (this.leftJoy.identifier === touch.identifier) {
                this.leftJoy.active = false;
                this.leftJoy.identifier = null;
            } else if (this.rightJoy.identifier === touch.identifier) {
                // Check if it was a quick tap for auto-aim
                const dist = Math.hypot(this.rightJoy.currentX - this.rightJoy.startX, this.rightJoy.currentY - this.rightJoy.startY);
                const time = performance.now() - this.rightJoy.startTime;

                if (dist < 20 && time < 200) {
                    this.autoAimBurst = true;
                } else if (dist >= 20) {
                    // Released an aimed shot outside the cancel deadzone
                    this.aimReleasedBurst = true;
                    this.lastAimVec = this.calculateVector(this.rightJoy);
                }

                this.rightJoy.active = false;
                this.rightJoy.identifier = null;
            }

            if (this.superTouchId === touch.identifier) {
                this.superTouchId = null;
            }
            if (this.gadgetTouchId === touch.identifier) {
                this.gadgetTouchId = null;
            }
        }
    }

    private calculateVector(joy: TouchJoy, maxRadius: number = 50): { x: number, y: number } {
        if (!joy.active) return { x: 0, y: 0 };

        let dx = joy.currentX - joy.startX;
        let dy = joy.currentY - joy.startY;

        const dist = Math.hypot(dx, dy);
        if (dist > maxRadius) {
            dx = (dx / dist) * maxRadius;
            dy = (dy / dist) * maxRadius;
        }

        return { x: dx / maxRadius, y: dy / maxRadius }; // Normalized -1 to 1
    }

    public getTouchInput(): Partial<PlayerInput> {
        const moveVec = this.calculateVector(this.leftJoy);
        let aimVec = this.calculateVector(this.rightJoy);

        let isAiming = this.rightJoy.active && Math.hypot(aimVec.x, aimVec.y) > 0.2;

        if (this.aimReleasedBurst) {
            aimVec = this.lastAimVec;
            isAiming = true; // Force vector transmission this frame
        }

        const isFiring = this.autoAimBurst || this.aimReleasedBurst;

        // Cache the button states for this exact frame read
        const superP = this.superPressed;
        const gadgetP = this.gadgetPressed;

        // Immediately unlatch the fast-tap inputs so they don't trigger across multiple frames
        this.superPressed = false;
        this.gadgetPressed = false;
        this.autoAimBurst = false;
        this.aimReleasedBurst = false;

        return {
            moveX: moveVec.x,
            moveY: moveVec.y,
            aimX: isAiming ? aimVec.x : 0,
            aimY: isAiming ? aimVec.y : 0,
            fire: isFiring,
            superBtn: superP,
            gadgetBtn: gadgetP,
            // We simulate bumper presses by tapping specific zones in WeaponSelect if needed
            connected: true
        };
    }


    public render(ctx: CanvasRenderingContext2D, player?: Player) {
        // Render left joystick (Blue)
        if (this.leftJoy.active) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.leftJoy.startX, this.leftJoy.startY, 50, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(this.leftJoy.currentX, this.leftJoy.currentY, 25, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(41, 128, 185, 0.7)';
            ctx.fill();
            ctx.restore();
        }

        // Render right joystick (Red)
        if (this.rightJoy.active) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.rightJoy.startX, this.rightJoy.startY, 50, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(this.rightJoy.currentX, this.rightJoy.currentY, 25, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(192, 57, 43, 0.7)';
            ctx.fill();
            ctx.restore();
        }

        // Render fixed buttons
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 16px sans-serif';

        let superReady = false;
        let gadgetReady = false;
        if (player) {
            superReady = player.superHits >= CONFIG.SUPER_HITS_REQUIRED || player.superActive;
            gadgetReady = player.gadgetCooldownTimer <= 0;
        }

        // Super
        const superVis = this.superTouchId !== null;
        ctx.beginPath();
        ctx.arc(this.superCenter.x, this.superCenter.y, this.superCenter.radius, 0, Math.PI * 2);
        const superAlpha = superVis ? 1.0 : (superReady ? 0.7 : 0.2);
        ctx.fillStyle = `rgba(241, 196, 15, ${superAlpha})`;
        ctx.fill();
        if (superVis) {
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#fff';
            ctx.stroke();
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${superVis || superReady ? 1.0 : 0.4})`;
        ctx.fillText('SUPER', this.superCenter.x, this.superCenter.y);

        // Gadget
        const gadgetVis = this.gadgetTouchId !== null;
        ctx.beginPath();
        ctx.arc(this.gadgetCenter.x, this.gadgetCenter.y, this.gadgetCenter.radius, 0, Math.PI * 2);
        const gadgetAlpha = gadgetVis ? 1.0 : (gadgetReady ? 0.7 : 0.2);
        ctx.fillStyle = `rgba(46, 204, 113, ${gadgetAlpha})`;
        ctx.fill();
        if (gadgetVis) {
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#fff';
            ctx.stroke();
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${gadgetVis || gadgetReady ? 1.0 : 0.4})`;
        ctx.fillText('GADGET', this.gadgetCenter.x, this.gadgetCenter.y);

        ctx.restore();
    }
}
