# Fighter Royale

A top-down isometric 2D arena shooter built with TypeScript, HTML5 Canvas, and Vite. Designed for 2-4 local players using Xbox Controllers.

## Core Features
*   **Local Multiplayer (Split-Screen):** Supports 2 to 4 concurrent players on a single machine, seamlessly dividing the screen based on the player count.
*   **Twin-Stick Shooter Combat:** Left stick for movement, Right stick for independent aiming. Map physical gamepad inputs to browser HTML5.
*   **Gamepad Support:** Uses the standard HTML5 Gamepad API. (Note: Most browsers require you to press a button on the controller while the game window is focused to recognize the device).
*   **Procedural Maps:** Generates dynamic map borders clustering Walls, Water (blocks movement, allows shooting), and Bushes.
*   **Isometric Engine:** Renders mathematical 2D Cartesian collision logic into an angled ¾-perspective viewpoint built entirely from scratch.
*   **Dynamic Combat States:** Features multiple specialized weapon types (Spread, Laser, Rail, Shock), AI-driven gadget turrets, and a "Super" attack charging system. 
*   **Zero-Dependency Engine:** The core rendering loops, coordinate parsing, entity Component modeling, and state-machine flows are completely vanilla TS. No external heavy game engines are used.

## Pre-requisites

You must have [Node.js](https://nodejs.org/) installed on your machine to build and run this project.

## Local Setup & Development

1. **Install Dependencies**
   Navigate to the project's root folder and install the required packages:
   ```bash
   npm install
   ```

2. **Start the Development Server**
   Spin up the Vite Hot-Module-Replacement server:
   ```bash
   npm run dev
   ```
   *The server will typically start at `http://localhost:5173`. Open this URL in your web browser.*

3. **Running the Tests**
   You can run the Vitest unit tests (asserting math and physics engine logic) using:
   ```bash
   npm run test
   ```

4. **Building for Production**
   If you want to package the TypeScript into optimized static JS and CSS bundles:
   ```bash
   npm run build
   ```

## Controls Architecture

*   **Left Stick (L-Stick):** Move directionally
*   **Right Stick (R-Stick):** Aim directionally
*   **Right Trigger (RT) / Fire Input:** Shoot standard weapon (consumes 1 ammo pip)
*   **Button X (Gadget/Alt):** Deploy Turret
*   **Button B (Super/Confirm):** Activate Super mode (infinite ammo/enhanced damage) or Confirm menu selections.

*(For a more granular breakdown of weapon statistics, mechanics, and design intentions, please reference `game_design_document.md` located in the root of the repository).*
