// ========================================
// ENDLESS MODE - WAVE-BASED SURVIVAL
// ========================================

class EndlessMode {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        
        // Wave configuration
        this.currentWave = 0;
        this.wordsPerWave = 5; // Starting words per wave
        this.timePerWave = 30; // Starting seconds per wave
        this.wordsCompleted = 0;
        this.wordsRequired = 0;
        this.timeRemaining = 0;
        this.timerInterval = null;
        
        // Difficulty scaling
        this.difficultyMultiplier = 1.0;
        
        // Stats
        this.totalWordsTyped = 0;
        this.totalCriticalHits = 0;
        this.startTime = null;
        
        // Current word tracking
        this.currentWord = '';
        this.currentInput = '';
        this.isCritical = true;
        
        this.setupUI();
    }
    
    setupUI() {
        // Get DOM elements
        this.screen = document.getElementById('endless-mode-screen');
        this.elements = {
            waveNumber: document.getElementById('endless-wave-number'),
            wordsProgress: document.getElementById('endless-words-progress'),
            timer: document.getElementById('endless-timer'),
            currentWord: document.getElementById('endless-current-word'),
            typingInput: document.getElementById('endless-typing-input'),
            typingFeedback: document.getElementById('endless-typing-feedback'),
            startBtn: document.getElementById('endless-start-btn'),
            backBtn: document.getElementById('endless-back-btn'),
            gameOverScreen: document.getElementById('endless-game-over'),
            gameOverTitle: document.getElementById('endless-game-over-title'),
            finalWave: document.getElementById('endless-final-wave'),
            totalWords: document.getElementById('endless-total-words'),
            totalCriticals: document.getElementById('endless-total-criticals'),
            survivalTime: document.getElementById('endless-survival-time'),
            playAgainBtn: document.getElementById('endless-play-again-btn'),
            menuBtn: document.getElementById('endless-menu-btn'),
            leaderboardList: document.getElementById('endless-leaderboard-list'),
            waveInfo: document.getElementById('endless-wave-info')
        };
        
        // Event listeners
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => this.startGame());
        }
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', () => this.returnToMenu());
        }
        if (this.elements.playAgainBtn) {
            this.elements.playAgainBtn.addEventListener('click', () => this.playAgain());
        }
        if (this.elements.menuBtn) {
            this.elements.menuBtn.addEventListener('click', () => this.returnToMenu());
        }
        if (this.elements.typingInput) {
            this.elements.typingInput.addEventListener('input', (e) => this.handleInput(e));
        }
        
        console.log('✅ Endless Mode initialized');
    }
    
    startGame() {
        this.isActive = true;
        this.currentWave = 1;
        this.totalWordsTyped = 0;
        this.totalCriticalHits = 0;
        this.startTime = Date.now();
        
        // Hide start button, show game area
        this.elements.startBtn.classList.add('hidden');
        this.elements.backBtn.classList.add('hidden');
        this.elements.gameOverScreen.classList.add('hidden');
        
        // Start first wave
        this.startWave();
        
        console.log('🎮 Endless Mode started!');
    }
    
    startWave() {
        // Calculate wave difficulty
        this.difficultyMultiplier = 1 + (this.currentWave - 1) * 0.1;
        this.wordsRequired = Math.floor(this.wordsPerWave + (this.currentWave - 1) * 1.5);
        this.timePerWave = Math.max(20, 30 - Math.floor((this.currentWave - 1) * 0.5));
        this.timeRemaining = this.timePerWave;
        this.wordsCompleted = 0;
        
        // Update UI
        this.elements.waveNumber.textContent = this.currentWave;
        this.elements.wordsProgress.textContent = `${this.wordsCompleted} / ${this.wordsRequired}`;
        this.elements.waveInfo.textContent = `Wave ${this.currentWave} - Complete ${this.wordsRequired} words in ${this.timePerWave}s`;
        
        // Get first word
        this.getNewWord();
        
        // Start timer
        this.startTimer();
        
        // Enable input and force focus
        this.elements.typingInput.disabled = false;
        this.elements.typingInput.value = '';
        this.elements.typingInput.focus();
        
        // Force focus again after a short delay to ensure it works
        setTimeout(() => {
            this.elements.typingInput.focus();
        }, 100);
        
        console.log(`🌊 Wave ${this.currentWave} started - ${this.wordsRequired} words, ${this.timePerWave}s`);
    }
    
    getNewWord() {
        // Get word based on difficulty
        const wordPool = this.getWordPoolForDifficulty();
        this.currentWord = wordPool[Math.floor(Math.random() * wordPool.length)];
        this.currentInput = '';
        this.isCritical = true;
        
        this.elements.currentWord.textContent = this.currentWord;
        this.elements.typingInput.value = '';
        this.elements.typingInput.classList.remove('correct', 'error');
    }
    
    getWordPoolForDifficulty() {
        // Easy words for early waves (3-6 letters)
        if (this.currentWave <= 3) {
            return ['cyber', 'neon', 'pixel', 'digital', 'matrix', 'chrome', 'glitch', 'byte', 'hack', 'fire',
                    'bolt', 'beam', 'tech', 'core', 'link', 'sync', 'grid', 'wave', 'data', 'code',
                    'node', 'port', 'ram', 'rom', 'cpu', 'gpu', 'usb', 'lan', 'wifi', 'cloud'];
        }
        // Medium words (6-8 letters)
        else if (this.currentWave <= 7) {
            return ['quantum', 'protocol', 'algorithm', 'interface', 'terminal', 'firewall', 'encrypted',
                    'network', 'system', 'server', 'client', 'socket', 'packet', 'router', 'daemon',
                    'kernel', 'buffer', 'cache', 'thread', 'process', 'memory', 'storage', 'backup',
                    'restore', 'compile', 'execute', 'runtime', 'binary', 'hexcode', 'decrypt'];
        }
        // Hard words (8-10 letters)
        else if (this.currentWave <= 12) {
            return ['bandwidth', 'mainframe', 'synthwave', 'wavelength', 'frequency', 'amplifier', 'override',
                    'cyberdeck', 'holonet', 'datastream', 'netrunner', 'firewall', 'cyberpunk', 'hologram',
                    'database', 'backtrack', 'overclock', 'processor', 'multitask', 'firmware', 'software',
                    'hardware', 'malware', 'spyware', 'ransomware', 'antivirus', 'defender', 'intrusion'];
        }
        // Very hard words (10+ letters)
        else {
            return ['electromagnetic', 'telecommunication', 'cybersecurity', 'virtualization', 'cryptocurrency', 
                    'decentralized', 'authentication', 'synchronization', 'infrastructure', 'unprecedented',
                    'biotechnology', 'nanotechnology', 'consciousness', 'augmentation', 'transhuman',
                    'singularity', 'posthuman', 'cyberwarfare', 'surveillance', 'blockchain',
                    'neuralnetwork', 'machinelearning', 'artificialintelligence', 'quantumcomputing',
                    'biometrics', 'holographic', 'dimensional', 'multiversal', 'transcendent'];
        }
    }
    
    handleInput(e) {
        if (!this.isActive) return;
        
        this.currentInput = e.target.value.toLowerCase();
        
        if (this.currentInput.length > 0) {
            if (this.currentWord.startsWith(this.currentInput)) {
                this.elements.typingInput.classList.remove('error');
                this.elements.typingInput.classList.add('correct');
                this.elements.typingFeedback.textContent = '';
                
                // Check for complete word
                if (this.currentInput === this.currentWord) {
                    this.completeWord();
                }
            } else {
                this.elements.typingInput.classList.remove('correct');
                this.elements.typingInput.classList.add('error');
                this.elements.typingFeedback.textContent = '❌ Wrong!';
                this.isCritical = false;
                
                if (this.game.soundManager) {
                    this.game.soundManager.play('error');
                }
            }
        } else {
            this.elements.typingInput.classList.remove('correct', 'error');
            this.elements.typingFeedback.textContent = '';
        }
    }
    
    completeWord() {
        this.wordsCompleted++;
        this.totalWordsTyped++;
        
        if (this.isCritical) {
            this.totalCriticalHits++;
            this.elements.typingFeedback.textContent = '🔥 CRITICAL!';
            if (this.game.soundManager) {
                this.game.soundManager.play('critical');
            }
            if (this.game.particleSystem) {
                this.game.particleSystem.createCriticalEffect(
                    document.body,
                    'var(--neon-cyan)'
                );
            }
        } else {
            this.elements.typingFeedback.textContent = '✓ Correct!';
            if (this.game.soundManager) {
                this.game.soundManager.play('hit');
            }
            if (this.game.particleSystem) {
                this.game.particleSystem.createHitEffect(
                    document.body,
                    'var(--neon-magenta)'
                );
            }
        }
        
        // Update progress
        this.elements.wordsProgress.textContent = `${this.wordsCompleted} / ${this.wordsRequired}`;
        
        // Clear feedback after delay
        setTimeout(() => {
            this.elements.typingFeedback.textContent = '';
        }, 500);
        
        // Check if wave is complete
        if (this.wordsCompleted >= this.wordsRequired) {
            this.completeWave();
        } else {
            this.getNewWord();
        }
    }
    
    completeWave() {
        // Stop timer
        clearInterval(this.timerInterval);
        
        // Victory sound
        if (this.game.soundManager) {
            this.game.soundManager.play('victory');
        }
        
        // Show wave complete message
        this.elements.typingFeedback.textContent = `🎉 Wave ${this.currentWave} Complete!`;
        this.elements.typingFeedback.style.color = 'var(--neon-green)';
        this.elements.typingInput.disabled = true;
        
        // Advance to next wave after delay
        setTimeout(() => {
            this.elements.typingFeedback.textContent = '';
            this.elements.typingFeedback.style.color = '';
            this.currentWave++;
            this.startWave();
        }, 2000);
    }
    
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                this.gameOver();
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        this.elements.timer.textContent = `${this.timeRemaining}s`;
        
        // Change color based on time remaining
        if (this.timeRemaining <= 5) {
            this.elements.timer.style.color = 'var(--neon-red)';
            this.elements.timer.style.animation = 'pulse 0.5s infinite';
        } else if (this.timeRemaining <= 10) {
            this.elements.timer.style.color = '#ffaa00';
            this.elements.timer.style.animation = 'none';
        } else {
            this.elements.timer.style.color = 'var(--neon-cyan)';
            this.elements.timer.style.animation = 'none';
        }
    }
    
    gameOver() {
        this.isActive = false;
        
        // Stop timer
        clearInterval(this.timerInterval);
        
        // Disable input
        this.elements.typingInput.disabled = true;
        
        // Calculate survival time
        const survivalTime = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(survivalTime / 60);
        const seconds = survivalTime % 60;
        
        // Update game over screen
        this.elements.gameOverTitle.textContent = 'GAME OVER';
        this.elements.finalWave.textContent = this.currentWave;
        this.elements.totalWords.textContent = this.totalWordsTyped;
        this.elements.totalCriticals.textContent = this.totalCriticalHits;
        this.elements.survivalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Show game over screen
        this.elements.gameOverScreen.classList.remove('hidden');
        
        // Play defeat sound
        if (this.game.soundManager) {
            this.game.soundManager.play('defeat');
        }
        
        // Submit score to leaderboard
        this.submitScore();
        
        console.log(`💀 Game Over - Wave ${this.currentWave}, ${this.totalWordsTyped} words typed`);
    }
    
    async submitScore() {
        // Check if user is authenticated
        if (!window.authClient || !window.authClient.currentUser) {
            console.log('User not authenticated - score not submitted');
            return;
        }
        
        try {
            const response = await fetch('/api/endless-scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.authClient.getToken()}`
                },
                body: JSON.stringify({
                    wave: this.currentWave,
                    wordsTyped: this.totalWordsTyped,
                    criticalHits: this.totalCriticalHits,
                    survivalTime: Math.floor((Date.now() - this.startTime) / 1000)
                })
            });
            
            if (response.ok) {
                console.log('✅ Endless mode score submitted');
                this.loadLeaderboard();
            } else {
                console.error('Failed to submit endless mode score');
            }
        } catch (error) {
            console.error('Error submitting endless mode score:', error);
        }
    }
    
    async loadLeaderboard() {
        try {
            const response = await fetch('/api/endless-scores/top');
            
            if (response.ok) {
                const scores = await response.json();
                this.displayLeaderboard(scores);
            }
        } catch (error) {
            console.error('Error loading endless mode leaderboard:', error);
        }
    }
    
    displayLeaderboard(scores) {
        if (!this.elements.leaderboardList) return;
        
        this.elements.leaderboardList.innerHTML = '';
        
        if (scores.length === 0) {
            this.elements.leaderboardList.innerHTML = '<div class="no-scores">No scores yet. Be the first!</div>';
            return;
        }
        
        scores.slice(0, 10).forEach((score, index) => {
            const entry = document.createElement('div');
            entry.className = 'leaderboard-entry';
            
            const rank = document.createElement('span');
            rank.className = 'rank';
            rank.textContent = `#${index + 1}`;
            
            const username = document.createElement('span');
            username.className = 'username';
            username.textContent = score.username;
            
            const wave = document.createElement('span');
            wave.className = 'wave';
            wave.textContent = `Wave ${score.wave}`;
            
            const words = document.createElement('span');
            words.className = 'words';
            words.textContent = `${score.words_typed} words`;
            
            entry.appendChild(rank);
            entry.appendChild(username);
            entry.appendChild(wave);
            entry.appendChild(words);
            
            this.elements.leaderboardList.appendChild(entry);
        });
    }
    
    playAgain() {
        this.elements.gameOverScreen.classList.add('hidden');
        this.elements.startBtn.classList.remove('hidden');
        this.elements.backBtn.classList.remove('hidden');
    }
    
    returnToMenu() {
        this.isActive = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        if (window.showScreen) {
            window.showScreen('menu');
        }
    }
    
    show() {
        this.screen.classList.remove('hidden');
        this.loadLeaderboard();
        // Focus on start button initially
        if (this.elements.startBtn && !this.elements.startBtn.classList.contains('hidden')) {
            this.elements.startBtn.focus();
        }
    }
    
    hide() {
        this.screen.classList.add('hidden');
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }
}
