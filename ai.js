// ========================================
// AI OPPONENT SYSTEM
// ========================================

class AIOpponent {
    constructor(game, difficulty = CONFIG.AI_DIFFICULTY) {
        this.game = game;
        this.difficulty = difficulty;
        this.isTyping = false;
        this.currentTarget = null;
        this.typingTimer = null;
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }
    
    startTurn(word) {
        if (this.isTyping) return;
        
        this.isTyping = true;
        this.currentTarget = word;
        
        // Calculate typing delay based on difficulty and word length
        const speeds = CONFIG.AI_TYPING_SPEED[this.difficulty];
        const baseDelay = speeds.min + Math.random() * (speeds.max - speeds.min);
        const wordLengthFactor = word.length * 100; // Extra time per character
        const totalDelay = baseDelay + wordLengthFactor;
        
        // Schedule AI completion
        this.typingTimer = setTimeout(() => {
            this.completeWord();
        }, totalDelay);
    }
    
    completeWord() {
        if (!this.isTyping || !this.currentTarget) return;
        
        // Determine if AI makes an error based on difficulty
        const errorRate = CONFIG.AI_ERROR_RATE[this.difficulty];
        const madeError = Math.random() < errorRate;
        
        const isCritical = !madeError && Math.random() > 0.5; // 50% critical chance if no error
        
        // Calculate damage
        let damage = CONFIG.BASE_DAMAGE;
        if (isCritical) {
            damage = Math.floor(damage * CONFIG.CRITICAL_MULTIPLIER);
        }
        
        // Apply damage to player
        if (!madeError) {
            this.game.dealDamage(1, damage, isCritical); // Player 1 takes damage
            this.game.addCombatLog('player2', this.currentTarget, isCritical);
        }
        
        this.isTyping = false;
        this.currentTarget = null;
        
        // Continue AI typing if game is still active
        if (this.game.isActive && !this.game.gameOver) {
            setTimeout(() => {
                const nextWord = this.game.wordManager.getRandomWord();
                this.startTurn(nextWord);
            }, 1000 + Math.random() * 1000); // 1-2 second delay between words
        }
    }
    
    stop() {
        this.isTyping = false;
        this.currentTarget = null;
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
    }
    
    reset() {
        this.stop();
    }
}
