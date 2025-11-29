// ========================================
// GAME CONFIGURATION
// ========================================

const CONFIG = {
    // Game Balance
    BASE_DAMAGE: 10,
    CRITICAL_MULTIPLIER: 1.5,
    PLAYER_MAX_HEALTH: 100,
    
    // Timing
    WORD_DISPLAY_DELAY: 500, // ms before new word appears
    AI_TYPING_SPEED: {
        easy: { min: 2000, max: 4000 },
        medium: { min: 1000, max: 2500 },
        hard: { min: 500, max: 1500 }
    },
    
    // Visual Effects
    PARTICLE_COUNT: 30,
    PARTICLE_SPREAD: 100,
    
    // Word Pool Size
    WORD_QUEUE_SIZE: 3,
    
    // Multiplayer
    WEBSOCKET_URL: 'wss://neon-fighter-production.up.railway.app', // WebSocket server URL
    RECONNECT_DELAY: 3000,
    
    // Difficulty Settings
    AI_DIFFICULTY: 'medium', // 'easy', 'medium', 'hard'
    AI_ERROR_RATE: {
        easy: 0.3,    // 30% chance of error
        medium: 0.15, // 15% chance of error
        hard: 0.05    // 5% chance of error
    }
};

// Ability Types (for future expansion)
const ABILITIES = {
    flare: { damage: 10, color: '#ff6600', description: 'Basic attack' },
    pulse: { damage: 12, color: '#00ffff', description: 'Energy pulse' },
    fracture: { damage: 15, color: '#ff00ff', description: 'Armor break' },
    spire: { damage: 18, color: '#ffff00', description: 'Lightning strike' },
    nova: { damage: 20, color: '#9d00ff', description: 'Explosive blast' },
    surge: { damage: 13, color: '#00ff00', description: 'Power surge' },
    void: { damage: 16, color: '#6600ff', description: 'Dark void' },
    blaze: { damage: 14, color: '#ff3300', description: 'Fire attack' }
};
