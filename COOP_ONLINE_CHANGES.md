# Co-op Mode: Online Multiplayer Conversion

## Overview
Converted the co-op mode from local 2-player-1-keyboard to online matchmaking similar to PvP multiplayer.

## Changes Made

### Client-Side: `coopmode.js`

#### Removed (Local Features)
- Dual input handling (player1Input, player2Input simultaneously)
- Local boss attack timer (client-side setTimeout)
- Methods: `setupInputHandlers()`, `assignNewWords()`, `checkPlayer1Word()`, `checkPlayer2Word()`, `player1CompleteWord()`, `player2CompleteWord()`, `damageBoSS()`, `scheduleBossAttack()`, `bossAttack()`

#### Added (Online Features)
- **WebSocket Connection**: `connectToServer()`, `send()`, `handleMessage()`
- **Matchmaking**: `findMatch()`, `cancelMatch()`, `showMatchmaking()`, `onMatchFound()`
- **Player Assignment**: `playerNumber` (1 or 2), `teammateName`
- **Single Input Handler**: `setupInputHandler()` - each player only types their own words
- **Server Sync Methods**:
  - `assignNewWord()` - Get word for current player only
  - `checkMyWord()` - Validate current player's typing
  - `completeWord()` - Send action to server
  - `onTeammateAction()` - Display teammate's attacks
  - `handleBossAttack()` - Receive boss attacks from server
  - `handleGameOver()` - Sync game end state
  - `handleTeammateDisconnected()` - Handle teammate leaving

#### Flow
1. Click "START" → `findMatch()` connects to WebSocket
2. Server matches 2 players → `onMatchFound()` assigns player numbers
3. `startMatch()` enables only my input (player 1 or 2)
4. Type word → `completeWord()` sends to server
5. Server relays to teammate → `onTeammateAction()` shows teammate's damage
6. Server sends boss attacks every 5s → `handleBossAttack()` updates health
7. Victory/defeat → `victory()/defeat()` notifies server → `handleGameOver()` shows results

### Server-Side: `server.js`

#### Added State
```javascript
const waitingCoopPlayers = [];
const activeCoopMatches = new Map();
const bossAttackTimers = new Map();
```

#### Added Message Handlers
- `'findCoopMatch'` → `findCoopMatch(ws, data)`
- `'cancelCoopMatch'` → `cancelCoopMatch(ws)`
- `'coopAction'` → `relayCoopAction(ws, data)`
- `'coopGameOver'` → `handleCoopGameOver(ws, data)`

#### Match Structure
```javascript
{
  id: 'coop-match-uuid',
  player1: WebSocket,
  player2: WebSocket,
  bossHealth: 300,
  teamHealth: 200
}
```

#### Boss Attack System
- `startBossAttackTimer(matchId)` - Starts 5s interval after match creation
- Boss attacks reduce `match.teamHealth` by 20
- Broadcasts `bossAttack` message to both players with updated teamHealth
- `clearBossAttackTimer(matchId)` - Stops timer on game over or disconnect

#### Relay System
- **Teammate Actions**: `relayCoopAction()` updates boss health server-side, broadcasts to teammate
- **Boss Attacks**: Server-controlled interval ensures synchronized timing
- **Game Over**: First player to trigger victory/defeat notifies server, server relays to teammate
- **Disconnection**: Clears timers, notifies teammate, deletes match

### Client Entry: `main.js`

#### Changed
```javascript
// OLD: game.coopMode.start();
// NEW:
const playerName = authClient?.currentUser?.username || 'Player';
game.coopMode.findMatch(playerName);
```

## Testing Checklist

### Two Browser Windows Required
1. ✅ Open two windows at localhost:8080 or deployed URL
2. ✅ Both click "Co-op Mode" → "START"
3. ✅ Should match together within 2s
4. ✅ Player 1 sees input box 1 enabled, Player 2 sees input box 2 enabled
5. ✅ Type words → damage appears for both players
6. ✅ Teammate's words and damage shown in opposite input box
7. ✅ Boss attacks every 5s, health bars update simultaneously
8. ✅ Victory when boss HP reaches 0
9. ✅ Defeat when team HP reaches 0
10. ✅ Disconnect test: Close one window → other player sees "Teammate Disconnected"

### Server Logs to Check
- `🤝 Co-op match found!` when 2 players matched
- `📨 Co-op message:` for each action received
- `Boss attack sent to match: coop-match-xxx` every 5s
- `Teammate disconnected from co-op match: xxx` on disconnect

## Configuration

### Boss Settings (config.js)
```javascript
BOSS_MAX_HEALTH: 300
COOP_TEAM_MAX_HEALTH: 200
BOSS_DAMAGE: 20
BOSS_ATTACK_DELAY: 5000 // Not used client-side anymore, server uses hardcoded 5000ms
```

### WebSocket URL (config.js)
```javascript
WEBSOCKET_URL: 'ws://localhost:8080' // Dev
WEBSOCKET_URL: 'wss://neontypefighter-production.up.railway.app' // Production
```

## Known Differences from PvP

| Feature | PvP Multiplayer | Co-op Mode |
|---------|----------------|------------|
| Players per match | 2 (1v1) | 2 (2v1 vs boss) |
| Health tracking | Individual | Shared team pool |
| Opponent/Boss | Player-controlled | Server-controlled timer |
| Victory condition | Opponent HP = 0 | Boss HP = 0 |
| Defeat condition | My HP = 0 | Team HP = 0 |
| ELO rating | Yes | No (not implemented) |

## Future Enhancements
- [ ] Co-op ELO rating system
- [ ] Boss difficulty levels (more HP, faster attacks)
- [ ] Boss special attacks (different patterns)
- [ ] 3-4 player co-op teams
- [ ] Boss attack animations/warnings
- [ ] Reconnection handling (rejoin in-progress match)
