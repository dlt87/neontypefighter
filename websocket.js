// ========================================
// WEBSOCKET MULTIPLAYER CLIENT
// ========================================

class MultiplayerClient {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.playerId = null;
        this.playerName = '';
        this.opponentName = '';
        this.inMatch = false;
        this.inQueue = false;
        this.queuePosition = 0;
        this.playersOnline = 0;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.callbacks = {
            onConnect: null,
            onDisconnect: null,
            onMatchFound: null,
            onOpponentAction: null,
            onGameOver: null,
            onLobbyStats: null,
            onQueuePosition: null,
            onEloUpdate: null
        };
    }
    
    connect() {
        try {
            console.log('Attempting to connect to:', CONFIG.WEBSOCKET_URL);
            this.ws = new WebSocket(CONFIG.WEBSOCKET_URL);
            
            this.ws.onopen = () => {
                console.log('✅ Connected to multiplayer server');
                this.connected = true;
                this.reconnectAttempts = 0;
                
                // Authenticate if token available
                console.log('🔍 Checking auth:', {
                    hasAuthClient: !!window.authClient,
                    hasCurrentUser: !!(window.authClient && window.authClient.currentUser),
                    hasToken: !!(window.authClient && window.authClient.currentUser && window.authClient.currentUser.token)
                });
                
                if (window.authClient && window.authClient.currentUser && window.authClient.currentUser.token) {
                    console.log('🔐 Authenticating WebSocket with token...');
                    this.send({
                        type: 'authenticate',
                        token: window.authClient.currentUser.token
                    });
                } else {
                    console.log('⚠️ No auth token available for WebSocket - multiplayer ELO will not be tracked');
                }
                
                if (this.callbacks.onConnect) {
                    this.callbacks.onConnect();
                }
            };
            
            this.ws.onmessage = (event) => {
                console.log('📨 Received message:', event.data);
                this.handleMessage(JSON.parse(event.data));
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                console.error('WebSocket URL:', CONFIG.WEBSOCKET_URL);
                console.error('ReadyState:', this.ws?.readyState);
            };
            
            this.ws.onclose = (event) => {
                console.log('🔌 Disconnected from server. Code:', event.code, 'Reason:', event.reason);
                this.connected = false;
                if (this.callbacks.onDisconnect) {
                    this.callbacks.onDisconnect();
                }
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('❌ Failed to connect:', error);
            this.connected = false;
            if (this.callbacks.onDisconnect) {
                this.callbacks.onDisconnect();
            }
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
            setTimeout(() => {
                this.connect();
            }, CONFIG.RECONNECT_DELAY);
        }
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'connected':
                this.playerId = data.playerId;
                this.playersOnline = data.playersOnline || 0;
                if (this.callbacks.onLobbyStats) {
                    this.callbacks.onLobbyStats({
                        playersOnline: data.playersOnline,
                        queueSize: data.queueSize
                    });
                }
                break;
                
            case 'lobbyStats':
                this.playersOnline = data.playersOnline || 0;
                if (this.callbacks.onLobbyStats) {
                    this.callbacks.onLobbyStats({
                        playersOnline: data.playersOnline,
                        queueSize: data.queueSize
                    });
                }
                break;
                
            case 'queuePosition':
                this.inQueue = true;
                this.queuePosition = data.position;
                if (this.callbacks.onQueuePosition) {
                    this.callbacks.onQueuePosition(data.position);
                }
                break;
                
            case 'matchFound':
                this.inMatch = true;
                this.inQueue = false;
                this.opponentName = data.opponentName;
                if (this.callbacks.onMatchFound) {
                    this.callbacks.onMatchFound(data);
                }
                break;
                
            case 'coopMatchFound':
                this.inMatch = true;
                this.inQueue = false;
                this.opponentName = data.teammateName;
                // Treat coop match found same as regular match found
                if (this.callbacks.onMatchFound) {
                    // Convert teammateName to opponentName for consistency
                    this.callbacks.onMatchFound({
                        ...data,
                        opponentName: data.teammateName
                    });
                }
                break;
                
            case 'opponentAction':
                if (this.callbacks.onOpponentAction) {
                    this.callbacks.onOpponentAction(data);
                }
                break;
                
            case 'opponentDisconnected':
                console.log('Opponent disconnected');
                this.inMatch = false;
                if (this.callbacks.onOpponentDisconnected) {
                    this.callbacks.onOpponentDisconnected();
                }
                break;
                
            case 'gameOver':
                if (this.callbacks.onGameOver) {
                    this.callbacks.onGameOver(data);
                }
                break;
                
            case 'eloUpdate':
                console.log(`ELO Update: ${data.eloChange > 0 ? '+' : ''}${data.eloChange} (New: ${data.newElo})`);
                if (this.callbacks.onEloUpdate) {
                    this.callbacks.onEloUpdate(data);
                }
                break;
                
            case 'authenticated':
                console.log('WebSocket authenticated');
                if (data.username) {
                    this.playerName = data.username;
                    console.log('✅ Username set from server:', this.playerName);
                }
                break;
                
            case 'authError':
                console.error('WebSocket auth error:', data.error);
                break;
        }
    }
    
    send(data) {
        if (this.ws && this.connected) {
            this.ws.send(JSON.stringify(data));
        }
    }
    
    findMatch(playerName, mode = 'pvp') {
        this.playerName = playerName;
        this.inQueue = true;
        this.currentMode = mode;
        
        // Send different message type based on mode
        if (mode === 'coop') {
            this.send({
                type: 'findCoopMatch',
                playerName: playerName
            });
        } else {
            this.send({
                type: 'findMatch',
                playerName: playerName
            });
        }
    }
    
    cancelMatch() {
        this.inQueue = false;
        this.queuePosition = 0;
        
        // Send appropriate cancel message based on current mode
        if (this.currentMode === 'coop') {
            this.send({
                type: 'cancelCoopMatch'
            });
        } else {
            this.send({
                type: 'cancelMatch'
            });
        }
    }
    
    sendAction(word, isCritical, damage) {
        this.send({
            type: 'action',
            word: word,
            isCritical: isCritical,
            damage: damage
        });
    }
    
    sendGameOver(won, matchDuration = null) {
        this.send({
            type: 'gameOver',
            won: won,
            matchDuration: matchDuration
        });
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        this.inMatch = false;
    }
    
    on(event, callback) {
        this.callbacks[event] = callback;
    }
}
