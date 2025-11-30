// ========================================
// CO-OP MODE - TEAM VS BOSS (ONLINE)
// ========================================

class CoopMode {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.bossHealth = CONFIG.BOSS_MAX_HEALTH;
        this.teamHealth = CONFIG.COOP_TEAM_MAX_HEALTH;
        this.bossTypingTimer = null;
        this.bossAttackDelay = CONFIG.BOSS_ATTACK_DELAY;
        
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
                console.log('✅ Match found! Starting game...');
                this.onMatchFound(data);
                break;
                
            case 'coopQueuePosition':
                console.log(`🔍 In queue position: ${data.position}`);
                this.elements.bossStatus.textContent = `🔍 Finding Teammate... (${data.position} in queue)`;
                break;
                
            case 'teammateTyping':
                this.onTeammateTyping(data);
                break;
                
            case 'teammateNewWord':
                this.onTeammateNewWord(data);
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
    
    findMatch(playerName) {
        this.connectToServer();
        
        // Wait for connection, then send match request
        const checkConnection = setInterval(() => {
            if (this.connected) {
                clearInterval(checkConnection);
                this.inQueue = true;
                this.send({
                    type: 'findCoopMatch',
                    playerName: playerName || 'Player'
                });
                this.showMatchmaking();
            }
        }, 100);
    }
    
    cancelMatch() {
        if (this.inQueue) {
            this.send({ type: 'cancelCoopMatch' });
            this.inQueue = false;
        }
    }
    
    showMatchmaking() {
        this.elements.bossStatus.textContent = '🔍 Finding Teammate...';
        this.elements.player1Input.disabled = true;
        this.elements.player2Input.disabled = true;
    }
    
    onMatchFound(data) {
        console.log('🎮 Co-op match found!', data);
        this.inQueue = false;
        this.inMatch = true;
        this.playerNumber = data.playerNumber;
        this.teammateName = data.teammateName;
        this.bossHealth = data.bossHealth;
        this.teamHealth = data.teamHealth;
        
        // Start the game
        this.startMatch();
    }
    
    startMatch() {
        this.isActive = true;
        
        // Reset stats
        this.totalDamageDealt = 0;
        this.criticalHits = 0;
        this.myCritical = true;
        
        // Setup UI based on player number
        if (this.playerNumber === 1) {
            // I'm player 1
            this.elements.player1Input.disabled = false;
            this.elements.player2Input.disabled = true;
            setTimeout(() => this.elements.player1Input.focus(), 100);
        } else {
            // I'm player 2
            this.elements.player1Input.disabled = true;
            this.elements.player2Input.disabled = false;
            setTimeout(() => this.elements.player2Input.focus(), 100);
        }
        
        // Setup input handler
        this.setupInputHandler();
        
        // Get first word
        this.game.wordManager.reset();
        this.assignNewWord();
        
        // Update UI
        this.updateHealthBars();
        this.elements.bossName.textContent = 'MEGA BOSS';
        this.elements.bossStatus.textContent = `🤝 ${this.teammateName}`;
        
        console.log('🤝 Co-op match started!');
    }
    
    setupInputHandler() {
        const myInput = this.playerNumber === 1 ? this.elements.player1Input : this.elements.player2Input;
        
        // Remove old listener if exists
        const newInput = myInput.cloneNode(true);
        myInput.parentNode.replaceChild(newInput, myInput);
        
        // Update reference
        if (this.playerNumber === 1) {
            this.elements.player1Input = newInput;
        } else {
            this.elements.player2Input = newInput;
        }
        
        // Add new listener
        newInput.addEventListener('input', (e) => {
            this.myInput = e.target.value.toLowerCase();
            this.checkMyWord();
            
            // Send typing progress to teammate
            this.send({
                type: 'coopTyping',
                input: this.myInput,
                word: this.myWord
            });
        });
    }
    
    assignNewWord() {
        this.myWord = this.game.wordManager.getNextWord();
        this.myCritical = true;
        
        const myWordElement = this.playerNumber === 1 ? this.elements.player1Word : this.elements.player2Word;
        myWordElement.textContent = this.myWord;
        
        // Send new word to teammate
        this.send({
            type: 'coopNewWord',
            word: this.myWord
        });
    }
    
    checkMyWord() {
        const target = this.myWord;
        const input = this.myInput;
        const myInput = this.playerNumber === 1 ? this.elements.player1Input : this.elements.player2Input;
        const myFeedback = this.playerNumber === 1 ? this.elements.player1Feedback : this.elements.player2Feedback;
        
        if (input.length > 0) {
            if (target.startsWith(input)) {
                myInput.classList.remove('error');
                myInput.classList.add('correct');
                myFeedback.textContent = '';
                
                if (input === target) {
                    this.completeWord();
                }
            } else {
                myInput.classList.remove('correct');
                myInput.classList.add('error');
                this.myCritical = false;
                myFeedback.textContent = '❌';
                this.game.soundManager.playErrorSound();
            }
        } else {
            myInput.classList.remove('correct', 'error');
            myFeedback.textContent = '';
        }
    }
    
    completeWord() {
        const isCritical = this.myCritical;
        let damage = CONFIG.BASE_DAMAGE;
        
        if (isCritical) {
            damage = Math.floor(damage * CONFIG.CRITICAL_MULTIPLIER);
            this.criticalHits++;
            this.game.soundManager.playCriticalSound();
        } else {
            this.game.soundManager.playHitSound();
        }
        
        // Send action to server
        this.send({
            type: 'coopAction',
            word: this.myWord,
            damage: damage,
            isCritical: isCritical
        });
        
        // Update local UI
        const myInput = this.playerNumber === 1 ? this.elements.player1Input : this.elements.player2Input;
        const myFeedback = this.playerNumber === 1 ? this.elements.player1Feedback : this.elements.player2Feedback;
        
        myFeedback.textContent = isCritical ? '💥 CRITICAL!' : '✓ HIT';
        myInput.value = '';
        this.myInput = '';
        myInput.classList.remove('correct', 'error');
        
        // Get new word
        this.assignNewWord();
        
        setTimeout(() => {
            myFeedback.textContent = '';
        }, 1000);
    }
    
    onTeammateTyping(data) {
        // Show teammate's current typing progress
        const teammateInput = this.playerNumber === 1 ? this.elements.player2Input : this.elements.player1Input;
        teammateInput.value = data.input;
    }
    
    onTeammateNewWord(data) {
        // Update teammate's word display
        const teammateWordElement = this.playerNumber === 1 ? this.elements.player2Word : this.elements.player1Word;
        teammateWordElement.textContent = data.word;
        this.teammateWord = data.word;
    }
    
    onTeammateAction(data) {
        console.log('👥 Teammate action:', data);
        
        // Show teammate's word
        const teammateWordElement = this.playerNumber === 1 ? this.elements.player2Word : this.elements.player1Word;
        const teammateFeedback = this.playerNumber === 1 ? this.elements.player2Feedback : this.elements.player1Feedback;
        
        teammateWordElement.textContent = data.word;
        teammateFeedback.textContent = data.isCritical ? '💥 CRITICAL!' : '✓ HIT';
        
        // Update boss health
        this.bossHealth = Math.max(0, this.bossHealth - data.damage);
        this.totalDamageDealt += data.damage;
        this.updateHealthBars();
        
        // Visual effect
        const bossHealthBar = this.elements.bossHealth.parentElement;
        const rect = bossHealthBar.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        if (data.isCritical) {
            this.game.particleSystem.createCriticalHit(x, y);
        } else {
            this.game.particleSystem.createHit(x, y);
        }
        
        // Check victory
        if (this.bossHealth <= 0) {
            this.victory();
        }
        
        setTimeout(() => {
            teammateFeedback.textContent = '';
        }, 1000);
    }
    
    handleBossAttack(data) {
        if (!this.isActive) return;
        
        this.teamHealth = Math.max(0, data.teamHealth);
        
        // Visual feedback
        this.elements.bossStatus.textContent = '⚡ ATTACKING!';
        this.game.soundManager.playDamageSound();
        this.updateHealthBars();
        
        // Flash health bar
        this.elements.teamHealth.parentElement.style.animation = 'none';
        setTimeout(() => {
            this.elements.teamHealth.parentElement.style.animation = 'pulse 0.5s';
        }, 10);
        
        setTimeout(() => {
            if (this.isActive) {
                this.elements.bossStatus.textContent = `🤝 ${this.teammateName}`;
            }
        }, 500);
        
        // Check defeat
        if (this.teamHealth <= 0) {
            this.defeat();
        }
    }
    
    handleGameOver(data) {
        console.log('🎮 Co-op game over:', data);
        this.showResults(data.victory, data.stats);
    }
    
    handleTeammateDisconnected() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.inMatch = false;
        
        alert('Your teammate disconnected! Returning to menu...');
        this.stop();
        document.getElementById('coop-mode-screen').classList.remove('active');
        document.getElementById('main-menu').classList.add('active');
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
        this.inMatch = false;
        
        const myInput = this.playerNumber === 1 ? this.elements.player1Input : this.elements.player2Input;
        myInput.disabled = true;
        
        this.elements.bossStatus.textContent = '💀 DEFEATED';
        this.game.soundManager.playVictorySound();
        
        // Notify server
        this.send({
            type: 'coopGameOver',
            victory: true,
            stats: {
                totalDamage: this.totalDamageDealt,
                criticalHits: this.criticalHits
            }
        });
    }
    
    defeat() {
        this.isActive = false;
        this.inMatch = false;
        
        const myInput = this.playerNumber === 1 ? this.elements.player1Input : this.elements.player2Input;
        myInput.disabled = true;
        
        this.game.soundManager.playDefeatSound();
        
        // Notify server
        this.send({
            type: 'coopGameOver',
            victory: false,
            stats: {
                totalDamage: this.totalDamageDealt,
                criticalHits: this.criticalHits
            }
        });
    }
    
    showResults(victory, stats = {}) {
        setTimeout(() => {
            const resultsHtml = `
                <div class="coop-results">
                    <h2 class="neon-text">${victory ? '🏆 VICTORY! 🏆' : '💀 DEFEATED 💀'}</h2>
                    <div class="coop-stats">
                        <p><span class="stat-label">Teammate:</span> <span class="stat-value">${this.teammateName}</span></p>
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
                this.findMatch(window.authClient?.currentUser?.username || 'Player');
            });
            
            document.getElementById('coop-back-to-menu-btn').addEventListener('click', () => {
                resultsDiv.remove();
                this.stop();
                document.getElementById('coop-mode-screen').classList.remove('active');
                document.getElementById('main-menu').classList.add('active');
            });
        }, 1000);
    }
    
    stop() {
        this.isActive = false;
        this.inMatch = false;
        clearTimeout(this.bossTypingTimer);
        
        if (this.ws && this.connected) {
            this.ws.close();
            this.ws = null;
            this.connected = false;
        }
    }
}
