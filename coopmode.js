// ========================================
// CO-OP MODE - TEAM VS BOSS
// ========================================

class CoopMode {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.bossHealth = CONFIG.BOSS_MAX_HEALTH;
        this.teamHealth = CONFIG.COOP_TEAM_MAX_HEALTH;
        this.bossTypingTimer = null;
        this.bossAttackDelay = CONFIG.BOSS_ATTACK_DELAY;
        
        // Player tracking
        this.player1Active = true;
        this.player2Active = true;
        this.player1Word = '';
        this.player2Word = '';
        this.player1Input = '';
        this.player2Input = '';
        this.player1Critical = true;
        this.player2Critical = true;
        
        // Stats
        this.totalDamageDealt = 0;
        this.criticalHits = 0;
        this.bossAttacksBlocked = 0;
        
        // DOM elements
        this.elements = {
            bossHealth: document.getElementById('coop-boss-health'),
            bossHealthText: document.getElementById('coop-boss-health-text'),
            teamHealth: document.getElementById('coop-team-health'),
            teamHealthText: document.getElementById('coop-team-health-text'),
            player1Word: document.getElementById('coop-player1-word'),
            player2Word: document.getElementById('coop-player2-word'),
            player1Input: document.getElementById('coop-player1-input'),
            player2Input: document.getElementById('coop-player2-input'),
            player1Feedback: document.getElementById('coop-player1-feedback'),
            player2Feedback: document.getElementById('coop-player2-feedback'),
            bossName: document.getElementById('coop-boss-name'),
            bossStatus: document.getElementById('coop-boss-status')
        };
        
        // Verify all elements exist
        const missingElements = [];
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element) {
                missingElements.push(key);
            }
        }
        if (missingElements.length > 0) {
            console.error('❌ Co-op mode missing elements:', missingElements);
        }
        
        // Setup input handlers once
        this.setupInputHandlers();
    }
    
    start() {
        this.isActive = true;
        this.bossHealth = CONFIG.BOSS_MAX_HEALTH;
        this.teamHealth = CONFIG.COOP_TEAM_MAX_HEALTH;
        this.totalDamageDealt = 0;
        this.criticalHits = 0;
        this.bossAttacksBlocked = 0;
        
        // Reset game state
        this.game.wordManager.reset();
        this.player1Critical = true;
        this.player2Critical = true;
        
        // Assign initial words
        this.assignNewWords();
        
        // Update UI
        this.updateHealthBars();
        this.elements.bossName.textContent = 'MEGA BOSS';
        this.elements.bossStatus.textContent = 'ACTIVE';
        
        // Enable inputs
        this.elements.player1Input.disabled = false;
        this.elements.player2Input.disabled = false;
        this.elements.player1Input.value = '';
        this.elements.player2Input.value = '';
        
        // Auto-focus player 1 input so typing can start immediately
        setTimeout(() => {
            this.elements.player1Input.focus();
        }, 100);
        
        // Start boss attack cycle
        this.scheduleBossAttack();
        
        console.log('🤝 Co-op mode started!');
    }
    
    setupInputHandlers() {
        if (!this.elements.player1Input || !this.elements.player2Input) {
            console.error('❌ Co-op input elements not found');
            return;
        }
        
        // Player 1 input
        this.elements.player1Input.addEventListener('input', (e) => {
            this.player1Input = e.target.value.toLowerCase();
            this.checkPlayer1Word();
        });
        
        // Player 2 input
        this.elements.player2Input.addEventListener('input', (e) => {
            this.player2Input = e.target.value.toLowerCase();
            this.checkPlayer2Word();
        });
    }
    
    assignNewWords() {
        // Get two different words
        this.player1Word = this.game.wordManager.getNextWord();
        do {
            this.player2Word = this.game.wordManager.getNextWord();
        } while (this.player2Word === this.player1Word);
        
        this.elements.player1Word.textContent = this.player1Word;
        this.elements.player2Word.textContent = this.player2Word;
        
        // Reset critical status
        this.player1Critical = true;
        this.player2Critical = true;
    }
    
    checkPlayer1Word() {
        const target = this.player1Word;
        const input = this.player1Input;
        
        // Check if input matches the start of the word
        if (input.length > 0) {
            if (target.startsWith(input)) {
                // Correct so far
                this.elements.player1Input.classList.remove('error');
                this.elements.player1Input.classList.add('correct');
                this.elements.player1Feedback.textContent = '';
                
                // Check if word is complete
                if (input === target) {
                    this.player1CompleteWord();
                }
            } else {
                // Error detected
                this.elements.player1Input.classList.remove('correct');
                this.elements.player1Input.classList.add('error');
                this.player1Critical = false;
                this.elements.player1Feedback.textContent = '❌';
                this.game.soundManager.playErrorSound();
            }
        } else {
            this.elements.player1Input.classList.remove('correct', 'error');
            this.elements.player1Feedback.textContent = '';
        }
    }
    
    checkPlayer2Word() {
        const target = this.player2Word;
        const input = this.player2Input;
        
        // Check if input matches the start of the word
        if (input.length > 0) {
            if (target.startsWith(input)) {
                // Correct so far
                this.elements.player2Input.classList.remove('error');
                this.elements.player2Input.classList.add('correct');
                this.elements.player2Feedback.textContent = '';
                
                // Check if word is complete
                if (input === target) {
                    this.player2CompleteWord();
                }
            } else {
                // Error detected
                this.elements.player2Input.classList.remove('correct');
                this.elements.player2Input.classList.add('error');
                this.player2Critical = false;
                this.elements.player2Feedback.textContent = '❌';
                this.game.soundManager.playErrorSound();
            }
        } else {
            this.elements.player2Input.classList.remove('correct', 'error');
            this.elements.player2Feedback.textContent = '';
        }
    }
    
    player1CompleteWord() {
        const isCritical = this.player1Critical;
        let damage = CONFIG.BASE_DAMAGE;
        
        if (isCritical) {
            damage = Math.floor(damage * CONFIG.CRITICAL_MULTIPLIER);
            this.criticalHits++;
            this.game.soundManager.playCriticalSound();
            this.elements.player1Feedback.textContent = '💥 CRITICAL!';
        } else {
            this.game.soundManager.playHitSound();
            this.elements.player1Feedback.textContent = '✓ HIT';
        }
        
        // Deal damage to boss
        this.damageBoSS(damage, 1, isCritical);
        
        // Clear input and get new word
        this.elements.player1Input.value = '';
        this.player1Input = '';
        this.player1Critical = true;
        this.player1Word = this.game.wordManager.getNextWord();
        
        // Make sure it's different from player 2's word
        while (this.player1Word === this.player2Word) {
            this.player1Word = this.game.wordManager.getNextWord();
        }
        
        this.elements.player1Word.textContent = this.player1Word;
        this.elements.player1Input.classList.remove('correct', 'error');
        
        setTimeout(() => {
            this.elements.player1Feedback.textContent = '';
        }, 1000);
    }
    
    player2CompleteWord() {
        const isCritical = this.player2Critical;
        let damage = CONFIG.BASE_DAMAGE;
        
        if (isCritical) {
            damage = Math.floor(damage * CONFIG.CRITICAL_MULTIPLIER);
            this.criticalHits++;
            this.game.soundManager.playCriticalSound();
            this.elements.player2Feedback.textContent = '💥 CRITICAL!';
        } else {
            this.game.soundManager.playHitSound();
            this.elements.player2Feedback.textContent = '✓ HIT';
        }
        
        // Deal damage to boss
        this.damageBoSS(damage, 2, isCritical);
        
        // Clear input and get new word
        this.elements.player2Input.value = '';
        this.player2Input = '';
        this.player2Critical = true;
        this.player2Word = this.game.wordManager.getNextWord();
        
        // Make sure it's different from player 1's word
        while (this.player2Word === this.player1Word) {
            this.player2Word = this.game.wordManager.getNextWord();
        }
        
        this.elements.player2Word.textContent = this.player2Word;
        this.elements.player2Input.classList.remove('correct', 'error');
        
        setTimeout(() => {
            this.elements.player2Feedback.textContent = '';
        }, 1000);
    }
    
    damageBoSS(damage, playerNum, isCritical) {
        this.bossHealth = Math.max(0, this.bossHealth - damage);
        this.totalDamageDealt += damage;
        
        // Update health bar
        this.updateHealthBars();
        
        // Create particles at boss position
        const bossHealthBar = this.elements.bossHealth.parentElement;
        const rect = bossHealthBar.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        if (isCritical) {
            this.game.particleSystem.createCriticalHit(x, y);
        } else {
            this.game.particleSystem.createHit(x, y);
        }
        
        // Check if boss is defeated
        if (this.bossHealth <= 0) {
            this.victory();
        }
    }
    
    scheduleBossAttack() {
        if (!this.isActive) return;
        
        this.bossTypingTimer = setTimeout(() => {
            this.bossAttack();
        }, this.bossAttackDelay);
    }
    
    bossAttack() {
        if (!this.isActive) return;
        
        const damage = CONFIG.BOSS_DAMAGE;
        this.teamHealth = Math.max(0, this.teamHealth - damage);
        
        // Visual feedback
        this.elements.bossStatus.textContent = '⚡ ATTACKING!';
        this.game.soundManager.playDamageSound();
        
        // Update health bar
        this.updateHealthBars();
        
        // Flash the team health bar
        this.elements.teamHealth.parentElement.style.animation = 'none';
        setTimeout(() => {
            this.elements.teamHealth.parentElement.style.animation = 'pulse 0.5s';
        }, 10);
        
        setTimeout(() => {
            if (this.isActive) {
                this.elements.bossStatus.textContent = 'ACTIVE';
            }
        }, 500);
        
        // Check if team is defeated
        if (this.teamHealth <= 0) {
            this.defeat();
        } else {
            // Schedule next attack
            this.scheduleBossAttack();
        }
    }
    
    updateHealthBars() {
        // Boss health
        const bossPercent = (this.bossHealth / CONFIG.BOSS_MAX_HEALTH) * 100;
        this.elements.bossHealth.style.width = bossPercent + '%';
        this.elements.bossHealthText.textContent = `${this.bossHealth} / ${CONFIG.BOSS_MAX_HEALTH}`;
        
        // Change boss health bar color based on health
        if (bossPercent > 60) {
            this.elements.bossHealth.style.background = 'linear-gradient(90deg, #ff0000, #ff6600)';
        } else if (bossPercent > 30) {
            this.elements.bossHealth.style.background = 'linear-gradient(90deg, #ff6600, #ffaa00)';
        } else {
            this.elements.bossHealth.style.background = 'linear-gradient(90deg, #ffaa00, #ff0000)';
        }
        
        // Team health
        const teamPercent = (this.teamHealth / CONFIG.COOP_TEAM_MAX_HEALTH) * 100;
        this.elements.teamHealth.style.width = teamPercent + '%';
        this.elements.teamHealthText.textContent = `${this.teamHealth} / ${CONFIG.COOP_TEAM_MAX_HEALTH}`;
        
        // Change team health bar color
        if (teamPercent > 60) {
            this.elements.teamHealth.style.background = 'linear-gradient(90deg, #00ff00, #00ffff)';
        } else if (teamPercent > 30) {
            this.elements.teamHealth.style.background = 'linear-gradient(90deg, #ffff00, #00ff00)';
        } else {
            this.elements.teamHealth.style.background = 'linear-gradient(90deg, #ff6600, #ffff00)';
        }
    }
    
    victory() {
        this.isActive = false;
        clearTimeout(this.bossTypingTimer);
        
        this.elements.player1Input.disabled = true;
        this.elements.player2Input.disabled = true;
        this.elements.bossStatus.textContent = '💀 DEFEATED';
        
        // Play victory sound
        this.game.soundManager.playVictorySound();
        
        // Show victory screen
        setTimeout(() => {
            this.showResults(true);
        }, 1000);
    }
    
    defeat() {
        this.isActive = false;
        clearTimeout(this.bossTypingTimer);
        
        this.elements.player1Input.disabled = true;
        this.elements.player2Input.disabled = true;
        
        // Play defeat sound
        this.game.soundManager.playDefeatSound();
        
        // Show defeat screen
        setTimeout(() => {
            this.showResults(false);
        }, 1000);
    }
    
    showResults(victory) {
        const resultsHtml = `
            <div class="coop-results">
                <h2 class="neon-text">${victory ? '🏆 VICTORY! 🏆' : '💀 DEFEATED 💀'}</h2>
                <div class="coop-stats">
                    <p><span class="stat-label">Total Damage:</span> <span class="stat-value">${this.totalDamageDealt}</span></p>
                    <p><span class="stat-label">Critical Hits:</span> <span class="stat-value">${this.criticalHits}</span></p>
                    <p><span class="stat-label">Boss Remaining HP:</span> <span class="stat-value">${this.bossHealth}</span></p>
                    <p><span class="stat-label">Team HP:</span> <span class="stat-value">${this.teamHealth}</span></p>
                </div>
                <button class="neon-button" id="coop-play-again-btn">PLAY AGAIN</button>
                <button class="neon-button secondary" id="coop-back-to-menu-btn">MAIN MENU</button>
            </div>
        `;
        
        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'coop-results-overlay';
        resultsDiv.innerHTML = resultsHtml;
        document.getElementById('coop-mode-screen').appendChild(resultsDiv);
        
        // Button handlers
        document.getElementById('coop-play-again-btn').addEventListener('click', () => {
            resultsDiv.remove();
            this.start();
        });
        
        document.getElementById('coop-back-to-menu-btn').addEventListener('click', () => {
            resultsDiv.remove();
            document.getElementById('coop-mode-screen').classList.remove('active');
            document.getElementById('main-menu').classList.add('active');
        });
    }
    
    stop() {
        this.isActive = false;
        clearTimeout(this.bossTypingTimer);
        this.elements.player1Input.disabled = true;
        this.elements.player2Input.disabled = true;
    }
}
