// Simple Event Emitter for internal game events
export class EventEmitter {
    private events: Record<string, Function[]> = {};

    on(event: string, listener: Function) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    emit(event: string, ...args: any[]) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(...args));
        }
    }
}

// Base State interface
export interface GameState {
    enter(): void;
    update(dt: number): void;
    render(ctx: CanvasRenderingContext2D): void;
    exit(): void;
}
