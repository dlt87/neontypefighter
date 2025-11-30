// ========================================
// CO-OP MODE - TEAM VS BOSS (ONLINE)
// ========================================

class CoopMode {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.bossHealth = CONFIG.BOSS_MAX_HEALTH;
        this.teamHealth = CONFIG.COOP_TEAM_MAX_HEALTH;
        this.maxBossHealth = CONFIG.BOSS_MAX_HEALTH;
        this.maxTeamHealth = CONFIG.COOP_TEAM_MAX_HEALTH;
        
        // WebSocket connection
        this.ws = null;
        this.connected = false;
        this.inQueue = false;
        this.inMatch = false;
        this.playerNumber = 0; // 1 or 2
        this.teammateName = '';
        
        // Player tracking
        this.myWord = '';
        this.myInput = '';
        this.myCritical = true;
        this.teammateWord = '';
        
        // Turn-based system
        this.currentTurn = 1; // Which player's turn (1 or 2)
        this.isMyTurn = false;
        this.currentWord = ''; // The active word being typed
        
        // Stats
        this.totalDamageDealt = 0;
        this.criticalHits = 0;
        this.wordsTyped = 0;
        
        this.setupUI();
        this.connectToServer();
    }
    
    setupUI() {
        // Menu elements
        this.matchmakingMenu = document.getElementById('coop-matchmaking-menu');
        this.matchmakingStatus = document.getElementById('coop-matchmaking-status');
        this.findMatchBtn = document.getElementById('coop-find-match-btn');
        this.cancelMatchBtn = document.getElementById('coop-cancel-match-btn');
        this.backBtn = document.getElementById('coop-back-btn');
        this.playAgainBtn = document.getElementById('coop-play-again-btn');
        this.menuBtn = document.getElementById('coop-menu-btn');
        
        // Countdown elements
        this.countdownOverlay = document.getElementById('coop-countdown-overlay');
        this.teammateFoundText = document.getElementById('coop-teammate-found-text');
        this.teammateNameDisplay = document.getElementById('coop-teammate-name-display');
        this.countdownNumber = document.getElementById('coop-countdown-number');
        
        // Game elements
        this.gameArea = document.getElementById('coop-game-area');
        this.elements = {
            bossHealth: document.getElementById('coop-boss-health'),
            bossHealthText: document.getElementById('coop-boss-health-text'),
            teamHealth: document.getElementById('coop-team-health'),
            teamHealthText: document.getElementById('coop-team-health-text'),
            sharedInput: document.getElementById('coop-shared-input'),
            currentWord: document.getElementById('coop-current-word'),
            typingFeedback: document.getElementById('coop-typing-feedback'),
            turnIndicator: document.getElementById('coop-turn-indicator'),
            turnText: document.getElementById('coop-turn-text'),
            player1Name: document.getElementById('coop-player1-name'),
            player2Name: document.getElementById('coop-player2-name'),
            bossName: document.getElementById('coop-boss-name'),
            bossStatus: document.getElementById('coop-boss-status'),
            gameOver: document.getElementById('coop-game-over'),
            gameOverTitle: document.getElementById('coop-game-over-title'),
            gameOverStats: document.getElementById('coop-game-over-stats')
        };
        
        // Event listeners
        if (this.findMatchBtn) {
            this.findMatchBtn.addEventListener('click', () => this.startMatchmaking());
        }
        if (this.cancelMatchBtn) {
            this.cancelMatchBtn.addEventListener('click', () => this.cancelMatchmaking());
        }
        if (this.backBtn) {
            this.backBtn.addEventListener('click', () => this.returnToMenu());
        }
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => this.playAgain());
        }
        if (this.menuBtn) {
            this.menuBtn.addEventListener('click', () => this.returnToMenu());
        }
        
        console.log('✅ Co-op UI setup complete', {
            gameArea: !!this.gameArea,
            sharedInput: !!this.elements.sharedInput,
            currentWord: !!this.elements.currentWord
        });
    }
    
    startMatchmaking() {
        if (!this.connected) {
            this.matchmakingStatus.innerHTML = `
                <div class="status-icon">⚠️</div>
                <div class="status-text">Connecting to server...</div>
            `;
            setTimeout(() => this.startMatchmaking(), 1000);
            return;
        }
        
        const playerName = window.authClient?.currentUser?.username || 'Player';
        
        this.inQueue = true;
        this.findMatchBtn.classList.add('hidden');
        this.cancelMatchBtn.classList.remove('hidden');
        
        this.matchmakingStatus.innerHTML = `
            <div class="status-icon spinning">🔍</div>
            <div class="status-text">Finding teammate...</div>
        `;
        
        this.send({
            type: 'findCoopMatch',
            playerName: playerName
        });
    }
    
    cancelMatchmaking() {
        this.inQueue = false;
        this.findMatchBtn.classList.remove('hidden');
        this.cancelMatchBtn.classList.add('hidden');
        
        this.matchmakingStatus.innerHTML = `
            <div class="status-icon">🔍</div>
            <div class="status-text">Ready to find a teammate!</div>
        `;
        
        this.send({ type: 'cancelCoopMatch' });
    }
    
    returnToMenu() {
        if (this.inQueue) {
            this.cancelMatchmaking();
        }
        if (this.inMatch) {
            this.send({ type: 'coopGameOver', reason: 'left' });
        }
        this.reset();
        showScreen('main');
    }
    
    playAgain() {
        this.reset();
        this.startMatchmaking();
    }
    
    reset() {
        this.isActive = false;
        this.inQueue = false;
        this.inMatch = false;
        this.playerNumber = 0;
        this.teammateName = '';
        this.totalDamageDealt = 0;
        this.criticalHits = 0;
        this.wordsTyped = 0;
        this.bossHealth = this.maxBossHealth;
        this.teamHealth = this.maxTeamHealth;
        
        // Reset UI
        this.matchmakingMenu.classList.remove('hidden');
        this.gameArea.classList.add('hidden');
        this.countdownOverlay.classList.add('hidden');
        this.elements.gameOver.classList.add('hidden');
        this.findMatchBtn.classList.remove('hidden');
        this.cancelMatchBtn.classList.add('hidden');
        
        this.matchmakingStatus.innerHTML = `
            <div class="status-icon">🔍</div>
            <div class="status-text">Ready to find a teammate!</div>
        `;
    }
    
    connectToServer() {
        if (this.ws && this.connected) {
            console.log('Already connected to server');
            return;
        }
        
        try {
            console.log('Connecting to co-op server:', CONFIG.WEBSOCKET_URL);
            this.ws = new WebSocket(CONFIG.WEBSOCKET_URL);
            
            this.ws.onopen = () => {
                console.log('✅ Connected to co-op server');
                this.connected = true;
                
                // Authenticate if available
                if (window.authClient && window.authClient.currentUser && window.authClient.currentUser.token) {
                    this.send({
                        type: 'authenticate',
                        token: window.authClient.currentUser.token
                    });
                }
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ Co-op WebSocket error:', error);
            };
            
            this.ws.onclose = () => {
                console.log('🔌 Disconnected from co-op server');
                this.connected = false;
                if (this.inMatch) {
                    this.handleTeammateDisconnected();
                }
            };
        } catch (error) {
            console.error('❌ Failed to connect to co-op server:', error);
        }
    }
    
    handleMessage(data) {
        console.log('📨 Co-op message:', data.type, data);
        
        switch (data.type) {
            case 'coopMatchFound':
                this.onMatchFound(data);
                break;
                
            case 'coopQueuePosition':
                this.matchmakingStatus.innerHTML = `
                    <div class="status-icon spinning">🔍</div>
                    <div class="status-text">Finding teammate... (${data.position} in queue)</div>
                `;
                break;
                
            case 'teammateAction':
                this.onTeammateAction(data);
                break;
            
            case 'turnChange':
                this.onTurnChange(data);
                break;
            
            case 'typingPreview':
                this.onTypingPreview(data);
                break;
                
            case 'bossAttack':
                this.handleBossAttack(data);
                break;
                
            case 'coopGameOver':
                this.handleGameOver(data);
                break;
                
            case 'teammateDisconnected':
                this.handleTeammateDisconnected();
                break;
        }
    }
    
    send(data) {
        if (this.ws && this.connected) {
            this.ws.send(JSON.stringify(data));
        }
    }
    
    onMatchFound(data) {
        console.log('🎮 Co-op match found!', data);
        this.inQueue = false;
        this.inMatch = true;
        this.playerNumber = data.playerNumber;
        this.teammateName = data.teammateName;
        this.bossHealth = data.bossHealth || this.maxBossHealth;
        this.teamHealth = data.teamHealth || this.maxTeamHealth;
        this.startWord = data.startWord; // Store initial word from server
        
        // Show countdown
        this.showCountdown();
    }
    
    showCountdown() {
        this.matchmakingMenu.classList.add('hidden');
        this.countdownOverlay.classList.remove('hidden');
        
        this.teammateFoundText.textContent = 'TEAMMATE FOUND!';
        this.teammateNameDisplay.textContent = this.teammateName;
        
        let count = 3;
        this.countdownNumber.textContent = count;
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                this.countdownNumber.textContent = count;
                this.game.soundManager.play('typing');
            } else {
                clearInterval(countdownInterval);
                this.countdownNumber.textContent = 'FIGHT!';
                this.game.soundManager.play('critical');
                
                setTimeout(() => {
                    this.countdownOverlay.classList.add('hidden');
                    this.startGame();
                    // Notify server that we're ready to start
                    this.send({ type: 'coopGameReady' });
                }, 1000);
            }
        }, 1000);
    }
    
    startGame() {
        console.log('🎮 Starting co-op game...', {
            playerNumber: this.playerNumber,
            teammateName: this.teammateName,
            gameArea: !!this.gameArea,
            sharedInput: !!this.elements.sharedInput,
            currentWord: !!this.elements.currentWord
        });
        
        this.isActive = true;
        this.gameArea.classList.remove('hidden');
        this.elements.gameOver.classList.add('hidden');
        
        // Reset stats
        this.totalDamageDealt = 0;
        this.criticalHits = 0;
        this.wordsTyped = 0;
        this.myCritical = true;
        
        // Initialize health to max
        this.bossHealth = this.maxBossHealth;
        this.teamHealth = this.maxTeamHealth;
        
        // Initialize turn-based system - Player 1 always starts
        this.currentTurn = 1;
        this.isMyTurn = (this.playerNumber === 1);
        this.currentWord = this.startWord; // Use word from server
        this.myCritical = true;
        
        // Update health bars to 100%
        console.log('Initializing health bars...');
        this.updateBossHealth();
        this.updateTeamHealth();
        
        // Set up the single word display for turn-based play
        this.elements.currentWord.textContent = this.currentWord;
        
        // Set up player names
        if (this.playerNumber === 1) {
            this.elements.player1Name.textContent = this.game.currentUser?.username || 'You';
            this.elements.player2Name.textContent = this.teammateName;
        } else {
            this.elements.player1Name.textContent = this.teammateName;
            this.elements.player2Name.textContent = this.game.currentUser?.username || 'You';
        }
        
        console.log('Words assigned:', { currentWord: this.currentWord });
        
        // Remove old event listeners by cloning and replacing
        const sharedInput = this.elements.sharedInput;
        const newSharedInput = sharedInput.cloneNode(true);
        sharedInput.parentNode.replaceChild(newSharedInput, sharedInput);
        this.elements.sharedInput = newSharedInput;
        
        // Set up UI based on whose turn it is
        if (this.isMyTurn) {
            // My turn - enable input
            this.elements.sharedInput.disabled = false;
            this.elements.sharedInput.value = '';
            this.elements.sharedInput.placeholder = 'YOUR TURN - Type here...';
            this.elements.turnText.textContent = 'Your Turn';
            this.elements.turnIndicator.style.borderColor = 'var(--neon-cyan)';
            this.elements.turnIndicator.style.boxShadow = '0 0 10px var(--neon-cyan)';
            
            // Add event listener for input and typing preview
            this.elements.sharedInput.addEventListener('input', (e) => {
                console.log('My input:', e.target.value);
                this.handleMyInput(e);
                this.sendTypingPreview(e.target.value);
            });
            
            setTimeout(() => this.elements.sharedInput.focus(), 100);
        } else {
            // Not my turn - disable input but show teammate's typing
            this.elements.sharedInput.disabled = true;
            this.elements.sharedInput.value = '';
            this.elements.sharedInput.placeholder = `${this.teammateName}'s turn...`;
            this.elements.turnText.textContent = `${this.teammateName}'s Turn`;
            this.elements.turnIndicator.style.borderColor = 'var(--neon-magenta)';
            this.elements.turnIndicator.style.boxShadow = '0 0 10px var(--neon-magenta)';
        }
        
        this.elements.bossName.textContent = 'CYBER BOSS';
        this.elements.bossStatus.textContent = `vs ${this.teammateName}`;
        
        console.log('✅ Co-op game started!');
    }
    
    handleMyInput(e) {
        if (!this.isActive || !this.isMyTurn) {
            // Not my turn - ignore input
            return;
        }
        
        this.myInput = e.target.value.toLowerCase();
        
        if (this.myInput.length > 0) {
            if (this.currentWord.startsWith(this.myInput)) {
                this.elements.sharedInput.classList.remove('error');
                this.elements.sharedInput.classList.add('correct');
                this.elements.typingFeedback.textContent = '';
                
                if (this.myInput === this.currentWord) {
                    this.completeWord();
                }
            } else {
                this.elements.sharedInput.classList.remove('correct');
                this.elements.sharedInput.classList.add('error');
                
                if (this.myCritical) {
                    this.myCritical = false;
                }
                
                this.elements.typingFeedback.textContent = '❌';
                this.game.soundManager.play('error');
            }
        } else {
            this.elements.sharedInput.classList.remove('correct', 'error');
            this.elements.typingFeedback.textContent = '';
        }
    }
    
    completeWord() {
        const damage = this.myCritical ? CONFIG.BASE_DAMAGE * CONFIG.CRITICAL_MULTIPLIER : CONFIG.BASE_DAMAGE;
        
        // Update boss health
        this.bossHealth = Math.max(0, this.bossHealth - damage);
        this.updateBossHealth();
        
        // Update stats
        this.totalDamageDealt += damage;
        this.wordsTyped++;
        if (this.myCritical) {
            this.criticalHits++;
        }
        
        // Show feedback
        if (this.myCritical) {
            this.elements.typingFeedback.textContent = `🔥 CRITICAL! -${damage}`;
            this.elements.typingFeedback.classList.add('critical');
            this.game.soundManager.play('critical');
        } else {
            this.elements.typingFeedback.textContent = `✓ -${damage}`;
            this.elements.typingFeedback.classList.remove('critical');
            this.game.soundManager.play('hit');
        }
        
        // Particles
        if (this.myCritical) {
            this.game.particleSystem.createCriticalEffect(
                document.body,
                'var(--neon-cyan)'
            );
        } else {
            this.game.particleSystem.createHitEffect(
                document.body,
                'var(--neon-magenta)'
            );
        }
        
        // Send action to server
        this.send({
            type: 'coopAction',
            word: this.currentWord,
            damage: damage,
            isCritical: this.myCritical
        });
        
        // Check if boss is defeated
        if (this.bossHealth <= 0) {
            this.endGame(true);
            return;
        }
        
        // Get new word for next turn
        this.currentWord = this.game.wordManager.getRandomWord();
        
        // Switch turns
        this.currentTurn = this.currentTurn === 1 ? 2 : 1;
        this.isMyTurn = false; // My turn is over
        
        // Update UI
        this.elements.currentWord.textContent = this.currentWord;
        
        // Disable input
        this.elements.sharedInput.value = '';
        this.elements.sharedInput.classList.remove('correct', 'error');
        this.elements.sharedInput.disabled = true;
        this.elements.sharedInput.placeholder = `${this.teammateName}'s turn...`;
        this.elements.turnText.textContent = `${this.teammateName}'s Turn`;
        this.elements.turnIndicator.style.borderColor = 'var(--neon-magenta)';
        this.elements.turnIndicator.style.boxShadow = '0 0 10px var(--neon-magenta)';
        this.myInput = '';
        
        // Notify server about turn change
        this.send({
            type: 'turnChange',
            nextTurn: this.currentTurn,
            newWord: this.currentWord
        });
        
        console.log(`Turn complete. Next turn: Player ${this.currentTurn}`);
        
        // Clear feedback after delay
        setTimeout(() => {
            this.elements.typingFeedback.textContent = '';
            this.elements.typingFeedback.classList.remove('critical');
        }, 1500);
    }
    
    onTurnChange(data) {
        // Teammate finished their word, now it's my turn
        this.currentTurn = data.nextTurn;
        this.currentWord = data.newWord;
        this.isMyTurn = (this.playerNumber === this.currentTurn);
        this.myCritical = true;
        
        // Update word display
        this.elements.currentWord.textContent = this.currentWord;
        
        console.log(`Turn changed. Current turn: Player ${this.currentTurn}, My turn: ${this.isMyTurn}`);
        
        if (this.isMyTurn) {
            // Enable my input
            this.elements.sharedInput.disabled = false;
            this.elements.sharedInput.value = '';
            this.elements.sharedInput.placeholder = 'YOUR TURN - Type here...';
            this.elements.turnText.textContent = 'Your Turn';
            this.elements.turnIndicator.style.borderColor = 'var(--neon-cyan)';
            this.elements.turnIndicator.style.boxShadow = '0 0 10px var(--neon-cyan)';
            this.elements.sharedInput.focus();
        } else {
            // Not my turn, keep disabled
            this.elements.sharedInput.disabled = true;
            this.elements.sharedInput.placeholder = `${this.teammateName}'s turn...`;
            this.elements.turnText.textContent = `${this.teammateName}'s Turn`;
            this.elements.turnIndicator.style.borderColor = 'var(--neon-magenta)';
            this.elements.turnIndicator.style.boxShadow = '0 0 10px var(--neon-magenta)';
        }
    }
    
    sendTypingPreview(text) {
        // Send real-time typing preview to teammate
        if (!this.isActive || !this.isMyTurn || !this.connected) {
            return;
        }
        
        this.send({
            type: 'typingPreview',
            text: text
        });
    }
    
    onTypingPreview(data) {
        // Receive teammate's typing preview and display it
        if (!this.isActive || this.isMyTurn) {
            return;
        }
        
        // Update the shared input to show what teammate is typing
        this.elements.sharedInput.value = data.text;
    }
    
    onTeammateAction(data) {
        // Teammate completed their word - update boss health and show feedback
        
        // Update boss health
        this.bossHealth = Math.max(0, this.bossHealth - data.damage);
        this.updateBossHealth();
        
        // Show feedback
        if (data.isCritical) {
            this.elements.typingFeedback.textContent = `🔥 ${this.teammateName} - CRITICAL! -${data.damage}`;
            this.elements.typingFeedback.classList.add('critical');
            this.game.particleSystem.createCriticalEffect(
                document.body,
                'var(--neon-cyan)'
            );
            this.game.soundManager.play('critical');
        } else {
            this.elements.typingFeedback.textContent = `✓ ${this.teammateName} -${data.damage}`;
            this.elements.typingFeedback.classList.remove('critical');
            this.game.particleSystem.createHitEffect(
                document.body,
                'var(--neon-magenta)'
            );
            this.game.soundManager.play('hit');
        }
        
        // Clear feedback after delay
        setTimeout(() => {
            this.elements.typingFeedback.textContent = '';
            this.elements.typingFeedback.classList.remove('critical');
        }, 1500);
        
        // Check if boss is defeated
        if (this.bossHealth <= 0) {
            this.endGame(true);
        }
        
        // Turn change will be handled by onTurnChange message from server
    }
    
    handleBossAttack(data) {
        // Update team health from server
        this.teamHealth = Math.max(0, data.teamHealth);
        this.updateTeamHealth();
        
        this.elements.bossStatus.textContent = `💥 BOSS ATTACKED! -${data.damage}`;
        
        setTimeout(() => {
            this.elements.bossStatus.textContent = `vs ${this.teammateName}`;
        }, 2000);
        
        // Check if team is defeated
        if (this.teamHealth <= 0) {
            this.endGame(false);
        }
    }
    
    updateBossHealth() {
        const percentage = Math.max(0, Math.min(100, (this.bossHealth / this.maxBossHealth) * 100));
        this.elements.bossHealth.style.width = `${percentage}%`;
        this.elements.bossHealthText.textContent = `${Math.round(this.bossHealth)} / ${this.maxBossHealth}`;
        console.log(`Boss health: ${Math.round(this.bossHealth)}/${this.maxBossHealth} (${percentage.toFixed(1)}%)`);
    }
    
    updateTeamHealth() {
        const percentage = Math.max(0, Math.min(100, (this.teamHealth / this.maxTeamHealth) * 100));
        this.elements.teamHealth.style.width = `${percentage}%`;
        this.elements.teamHealthText.textContent = `${Math.round(this.teamHealth)} / ${this.maxTeamHealth}`;
        console.log(`Team health: ${Math.round(this.teamHealth)}/${this.maxTeamHealth} (${percentage.toFixed(1)}%)`);
    }
    
    endGame(victory) {
        this.isActive = false;
        this.inMatch = false;
        
        // Disable input
        this.elements.sharedInput.disabled = true;
        
        // Show game over screen
        this.elements.gameOver.classList.remove('hidden');
        
        if (victory) {
            this.elements.gameOverTitle.textContent = '🏆 VICTORY!';
            this.elements.gameOverTitle.style.color = 'var(--neon-green)';
            this.game.soundManager.play('victory');
        } else {
            this.elements.gameOverTitle.textContent = '💀 DEFEATED!';
            this.elements.gameOverTitle.style.color = 'var(--neon-red)';
            this.game.soundManager.play('defeat');
        }
        
        // Show stats
        this.elements.gameOverStats.innerHTML = `
            <div class="stat-row">Words Typed: ${this.wordsTyped}</div>
            <div class="stat-row">Damage Dealt: ${Math.round(this.totalDamageDealt)}</div>
            <div class="stat-row">Critical Hits: ${this.criticalHits}</div>
            <div class="stat-row">Teammate: ${this.teammateName}</div>
        `;
        
        // Send game over to server
        this.send({
            type: 'coopGameOver',
            victory: victory,
            stats: {
                wordsTyped: this.wordsTyped,
                damageDealt: this.totalDamageDealt,
                criticalHits: this.criticalHits
            }
        });
    }
    
    handleGameOver(data) {
        if (!this.isActive) return;
        this.endGame(data.victory);
    }
    
    handleTeammateDisconnected() {
        if (!this.inMatch) return;
        
        this.isActive = false;
        this.inMatch = false;
        
        alert('Teammate disconnected!');
        this.reset();
    }
}
