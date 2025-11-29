# Neon Typing Fighter 🎮⚡

A fast-paced cyberpunk typing duel game built for the browser with global leaderboards!

## 🎯 Features

- **Solo Mode**: Battle against an AI opponent with adjustable difficulty (Easy, Medium, Hard)
- **Timed Mode**: 15-second challenge with scoring, multipliers, and global leaderboards
- **Multiplayer Mode**: Real-time 1v1 typing duels via WebSockets
- **User Authentication**: Register with username/email/password to save scores and compete globally
- **Cyberpunk Aesthetic**: Neon visual effects, particle systems, synthwave styling
- **Critical Hits**: Type words perfectly (no mistakes) for bonus damage
- **Word Preview**: See the next word while typing current word
- **Instant Auto-Complete**: No need to press Enter - words complete automatically
- **Dynamic Word Pool**: 70+ cyberpunk-themed words
- **Combat System**: Health bars, damage calculation, victory/defeat conditions
- **Sound System**: Complete procedural audio with typing sounds, hit effects, and background music
- **Cosmetic Themes**: Choose from 3 neon color themes (Vaporwave, Glacier, Inferno)

## 🚀 Quick Start

### Playing Solo Mode (No Setup Required)

1. Open `index.html` in your browser
2. Click "SOLO MODE"
3. Start typing the words that appear!

### Setting Up Full Experience (with Multiplayer + Leaderboards)

1. **Install Node.js** (if not already installed)

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the WebSocket + API Server**:
   ```bash
   npm start
   ```
   Server runs on port 8080 with WebSocket and HTTP API

4. **Start HTTP Server** (in a new terminal):
   ```bash
   python -m http.server 3000
   ```

5. **Open the Game**:
   - Navigate to `http://localhost:3000` in your browser
   - Click "MULTIPLAYER" for real-time duels
   - Create an account and play TIMED MODE for global leaderboards!

## 🔐 User Authentication

The game features a complete username/password authentication system:

### Creating an Account
1. Click **REGISTER** button in the main menu
2. Enter a username (3-20 characters)
3. Enter your email address
4. Create a password (minimum 6 characters)
5. Click **CREATE ACCOUNT**

You'll be automatically logged in and your scores will be saved!

### Logging In
1. Click **LOGIN** button in the main menu
2. Enter your username or email
3. Enter your password
4. Click **LOGIN**

Your session will persist across browser visits.

### Security Features
- Passwords are securely hashed using PBKDF2 with SHA-512
- Unique salt per user
- Authentication tokens expire after 30 days
- All data stored server-side (in-memory for MVP)

## 🎮 How to Play

### Solo Mode
1. **Type the word** shown in the center of the screen
2. Word auto-completes when you type it exactly (no Enter needed!)
3. Typing with **zero mistakes** = **CRITICAL HIT** (2x damage)
4. Any typo removes critical status for that word
5. Deal damage to reduce opponent's health to zero
6. **First to 0 HP loses!**

### Timed Mode ⏱️
1. You have **15 seconds** on the clock
2. Type words as fast as you can
3. Each correct word = **points**
4. **Perfect words** (no mistakes) = **bonus points + multiplier**
5. **Difficulty increases** every 3 words (higher multiplier!)
6. When time hits 0, game ends and score is submitted
7. Try to beat your **best score** and climb the **global leaderboard**!

**Scoring:**
- Base score: 100 points per word
- Perfect bonus: +50 points
- Multiplier increases with difficulty (x1.0, x1.5, x2.0, etc.)
- Final score = sum of all word scores with multipliers

### Multiplayer Mode
1. Enter your name
2. Click **FIND MATCH**
3. Wait to be paired with an opponent
4. Type words to attack!
5. First to reduce opponent's health to zero wins!

## 📁 Project Structure

```
neontypefighter/
├── index.html          # Main game HTML
├── styles.css          # Cyberpunk styling & animations
├── config.js           # Game configuration & balance
├── words.js            # Word pool & word manager
├── game.js             # Core game engine
├── ai.js               # AI opponent logic
├── particle.js         # Visual effects system
├── sounds.js           # Sound system & audio manager
├── themes.js           # Cosmetic theme system
├── timedmode.js        # Timed challenge mode
├── websocket.js        # Multiplayer client
├── auth.js             # Google authentication client
├── highscore-api.js    # High score API client
├── main.js             # Application entry point
├── server.js           # WebSocket + HTTP API server (Node.js)
├── package.json        # Server dependencies
└── README.md           # This file
```

## 🏆 Leaderboard System

The timed mode features a global leaderboard:
- **Top 10 Scores**: Displayed after each game
- **Rank Styling**: Gold/Silver/Bronze for top 3
- **Your Score Highlighted**: Your entry is highlighted in yellow
- **Persistent Storage**: Scores are saved to server
- **User Authentication**: Google login required for global saves

## 🔌 API Endpoints

The server exposes RESTful API endpoints:

- `POST /api/scores` - Submit a new score
  - Body: `{ score: number, stats: object }`
  - Requires: Authorization header with user token
  
- `GET /api/leaderboard?limit=10` - Get top scores
  - Returns: Array of top score entries
  
- `GET /api/scores/:userId` - Get user's best score
  - Returns: User's highest score and stats
  
- `GET /api/stats` - Get global statistics
  - Returns: Total players, total games, average score

## ⚙️ Configuration

Edit `config.js` to adjust:

- **Damage Values**: `BASE_DAMAGE`, `CRITICAL_MULTIPLIER`
- **AI Difficulty**: `AI_DIFFICULTY` ('easy', 'medium', 'hard')
- **Typing Speed**: `AI_TYPING_SPEED` per difficulty
- **Visual Effects**: `PARTICLE_COUNT`, `PARTICLE_SPREAD`
- **WebSocket Server**: `WEBSOCKET_URL`
- **Sound Settings**: Toggle SFX and music from the main menu

## 🎵 Sound System

The game features a complete procedural audio system:

### Sound Effects
- **Typing Sound**: Short click for each correct character typed
- **Critical Hit**: Ascending neon burst for perfect words
- **Hit Sound**: Impact effect for regular attacks
- **Damage Received**: Descending tone when taking damage
- **Victory**: Ascending fanfare (C-E-G-C major chord)
- **Defeat**: Descending sequence (C-B-A-G)
- **Round Start**: Quick rising tone at game start
- **Error Sound**: Quick buzz for typing mistakes

### Background Music
- **Synthwave Loop**: Procedurally generated ambient chord progression
- **Low Volume**: Set to 20% by default to not interfere with gameplay
- **Optional**: Can be toggled on/off from the main menu
- **8-Second Loop**: Smooth C-Dm-G-Am progression

### Audio Controls
- **🔊 SFX Button**: Toggle all sound effects on/off
- **🎵 MUSIC Button**: Toggle background music on/off
- Both controls are located on the main menu screen

All sounds are generated procedurally using the Web Audio API, so no external audio files are needed!

## 🎨 Game Mechanics

### Damage System
- Base damage: 10 HP
- Critical hit: 15 HP (1.5x multiplier)
- Critical requires: 0 typing mistakes

### AI Difficulty Levels
- **Easy**: Slow typing, 30% error rate
- **Medium**: Moderate typing, 15% error rate  
- **Hard**: Fast typing, 5% error rate

### Word Difficulty
- Short words (3-5 letters): Basic attacks
- Medium words (6-8 letters): Standard abilities
- Long words (9+ letters): Power moves

## 🌐 Multiplayer Architecture

- **WebSocket Protocol**: Real-time bidirectional communication
- **Matchmaking**: Automatic pairing of waiting players
- **Action Relay**: Server relays typed words between opponents
- **Disconnection Handling**: Graceful cleanup and opponent notification

## 🎨 Cosmetic Themes

Customize your gaming experience with 3 vibrant neon themes:

### Available Themes

**🌸 Vaporwave** (Default)
- Primary: Pink/Magenta (#ff00ff)
- Secondary: Teal/Cyan (#00ffff)
- Aesthetic: Classic neon pink and teal vaporwave

**❄️ Glacier**
- Primary: Ice Blue (#00d4ff)
- Secondary: Crystalline White (#ffffff)
- Aesthetic: Cool ice blue and pristine white

**🔥 Inferno**
- Primary: Orange-Red (#ff4500)
- Secondary: Bright Orange (#ffaa00)
- Aesthetic: Blazing orange and fierce red flames

### How to Change Themes

1. Click **"THEMES"** button on the main menu
2. Select your preferred color theme
3. Theme is instantly applied and saved to localStorage
4. Your choice persists across sessions

### What Changes with Themes

- **Player Colors**: Health bars and character glows
- **UI Elements**: Input fields, borders, and buttons
- **Particle Effects**: Hit explosions and critical bursts
- **Visual Atmosphere**: Overall game aesthetic and mood

Each theme provides a unique visual experience while maintaining the cyberpunk neon aesthetic!

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js + WebSocket (`ws` library)
- **Styling**: Custom CSS with neon effects and animations
- **Fonts**: Google Fonts (Orbitron, Rajdhani)

## 📝 Future Enhancements

- [ ] Character selection with unique abilities
- [ ] Power-ups and special moves
- [ ] Ranked matchmaking & leaderboards
- [ ] Sound effects & synthwave music
- [ ] Custom word lists
- [ ] Replay system
- [ ] Tournament mode
- [ ] Mobile responsive design
- [ ] Accessibility features

## 🐛 Troubleshooting

### Multiplayer Not Connecting
- Ensure WebSocket server is running (`npm start`)
- Check `CONFIG.WEBSOCKET_URL` in `config.js`
- Verify port 8080 is not blocked

### Words Not Appearing
- Check browser console for errors
- Ensure all JavaScript files are loaded

### Performance Issues
- Reduce `PARTICLE_COUNT` in config.js
- Close other browser tabs
- Try a different browser (Chrome recommended)

## 📜 License

MIT License - Feel free to use and modify!

## 🎉 Credits

Created as a cyberpunk typing combat experience. Type fast, hit hard! ⚡

---

**May your typing be swift and your criticals plentiful!** 🚀✨
