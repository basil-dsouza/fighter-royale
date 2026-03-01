# Game Design Document: Fighter Royale

## 1. Overview
**Title:** Fighter Royale
**Genre:** Isometric 2D Arena Shooter
**Platform:** Web (HTML5 Canvas / JavaScript / TypeScript)
**Input:** Xbox Controllers
**Visual Style:** Bright, colorful, and visually impressive aesthetics from an isometric perspective.
**Goal:** Last Man Standing (Eliminate the other player).

## 2. Core Gameplay
- **Players:** 2 to 4 players controlled via Xbox controllers in a **Split-Screen** layout.
- **Match Flow:** Players start at the Home Screen -> Player Count Selection -> Weapon Selection -> Match in a randomly chosen map.
- **Health System:**
  - Base Health: 5000 HP.
  - Regeneration: Health recharges if the player is out of combat (not shooting and not taking damage for 3 seconds).
- **Scale:** 1 "Block" is roughly equivalent to the height of a character.

## 3. Combat Mechanics & Controls
- **Movement & Aiming:** Twin-stick shooter style. Left Stick moves the character, Right Stick aims independently.
- **Ammo & Reloading:**
  - A reload bar visualization with 3 shot slots.
  - Automatically refills 1 bar every 1.5 seconds.
- **Primary Attack (Left Trigger):**
  - Consumes 1 ammo slot.
  - Behavior depends on the selected weapon.
  - Base shots travel ~5 blocks before disappearing.
- **Super Ability (Button 'B'):**
  - **Charge Condition:** Hit the enemy 10 times.
  - **Cost:** Does not consume ammo.
  - **Effect:** Deals 500 damage. Activates a 15-second buff that removes reload requirements. During this time, the weapon operates in semi-automatic mode (1 shot per click).
- **Gadget (Button 'X'):**
  - **Effect:** Places a mini-turret on the ground.
  - **Turret Specs:** 1500 HP. Automatically aims at the enemy but tracking speed is slower than character movement. Deals 450 damage per shot. Fire rate is 1 shot every 1.5 seconds. Fires continuously until destroyed or a new turret is placed.
  - **Cooldown:** 10-11 seconds.

## 4. Weapons
| Weapon | Damage | Reload Time (per bar) | Special Attributes |
| :--- | :--- | :--- | :--- |
| **Spread gun (Default)** | 500 | 1.50 secs | Fires 3 shots spread like a shotgun. Semi-realistic appearance, not too large. |
| **Shock gun** | 480 | 1.70 secs | Stuns the enemy for 0.25 seconds. |
| **Rail gun** | 1000 | 2.35 secs | High damage, slow reload. |
| **Laser gun** | 250 | 0.90 secs | Low damage, fast reload. |

## 5. Environment & Maps
- **Map Selection:** 4 handcrafted medium-sized maps. 1 is randomly selected for each match.
- **Map Features:**
  - **Walls:** Indestructible. Serve as boundaries and internal cover. Cannot shoot through.
  - **Bushes:** Hide players inside them. Visible to enemies when within 4-5 blocks distance.
  - **Water:** Blocks movement but does not block projectiles (can shoot across). Grouped in patches of ~15 blocks.
  - **Power Boxes:** Have 3000 HP. When destroyed, they drop a token granting a stackable 15% damage buff for the rest of the match.

## 6. User Interface
- **Home Screen:** Displays the title "Fighter Royale" prominently.
- **Player Count Selection:** A menu to select how many players (2, 3, or 4) are participating.
- **Weapon Selection Screen:** Shows the 4 available guns.
- **In-Game HUD:**
  - Gadget ready state/cooldown icon.
  - Super charge/ready icon.
  - Reload bar (3 slots).
  - Health bar.
  - Bright and colorful aesthetic.
