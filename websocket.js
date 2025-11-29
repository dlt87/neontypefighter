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
            onQueuePosition: null
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
        }
    }
    
    send(data) {
        if (this.ws && this.connected) {
            this.ws.send(JSON.stringify(data));
        }
    }
    
    findMatch(playerName) {
        this.playerName = playerName;
        this.inQueue = true;
        this.send({
            type: 'findMatch',
            playerName: playerName
        });
    }
    
    cancelMatch() {
        this.inQueue = false;
        this.queuePosition = 0;
        this.send({
            type: 'cancelMatch'
        });
    }
    
    sendAction(word, isCritical, damage) {
        this.send({
            type: 'action',
            word: word,
            isCritical: isCritical,
            damage: damage
        });
    }
    
    sendGameOver(won) {
        this.send({
            type: 'gameOver',
            won: won
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
