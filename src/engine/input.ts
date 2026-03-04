export interface PlayerInput {
    moveX: number;
    moveY: number;
    aimX: number;
    aimY: number;
    fire: boolean;
    superBtn: boolean;
    gadgetBtn: boolean;
    gadgetPrev: boolean;
    gadgetNext: boolean;
    connected: boolean;
}

import { TouchInputManager } from './TouchInputManager';

export class InputManager {
    private static instance: InputManager;
    private inputStates: PlayerInput[] = [];
    public isPhoneMode: boolean = false;

    private constructor() {
        for (let i = 0; i < 4; i++) {
            this.inputStates.push({
                moveX: 0, moveY: 0, aimX: 0, aimY: 0,
                fire: false, superBtn: false, gadgetBtn: false,
                gadgetPrev: false, gadgetNext: false,
                connected: false
            });
        }

        window.addEventListener("gamepadconnected", (e) => {
            console.log(`Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}.`);
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            console.log(`Gamepad disconnected from index ${e.gamepad.index}: ${e.gamepad.id}.`);
        });
    }

    static getInstance(): InputManager {
        if (!InputManager.instance) {
            InputManager.instance = new InputManager();
        }
        return InputManager.instance;
    }

    private applyDeadzone(value: number, deadzone = 0.2): number {
        if (Math.abs(value) < deadzone) return 0;
        return (value - Math.sign(value) * deadzone) / (1 - deadzone);
    }

    update() {
        // The Gamepad API needs to be polled every frame
        const connectedPads = navigator.getGamepads ? navigator.getGamepads() : [];

        for (let i = 0; i < 4; i++) {
            const pad = connectedPads[i];
            const state = this.inputStates[i];

            if (pad) {
                state.connected = true;

                // Standard Xbox Controller mapping:
                // Axes 0, 1 = Left Stick (X, Y)
                // Axes 2, 3 = Right Stick (X, Y)
                // Buttons 6 = Left Trigger or 7 = Right Trigger (typically Fire is RT, but GDD says Left Trigger. We'll map button 6).
                // Buttons 2 = X (Gadget)
                // Buttons 1 = B (Super)

                state.moveX = this.applyDeadzone(pad.axes[0]);
                state.moveY = this.applyDeadzone(pad.axes[1]);
                state.aimX = this.applyDeadzone(pad.axes[2]);
                state.aimY = this.applyDeadzone(pad.axes[3]);

                // Map triggers (which might be analog) to boolean
                state.fire = pad.buttons[6]?.pressed || pad.buttons[7]?.value > 0.5; // Accept either trigger for ease
                state.gadgetBtn = pad.buttons[2]?.pressed;
                state.superBtn = pad.buttons[1]?.pressed;
                state.gadgetPrev = pad.buttons[4]?.pressed;
                state.gadgetNext = pad.buttons[5]?.pressed;

            } else {
                // Reset if disconnected
                state.connected = false;
                state.moveX = 0; state.moveY = 0; state.aimX = 0; state.aimY = 0;
                state.fire = false; state.gadgetBtn = false; state.superBtn = false;
                state.gadgetPrev = false; state.gadgetNext = false;
            }
        }
    }

    getInputState(playerIndex: number): PlayerInput {
        const state = { ...this.inputStates[playerIndex] };

        if (this.isPhoneMode && playerIndex === 0) {
            try {
                const touchInput = TouchInputManager.getInstance().getTouchInput();

                // Override Controller state with phone state if connected
                if (touchInput.connected) {
                    state.moveX = touchInput.moveX || state.moveX;
                    state.moveY = touchInput.moveY || state.moveY;
                    state.aimX = touchInput.aimX || 0;
                    state.aimY = touchInput.aimY || 0;
                    state.fire = touchInput.fire || false;
                    state.superBtn = touchInput.superBtn || false;
                    state.gadgetBtn = touchInput.gadgetBtn || false;
                    state.connected = true;
                }
            } catch (e) {
                // Not initialized
            }
        }

        return state;
    }

    setBotInput(playerIndex: number, fakeState: Partial<PlayerInput>): void {
        this.inputStates[playerIndex] = { ...this.inputStates[playerIndex], ...fakeState };
    }

    // Utility to check how many controllers are connected for the lobby
    getConnectedCount(): number {
        return this.inputStates.filter(s => s.connected).length;
    }
}
