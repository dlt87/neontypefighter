// ========================================
// MAIN APPLICATION ENTRY POINT
// ========================================

let game;
let multiplayerClient;
let authClient;
let highScoreAPI;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize game
    game = new Game();
    
    // Initialize authentication
    authClient = new AuthClient();
    highScoreAPI = new HighScoreAPI();
    
    // Make them globally accessible for TimedMode
    window.authClient = authClient;
    window.highScoreAPI = highScoreAPI;
    
    // Setup auth callbacks
    authClient.onLogin = handleUserLogin;
    authClient.onLogout = handleUserLogout;
    
    // Apply saved theme on load
    game.themeManager.applyTheme();
    
    // Check for existing session
    if (authClient.currentUser) {
        updateUIForUser(authClient.currentUser);
    }
    
    // Load main menu leaderboard
    loadMainMenuLeaderboard();
    
    // Menu navigation
    const mainMenu = document.getElementById('main-menu');
    const gameScreen = document.getElementById('game-screen');
    const multiplayerLobby = document.getElementById('multiplayer-lobby');
    const themeSelector = document.getElementById('theme-selector');
    const timedModeScreen = document.getElementById('timed-mode-screen');
    
    // Auth button handlers
    document.getElementById('login-btn').addEventListener('click', () => {
        showLoginModal();
    });
    
    document.getElementById('register-btn').addEventListener('click', () => {
        showRegisterModal();
    });
    
    document.getElementById('logout-btn').addEventListener('click', () => {
        authClient.signOut();
    });
    
    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');
        
        errorEl.classList.add('hidden');
        
        const result = await authClient.login(username, password);
        
        if (result.success) {
            document.getElementById('login-modal').classList.add('hidden');
            document.getElementById('login-form').reset();
        } else {
            errorEl.textContent = result.error;
            errorEl.classList.remove('hidden');
        }
    });
    
    document.getElementById('login-cancel').addEventListener('click', () => {
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('login-form').reset();
        document.getElementById('login-error').classList.add('hidden');
    });
    
    // Register form
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const errorEl = document.getElementById('register-error');
        
        errorEl.classList.add('hidden');
        
        const result = await authClient.register(username, email, password);
        
        if (result.success) {
            document.getElementById('register-modal').classList.add('hidden');
            document.getElementById('register-form').reset();
        } else {
            errorEl.textContent = result.error;
            errorEl.classList.remove('hidden');
        }
    });
    
    document.getElementById('register-cancel').addEventListener('click', () => {
        document.getElementById('register-modal').classList.add('hidden');
        document.getElementById('register-form').reset();
        document.getElementById('register-error').classList.add('hidden');
    });
    
    // Button handlers
    document.getElementById('solo-mode-btn').addEventListener('click', () => {
        showScreen('game');
        game.startSoloGame();
    });
    
    document.getElementById('timed-mode-btn').addEventListener('click', () => {
        showScreen('timed');
        setupTimedMode();
        game.startTimedMode();
    });
    
    document.getElementById('multiplayer-mode-btn').addEventListener('click', () => {
        showScreen('multiplayer');
        initMultiplayer();
    });
    
    document.getElementById('themes-btn').addEventListener('click', () => {
        showScreen('themes');
        populateThemeSelector();
    });
    
    document.getElementById('settings-btn').addEventListener('click', () => {
        alert('Settings coming soon! AI Difficulty and customization options will be added here.');
    });
    
    // Audio control buttons
    document.getElementById('sound-toggle').addEventListener('click', (e) => {
        const enabled = game.soundManager.toggleSound();
        e.target.classList.toggle('disabled', !enabled);
        e.target.textContent = enabled ? '🔊 SFX' : '🔇 SFX';
    });
    
    document.getElementById('music-toggle').addEventListener('click', (e) => {
        const enabled = game.soundManager.toggleMusic();
        e.target.classList.toggle('disabled', !enabled);
        e.target.textContent = enabled ? '🎵 MUSIC' : '🎵 MUSIC';
    });
    
    document.getElementById('return-menu-btn').addEventListener('click', () => {
        game.reset();
        document.getElementById('game-over-overlay').classList.add('hidden');
        showScreen('menu');
    });
    
    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
        if (multiplayerClient) {
            multiplayerClient.disconnect();
        }
        showScreen('menu');
    });
    
    document.getElementById('back-from-themes-btn').addEventListener('click', () => {
        showScreen('menu');
    });
    
    // Timed mode buttons
    document.getElementById('replay-timed-btn').addEventListener('click', () => {
        document.getElementById('timed-results-overlay').classList.add('hidden');
        game.startTimedMode();
    });
    
    document.getElementById('timed-menu-btn').addEventListener('click', () => {
        document.getElementById('timed-results-overlay').classList.add('hidden');
        game.reset();
        showScreen('menu');
    });
    
    // Multiplayer lobby
    document.getElementById('find-match-btn').addEventListener('click', () => {
        const playerName = document.getElementById('player-name-input').value.trim();
        if (!playerName) {
            alert('Please enter your name!');
            return;
        }
        
        if (multiplayerClient && multiplayerClient.connected) {
            multiplayerClient.findMatch(playerName);
            document.getElementById('waiting-message').classList.remove('hidden');
            document.getElementById('find-match-btn').disabled = true;
        } else {
            alert('Not connected to server. Please check your connection.');
        }
    });
    
    function showScreen(screen) {
        mainMenu.classList.remove('active');
        mainMenu.classList.add('hidden');
        gameScreen.classList.add('hidden');
        multiplayerLobby.classList.add('hidden');
        themeSelector.classList.add('hidden');
        timedModeScreen.classList.add('hidden');
        
        if (screen === 'menu') {
            mainMenu.classList.add('active');
            mainMenu.classList.remove('hidden');
        } else if (screen === 'game') {
            gameScreen.classList.remove('hidden');
        } else if (screen === 'multiplayer') {
            multiplayerLobby.classList.remove('hidden');
        } else if (screen === 'themes') {
            themeSelector.classList.remove('hidden');
            themeSelector.style.display = 'flex';
        } else if (screen === 'timed') {
            timedModeScreen.classList.remove('hidden');
        }
    }
    
    function setupTimedMode() {
        const timedInput = document.getElementById('timed-typing-input');
        const timedCurrentWord = document.getElementById('timed-current-word');
        const timedNextWordPreview = document.getElementById('timed-next-word-preview');
        const timedFeedback = document.getElementById('timed-typing-feedback');
        
        // Clear previous listeners by cloning
        const newInput = timedInput.cloneNode(true);
        timedInput.parentNode.replaceChild(newInput, timedInput);
        
        // Set up timed mode typing with auto-complete
        newInput.addEventListener('input', (e) => {
            if (!game.timedMode || !game.timedMode.isActive) return;
            
            const value = e.target.value.toLowerCase();
            const targetWord = game.wordManager.getCurrentWord();
            
            // Auto-complete when word is fully typed correctly
            if (value === targetWord) {
                const isPerfect = game.isCritical;
                
                // Play sound
                if (isPerfect) {
                    game.soundManager.play('critical');
                    timedFeedback.textContent = '⚡ PERFECT! ⚡';
                    timedFeedback.className = 'typing-feedback critical';
                } else {
                    game.soundManager.play('hit');
                    timedFeedback.textContent = '✓ CORRECT!';
                    timedFeedback.className = 'typing-feedback';
                }
                
                // Update timed mode score
                game.timedMode.onWordCompleted(isPerfect);
                
                // Show particle effect
                const color = game.themeManager.getCurrentTheme().primary;
                
                if (isPerfect) {
                    game.particleSystem.createCriticalEffect(timedCurrentWord, color);
                } else {
                    game.particleSystem.createHitEffect(timedCurrentWord, color);
                }
                
                // Clear and show next word immediately
                newInput.value = '';
                newInput.classList.remove('correct', 'error');
                game.isCritical = true;
                
                // Display next word instantly (no delay)
                if (game.timedMode && game.timedMode.isActive) {
                    const nextWord = game.wordManager.getNextWord();
                    const previewWord = game.wordManager.getNextWordPreview();
                    timedCurrentWord.textContent = nextWord.toUpperCase();
                    timedNextWordPreview.textContent = 'NEXT: ' + previewWord.toUpperCase();
                }
                
                // Clear feedback after brief moment
                setTimeout(() => {
                    timedFeedback.textContent = '';
                }, 300);
                
                return;
            }
            
            // Check if input is on the right track
            if (targetWord.startsWith(value)) {
                newInput.classList.remove('error');
                newInput.classList.add('correct');
                if (value.length > 0) {
                    game.soundManager.play('typing');
                }
            } else {
                newInput.classList.remove('correct');
                newInput.classList.add('error');
                game.isCritical = false;
                if (value.length > 0) {
                    game.soundManager.play('error');
                }
            }
        });
        
        // Disable Enter key - auto-complete handles everything
        newInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Do nothing on Enter
            }
        });
        
        // Focus input
        newInput.focus();
    }
    
    function populateThemeSelector() {
        const themeGrid = document.getElementById('theme-grid');
        themeGrid.innerHTML = '';
        
        const themes = game.themeManager.getAllThemes();
        const currentTheme = game.themeManager.getThemeName();
        
        Object.keys(themes).forEach(themeKey => {
            const theme = themes[themeKey];
            const card = document.createElement('div');
            card.className = 'theme-card';
            card.setAttribute('data-theme', themeKey);
            
            if (themeKey === currentTheme) {
                card.classList.add('active');
            }
            
            card.innerHTML = `
                <div class="theme-name">${theme.name}</div>
                <div class="theme-description">${theme.description}</div>
                <div class="theme-preview">
                    <div class="theme-color-swatch" style="background: ${theme.primary}; color: ${theme.primary};"></div>
                    <div class="theme-color-swatch" style="background: ${theme.secondary}; color: ${theme.secondary};"></div>
                    <div class="theme-color-swatch" style="background: ${theme.accent}; color: ${theme.accent};"></div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                game.themeManager.setTheme(themeKey);
                game.soundManager.play('typing');
                
                // Update active state
                document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            });
            
            themeGrid.appendChild(card);
        });
    }
    
    function initMultiplayer() {
        if (!multiplayerClient) {
            multiplayerClient = new MultiplayerClient();
            game.multiplayerClient = multiplayerClient;
            
            multiplayerClient.on('onConnect', () => {
                updateConnectionStatus('Connected', true);
            });
            
            multiplayerClient.on('onDisconnect', () => {
                updateConnectionStatus('Disconnected - Retrying...', false);
                document.getElementById('find-match-btn').disabled = true;
            });
            
            multiplayerClient.on('onMatchFound', (data) => {
                document.getElementById('waiting-message').classList.add('hidden');
                showScreen('game');
                game.startMultiplayerGame(
                    multiplayerClient.playerName,
                    data.opponentName
                );
            });
            
            multiplayerClient.on('onOpponentAction', (data) => {
                if (game.isActive && !game.gameOver) {
                    game.dealDamage(1, data.damage, data.isCritical);
                    game.addCombatLog('player2', data.word, data.isCritical);
                }
            });
            
            multiplayerClient.on('onGameOver', (data) => {
                if (!game.gameOver) {
                    game.endGame(!data.opponentWon);
                }
            });
        }
        
        multiplayerClient.connect();
    }
    
    function updateConnectionStatus(message, connected) {
        const statusElement = document.getElementById('connection-status');
        statusElement.textContent = message;
        statusElement.className = 'connection-status ' + (connected ? 'connected' : 'disconnected');
        document.getElementById('find-match-btn').disabled = !connected;
    }
    
    function handleUserLogin(user) {
        console.log('User logged in:', user);
        updateUIForUser(user);
    }
    
    function handleUserLogout() {
        console.log('User logged out');
        updateUIForLogout();
    }
    
    function showLoginModal() {
        document.getElementById('login-modal').classList.remove('hidden');
        document.getElementById('login-username').focus();
    }
    
    function showRegisterModal() {
        document.getElementById('register-modal').classList.remove('hidden');
        document.getElementById('register-username').focus();
    }
    
    function updateUIForUser(user) {
        // Show user info, hide auth buttons
        const userInfo = document.getElementById('user-info');
        const authButtons = document.getElementById('auth-buttons');
        const userName = document.getElementById('user-name-display');
        
        userName.textContent = user.name;
        
        userInfo.classList.remove('hidden');
        authButtons.classList.add('hidden');
    }
    
    function updateUIForLogout() {
        // Hide user info, show auth buttons
        const userInfo = document.getElementById('user-info');
        const authButtons = document.getElementById('auth-buttons');
        
        userInfo.classList.add('hidden');
        authButtons.classList.remove('hidden');
    }
    
    async function loadMainMenuLeaderboard() {
        const leaderboardList = document.getElementById('main-menu-leaderboard-list');
        
        if (!window.highScoreAPI) {
            leaderboardList.innerHTML = '<div class="loading-message">API not initialized</div>';
            return;
        }
        
        try {
            const leaderboard = await highScoreAPI.getLeaderboard(10);
            
            if (!leaderboard || leaderboard.length === 0) {
                leaderboardList.innerHTML = '<div class="loading-message">No scores yet.<br>Be the first!</div>';
                return;
            }
            
            const currentUserId = authClient.currentUser?.sub;
            
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
        } catch (error) {
            console.error('Failed to load main menu leaderboard:', error);
            leaderboardList.innerHTML = '<div class="loading-message">Server offline.<br>Play to set scores!</div>';
        }
    }
    
    // Add keyboard shortcut to return to menu (ESC key)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && game.isActive && !game.gameOver) {
            if (confirm('Are you sure you want to quit the current game?')) {
                game.reset();
                showScreen('menu');
            }
        }
    });
    
    console.log('🎮 Neon Typing Fighter initialized!');
    console.log('💡 Press ESC during a game to return to menu');
});
