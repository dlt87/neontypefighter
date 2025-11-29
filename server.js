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
const { initDatabase, userDb, scoreDb, pool } = require('./database');
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

// High Score storage (in-memory - use a database for production)
const highScores = [];
const userBestScores = new Map();

console.log(`🎮 Neon Typing Fighter Server running on port ${PORT}`);

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    const playerId = generateId();
    ws.playerId = playerId;
    ws.isAlive = true;
    
    // Send connection confirmation
    ws.send(JSON.stringify({
        type: 'connected',
        playerId: playerId
    }));
    
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

function handleMessage(ws, data) {
    switch (data.type) {
        case 'findMatch':
            findMatch(ws, data.playerName);
            break;
            
        case 'action':
            relayAction(ws, data);
            break;
            
        case 'gameOver':
            handleGameOver(ws, data);
            break;
    }
}

function findMatch(ws, playerName) {
    ws.playerName = playerName;
    
    // Check if there's a waiting player
    if (waitingPlayers.length > 0) {
        const opponent = waitingPlayers.shift();
        
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
    } else {
        // Add to waiting queue
        waitingPlayers.push(ws);
        console.log(`${playerName} added to waiting queue`);
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
    if (!matchId) return;
    
    const opponent = findOpponent(ws);
    if (opponent) {
        opponent.send(JSON.stringify({
            type: 'gameOver',
            opponentWon: data.won
        }));
    }
    
    // Clean up match
    cleanupMatch(ws);
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
                isNewBest
            }));
            
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
