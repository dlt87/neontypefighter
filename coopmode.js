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
            player1Word: document.getElementById('coop-player1-word'),
            player2Word: document.getElementById('coop-player2-word'),
            player1Input: document.getElementById('coop-player1-input'),
            player2Input: document.getElementById('coop-player2-input'),
            player1Feedback: document.getElementById('coop-player1-feedback'),
            player2Feedback: document.getElementById('coop-player2-feedback'),
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
        
        console.log('✅ Co-op UI setup complete', {
            gameArea: !!this.gameArea,
            player1Input: !!this.elements.player1Input,
            player2Input: !!this.elements.player2Input
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
                this.game.soundManager.playTypingSound();
            } else {
                clearInterval(countdownInterval);
                this.countdownNumber.textContent = 'FIGHT!';
                this.game.soundManager.playCriticalSound();
                
                setTimeout(() => {
                    this.countdownOverlay.classList.add('hidden');
                    this.startGame();
                }, 1000);
            }
        }, 1000);
    }
    
    startGame() {
        console.log('🎮 Starting co-op game...', {
            playerNumber: this.playerNumber,
            teammateName: this.teammateName,
            gameArea: !!this.gameArea,
            player1Input: !!this.elements.player1Input,
            player2Input: !!this.elements.player2Input
        });
        
        this.isActive = true;
        this.gameArea.classList.remove('hidden');
        this.elements.gameOver.classList.add('hidden');
        
        // Reset stats
        this.totalDamageDealt = 0;
        this.criticalHits = 0;
        this.wordsTyped = 0;
        this.myCritical = true;
        
        // Update health bars
        this.updateBossHealth();
        this.updateTeamHealth();
        
        // Set up words
        this.myWord = this.game.wordManager.getRandomWord();
        this.teammateWord = this.game.wordManager.getRandomWord();
        
        console.log('Words assigned:', { myWord: this.myWord, teammateWord: this.teammateWord });
        
        // Remove old event listeners by cloning and replacing
        const player1Input = this.elements.player1Input;
        const player2Input = this.elements.player2Input;
        
        const newPlayer1Input = player1Input.cloneNode(true);
        const newPlayer2Input = player2Input.cloneNode(true);
        
        player1Input.parentNode.replaceChild(newPlayer1Input, player1Input);
        player2Input.parentNode.replaceChild(newPlayer2Input, player2Input);
        
        this.elements.player1Input = newPlayer1Input;
        this.elements.player2Input = newPlayer2Input;
        
        // Set up UI based on player number
        if (this.playerNumber === 1) {
            this.elements.player1Word.textContent = this.myWord;
            this.elements.player2Word.textContent = this.teammateWord;
            this.elements.player1Input.disabled = false;
            this.elements.player2Input.disabled = true;
            this.elements.player1Input.value = '';
            
            // Add event listener
            this.elements.player1Input.addEventListener('input', (e) => {
                console.log('Player 1 input:', e.target.value);
                this.handleMyInput(e);
            });
            
            setTimeout(() => this.elements.player1Input.focus(), 100);
        } else {
            this.elements.player2Word.textContent = this.myWord;
            this.elements.player1Word.textContent = this.teammateWord;
            this.elements.player2Input.disabled = false;
            this.elements.player1Input.disabled = true;
            this.elements.player2Input.value = '';
            
            // Add event listener
            this.elements.player2Input.addEventListener('input', (e) => {
                console.log('Player 2 input:', e.target.value);
                this.handleMyInput(e);
            });
            
            setTimeout(() => this.elements.player2Input.focus(), 100);
        }
        
        this.elements.bossName.textContent = 'CYBER BOSS';
        this.elements.bossStatus.textContent = `vs ${this.teammateName}`;
        
        console.log('✅ Co-op game started!');
    }
    
    handleMyInput(e) {
        if (!this.isActive) return;
        
        this.myInput = e.target.value.toLowerCase();
        const myInputElement = this.playerNumber === 1 ? this.elements.player1Input : this.elements.player2Input;
        const myFeedback = this.playerNumber === 1 ? this.elements.player1Feedback : this.elements.player2Feedback;
        
        if (this.myInput.length > 0) {
            if (this.myWord.startsWith(this.myInput)) {
                myInputElement.classList.remove('error');
                myInputElement.classList.add('correct');
                myFeedback.textContent = '';
                
                if (this.myInput === this.myWord) {
                    this.completeWord();
                }
            } else {
                myInputElement.classList.remove('correct');
                myInputElement.classList.add('error');
                
                if (this.myCritical) {
                    this.myCritical = false;
                }
                
                myFeedback.textContent = '❌';
                this.game.soundManager.playErrorSound();
            }
        } else {
            myInputElement.classList.remove('correct', 'error');
            myFeedback.textContent = '';
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
        const myFeedback = this.playerNumber === 1 ? this.elements.player1Feedback : this.elements.player2Feedback;
        const myInputElement = this.playerNumber === 1 ? this.elements.player1Input : this.elements.player2Input;
        
        if (this.myCritical) {
            myFeedback.textContent = `🔥 CRITICAL! -${damage}`;
            myFeedback.classList.add('critical');
            this.game.soundManager.playCriticalSound();
        } else {
            myFeedback.textContent = `✓ -${damage}`;
            myFeedback.classList.remove('critical');
            this.game.soundManager.playSuccessSound();
        }
        
        // Particles
        this.game.particleSystem.createBurst(
            window.innerWidth / 2,
            window.innerHeight / 3,
            this.myCritical ? 'critical' : 'hit'
        );
        
        // Send action to server
        this.send({
            type: 'coopAction',
            word: this.myWord,
            damage: damage,
            isCritical: this.myCritical
        });
        
        // Check if boss is defeated
        if (this.bossHealth <= 0) {
            this.endGame(true);
            return;
        }
        
        // Get new word
        this.myWord = this.game.wordManager.getRandomWord();
        const myWordElement = this.playerNumber === 1 ? this.elements.player1Word : this.elements.player2Word;
        myWordElement.textContent = this.myWord;
        
        // Reset input
        myInputElement.value = '';
        myInputElement.classList.remove('correct', 'error');
        this.myInput = '';
        this.myCritical = true;
        
        setTimeout(() => {
            myFeedback.textContent = '';
            myFeedback.classList.remove('critical');
        }, 1000);
    }
    
    onTeammateAction(data) {
        const teammateWordElement = this.playerNumber === 1 ? this.elements.player2Word : this.elements.player1Word;
        const teammateFeedback = this.playerNumber === 1 ? this.elements.player2Feedback : this.elements.player1Feedback;
        
        // Update boss health
        this.bossHealth = Math.max(0, this.bossHealth - data.damage);
        this.updateBossHealth();
        
        // Show feedback
        if (data.isCritical) {
            teammateFeedback.textContent = `🔥 CRITICAL! -${data.damage}`;
            teammateFeedback.classList.add('critical');
        } else {
            teammateFeedback.textContent = `✓ -${data.damage}`;
            teammateFeedback.classList.remove('critical');
        }
        
        // Particles
        this.game.particleSystem.createBurst(
            window.innerWidth / 2,
            window.innerHeight / 3,
            data.isCritical ? 'critical' : 'hit'
        );
        
        // Get new word for teammate
        this.teammateWord = this.game.wordManager.getRandomWord();
        teammateWordElement.textContent = this.teammateWord;
        
        setTimeout(() => {
            teammateFeedback.textContent = '';
            teammateFeedback.classList.remove('critical');
        }, 1000);
        
        // Check if boss is defeated
        if (this.bossHealth <= 0) {
            this.endGame(true);
        }
    }
    
    handleBossAttack(data) {
        this.teamHealth = Math.max(0, this.teamHealth - data.damage);
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
        const percentage = (this.bossHealth / this.maxBossHealth) * 100;
        this.elements.bossHealth.style.width = `${percentage}%`;
        this.elements.bossHealthText.textContent = `${Math.round(this.bossHealth)} / ${this.maxBossHealth}`;
    }
    
    updateTeamHealth() {
        const percentage = (this.teamHealth / this.maxTeamHealth) * 100;
        this.elements.teamHealth.style.width = `${percentage}%`;
        this.elements.teamHealthText.textContent = `${Math.round(this.teamHealth)} / ${this.maxTeamHealth}`;
    }
    
    endGame(victory) {
        this.isActive = false;
        this.inMatch = false;
        
        // Disable inputs
        this.elements.player1Input.disabled = true;
        this.elements.player2Input.disabled = true;
        
        // Show game over screen
        this.elements.gameOver.classList.remove('hidden');
        
        if (victory) {
            this.elements.gameOverTitle.textContent = '🏆 VICTORY!';
            this.elements.gameOverTitle.style.color = 'var(--neon-green)';
            this.game.soundManager.playVictorySound();
        } else {
            this.elements.gameOverTitle.textContent = '💀 DEFEATED!';
            this.elements.gameOverTitle.style.color = 'var(--neon-red)';
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
