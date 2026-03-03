export const CONFIG = {
  // Engine
  TARGET_FPS: 60,

  // Game World and Scale
  BLOCK_SIZE: 64, // The size of one logical block in the grid (roughly character height)

  // Map dimensions (in blocks)
  MAP_WIDTH: 30,
  MAP_HEIGHT: 30,

  // Player Stats
  PLAYER_MAX_HEALTH: 5000,
  PLAYER_SPEED: 5, // units per second (will be scaled)
  HEALTH_REGEN_DELAY: 3000, // ms out of combat before regen starts
  HEALTH_REGEN_RATE: 100, // hp per tick/second

  // Weapons (Base Definitions)
  WEAPONS: {
    SPREAD: { damage: 500, reloadSecs: 1.5, type: 'spread', rangeBlocks: 6 },
    SHOCK: { damage: 480, reloadSecs: 1.7, type: 'shock', stunDur: 0.25, rangeBlocks: 8 },
    RAIL: { damage: 1000, reloadSecs: 2.35, type: 'rail', rangeBlocks: 16 },
    LASER: { damage: 250, reloadSecs: 0.9, type: 'laser', rangeBlocks: 12 },
  },

  // Interactions
  SUPER_HITS_REQUIRED: 10,
  SUPER_DAMAGE: 500,
  SUPER_DURATION_SECS: 15,

  GADGETS: {
    TURRET: { health: 1500, damage: 450, cooldownSecs: 11, fireRateSecs: 1.5 },
    HEAL_STATION: { health: 1000, cooldownSecs: 15, tickRateSecs: 1, radiusBlocks: 4, healAmount: 200 },
    PROXIMITY_MINE: { health: 100, damage: 1500, cooldownSecs: 12, triggerRadiusBlocks: 2, explosiveRadiusBlocks: 3 }
  },

  POWER_BOX_HEALTH: 3000,
  POWER_BUFF_PERCENT: 0.15,
};
