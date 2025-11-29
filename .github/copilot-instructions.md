# Neon Typing Fighter - AI Coding Guide

## Architecture Overview

This is a browser-based multiplayer typing game with a cyberpunk aesthetic. The architecture splits between client-side gameplay and server-side multiplayer/persistence:

**Client (Browser)**: Vanilla JS with class-based architecture. Entry point is `main.js` which initializes the `Game` class and manages screen transitions.

**Server (Node.js)**: `server.js` handles three concerns in one file:
1. WebSocket server for real-time multiplayer matchmaking/gameplay
2. RESTful HTTP API for authentication, scores, achievements
3. Static file serving (optional - can use separate HTTP server)

**Database**: PostgreSQL via `pg` pool connection. Schema initialized in `database.js` with user authentication, high scores, achievements, and ELO rating tables.

## Critical Workflows

### Development Setup
```bash
npm install
npm start  # Starts server on port 8080 (WebSocket + API + static files)
# OR for separate HTTP server:
python -m http.server 3000  # Then visit localhost:3000
```

**Environment**: Copy `.env.example` to `.env`. Required: `DATABASE_URL`, `RESEND_API_KEY` (for email verification), `APP_URL`.

### Testing
No automated tests exist. Manual testing workflow:
- Solo mode works offline (AI opponent in `ai.js`)
- Timed mode requires server for leaderboard submission
- Multiplayer requires WebSocket server and 2+ clients

## Key Patterns & Conventions

### Client-Side Class Structure
- Each major feature is a class: `Game`, `WordManager`, `ParticleSystem`, `SoundManager`, `ThemeManager`, `AIOpponent`, `TimedMode`, `MultiplayerClient`, `AuthClient`
- Classes are instantiated once in `main.js` and passed to dependent systems
- Global state lives on `Game` instance (e.g., `game.player1Health`)
- DOM manipulation happens directly in classes (no framework)

### Server Message Flow
WebSocket messages are JSON with `type` field:
- Client → Server: `{ type: 'find-match', playerName: '...' }`
- Server → Client: `{ type: 'match-found', opponent: '...', startWord: '...' }`

Match relay pattern: Server receives action from one client, broadcasts to opponent's WebSocket connection (stored in `clients` Set with `matchId` property).

### Configuration System
`config.js` exports global `CONFIG` object with:
- Game balance: `BASE_DAMAGE`, `CRITICAL_MULTIPLIER`, `PLAYER_MAX_HEALTH`
- AI behavior: `AI_TYPING_SPEED`, `AI_ERROR_RATE` per difficulty
- Network: `WEBSOCKET_URL` (must match server deployment URL)

**Important**: Changing `WEBSOCKET_URL` in `config.js` does NOT affect server port. Server port is `process.env.PORT || 8080`.

### Word System
`words.js` has two parts:
1. `WORD_POOL` array (70+ cyberpunk-themed words)
2. `WordManager` class handles word queue with 3-word lookahead for preview

Words auto-complete when typed exactly (no Enter key). Critical hits require zero mistakes in current word (`game.isCritical` flag).

### Authentication Flow
- Client-side: `auth.js` (`AuthClient` class) handles login/register via `fetch()` to `/api/auth/*` endpoints
- Server-side: `server.js` has auth routes using PBKDF2 password hashing (see `hashPassword()` function)
- Session: Base64 token with format `userId:timestamp:random`. 30-day expiry. Stored in localStorage.
- Email verification: Uses Resend API (see `email-service.js`). Tokens stored in PostgreSQL `users` table.

### Sound Architecture
All audio is procedural via Web Audio API (no audio files). `SoundManager` creates oscillators/filters on-demand. Key methods:
- `playTypingSound()` - 30ms beep per character
- `playCriticalSound()` - Ascending arpeggio for perfect words
- `playBackgroundMusic()` - 8-second C-Dm-G-Am loop (toggle-able)

### Theme System
Three color themes (`ThemeManager` in `themes.js`):
- Vaporwave (pink/cyan), Glacier (blue/white), Inferno (orange/red)
- Saved to localStorage, applied via CSS custom properties
- `ParticleSystem` reads theme colors for effects

## Integration Points

### Client ↔ Server
- **Multiplayer WebSocket**: Client connects via `MultiplayerClient.connect()` in `websocket.js`. Server broadcasts lobby stats every 2s.
- **Score Submission**: `HighScoreAPI.submitScore()` in `highscore-api.js` POSTs to `/api/scores` with auth token in header.
- **Authentication**: All auth flows hit `/api/auth/*` endpoints. Server returns token + user data.

### Database Access
`database.js` exports separate modules: `userDb`, `scoreDb`, `achievementDb`, `eloDb`. Each has CRUD methods (e.g., `userDb.create()`, `scoreDb.getTopScores()`).

**Critical**: Always use parameterized queries (`$1, $2`) to prevent SQL injection. Pattern:
```javascript
await client.query('SELECT * FROM users WHERE username = $1', [username]);
```

### External Dependencies
- **Resend API**: Email verification/reset. API key in `.env`. Fallback: Console logs if not configured.
- **Railway**: Production deployment platform (see `DATABASE_URL` auto-injection).

## Common Pitfalls

1. **WebSocket URL Mismatch**: `config.js` must have production URL for deployed client (e.g., `wss://...railway.app`). Localhost works for dev.

2. **Token Verification**: WebSocket clients must send `authenticate` message with token AFTER connection opens (see `MultiplayerClient.connect()` onopen handler).

3. **Critical Hit Logic**: `game.isCritical` starts `true`, becomes `false` on ANY mistake (including backspace). Reset to `true` only when word completes.

4. **AI Timing**: `AIOpponent` schedules word completion with `setTimeout()`. Must clear timer (`clearTimeout(this.typingTimer)`) when game ends or opponent changes.

5. **Database Schema Migrations**: `initDatabase()` uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for safe column additions. New tables should use `CREATE TABLE IF NOT EXISTS`.

## File Roles Summary

**Gameplay**: `game.js` (core loop), `ai.js` (solo opponent), `timedmode.js` (15s challenge), `words.js` (word pool)  
**Multiplayer**: `websocket.js` (client), `server.js` (matchmaking + relay)  
**Persistence**: `database.js` (PostgreSQL), `highscore-api.js` (HTTP client), `auth.js` (client auth)  
**Effects**: `particle.js` (canvas rendering), `sounds.js` (Web Audio), `themes.js` (CSS variables)  
**UI**: `main.js` (entry + navigation), `index.html` (structure), `styles.css` (cyberpunk styling)  
**Config**: `config.js` (game constants), `.env` (secrets)
