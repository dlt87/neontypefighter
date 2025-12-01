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
    
    // Leaderboard tab switching
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            document.querySelectorAll('.leaderboard-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Reload leaderboard
            loadMainMenuLeaderboard();
        });
    });
    
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
    
    document.getElementById('resend-verification-btn').addEventListener('click', async () => {
        const btn = document.getElementById('resend-verification-btn');
        btn.disabled = true;
        btn.textContent = 'Sending...';
        
        try {
            const response = await fetch('https://neontypefighter-production.up.railway.app/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: authClient.currentUser.email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('✅ Verification email sent! Check your inbox.');
            } else {
                alert('❌ ' + (data.error || 'Failed to send verification email'));
            }
        } catch (error) {
            console.error('Resend verification error:', error);
            alert('❌ Failed to send verification email. Please try again.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Resend Email';
        }
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
        document.getElementById('game-start-overlay').style.display = 'flex';
    });
    
    // Game start button (Solo mode)
    document.getElementById('game-start-btn').addEventListener('click', () => {
        const difficulty = document.getElementById('ai-difficulty-select').value;
        document.getElementById('game-start-overlay').style.display = 'none';
        game.startSoloGame(difficulty);
    });
    
    document.getElementById('timed-mode-btn').addEventListener('click', () => {
        showScreen('timed');
        setupTimedMode();
        // Don't start game immediately - show start overlay instead
        document.getElementById('timed-start-overlay').style.display = 'flex';
    });
    
    // Timed mode start game button
    document.getElementById('timed-start-game-btn').addEventListener('click', () => {
        document.getElementById('timed-start-overlay').style.display = 'none';
        showTimedCountdown(() => {
            game.startTimedMode();
        });
    });
    
    // Home button handlers
    document.getElementById('game-home-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to quit and return to the menu?')) {
            game.endGame();
            showScreen('menu');
        }
    });
    
    document.getElementById('timed-home-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to quit and return to the menu? Your score will be saved.')) {
            if (game.timedMode && game.timedMode.isActive) {
                // Stop the timer and end the game properly
                game.timedMode.endGame();
            } else if (game.timedMode) {
                game.timedMode.reset();
                // Hide results overlay if visible
                document.getElementById('timed-results-overlay').classList.add('hidden');
            }
            showScreen('menu');
        }
    });
    
    document.getElementById('endless-home-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to quit and return to the menu?')) {
            if (game.endlessMode) {
                game.endlessMode.gameOver();
            }
            showScreen('menu');
        }
    });
    
    document.getElementById('endless-mode-btn').addEventListener('click', () => {
        showScreen('endless');
        if (!game.endlessMode) {
            game.endlessMode = new EndlessMode(game);
        }
        document.getElementById('endless-start-overlay').style.display = 'flex';
        game.endlessMode.show();
    });
    
    // Learn Mode button
    document.getElementById('learn-mode-btn').addEventListener('click', () => {
        showScreen('learn-mode');
        if (!game.learnMode) {
            game.learnMode = new LearnMode(game);
            game.learnMode.setupUI();
        }
    });
    
    // Endless mode start button
    document.getElementById('endless-start-game-btn').addEventListener('click', () => {
        document.getElementById('endless-start-overlay').style.display = 'none';
        if (game.endlessMode) {
            game.endlessMode.startGame();
        }
    });
    
    document.getElementById('multiplayer-mode-btn').addEventListener('click', () => {
        // Require login for multiplayer
        if (!authClient.currentUser) {
            alert('Please log in to play multiplayer matches and track your ELO rating!');
            document.getElementById('login-modal').classList.remove('hidden');
            return;
        }
        
        showScreen('multiplayer');
        initMultiplayer();
    });
    
    // Mode selection handlers
    document.getElementById('select-pvp-btn').addEventListener('click', () => {
        // Show matchmaking lobby directly
        document.getElementById('multiplayer-mode-selection').classList.add('hidden');
        document.getElementById('lobby-matchmaking').classList.remove('hidden');
        
        // Set title
        const titleEl = document.getElementById('selected-mode-title');
        if (titleEl) titleEl.textContent = 'PLAYER VS PLAYER';
        
        // Initialize multiplayer client
        if (!window.multiplayerClient) {
            window.multiplayerClient = new MultiplayerClient();
            game.multiplayerClient = window.multiplayerClient;
            window.multiplayerClient.connect();
        }
        
        // Set matchmaking mode
        if (window.multiplayerClient) {
            window.multiplayerClient.matchmakingMode = 'pvp';
        }
    });
    
    document.getElementById('change-mode-btn').addEventListener('click', () => {
        // Return to mode selection
        document.getElementById('multiplayer-mode-selection').classList.remove('hidden');
        document.getElementById('lobby-matchmaking').classList.add('hidden');
        // Cancel any active matchmaking
        if (window.multiplayerClient && window.multiplayerClient.isSearching) {
            window.multiplayerClient.cancelSearch();
        }
    });
    
    document.getElementById('themes-btn').addEventListener('click', () => {
        showScreen('themes');
        populateThemeSelector();
    });
    
    // Leaderboard show more toggle
    window.showingTop50 = false;
    document.getElementById('leaderboard-show-more').addEventListener('click', () => {
        window.showingTop50 = !window.showingTop50;
        const btn = document.getElementById('leaderboard-show-more');
        const titleEl = document.querySelector('.leaderboard-header h3');
        
        if (window.showingTop50) {
            btn.textContent = 'SHOW TOP 10';
            titleEl.textContent = '🏆 TOP 50 🏆';
        } else {
            btn.textContent = 'SHOW TOP 50';
            titleEl.textContent = '🏆 TOP 10 🏆';
        }
        
        loadMainMenuLeaderboard();
    });
    
    document.getElementById('settings-btn').addEventListener('click', () => {
        showScreen('settings');
        loadSettings();
    });
    
    document.getElementById('profile-btn').addEventListener('click', () => {
        if (!authClient.currentUser) {
            alert('Please log in to view your profile!');
            document.getElementById('login-modal').classList.remove('hidden');
            return;
        }
        showScreen('profile');
        loadPlayerProfile();
    });
    
    document.getElementById('achievements-btn').addEventListener('click', () => {
        showScreen('achievements');
        window.loadAchievements();
    });
    
    // Glossary button
    document.getElementById('glossary-btn').addEventListener('click', () => {
        showScreen('glossary');
        if (!window.techMindMap) {
            window.techMindMap = new TechMindMap('mindmap-canvas', TECH_GLOSSARY, CATEGORY_COLORS);
        }
    });
    
    // FAQ button
    document.getElementById('faq-btn').addEventListener('click', () => {
        document.getElementById('faq-modal').classList.remove('hidden');
    });
    
    document.getElementById('faq-close').addEventListener('click', () => {
        document.getElementById('faq-modal').classList.add('hidden');
    });
    
    // Word bank selector in settings
    const wordBankSelect = document.getElementById('word-bank-select');
    if (wordBankSelect) {
        // Set initial value
        wordBankSelect.value = game.wordManager.getWordBank();
        
        // Handle changes
        wordBankSelect.addEventListener('change', (e) => {
            game.wordManager.setWordBank(e.target.value);
            console.log('✅ Word bank changed to:', e.target.value);
        });
    }
    
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
        document.getElementById('play-again-btn').style.display = 'none';
        showScreen('menu');
    });
    
    document.getElementById('play-again-btn').addEventListener('click', () => {
        game.reset();
        document.getElementById('game-over-overlay').classList.add('hidden');
        showTimedCountdown(() => {
            game.startTimedMode();
        });
    });
    
    document.getElementById('multiplayer-home-btn').addEventListener('click', () => {
        if (multiplayerClient) {
            multiplayerClient.disconnect();
        }
        showScreen('menu');
    });
    
    document.getElementById('themes-home-btn').addEventListener('click', () => {
        showScreen('menu');
    });
    
    // Timed mode buttons
    document.getElementById('replay-timed-btn').addEventListener('click', () => {
        document.getElementById('timed-results-overlay').classList.add('hidden');
        showTimedCountdown(() => {
            game.startTimedMode();
        });
    });
    
    document.getElementById('timed-menu-btn').addEventListener('click', () => {
        document.getElementById('timed-results-overlay').classList.add('hidden');
        game.reset();
        showScreen('menu');
        // Reload leaderboard when returning to menu
        loadMainMenuLeaderboard();
    });
    
    // Multiplayer lobby
    document.getElementById('find-match-btn').addEventListener('click', () => {
        const playerName = authClient.currentUser ? authClient.currentUser.username : 'Guest';
        
        console.log('🔍 Finding PvP match for:', playerName);
        
        // Use regular multiplayer client for PvP
        if (multiplayerClient && multiplayerClient.connected) {
            multiplayerClient.findMatch(playerName, 'pvp');
            document.getElementById('waiting-message').classList.remove('hidden');
            document.getElementById('find-match-btn').style.display = 'none';
            document.getElementById('cancel-match-btn').style.display = '';
        } else {
            alert('Not connected to server. Please check your connection.');
        }
    });
    
    document.getElementById('cancel-match-btn').addEventListener('click', () => {
        const mode = multiplayerClient.matchmakingMode || 'pvp';
        
        if (mode === 'coop' && game.coopMode) {
            game.coopMode.cancelMatchmaking();
        } else if (multiplayerClient) {
            multiplayerClient.cancelMatch();
        }
        
        document.getElementById('waiting-message').classList.add('hidden');
        document.getElementById('find-match-btn').style.display = '';
        document.getElementById('cancel-match-btn').style.display = 'none';
    });
    
    function showScreen(screen) {
        const settingsMenu = document.getElementById('settings-menu');
        const achievementsScreen = document.getElementById('achievements-screen');
        const profileScreen = document.getElementById('profile-screen');
        const glossaryScreen = document.getElementById('glossary-screen');
        const endlessModeScreen = document.getElementById('endless-mode-screen');
        const learnModeScreen = document.getElementById('learn-mode-screen');
        
        mainMenu.classList.remove('active');
        mainMenu.classList.add('hidden');
        gameScreen.classList.add('hidden');
        multiplayerLobby.classList.add('hidden');
        multiplayerLobby.classList.remove('active');
        themeSelector.classList.add('hidden');
        timedModeScreen.classList.add('hidden');
        settingsMenu.classList.add('hidden');
        settingsMenu.classList.remove('active');
        achievementsScreen.classList.add('hidden');
        achievementsScreen.classList.remove('active');
        if (profileScreen) {
            profileScreen.classList.add('hidden');
            profileScreen.classList.remove('active');
        }
        if (glossaryScreen) {
            glossaryScreen.classList.add('hidden');
            glossaryScreen.classList.remove('active');
        }
        if (endlessModeScreen) {
            endlessModeScreen.classList.add('hidden');
            endlessModeScreen.classList.remove('active');
        }
        if (learnModeScreen) {
            learnModeScreen.classList.add('hidden');
            learnModeScreen.classList.remove('active');
        }
        
        if (screen === 'menu') {
            mainMenu.classList.add('active');
            mainMenu.classList.remove('hidden');
        } else if (screen === 'game') {
            gameScreen.classList.remove('hidden');
        } else if (screen === 'multiplayer') {
            multiplayerLobby.classList.remove('hidden');
            multiplayerLobby.classList.add('active');
        } else if (screen === 'themes') {
            themeSelector.classList.remove('hidden');
            themeSelector.style.display = 'flex';
        } else if (screen === 'timed') {
            timedModeScreen.classList.remove('hidden');
        } else if (screen === 'endless') {
            if (endlessModeScreen) {
                endlessModeScreen.classList.remove('hidden');
                endlessModeScreen.classList.add('active');
            }
        } else if (screen === 'settings') {
            settingsMenu.classList.remove('hidden');
            settingsMenu.classList.add('active');
        } else if (screen === 'achievements') {
            achievementsScreen.classList.remove('hidden');
            achievementsScreen.classList.add('active');
        } else if (screen === 'profile') {
            if (profileScreen) {
                profileScreen.classList.remove('hidden');
                profileScreen.classList.add('active');
            }
        } else if (screen === 'glossary') {
            if (glossaryScreen) {
                glossaryScreen.classList.remove('hidden');
                glossaryScreen.classList.add('active');
            }
        } else if (screen === 'learn-mode') {
            if (learnModeScreen) {
                learnModeScreen.classList.remove('hidden');
                learnModeScreen.classList.add('active');
            }
        }
    }
    
    // Make showScreen globally accessible for other modules
    window.showScreen = showScreen;
    
    function setupTimedMode() {
        const timedInput = document.getElementById('timed-typing-input');
        const timedCurrentWord = document.getElementById('timed-current-word');
        const timedNextWordPreview = document.getElementById('timed-next-word-preview');
        const timedFeedback = document.getElementById('timed-typing-feedback');
        
        // Hide results overlay if it's visible from previous game
        const resultsOverlay = document.getElementById('timed-results-overlay');
        if (resultsOverlay) {
            resultsOverlay.classList.add('hidden');
        }
        
        // Reset timed mode if it exists
        if (game.timedMode) {
            game.timedMode.reset();
        }
        
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
                game.timedMode.onWordCompleted(isPerfect, targetWord);
                
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
    
    function selectMultiplayerMode(mode) {
        // Hide mode selection, show matchmaking area
        document.getElementById('multiplayer-mode-selection').classList.add('hidden');
        document.getElementById('lobby-matchmaking').classList.remove('hidden');
        
        // Update UI based on selected mode
        const titleEl = document.getElementById('selected-mode-title');
        const searchingTextEl = document.getElementById('searching-text');
        const findMatchBtn = document.getElementById('find-match-btn');
        
        if (mode === 'pvp') {
            titleEl.textContent = 'PLAYER VS PLAYER';
            searchingTextEl.textContent = 'Searching for opponent...';
            findMatchBtn.textContent = 'FIND MATCH';
            
            // Set matchmaking mode for WebSocket
            if (window.multiplayerClient) {
                window.multiplayerClient.matchmakingMode = 'pvp';
            }
        } else if (mode === 'coop') {
            titleEl.textContent = 'CO-OP MODE';
            searchingTextEl.textContent = 'Searching for teammate...';
            findMatchBtn.textContent = 'FIND TEAMMATE';
            
            // Initialize co-op mode immediately if not already
            if (!game.coopMode) {
                console.log('🤝 Initializing CoopMode...');
                game.coopMode = new CoopMode(game);
            }
            
            // Set matchmaking mode
            if (window.multiplayerClient) {
                window.multiplayerClient.matchmakingMode = 'coop';
            }
        }
    }
    
    function initMultiplayer() {
        // Show mode selection by default
        document.getElementById('multiplayer-mode-selection').classList.remove('hidden');
        document.getElementById('lobby-matchmaking').classList.add('hidden');
        
        if (!multiplayerClient) {
            multiplayerClient = new MultiplayerClient();
            game.multiplayerClient = multiplayerClient;
            
            multiplayerClient.on('onConnect', () => {
                console.log('📡 Multiplayer connected - enabling Find Match button');
                updateConnectionStatus('Connected', true);
                document.getElementById('lobby-stats').classList.remove('hidden');
            });
            
            multiplayerClient.on('onDisconnect', () => {
                updateConnectionStatus('Disconnected - Retrying...', false);
                document.getElementById('find-match-btn').disabled = true;
                document.getElementById('lobby-stats').classList.add('hidden');
            });
            
            multiplayerClient.on('onLobbyStats', (stats) => {
                document.getElementById('players-online').textContent = stats.playersOnline;
                document.getElementById('queue-position').textContent = stats.queueSize;
            });
            
            multiplayerClient.on('onQueuePosition', (position) => {
                console.log('Queue position:', position);
            });
            
            multiplayerClient.on('onMatchFound', (data) => {
                document.getElementById('waiting-message').classList.add('hidden');
                document.getElementById('find-match-btn').style.display = '';
                document.getElementById('cancel-match-btn').style.display = 'none';
                
                // Use authenticated username or fallback to account username
                const playerName = multiplayerClient.playerName || (authClient.currentUser ? authClient.currentUser.username : 'Player');
                const mode = multiplayerClient.currentMode || 'pvp';
                console.log('🎮 Match found - Mode:', mode, 'Player:', playerName, 'Opponent:', data.opponentName);
                
                // Show countdown overlay
                const partnerLabel = mode === 'coop' ? 'teammate' : 'opponent';
                showMatchCountdown(data.opponentName, () => {
                    if (mode === 'coop') {
                        // Start co-op game
                        showScreen('coop');
                        if (game.coopMode) {
                            game.coopMode.startMultiplayerGame(playerName, data.opponentName);
                        }
                    } else {
                        // Start PvP game
                        showScreen('game');
                        game.startMultiplayerGame(playerName, data.opponentName);
                    }
                }, partnerLabel);
            });
            
            multiplayerClient.on('onOpponentAction', (data) => {
                if (game.isActive && !game.gameOver) {
                    game.dealDamage(1, data.damage, data.isCritical);
                    game.addCombatLog('player2', data.word, data.isCritical);
                }
            });
            
            multiplayerClient.on('onOpponentDisconnected', () => {
                if (game.isActive && !game.gameOver) {
                    alert('Opponent disconnected! You win by default.');
                    game.endGame(true);
                }
            });
            
            multiplayerClient.on('onGameOver', (data) => {
                if (!game.gameOver) {
                    game.endGame(!data.opponentWon);
                }
            });
            
            multiplayerClient.on('onEloUpdate', (data) => {
                console.log('📊 ELO Update received:', data);
                // Store ELO change for display in game over screen
                game.lastEloChange = data.eloChange;
                game.lastElo = data.newElo;
                console.log('✅ Stored ELO in game:', game.lastEloChange, game.lastElo);
                
                // Reload ELO leaderboard if we're viewing it
                const currentTab = document.querySelector('.leaderboard-tab.active');
                if (currentTab && currentTab.textContent === 'ELO') {
                    loadEloLeaderboard();
                }
            });
        }
        
        multiplayerClient.connect();
    }
    
    function updateConnectionStatus(message, connected) {
        const statusElement = document.getElementById('connection-status');
        const findMatchBtn = document.getElementById('find-match-btn');
        
        console.log('🔄 Updating connection status:', message, 'Connected:', connected);
        
        statusElement.textContent = message;
        statusElement.className = 'connection-status ' + (connected ? 'connected' : 'disconnected');
        findMatchBtn.disabled = !connected;
        
        console.log('🎮 Find Match button disabled state:', findMatchBtn.disabled);
    }
    
    function showMatchCountdown(opponentName, onComplete, partnerType = 'opponent') {
        const overlay = document.getElementById('match-countdown-overlay');
        const opponentFoundText = document.querySelector('.opponent-found-text');
        const opponentDisplay = document.getElementById('opponent-name-display');
        const countdownNumber = document.getElementById('countdown-number');
        
        // Update text based on partner type
        if (partnerType === 'teammate') {
            opponentFoundText.textContent = 'TEAMMATE FOUND!';
        } else {
            opponentFoundText.textContent = 'OPPONENT FOUND!';
        }
        
        opponentDisplay.textContent = opponentName;
        overlay.classList.remove('hidden');
        
        let count = 3;
        countdownNumber.textContent = count;
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownNumber.textContent = count;
                // Restart animation
                countdownNumber.style.animation = 'none';
                setTimeout(() => {
                    countdownNumber.style.animation = 'countdownPulse 1s ease-in-out';
                }, 10);
            } else {
                clearInterval(countdownInterval);
                overlay.classList.add('hidden');
                
                // Reset text for next time
                opponentFoundText.textContent = 'OPPONENT FOUND!';
                
                onComplete();
            }
        }, 1000);
    }
    
    function showTimedCountdown(onComplete) {
        const overlay = document.getElementById('match-countdown-overlay');
        const opponentFoundText = document.querySelector('.opponent-found-text');
        const opponentDisplay = document.getElementById('opponent-name-display');
        const countdownNumber = document.getElementById('countdown-number');
        
        opponentFoundText.textContent = 'GET READY!';
        opponentDisplay.textContent = 'MATCH STARTING!';
        overlay.classList.remove('hidden');
        
        let count = 3;
        countdownNumber.textContent = count;
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownNumber.textContent = count;
                // Restart animation
                countdownNumber.style.animation = 'none';
                setTimeout(() => {
                    countdownNumber.style.animation = 'countdownPulse 1s ease-in-out';
                }, 10);
            } else {
                clearInterval(countdownInterval);
                overlay.classList.add('hidden');
                // Reset text for multiplayer
                opponentFoundText.textContent = 'OPPONENT FOUND!';
                onComplete();
            }
        }, 1000);
    }
    
    function handleUserLogin(user) {
        console.log('User logged in:', user);
        updateUIForUser(user);
        
        // Re-authenticate multiplayer WebSocket if connected
        if (multiplayerClient && multiplayerClient.connected) {
            console.log('🔄 Re-authenticating existing WebSocket connection...');
            multiplayerClient.send({
                type: 'authenticate',
                token: authClient.currentUser.token
            });
        }
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
        const verificationStatus = document.getElementById('verification-status');
        const unverifiedBadge = document.getElementById('unverified-badge');
        
        userName.textContent = user.name;
        
        // Show/hide verification badge
        if (user.emailVerified === false) {
            verificationStatus.classList.remove('hidden');
        } else {
            verificationStatus.classList.add('hidden');
        }
        
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
        
        // Check which tab is active
        const activeTab = document.querySelector('.leaderboard-tab.active');
        const tabType = activeTab ? activeTab.dataset.tab : 'timed';
        const limit = window.showingTop50 ? 50 : 10;
        
        try {
            if (tabType === 'elo') {
                await loadEloLeaderboard(limit);
            } else if (tabType === 'endless') {
                await loadEndlessLeaderboard(limit);
            } else {
                await loadTimedLeaderboard(limit);
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            leaderboardList.innerHTML = '<div class="loading-message">Server offline.<br>Play to set scores!</div>';
        }
    }
    
    async function loadTimedLeaderboard(limit = 10) {
        const leaderboardList = document.getElementById('main-menu-leaderboard-list');
        
        try {
            const leaderboard = await highScoreAPI.getLeaderboard(limit);
            
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
            console.error('Failed to load timed leaderboard:', error);
            throw error;
        }
    }
    
    async function loadEloLeaderboard(limit = 10) {
        const leaderboardList = document.getElementById('main-menu-leaderboard-list');
        
        try {
            console.log('📊 Fetching ELO leaderboard...');
            const response = await fetch(`https://neontypefighter-production.up.railway.app/api/elo/leaderboard?limit=${limit}`);
            if (!response.ok) {
                throw new Error('Failed to fetch ELO leaderboard');
            }
            
            const leaderboard = await response.json();
            console.log('✅ ELO leaderboard data:', leaderboard);
            
            if (!leaderboard || leaderboard.length === 0) {
                leaderboardList.innerHTML = '<div class="loading-message">No ranked matches yet.<br>Play multiplayer!</div>';
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
                        <div class="leaderboard-user">${entry.username}</div>
                        <div class="leaderboard-score">${entry.eloRating} <span style="font-size:0.8em;opacity:0.7">(${entry.wins}W/${entry.losses}L)</span></div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Failed to load ELO leaderboard:', error);
            leaderboardList.innerHTML = '<div class="loading-message">Server offline.<br>Play to set scores!</div>';
        }
    }
    
    async function loadEndlessLeaderboard(limit = 10) {
        const leaderboardList = document.getElementById('main-menu-leaderboard-list');
        
        try {
            const response = await fetch(`https://neontypefighter-production.up.railway.app/api/endless-scores/top?limit=${limit}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch endless leaderboard');
            }
            
            const leaderboard = await response.json();
            
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
                        <div class="leaderboard-score">Wave ${entry.wave} <span style="font-size:0.8em;opacity:0.7">(${entry.wordsTyped} words)</span></div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Failed to load endless leaderboard:', error);
            leaderboardList.innerHTML = '<div class="loading-message">Server offline.<br>Play to set scores!</div>';
        }
    }

    // Settings Management
    function loadSettings() {
        const soundVolume = localStorage.getItem('soundVolume') || '50';
        const musicVolume = localStorage.getItem('musicVolume') || '30';
        const muteSounds = localStorage.getItem('muteSounds') === 'true';
        const difficulty = localStorage.getItem('difficulty') || 'medium';
        const showFps = localStorage.getItem('showFps') === 'true';
        const reduceParticles = localStorage.getItem('reduceParticles') === 'true';
        const screenShake = localStorage.getItem('screenShake') === 'true';
        const musicTrack = localStorage.getItem('musicTrack') || 'NEON1';

        document.getElementById('sound-volume').value = soundVolume;
        document.getElementById('sound-volume-value').textContent = soundVolume + '%';
        document.getElementById('music-volume').value = musicVolume;
        document.getElementById('music-volume-value').textContent = musicVolume + '%';

    // Achievements Management
    window.loadAchievements = async function() {
        const achievementsGrid = document.getElementById('achievements-grid');
        const unlockedCount = document.getElementById('unlocked-count');
        const totalCount = document.getElementById('total-count');
        
        if (!authClient.currentUser) {
            achievementsGrid.innerHTML = '<div class="loading-message">Please log in to view achievements</div>';
            unlockedCount.textContent = '0';
            totalCount.textContent = '0';
            return;
        }
        
        try {
            achievementsGrid.innerHTML = '<div class="loading-message">Loading achievements...</div>';
            
            const token = authClient.token;
            const response = await fetch('https://neontypefighter-production.up.railway.app/api/achievements/user', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch achievements');
            }
            
            const achievements = await response.json();
            
            const unlocked = achievements.filter(a => a.unlocked).length;
            unlockedCount.textContent = unlocked;
            totalCount.textContent = achievements.length;
            
            achievementsGrid.innerHTML = achievements.map(achievement => {
                const isUnlocked = achievement.unlocked;
                const tierClass = `tier-${achievement.tier}`;
                const lockedClass = isUnlocked ? 'unlocked' : 'locked';
                
                return `
                    <div class="achievement-card ${tierClass} ${lockedClass}">
                        <div class="achievement-icon">${achievement.icon}</div>
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                        ${isUnlocked 
                            ? `<div class="achievement-unlocked-date">✓ Unlocked: ${new Date(achievement.unlocked_at).toLocaleDateString()}</div>`
                            : `<div class="achievement-progress">🔒 ${achievement.requirement}</div>`
                        }
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Failed to load achievements:', error);
            achievementsGrid.innerHTML = '<div class="loading-message">Failed to load achievements</div>';
            unlockedCount.textContent = '0';
            totalCount.textContent = '0';
        }
    }
    
    // Achievement Toast Notification
    window.showAchievementToast = function(achievement) {
        const toast = document.getElementById('achievement-toast');
        const icon = toast.querySelector('.achievement-toast-icon');
        const name = toast.querySelector('.achievement-toast-name');
        
        icon.textContent = achievement.icon;
        name.textContent = achievement.name;
        
        toast.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 5000);
    };

        document.getElementById('mute-sounds').checked = muteSounds;
        document.getElementById('difficulty').value = difficulty;
        document.getElementById('show-fps').checked = showFps;
        document.getElementById('reduce-particles').checked = reduceParticles;
        document.getElementById('screen-shake').checked = screenShake;
        document.getElementById('music-track').value = musicTrack;

        applySettings();
    }

    function saveSettings() {
        localStorage.setItem('soundVolume', document.getElementById('sound-volume').value);
        localStorage.setItem('musicVolume', document.getElementById('music-volume').value);
        localStorage.setItem('muteSounds', document.getElementById('mute-sounds').checked);
        localStorage.setItem('difficulty', document.getElementById('difficulty').value);
        localStorage.setItem('showFps', document.getElementById('show-fps').checked);
        localStorage.setItem('reduceParticles', document.getElementById('reduce-particles').checked);
        localStorage.setItem('screenShake', document.getElementById('screen-shake').checked);
        localStorage.setItem('musicTrack', document.getElementById('music-track').value);
        applySettings();
    }

    function applySettings() {
        const soundVolume = parseInt(document.getElementById('sound-volume').value);
        const musicVolume = parseInt(document.getElementById('music-volume').value);
        const muteSounds = document.getElementById('mute-sounds').checked;
        const difficulty = document.getElementById('difficulty').value;
        const musicTrack = document.getElementById('music-track').value;
        
        // Apply sound volume
        if (game && game.soundManager) {
            game.soundManager.setVolume(muteSounds ? 0 : soundVolume / 100);
            game.soundManager.setMusicVolume(muteSounds ? 0 : musicVolume / 100);
            game.soundManager.currentTrack = musicTrack;
            game.soundManager.loadMusicTrack(musicTrack);
        }

        // Apply AI difficulty
        if (game && difficulty) {
            game.aiDifficulty = difficulty;
        }

        console.log('⚙️ Settings applied:', { soundVolume, musicVolume, muteSounds, difficulty, musicTrack });
    }

    // Settings event listeners
    document.getElementById('sound-volume').addEventListener('input', (e) => {
        document.getElementById('sound-volume-value').textContent = e.target.value + '%';
        saveSettings();
    });

    document.getElementById('music-volume').addEventListener('input', (e) => {
        document.getElementById('music-volume-value').textContent = e.target.value + '%';
        saveSettings();
    });

    document.getElementById('mute-sounds').addEventListener('change', saveSettings);
    document.getElementById('difficulty').addEventListener('change', saveSettings);
    document.getElementById('show-fps').addEventListener('change', saveSettings);
    document.getElementById('reduce-particles').addEventListener('change', saveSettings);
    document.getElementById('screen-shake').addEventListener('change', saveSettings);
    
    document.getElementById('music-track').addEventListener('change', (e) => {
        const trackName = e.target.value;
        game.soundManager.loadMusicTrack(trackName);
        saveSettings();
    });

    document.getElementById('settings-home-btn').addEventListener('click', () => {
        showScreen('menu');
        loadMainMenuLeaderboard();
    });
    
    document.getElementById('achievements-home-btn').addEventListener('click', () => {
        showScreen('menu');
        loadMainMenuLeaderboard();
    });
    
    document.getElementById('profile-home-btn').addEventListener('click', () => {
        showScreen('menu');
        loadMainMenuLeaderboard();
    });
    
    document.getElementById('glossary-home-btn').addEventListener('click', () => {
        showScreen('menu');
        loadMainMenuLeaderboard();
    });
    
    // Glossary controls
    document.getElementById('close-definition-btn').addEventListener('click', () => {
        document.getElementById('word-definition-panel').classList.add('hidden');
        if (window.techMindMap) {
            window.techMindMap.selectedNode = null;
        }
    });
    
    document.getElementById('reset-view-btn').addEventListener('click', () => {
        if (window.techMindMap) {
            window.techMindMap.reset();
        }
    });
    
    document.getElementById('toggle-physics-btn').addEventListener('click', (e) => {
        if (window.techMindMap) {
            window.techMindMap.physicsEnabled = !window.techMindMap.physicsEnabled;
            e.target.textContent = `Physics: ${window.techMindMap.physicsEnabled ? 'ON' : 'OFF'}`;
        }
    });
    
    document.getElementById('glossary-search').addEventListener('input', (e) => {
        const query = e.target.value.trim();
        const suggestionsContainer = document.getElementById('search-suggestions');
        
        if (window.techMindMap && query) {
            // Get suggestions
            const suggestions = window.techMindMap.getSuggestions(query);
            
            if (suggestions.length > 0) {
                suggestionsContainer.innerHTML = suggestions.map(word => 
                    `<div class="search-suggestion-item" data-word="${word}">${word}</div>`
                ).join('');
                suggestionsContainer.classList.remove('hidden');
            } else {
                suggestionsContainer.classList.add('hidden');
            }
        } else {
            suggestionsContainer.classList.add('hidden');
        }
    });
    
    // Category filter for glossary
    const categoryFilter = document.getElementById('glossary-category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            if (window.techMindMap) {
                window.techMindMap.setCategory(e.target.value);
            }
        });
    }
    
    // Handle suggestion clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('search-suggestion-item')) {
            const word = e.target.dataset.word;
            document.getElementById('glossary-search').value = word;
            document.getElementById('search-suggestions').classList.add('hidden');
            if (window.techMindMap) {
                window.techMindMap.searchWord(word);
            }
        }
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        const searchContainer = e.target.closest('.glossary-header');
        if (!searchContainer) {
            document.getElementById('search-suggestions')?.classList.add('hidden');
        }
    });
    
    // Profile loading function - shows only high scores
    async function loadPlayerProfile() {
        if (!authClient.currentUser) {
            return;
        }
        
        const user = authClient.currentUser;
        document.getElementById('profile-username').textContent = user.username;
        
        // Load Timed Mode High Score
        try {
            const response = await fetch(`https://neontypefighter-production.up.railway.app/api/scores/user/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                document.getElementById('timed-highscore').textContent = data.score || 0;
            } else {
                document.getElementById('timed-highscore').textContent = '0';
            }
        } catch (error) {
            console.error('Failed to load timed score:', error);
            document.getElementById('timed-highscore').textContent = '--';
        }
        
        // Load Endless Mode High Score
        try {
            const response = await fetch(`https://neontypefighter-production.up.railway.app/api/endless-scores/user/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                document.getElementById('endless-highscore').textContent = data.wave || 0;
            } else {
                document.getElementById('endless-highscore').textContent = '0';
            }
        } catch (error) {
            console.error('Failed to load endless score:', error);
            document.getElementById('endless-highscore').textContent = '--';
        }
        
        // Load PvP ELO (current rating + best rating)
        try {
            const response = await fetch(`https://neontypefighter-production.up.railway.app/api/elo/stats`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('📊 ELO Stats received:', data);
                // Use eloRating from database (defaults to 1200 if not set)
                const currentElo = data.eloRating || 1200;
                const bestElo = data.peak_rating || data.peakRating || currentElo;
                document.getElementById('profile-elo').textContent = `Current ELO: ${currentElo}`;
                document.getElementById('pvp-highscore').textContent = bestElo;
            } else {
                document.getElementById('profile-elo').textContent = 'ELO: 1200';
                document.getElementById('pvp-highscore').textContent = '1200';
            }
        } catch (error) {
            console.error('Failed to load ELO:', error);
            document.getElementById('profile-elo').textContent = 'ELO: N/A';
            document.getElementById('pvp-highscore').textContent = '--';
        }
    }
    
    // Co-op mode handlers are now in CoopMode class (setupUI method)
    
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
    
    // Auto-start background music
    setTimeout(() => {
        if (game && game.soundManager && game.soundManager.musicEnabled) {
            game.soundManager.startBackgroundMusic();
        }
    }, 500);
});
