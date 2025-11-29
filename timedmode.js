// ========================================
// TIMED MODE GAME LOGIC
// ========================================

class TimedMode {
    constructor(game) {
        this.game = game;
        this.timeLimit = 15; // 15 seconds
        this.timeRemaining = this.timeLimit;
        this.score = 0;
        this.wordsCompleted = 0;
        this.perfectWords = 0;
        this.isActive = false;
        this.timerInterval = null;
        this.difficultyLevel = 1;
        
        // Scoring
        this.baseScore = 10;
        this.perfectBonus = 15;
        this.difficultyMultiplier = 1;
        
        // DOM elements
        this.elements = {
            timer: document.getElementById('timed-timer'),
            score: document.getElementById('timed-score'),
            multiplier: document.getElementById('timed-multiplier'),
            currentWord: document.getElementById('timed-current-word'),
            nextWordPreview: document.getElementById('timed-next-word-preview')
        };
    }
    
    start() {
        this.isActive = true;
        this.timeRemaining = this.timeLimit;
        this.score = 0;
        this.wordsCompleted = 0;
        this.perfectWords = 0;
        this.difficultyLevel = 1;
        this.difficultyMultiplier = 1;
        
        // Reset game state
        this.game.wordManager.reset();
        this.game.currentInput = '';
        this.game.isCritical = true;
        
        // Start timer
        this.startTimer();
        
        // Display first word and preview
        const firstWord = this.game.wordManager.getNextWord();
        const nextWord = this.game.wordManager.getNextWordPreview();
        this.elements.currentWord.textContent = firstWord.toUpperCase();
        this.elements.nextWordPreview.textContent = 'NEXT: ' + nextWord.toUpperCase();
        
        // Update UI
        this.updateUI();
        
        // Play round start sound
        this.game.soundManager.play('roundStart');
        
        console.log('⏱️ Timed Mode Started!');
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeRemaining -= 0.01; // Update every 10ms for smooth display
            
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.endGame();
            }
            
            this.updateUI();
        }, 10);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    onWordCompleted(isPerfect) {
        if (!this.isActive) return;
        
        this.wordsCompleted++;
        
        // Calculate score
        let wordScore = this.baseScore * this.difficultyMultiplier;
        if (isPerfect) {
            wordScore += this.perfectBonus * this.difficultyMultiplier;
            this.perfectWords++;
        }
        
        this.score += Math.floor(wordScore);
        
        // Increase difficulty every 3 words
        if (this.wordsCompleted % 3 === 0) {
            this.difficultyLevel++;
            this.difficultyMultiplier = 1 + (this.difficultyLevel - 1) * 0.5;
        }
        
        this.updateUI();
    }
    
    updateUI() {
        // Update timer display
        const seconds = Math.max(0, this.timeRemaining).toFixed(2);
        this.elements.timer.textContent = seconds;
        
        // Change color based on time remaining
        if (this.timeRemaining <= 3) {
            this.elements.timer.style.color = 'var(--neon-orange)';
            this.elements.timer.style.animation = 'pulse 0.5s ease-in-out infinite';
        } else if (this.timeRemaining <= 5) {
            this.elements.timer.style.color = 'var(--neon-yellow)';
            this.elements.timer.style.animation = 'none';
        } else {
            this.elements.timer.style.color = 'var(--neon-cyan)';
            this.elements.timer.style.animation = 'none';
        }
        
        // Update score
        this.elements.score.textContent = this.score;
        
        // Update multiplier
        this.elements.multiplier.textContent = `x${this.difficultyMultiplier.toFixed(1)}`;
    }
    
    endGame() {
        this.isActive = false;
        this.stopTimer();
        
        // Play defeat sound (time's up)
        this.game.soundManager.play('defeat');
        
        // Calculate stats
        const accuracy = this.wordsCompleted > 0 
            ? Math.floor((this.perfectWords / this.wordsCompleted) * 100) 
            : 0;
        
        // Save best score
        const bestScore = this.saveBestScore();
        
        // Submit score to server if logged in
        this.submitScoreToServer(accuracy);
        
        // Show results (will load leaderboard after submission)
        this.showResults(bestScore, accuracy);
        
        console.log('⏱️ Timed Mode Ended! Score:', this.score);
    }
    
    async submitScoreToServer(accuracy) {
        // Check if user is logged in
        if (!window.authClient || !window.authClient.currentUser) {
            console.log('User not logged in, skipping server submission');
            return;
        }
        
        if (!window.highScoreAPI) {
            console.error('High Score API not initialized');
            return;
        }
        
        try {
            const stats = {
                wordsCompleted: this.wordsCompleted,
                perfectWords: this.perfectWords,
                accuracy: accuracy,
                maxMultiplier: parseFloat(this.difficultyMultiplier.toFixed(1))
            };
            
            const user = window.authClient.currentUser;
            const result = await window.highScoreAPI.submitScore(
                user.userId,
                user.username,
                this.score,
                stats,
                user.token
            );
            console.log('Score submitted to server:', result);
            
            // Load and display leaderboard
            await this.loadLeaderboard();
        } catch (error) {
            console.error('Failed to submit score:', error);
        }
    }
    
    async loadLeaderboard() {
        if (!window.highScoreAPI) return;
        
        try {
            const leaderboard = await window.highScoreAPI.getLeaderboard(10);
            this.displayLeaderboard(leaderboard);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        }
    }
    
    displayLeaderboard(leaderboard) {
        const leaderboardContainer = document.getElementById('global-leaderboard');
        const leaderboardList = document.getElementById('leaderboard-list');
        
        if (!leaderboard || leaderboard.length === 0) {
            leaderboardList.innerHTML = '<div style="text-align: center; color: var(--neon-cyan); padding: 20px;">No scores yet. Be the first!</div>';
            return;
        }
        
        const currentUserId = window.authClient?.currentUser?.sub;
        
        leaderboardList.innerHTML = leaderboard.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = entry.userId === currentUserId;
            const rankClass = rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : '';
            
            return `
                <div class="leaderboard-entry ${isCurrentUser ? 'current-user' : ''}">
                    <div class="leaderboard-rank ${rankClass}">#${rank}</div>
                    <div class="leaderboard-user">${entry.userName}</div>
                    <div class="leaderboard-score">${entry.score}</div>
                </div>
            `;
        }).join('');
        
        leaderboardContainer.classList.remove('hidden');
    }
    
    saveBestScore() {
        const localBest = localStorage.getItem('neonTypingFighter_timedBest');
        const currentBest = localBest ? parseInt(localBest) : 0;
        
        if (this.score > currentBest) {
            localStorage.setItem('neonTypingFighter_timedBest', this.score);
            return this.score;
        }
        
        return currentBest;
    }
    
    getBestScore() {
        const localBest = localStorage.getItem('neonTypingFighter_timedBest');
        return localBest ? parseInt(localBest) : 0;
    }
    
    showResults(bestScore, accuracy) {
        const overlay = document.getElementById('timed-results-overlay');
        const finalScore = document.getElementById('timed-final-score');
        const bestScoreEl = document.getElementById('timed-best-score');
        const statsEl = document.getElementById('timed-stats');
        const leaderboardContainer = document.getElementById('global-leaderboard');
        
        finalScore.textContent = this.score;
        bestScoreEl.textContent = bestScore;
        
        statsEl.innerHTML = `
            <div>Words Completed: ${this.wordsCompleted}</div>
            <div>Perfect Words: ${this.perfectWords}</div>
            <div>Accuracy: ${accuracy}%</div>
            <div>Max Multiplier: x${this.difficultyMultiplier.toFixed(1)}</div>
        `;
        
        // Show new record message if applicable
        if (this.score === bestScore && this.score > 0) {
            const recordMsg = document.createElement('div');
            recordMsg.className = 'new-record-message';
            recordMsg.textContent = '🏆 NEW RECORD! 🏆';
            statsEl.prepend(recordMsg);
        }
        
        // Hide leaderboard initially (will be shown if scores are loaded)
        leaderboardContainer.classList.add('hidden');
        
        overlay.classList.remove('hidden');
    }
    
    reset() {
        this.stopTimer();
        this.isActive = false;
        this.timeRemaining = this.timeLimit;
        this.score = 0;
        this.wordsCompleted = 0;
        this.perfectWords = 0;
        this.difficultyLevel = 1;
        this.difficultyMultiplier = 1;
    }
}
