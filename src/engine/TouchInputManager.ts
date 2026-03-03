import type { PlayerInput } from './input';

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
                this.superPressed = true;
                continue;
            }
            if (this.checkButtonHit(px, py, this.gadgetCenter)) {
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
        // Reset buttons on any touch end (simple approach)
        this.superPressed = false;
        this.gadgetPressed = false;

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
                    // Auto-clear the flag after 100ms
                    setTimeout(() => { this.autoAimBurst = false; }, 100);
                }

                this.rightJoy.active = false;
                this.rightJoy.identifier = null;
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
        const aimVec = this.calculateVector(this.rightJoy);

        const isAiming = this.rightJoy.active && Math.hypot(aimVec.x, aimVec.y) > 0.2;
        const isFiring = isAiming || this.autoAimBurst;

        return {
            moveX: moveVec.x,
            moveY: moveVec.y,
            aimX: isAiming ? aimVec.x : 0,
            aimY: isAiming ? aimVec.y : 0,
            fire: isFiring,
            superBtn: this.superPressed,
            gadgetBtn: this.gadgetPressed,
            // We simulate bumper presses by tapping specific zones in WeaponSelect if needed
            connected: true
        };
    }

    public isAutoAimTap(): boolean {
        return this.autoAimBurst && !this.rightJoy.active;
    }

    public render(ctx: CanvasRenderingContext2D) {
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

        // Super
        ctx.beginPath();
        ctx.arc(this.superCenter.x, this.superCenter.y, this.superCenter.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.superPressed ? 'rgba(241, 196, 15, 0.8)' : 'rgba(241, 196, 15, 0.4)';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText('SUPER', this.superCenter.x, this.superCenter.y);

        // Gadget
        ctx.beginPath();
        ctx.arc(this.gadgetCenter.x, this.gadgetCenter.y, this.gadgetCenter.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.gadgetPressed ? 'rgba(46, 204, 113, 0.8)' : 'rgba(46, 204, 113, 0.4)';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText('GADGET', this.gadgetCenter.x, this.gadgetCenter.y);

        ctx.restore();
    }
}
