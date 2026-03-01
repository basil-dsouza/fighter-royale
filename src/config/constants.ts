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

  GADGET_COOLDOWN_SECS: 11,
  TURRET_HEALTH: 1500,
  TURRET_DAMAGE: 450,
  TURRET_FIRE_RATE_SECS: 1.5,

  POWER_BOX_HEALTH: 3000,
  POWER_BUFF_PERCENT: 0.15,
};
