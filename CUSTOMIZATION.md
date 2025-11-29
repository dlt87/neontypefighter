# 🎨 Customization Guide

## Changing the Word Bank

Edit `words.js` and modify the `WORD_POOL` array:

```javascript
const WORD_POOL = [
    // Add your own words here!
    'awesome', 'gaming', 'typing', 'custom', 'words',
    'whatever', 'you', 'want', 'to', 'type',
    // You can use any words or phrases
];
```

**Tips:**
- Words can be any length
- Mix short and long words for variety
- Use lowercase letters only
- No spaces or special characters

## Adding Custom Background Music

### Option 1: Use a music file in your project

1. **Add your music file** to the project folder (e.g., `music.mp3`, `background.ogg`, etc.)

2. **Load it in `main.js`** by adding this after the game initializes:

```javascript
// Add this after: const game = new Game();
game.soundManager.loadCustomMusic('music.mp3');
```

### Option 2: Load from URL

```javascript
game.soundManager.loadCustomMusic('https://example.com/your-music.mp3');
```

### Supported Formats
- MP3 (most compatible)
- OGG
- WAV
- M4A

### Music Recommendations
- Use looping tracks (seamless loops work best)
- Keep file size under 5MB for faster loading
- Synthwave/cyberpunk music fits the theme!
- Try royalty-free music from: Incompetech, Purple Planet, Free Music Archive

## Volume Control

The music volume slider in Settings will control your custom music volume automatically!

## Disabling Custom Music

To go back to procedural music, comment out or remove the `loadCustomMusic()` line.

---

**Example Setup:**

1. Download a synthwave track (e.g., `cyberpunk.mp3`)
2. Place it in the project root folder
3. In `main.js`, find where `const game = new Game();` is created
4. Add: `game.soundManager.loadCustomMusic('cyberpunk.mp3');`
5. Refresh the page!
