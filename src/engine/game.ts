import type { GameState } from './core';
import { InputManager } from './input';
import { TouchInputManager } from './TouchInputManager';

export class Game {
    public canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private lastTime: number = 0;
    private isRunning: boolean = false;
    private rafId: number = 0;

    private currentState: GameState | null = null;

    // Shared state
    public numPlayers: number = 2; // Default to 2, changeable in menu
    public numBots: number = 0;
    public gameMode: 'FFA' | 'TEAM' = 'FFA';
    public botStyle: 'NORMAL' | 'AGGRESSIVE' | 'DEFENSIVE' | 'RANDOM' = 'NORMAL';
    public playerWeapons: string[] = ['SPREAD', 'SPREAD', 'SPREAD', 'SPREAD'];
    public playerGadgets: string[] = ['TURRET', 'TURRET', 'TURRET', 'TURRET'];
    public playerTeams: number[] = [0, 1, 0, 1]; // 0=Red, 1=Blue, etc.
    public isPhoneMode: boolean = false;

    constructor(canvasId: string) {
        const el = document.getElementById(canvasId);
        if (!el || !(el instanceof HTMLCanvasElement)) {
            throw new Error(`Cannot find canvas element with id: ${canvasId}`);
        }
        this.canvas = el;
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("Could not get 2D context from canvas");
        }
        this.ctx = context;

        // Resize handler
        window.addEventListener('resize', this.onResize.bind(this));
        this.onResize();

        // Initialize touch manager
        TouchInputManager.initialize(this.canvas);
    }

    private onResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    public changeState(newState: GameState) {
        if (this.currentState) {
            this.currentState.exit();
        }
        this.currentState = newState;
        this.currentState.enter();
    }

    public start(initialState: GameState) {
        this.changeState(initialState);
        this.isRunning = true;
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(this.loop.bind(this));
    }

    public stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.rafId);
    }

    private loop(timestamp: number) {
        if (!this.isRunning) return;

        // Calculate delta time in seconds
        let dt = (timestamp - this.lastTime) / 1000;

        // Cap dt to prevent massive jumps if tab is backgrounded
        if (dt > 0.1) dt = 0.1;
        this.lastTime = timestamp;

        // Update Input
        InputManager.getInstance().update();

        // Update State
        if (this.currentState) {
            this.currentState.update(dt);

            // Clear canvas before rendering state
            this.ctx.fillStyle = '#000000'; // Base background
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.currentState.render(this.ctx);
        }

        this.rafId = requestAnimationFrame(this.loop.bind(this));
    }
}
