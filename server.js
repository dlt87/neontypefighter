// ========================================
// WEBSOCKET SERVER FOR MULTIPLAYER
// Node.js WebSocket Server + High Score API + Authentication
// ========================================

// Load environment variables from .env file in development
require('dotenv').config();

const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { initDatabase, userDb, scoreDb, achievementDb, eloDb, pool } = require('./database');
const emailService = require('./email-service');

const PORT = process.env.PORT || 8080;

// Helper function to hash passwords
function hashPassword(password, salt = null) {
    if (!salt) {
        salt = crypto.randomBytes(16).toString('hex');
    }
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { salt, hash };
}

function verifyPassword(password, salt, hash) {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
}

function generateToken(userId) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(32).toString('hex');
    const payload = `${userId}:${timestamp}:${random}`;
    return Buffer.from(payload).toString('base64');
}

function verifyToken(token) {
    try {
        const payload = Buffer.from(token, 'base64').toString('utf8');
        const parts = payload.split(':');
        if (parts.length !== 3) return null;
        
        const userId = parts[0];
        const timestamp = parseInt(parts[1]);
        
        // Token expires after 30 days
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp > thirtyDaysInMs) {
            return null;
        }
        
        return userId;
    } catch (error) {
        return null;
    }
}

// Helper function to serve static files
function serveFile(res, filePath, contentType) {
    const fullPath = path.join(__dirname, filePath);
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// Create HTTP server
const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Serve static files
    if (pathname === '/' || pathname === '/index.html') {
        serveFile(res, 'index.html', 'text/html');
        return;
    } else if (pathname.endsWith('.css')) {
        serveFile(res, pathname.substring(1), 'text/css');
        return;
    } else if (pathname.endsWith('.js')) {
        serveFile(res, pathname.substring(1), 'application/javascript');
        return;
    } else if (pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.gif')) {
        const ext = path.extname(pathname).substring(1);
        serveFile(res, pathname.substring(1), `image/${ext}`);
        return;
    }
    
    // API Routes
    if (pathname === '/api/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            smtp_configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
            smtp_host: process.env.SMTP_HOST || 'not set',
            smtp_port: process.env.SMTP_PORT || 'not set',
            smtp_user: process.env.SMTP_USER ? 'set' : 'not set',
            smtp_pass: process.env.SMTP_PASS ? 'set' : 'not set',
            app_url: process.env.APP_URL || 'not set'
        }));
    } else if (pathname === '/api/test-email' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { email } = JSON.parse(body);
                const result = await emailService.sendVerificationEmail(email || process.env.SMTP_USER, 'Test User', 'test-token-123');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: result, message: result ? 'Email sent! Check logs for details.' : 'Failed to send. Check logs.' }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else if (pathname === '/api/auth/register' && req.method === 'POST') {
        handleRegister(req, res);
    } else if (pathname === '/api/auth/login' && req.method === 'POST') {
        handleLogin(req, res);
    } else if (pathname === '/api/auth/verify-email' && req.method === 'POST') {
        handleVerifyEmail(req, res);
    } else if (pathname === '/api/auth/resend-verification' && req.method === 'POST') {
        handleResendVerification(req, res);
    } else if (pathname === '/api/auth/forgot-password' && req.method === 'POST') {
        handleForgotPassword(req, res);
    } else if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
        handleResetPassword(req, res);
    } else if (pathname === '/api/scores' && req.method === 'POST') {
        handleSubmitScore(req, res);
    } else if (pathname === '/api/leaderboard' && req.method === 'GET') {
        handleGetLeaderboard(req, res, parsedUrl.query);
    } else if (pathname.startsWith('/api/scores/') && req.method === 'GET') {
        const userId = pathname.split('/')[3];
        handleGetUserScore(req, res, userId);
    } else if (pathname === '/api/stats' && req.method === 'GET') {
        handleGetStats(req, res);
    } else if (pathname === '/api/achievements' && req.method === 'GET') {
        handleGetAchievements(req, res);
    } else if (pathname === '/api/achievements/user' && req.method === 'GET') {
        handleGetUserAchievements(req, res);
    } else if (pathname === '/api/elo/leaderboard' && req.method === 'GET') {
        handleGetEloLeaderboard(req, res);
    } else if (pathname === '/api/elo/stats' && req.method === 'GET') {
        handleGetEloStats(req, res);
    } else if (pathname === '/api/elo/history' && req.method === 'GET') {
        handleGetMatchHistory(req, res);
    } else if (pathname === '/api/match/result' && req.method === 'POST') {
        handleMatchResult(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// WebSocket server
const wss = new WebSocket.Server({ server });

// Game state
const waitingPlayers = [];
const activeMatches = new Map();
const matchEloRecorded = new Map(); // Track which matches have recorded ELO

// High Score storage (in-memory - use a database for production)
const highScores = [];
const userBestScores = new Map();

console.log(`🎮 Neon Typing Fighter Server running on port ${PORT}`);

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    const playerId = generateId();
    ws.playerId = playerId;
    ws.isAlive = true;
    
    // Send connection confirmation with lobby stats
    ws.send(JSON.stringify({
        type: 'connected',
        playerId: playerId,
        playersOnline: wss.clients.size,
        queueSize: waitingPlayers.length
    }));
    
    // Broadcast updated stats to all clients
    broadcastLobbyStats();
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
        handleDisconnect(ws);
    });
    
    ws.on('pong', () => {
        ws.isAlive = true;
    });
});

// Heartbeat to detect disconnections
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            handleDisconnect(ws);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000); // Every 30 seconds

wss.on('close', () => {
    clearInterval(interval);
});

async function handleMessage(ws, data) {
    if (data.type === 'authenticate') {
        console.log('📨 Received authenticate message with token:', data.token ? 'present' : 'missing');
    }
    
    switch (data.type) {
        case 'authenticate':
            await authenticateWebSocket(ws, data.token);
            break;
            
        case 'findMatch':
            findMatch(ws, data.playerName);
            break;
            
        case 'cancelMatch':
            cancelMatch(ws);
            break;
            
        case 'action':
            relayAction(ws, data);
            break;
            
        case 'gameOver':
            handleGameOver(ws, data);
            break;
    }
}

async function authenticateWebSocket(ws, token) {
    if (!token) {
        console.log('❌ No token provided for WebSocket authentication');
        return;
    }
    
    const userId = verifyToken(token);
    if (userId) {
        ws.userId = userId;
        
        // Get username from database
        try {
            const result = await db.query('SELECT username FROM users WHERE user_id = $1', [userId]);
            if (result.rows.length > 0) {
                ws.username = result.rows[0].username;
            }
        } catch (error) {
            console.error('Error fetching username:', error);
        }
        
        ws.send(JSON.stringify({
            type: 'authenticated',
            userId: userId,
            username: ws.username
        }));
        console.log(`✅ WebSocket authenticated for user: ${userId} (${ws.username})`);
    } else {
        console.log('❌ Invalid token for WebSocket authentication');
        ws.send(JSON.stringify({
            type: 'authError',
            error: 'Invalid token'
        }));
    }
}

function findMatch(ws, playerName) {
    // Use authenticated username if available, otherwise use provided name
    ws.playerName = ws.username || playerName;
    
    // Remove from queue first if already in it (prevents duplicates)
    const existingIndex = waitingPlayers.indexOf(ws);
    if (existingIndex > -1) {
        waitingPlayers.splice(existingIndex, 1);
    }
    
    // Check if there's a waiting player that isn't this player
    if (waitingPlayers.length > 0) {
        const opponent = waitingPlayers.shift();
        
        // Prevent self-matching (should not happen but safety check)
        if (opponent.playerId === ws.playerId) {
            console.log('Prevented self-match for:', playerName);
            waitingPlayers.push(ws);
            broadcastLobbyStats();
            return;
        }
        
        // Create match
        const matchId = generateId();
        const match = {
            id: matchId,
            player1: ws,
            player2: opponent
        };
        
        activeMatches.set(ws.playerId, matchId);
        activeMatches.set(opponent.playerId, matchId);
        
        // Notify both players
        ws.send(JSON.stringify({
            type: 'matchFound',
            matchId: matchId,
            opponentName: opponent.playerName
        }));
        
        opponent.send(JSON.stringify({
            type: 'matchFound',
            matchId: matchId,
            opponentName: ws.playerName
        }));
        
        console.log(`Match created: ${ws.playerName} vs ${opponent.playerName}`);
        
        // Broadcast updated stats
        broadcastLobbyStats();
    } else {
        // Add to waiting queue
        waitingPlayers.push(ws);
        console.log(`${playerName} added to waiting queue`);
        
        // Send queue position
        ws.send(JSON.stringify({
            type: 'queuePosition',
            position: waitingPlayers.length
        }));
        
        // Broadcast updated stats
        broadcastLobbyStats();
    }
}

function cancelMatch(ws) {
    const waitingIndex = waitingPlayers.indexOf(ws);
    if (waitingIndex > -1) {
        waitingPlayers.splice(waitingIndex, 1);
        console.log(`${ws.playerName} cancelled matchmaking`);
        broadcastLobbyStats();
    }
}

function relayAction(ws, data) {
    const matchId = activeMatches.get(ws.playerId);
    if (!matchId) return;
    
    // Find opponent
    const opponent = findOpponent(ws);
    if (opponent) {
        opponent.send(JSON.stringify({
            type: 'opponentAction',
            word: data.word,
            isCritical: data.isCritical,
            damage: data.damage
        }));
    }
}

function handleGameOver(ws, data) {
    const matchId = activeMatches.get(ws.playerId);
    if (!matchId) {
        console.log('No match found for player:', ws.playerId);
        return;
    }
    
    const opponent = findOpponent(ws);
    if (opponent) {
        opponent.send(JSON.stringify({
            type: 'gameOver',
            opponentWon: data.won
        }));
        
        // Record ELO change if both players are authenticated and not already recorded
        if (data.won && ws.userId && opponent.userId && !matchEloRecorded.get(matchId)) {
            matchEloRecorded.set(matchId, true);
            
            const winnerId = ws.userId;
            const loserId = opponent.userId;
            const matchDuration = data.matchDuration || null;
            
            console.log(`Recording ELO for match ${matchId}: Winner=${winnerId}, Loser=${loserId}`);
            
            eloDb.recordMatch(winnerId, loserId, matchDuration)
                .then(result => {
                    console.log(`✅ ELO updated: ${result.winner.name} (+${result.winner.eloChange}) vs ${result.loser.name} (${result.loser.eloChange})`);
                    
                    // Send ELO update to both players
                    ws.send(JSON.stringify({
                        type: 'eloUpdate',
                        eloChange: result.winner.eloChange,
                        newElo: result.winner.eloAfter
                    }));
                    
                    opponent.send(JSON.stringify({
                        type: 'eloUpdate',
                        eloChange: result.loser.eloChange,
                        newElo: result.loser.eloAfter
                    }));
                })
                .catch(error => {
                    console.error('❌ Error recording match result:', error);
                });
        } else {
            console.log(`ELO not recorded - won: ${data.won}, ws.userId: ${ws.userId}, opponent.userId: ${opponent.userId}, already recorded: ${matchEloRecorded.get(matchId)}`);
        }
    } else {
        console.log('No opponent found for match:', matchId);
    }
    
    // Clean up match
    cleanupMatch(ws);
    
    // Clean up ELO tracking after a delay
    setTimeout(() => {
        matchEloRecorded.delete(matchId);
    }, 5000);
}

function handleDisconnect(ws) {
    // Remove from waiting queue
    const waitingIndex = waitingPlayers.indexOf(ws);
    if (waitingIndex > -1) {
        waitingPlayers.splice(waitingIndex, 1);
    }
    
    // Notify opponent if in match
    const opponent = findOpponent(ws);
    if (opponent) {
        opponent.send(JSON.stringify({
            type: 'opponentDisconnected'
        }));
    }
    
    cleanupMatch(ws);
    
    // Broadcast updated lobby stats
    broadcastLobbyStats();
}

function broadcastLobbyStats() {
    const stats = JSON.stringify({
        type: 'lobbyStats',
        playersOnline: wss.clients.size,
        queueSize: waitingPlayers.length
    });
    
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(stats);
        }
    });
}

function findOpponent(ws) {
    const matchId = activeMatches.get(ws.playerId);
    if (!matchId) return null;
    
    for (const [playerId, mId] of activeMatches.entries()) {
        if (mId === matchId && playerId !== ws.playerId) {
            return findClientById(playerId);
        }
    }
    return null;
}

function findClientById(playerId) {
    for (const client of wss.clients) {
        if (client.playerId === playerId) {
            return client;
        }
    }
    return null;
}

function cleanupMatch(ws) {
    const matchId = activeMatches.get(ws.playerId);
    if (!matchId) return;
    
    const opponent = findOpponent(ws);
    if (opponent) {
        activeMatches.delete(opponent.playerId);
    }
    activeMatches.delete(ws.playerId);
}

function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

// ========================================
// AUTHENTICATION API HANDLERS
// ========================================

function handleRegister(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', async () => {
        try {
            const { username, email, password } = JSON.parse(body);
            
            // Validation
            if (!username || !email || !password) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Username, email, and password are required' }));
                return;
            }
            
            if (username.length < 3 || username.length > 20) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Username must be between 3 and 20 characters' }));
                return;
            }
            
            if (password.length < 6) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Password must be at least 6 characters' }));
                return;
            }
            
            // Email validation (basic)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid email format' }));
                return;
            }
            
            // Check if username exists
            const existingUsername = await userDb.findByUsername(username);
            if (existingUsername) {
                res.writeHead(409, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Username already taken' }));
                return;
            }
            
            // Check if email exists
            const existingEmail = await userDb.findByEmail(email);
            if (existingEmail) {
                res.writeHead(409, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Email already registered' }));
                return;
            }
            
            // Create user
            const userId = 'user_' + crypto.randomBytes(16).toString('hex');
            const { salt, hash } = hashPassword(password);
            
            await userDb.create(userId, username, email, hash, salt);
            
            // Generate verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            
            await userDb.setVerificationToken(userId, verificationToken, expires);
            
            // Send verification email (don't wait for it)
            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                emailService.sendVerificationEmail(email, username, verificationToken)
                    .catch(err => console.error('❌ Failed to send verification email:', err));
                console.log(`📧 Verification email queued for: ${email}`);
            } else {
                console.warn('⚠️ SMTP not configured - verification email not sent');
            }
            
            // Generate auth token
            const token = generateToken(userId);
            
            console.log(`✅ New user registered: ${username}`);
            
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                userId,
                username,
                email,
                token,
                message: 'Registration successful! Please check your email to verify your account.'
            }));
        } catch (error) {
            console.error('Registration error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
}

function handleLogin(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', async () => {
        try {
            const { emailOrUsername, password } = JSON.parse(body);
            
            if (!emailOrUsername || !password) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Email/username and password are required' }));
                return;
            }
            
            // Find user by email or username
            let user = await userDb.findByEmail(emailOrUsername);
            if (!user) {
                user = await userDb.findByUsername(emailOrUsername);
            }
            
            if (!user) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid credentials' }));
                return;
            }
            
            // Verify password
            const isValid = verifyPassword(password, user.password_salt, user.password_hash);
            
            if (!isValid) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid credentials' }));
                return;
            }
            
            // Generate token
            const token = generateToken(user.user_id);
            
            console.log(`✅ User logged in: ${user.username}`);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                userId: user.user_id,
                username: user.username,
                email: user.email,
                emailVerified: user.email_verified || false,
                token
            }));
        } catch (error) {
            console.error('Login error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
}

function handleVerifyEmail(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', async () => {
        try {
            const { token } = JSON.parse(body);
            
            if (!token) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Verification token required' }));
                return;
            }
            
            const user = await userDb.verifyEmail(token);
            
            if (!user) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid or expired verification token' }));
                return;
            }
            
            console.log(`✅ Email verified for user: ${user.username}`);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Email verified successfully!'
            }));
        } catch (error) {
            console.error('Email verification error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
}

function handleResendVerification(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', async () => {
        try {
            const { email } = JSON.parse(body);
            
            if (!email) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Email required' }));
                return;
            }
            
            const user = await userDb.findByEmail(email);
            
            if (!user) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'User not found' }));
                return;
            }
            
            if (user.email_verified) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Email already verified' }));
                return;
            }
            
            // Generate new verification token
            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            
            await userDb.setVerificationToken(user.user_id, token, expires);
            await emailService.sendVerificationEmail(user.email, user.username, token);
            
            console.log(`✅ Verification email resent to: ${user.email}`);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Verification email sent!'
            }));
        } catch (error) {
            console.error('Resend verification error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
}

function handleForgotPassword(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', async () => {
        try {
            const { email } = JSON.parse(body);
            
            if (!email) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Email required' }));
                return;
            }
            
            const user = await userDb.findByEmail(email);
            
            // Always return success to prevent email enumeration
            if (!user) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'If that email exists, a password reset link has been sent'
                }));
                return;
            }
            
            // Generate reset token
            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            
            await userDb.setResetToken(email, token, expires);
            await emailService.sendPasswordResetEmail(user.email, user.username, token);
            
            console.log(`✅ Password reset email sent to: ${user.email}`);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'If that email exists, a password reset link has been sent'
            }));
        } catch (error) {
            console.error('Forgot password error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
}

function handleResetPassword(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', async () => {
        try {
            const { token, password } = JSON.parse(body);
            
            if (!token || !password) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Token and password required' }));
                return;
            }
            
            if (password.length < 6) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Password must be at least 6 characters' }));
                return;
            }
            
            // Hash new password
            const { salt, hash } = hashPassword(password);
            
            const user = await userDb.resetPassword(token, hash, salt);
            
            if (!user) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid or expired reset token' }));
                return;
            }
            
            console.log(`✅ Password reset for user: ${user.username}`);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Password reset successfully!'
            }));
        } catch (error) {
            console.error('Reset password error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
}

// ========================================
// HIGH SCORE API HANDLERS
// ========================================

function handleSubmitScore(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', async () => {
        try {
            const data = JSON.parse(body);
            const { userId, userName, score, stats } = data;
            
            if (!userId || !userName || score === undefined) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing required fields' }));
                return;
            }
            
            // Check if user's email is verified
            const user = await userDb.findById(userId);
            
            if (!user) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'User not found' }));
                return;
            }
            
            // Email verification removed - users can submit scores without verification
            
            // Save score to database
            const scoreEntry = await scoreDb.submitScore(userId, userName, score, stats || {});
            
            // Check and unlock achievements
            const newAchievements = await achievementDb.checkAndUnlock(userId);
            
            // Get user's best score
            const userBest = await scoreDb.getUserBestScore(userId);
            const isNewBest = userBest && userBest.score === score;
            
            // Get leaderboard to calculate rank
            const leaderboard = await scoreDb.getLeaderboard(1000);
            const rank = leaderboard.findIndex(s => s.userId === userId && s.score === score) + 1;
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                rank: rank || 0,
                isNewBest,
                newAchievements: newAchievements || []
            }));
            
            if (newAchievements && newAchievements.length > 0) {
                console.log(`🏆 ${userName} unlocked ${newAchievements.length} achievement(s)!`);
            }
            console.log(`📊 Score submitted: ${userName} - ${score} points (Rank #${rank || 'N/A'})`);
        } catch (error) {
            console.error('Error handling score submission:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
}

async function handleGetLeaderboard(req, res, query) {
    try {
        const limit = parseInt(query.limit) || 10;
        const leaderboard = await scoreDb.getLeaderboard(limit);
        const stats = await scoreDb.getGlobalStats();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(leaderboard));
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

async function handleGetUserScore(req, res, userId) {
    try {
        const userBest = await scoreDb.getUserBestScore(userId);
        
        if (!userBest) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No scores found for user' }));
            return;
        }
    
    const rank = highScores.findIndex(s => s.userId === userId && s.score === userBest.score) + 1;
    
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(userBest));
    } catch (error) {
        console.error('Error getting user score:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

async function handleGetStats(req, res) {
    try {
        const stats = await scoreDb.getGlobalStats();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
    } catch (error) {
        console.error('Error getting stats:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

// Get all achievements
async function handleGetAchievements(req, res) {
    try {
        const achievements = await achievementDb.getAllAchievements();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(achievements));
    } catch (error) {
        console.error('Error getting achievements:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

// Get user's achievements with progress
async function handleGetUserAchievements(req, res) {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Authorization required' }));
            return;
        }

        const token = authHeader.replace('Bearer ', '');
        const userId = verifyToken(token);

        if (!userId) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
            return;
        }

        const achievements = await achievementDb.getUserAchievements(userId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(achievements));
    } catch (error) {
        console.error('Error getting user achievements:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

// ELO Leaderboard Handler
async function handleGetEloLeaderboard(req, res) {
    try {
        const leaderboard = await eloDb.getEloLeaderboard(50);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(leaderboard));
    } catch (error) {
        console.error('Error getting ELO leaderboard:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

// ELO Stats Handler
async function handleGetEloStats(req, res) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }

        const token = authHeader.substring(7);
        const tokenData = verifyToken(token);

        if (!tokenData) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
            return;
        }

        const userId = tokenData.userId;
        const stats = await eloDb.getUserEloStats(userId);
        
        if (!stats) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
    } catch (error) {
        console.error('Error getting ELO stats:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

// Match History Handler
async function handleGetMatchHistory(req, res) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }

        const token = authHeader.substring(7);
        const tokenData = verifyToken(token);

        if (!tokenData) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
            return;
        }

        const userId = tokenData.userId;
        const history = await eloDb.getMatchHistory(userId, 20);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(history));
    } catch (error) {
        console.error('Error getting match history:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

// Match Result Handler
async function handleMatchResult(req, res) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }

        const token = authHeader.substring(7);
        const tokenData = verifyToken(token);

        if (!tokenData) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
            return;
        }

        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { winnerId, loserId, matchDuration } = JSON.parse(body);
                
                if (!winnerId || !loserId) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing winnerId or loserId' }));
                    return;
                }
                
                // Verify the requester is one of the players
                if (tokenData.userId !== winnerId && tokenData.userId !== loserId) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Forbidden' }));
                    return;
                }
                
                const result = await eloDb.recordMatch(winnerId, loserId, matchDuration);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error) {
                console.error('Error recording match result:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });
    } catch (error) {
        console.error('Error handling match result:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

// Initialize database and start server
(async () => {
    try {
        await initDatabase();
        console.log('✅ Database initialized successfully');
        
        server.listen(PORT, () => {
            console.log(`🌐 HTTP API and WebSocket server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        process.exit(1);
    }
})();
