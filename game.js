// ========================================
// MAIN GAME ENGINE
// ========================================

class Game {
    constructor() {
        this.mode = null; // 'solo' or 'multiplayer'
        this.isActive = false;
        this.gameOver = false;
        
        // Game state
        this.player1Health = CONFIG.PLAYER_MAX_HEALTH;
        this.player2Health = CONFIG.PLAYER_MAX_HEALTH;
        this.player1Name = 'PLAYER 1';
        this.player2Name = 'AI OPPONENT';
        
        // Word tracking
        this.currentInput = '';
        this.isCritical = true; // Starts as critical, becomes false on first error
        this.wordsTyped = 0;
        this.criticalHits = 0;
        this.startTime = null;
        
        // ELO tracking for multiplayer
        this.lastEloChange = undefined;
        this.lastElo = undefined;
        
        // Systems
        this.wordManager = new WordManager();
        this.particleSystem = new ParticleSystem();
        this.soundManager = new SoundManager();
        this.themeManager = new ThemeManager();
        this.timedMode = null;
        this.aiOpponent = null;
        this.multiplayerClient = null;
        
        // Connect theme manager to particle system
        this.particleSystem.setThemeManager(this.themeManager);
        
        // DOM Elements
        this.elements = {
            currentWord: document.getElementById('current-word'),
            typingInput: document.getElementById('typing-input'),
            typingFeedback: document.getElementById('typing-feedback'),
            player1Health: document.getElementById('player1-health'),
            player2Health: document.getElementById('player2-health'),
            player1HealthText: document.getElementById('player1-health-text'),
            player2HealthText: document.getElementById('player2-health-text'),
            player1Name: document.getElementById('player1-name'),
            player2Name: document.getElementById('player2-name'),
            player2Character: document.getElementById('player2-character'),
            combatLog: document.getElementById('combat-log'),
            wordQueue: document.getElementById('word-queue'),
            gameOverOverlay: document.getElementById('game-over-overlay'),
            gameOverTitle: document.getElementById('game-over-title'),
            gameOverStats: document.getElementById('game-over-stats'),
            nextWordPreview: document.getElementById('next-word-preview')
        };
        
        this.setupEventListeners();
    }
    
    startTimedMode() {
        // Stop any existing timed mode instance
        if (this.timedMode && this.timedMode.isActive) {
            this.timedMode.stopTimer();
            this.timedMode.isActive = false;
        }
        
        this.mode = 'timed';
        this.timedMode = new TimedMode(this);
        this.isActive = true;
        this.timedMode.start();
    }
    
    setupEventListeners() {
        // Typing input handler
        this.elements.typingInput.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });
        
        // Enter key handler - now disabled (auto-complete handles it)
        this.elements.typingInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent default behavior
                // Do nothing - auto-complete handles word completion
            }
        });
    }
    
    startSoloGame() {
        // Stop any existing AI opponent
        if (this.aiOpponent) {
            this.aiOpponent.stopTyping();
        }
        
        this.mode = 'solo';
        this.player2Name = 'AI OPPONENT';
        this.aiOpponent = new AIOpponent(this);
        this.initGame();
        
        // Start AI after a short delay
        setTimeout(() => {
            const firstWord = this.wordManager.getRandomWord();
            this.aiOpponent.startTurn(firstWord);
        }, 2000);
    }
    
    startMultiplayerGame(playerName, opponentName) {
        this.mode = 'multiplayer';
        this.player1Name = playerName;
        this.player2Name = opponentName;
        this.initGame();
    }
    
    initGame() {
        this.isActive = true;
        this.gameOver = false;
        this.player1Health = CONFIG.PLAYER_MAX_HEALTH;
        this.player2Health = CONFIG.PLAYER_MAX_HEALTH;
        this.wordsTyped = 0;
        this.criticalHits = 0;
        this.startTime = Date.now();
        
        // Reset systems
        this.wordManager.reset();
        this.particleSystem.clear();
        
        // Update UI
        this.elements.player1Name.textContent = this.player1Name;
        this.elements.player2Name.textContent = this.player2Name;
        this.updateHealth(1, this.player1Health);
        this.updateHealth(2, this.player2Health);
        this.elements.combatLog.innerHTML = '';
        
        // Apply current theme to game elements
        this.themeManager.applyTheme();
        
        // Display first word
        this.displayNextWord();
        
        // Focus input
        this.elements.typingInput.value = '';
        this.elements.typingInput.focus();
        this.elements.typingFeedback.textContent = '';
        
        this.addCombatLog('system', 'FIGHT START!');
        
        // Play round start sound
        this.soundManager.play('roundStart');
        
        // Start background music
        this.soundManager.startBackgroundMusic();
    }
    
    displayNextWord() {
        const word = this.wordManager.getNextWord();
        const nextWord = this.wordManager.getNextWordPreview();
        
        this.elements.currentWord.textContent = word.toUpperCase();
        
        // Update next word preview if element exists
        if (this.elements.nextWordPreview) {
            this.elements.nextWordPreview.textContent = 'NEXT: ' + nextWord.toUpperCase();
        }
        
        this.currentInput = '';
        this.isCritical = true;
        
        // Update word queue display
        this.updateWordQueue();
    }
    
    updateWordQueue() {
        const queue = this.wordManager.getQueue();
        this.elements.wordQueue.innerHTML = '';
        queue.forEach(word => {
            const item = document.createElement('div');
            item.className = 'word-queue-item';
            item.textContent = word.toUpperCase();
            this.elements.wordQueue.appendChild(item);
        });
    }
    
    handleInput(value) {
        if (!this.isActive || this.gameOver) return;
        
        this.currentInput = value.toLowerCase();
        const targetWord = this.wordManager.getCurrentWord();
        
        // Check if input exactly matches the word - auto-complete!
        if (this.currentInput === targetWord) {
            this.completeWord();
            return;
        }
        
        // Check if input matches the start of the word
        if (targetWord.startsWith(this.currentInput)) {
            this.elements.typingInput.classList.remove('error');
            this.elements.typingInput.classList.add('correct');
            
            // Play typing sound for correct character
            if (this.currentInput.length > 0) {
                this.soundManager.play('typing');
            }
        } else {
            this.elements.typingInput.classList.remove('correct');
            this.elements.typingInput.classList.add('error');
            this.isCritical = false; // Any mistake removes critical status
            
            // Play error sound
            if (this.currentInput.length > 0) {
                this.soundManager.play('error');
            }
        }
    }
    
    completeWord() {
        if (!this.isActive || this.gameOver) return;
        
        const targetWord = this.wordManager.getCurrentWord();
        
        // Correct word!
        this.wordsTyped++;
        
        // Calculate damage
        let damage = CONFIG.BASE_DAMAGE;
        if (this.isCritical) {
            damage = Math.floor(damage * CONFIG.CRITICAL_MULTIPLIER);
            this.criticalHits++;
            this.elements.typingFeedback.textContent = '⚡ CRITICAL HIT! ⚡';
            this.elements.typingFeedback.className = 'typing-feedback critical';
            
            // Play critical hit sound
            this.soundManager.play('critical');
        } else {
            this.elements.typingFeedback.textContent = '✓ HIT!';
            this.elements.typingFeedback.className = 'typing-feedback';
            
            // Play normal hit sound
            this.soundManager.play('hit');
        }
        
        // Deal damage to opponent
        this.dealDamage(2, damage, this.isCritical);
        
        // Add to combat log
        this.addCombatLog('player1', targetWord, this.isCritical);
        
        // Send to multiplayer if in multiplayer mode
        if (this.mode === 'multiplayer' && this.multiplayerClient) {
            this.multiplayerClient.sendAction(targetWord, this.isCritical, damage);
        }
        
        // Clear input immediately and show next word instantly
        this.elements.typingInput.value = '';
        this.elements.typingInput.classList.remove('correct', 'error');
        this.currentInput = '';
        this.isCritical = true; // Reset for next word
        
        // Display next word immediately (no delay)
        if (!this.gameOver) {
            this.displayNextWord();
        }
        
        // Clear feedback after a brief moment
        setTimeout(() => {
            this.elements.typingFeedback.textContent = '';
        }, 500);
    }
    
    dealDamage(targetPlayer, damage, isCritical = false) {
        // targetPlayer: 1 = player1, 2 = player2
        if (targetPlayer === 1) {
            this.player1Health = Math.max(0, this.player1Health - damage);
            this.updateHealth(1, this.player1Health);
            
            // Play damage sound
            this.soundManager.play('damage');
            
            // Visual effects
            const targetElement = this.elements.player2Character;
            if (isCritical) {
                this.particleSystem.createCriticalEffect(targetElement, '#ff00ff');
            } else {
                this.particleSystem.createHitEffect(targetElement, '#ff00ff');
            }
            
            if (this.player1Health <= 0) {
                this.endGame(false);
            }
        } else {
            this.player2Health = Math.max(0, this.player2Health - damage);
            this.updateHealth(2, this.player2Health);
            
            // Visual effects
            const targetElement = document.getElementById('player2-character');
            if (isCritical) {
                this.particleSystem.createCriticalEffect(targetElement, '#00ffff');
            } else {
                this.particleSystem.createHitEffect(targetElement, '#00ffff');
            }
            
            if (this.player2Health <= 0) {
                this.endGame(true);
            }
        }
    }
    
    updateHealth(player, health) {
        const percentage = (health / CONFIG.PLAYER_MAX_HEALTH) * 100;
        
        if (player === 1) {
            this.elements.player1Health.style.width = percentage + '%';
            this.elements.player1HealthText.textContent = Math.max(0, health);
        } else {
            this.elements.player2Health.style.width = percentage + '%';
            this.elements.player2HealthText.textContent = Math.max(0, health);
        }
    }
    
    addCombatLog(player, message, isCritical = false) {
        const entry = document.createElement('div');
        entry.className = `combat-log-entry ${player}`;
        if (isCritical) entry.classList.add('critical');
        
        let prefix = '';
        if (player === 'player1') prefix = `${this.player1Name}: `;
        else if (player === 'player2') prefix = `${this.player2Name}: `;
        
        entry.textContent = prefix + message.toUpperCase() + (isCritical ? ' [CRITICAL!]' : '');
        
        this.elements.combatLog.appendChild(entry);
        this.elements.combatLog.scrollTop = this.elements.combatLog.scrollHeight;
    }
    
    endGame(playerWon) {
        this.gameOver = true;
        this.isActive = false;
        
        // Stop AI if in solo mode
        if (this.aiOpponent) {
            this.aiOpponent.stop();
        }
        
        // Play victory or defeat sound
        if (playerWon) {
            this.soundManager.play('victory');
        } else {
            this.soundManager.play('defeat');
        }
        
        // Calculate stats
        const duration = Math.floor((Date.now() - this.startTime) / 1000);
        const accuracy = this.wordsTyped > 0 ? 
            Math.floor((this.criticalHits / this.wordsTyped) * 100) : 0;
        
        // Show game over screen
        this.elements.gameOverTitle.textContent = playerWon ? 'VICTORY' : 'DEFEAT';
        this.elements.gameOverTitle.className = playerWon ? 'victory' : 'defeat';
        
        let statsHTML = `
            <div>Words Typed: ${this.wordsTyped}</div>
            <div>Critical Hits: ${this.criticalHits}</div>
            <div>Accuracy: ${accuracy}%</div>
            <div>Duration: ${duration}s</div>
        `;
        
        // Add ELO change for multiplayer matches
        console.log('🎮 Checking ELO display:', {
            mode: this.mode,
            lastEloChange: this.lastEloChange,
            lastElo: this.lastElo
        });
        
        if (this.mode === 'multiplayer' && this.lastEloChange !== undefined) {
            console.log('✅ Adding ELO to game over screen');
            const eloChangeText = this.lastEloChange > 0 ? `+${this.lastEloChange}` : this.lastEloChange;
            const eloColor = this.lastEloChange > 0 ? 'var(--neon-green)' : 'var(--neon-orange)';
            statsHTML += `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid rgba(255,255,255,0.2);">
                    <div style="font-size: 1.3em; color: ${eloColor};">ELO: ${eloChangeText}</div>
                    <div style="font-size: 0.9em; opacity: 0.8;">New Rating: ${this.lastElo}</div>
                </div>
            `;
        } else {
            console.log('❌ Not showing ELO:', this.mode !== 'multiplayer' ? 'Not multiplayer mode' : 'ELO data not available');
        }
        
        this.elements.gameOverStats.innerHTML = statsHTML;
        
        // Show Play Again button only for timed mode
        const playAgainBtn = document.getElementById('play-again-btn');
        if (this.mode === 'timed') {
            playAgainBtn.style.display = '';
        } else {
            playAgainBtn.style.display = 'none';
        }
        
        this.elements.gameOverOverlay.classList.remove('hidden');
        
        // Send to multiplayer if needed
        if (this.mode === 'multiplayer' && this.multiplayerClient) {
            this.multiplayerClient.sendGameOver(playerWon, duration);
        }
    }
    
    reset() {
        this.isActive = false;
        this.gameOver = false;
        this.currentInput = '';
        this.wordsTyped = 0;
        this.criticalHits = 0;
        this.lastEloChange = undefined;
        this.lastElo = undefined;
        
        if (this.aiOpponent) {
            this.aiOpponent.reset();
        }
        
        this.particleSystem.clear();
        this.wordManager.reset();
    }
}
