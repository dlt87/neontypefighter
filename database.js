// ========================================
// DATABASE SETUP AND QUERIES
// PostgreSQL Database Layer
// ========================================

const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDatabase() {
    const client = await pool.connect();
    try {
        // Create users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id VARCHAR(255) PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                password_salt VARCHAR(255) NOT NULL,
                email_verified BOOLEAN DEFAULT FALSE,
                verification_token VARCHAR(255),
                verification_token_expires TIMESTAMP,
                reset_token VARCHAR(255),
                reset_token_expires TIMESTAMP,
                elo_rating INTEGER DEFAULT 1200,
                multiplayer_wins INTEGER DEFAULT 0,
                multiplayer_losses INTEGER DEFAULT 0,
                multiplayer_games INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_username ON users(LOWER(username));
            CREATE INDEX IF NOT EXISTS idx_email ON users(LOWER(email));
        `);
        
        // Add new columns to existing users table (migration)
        await client.query(`
            DO $$ 
            BEGIN
                BEGIN
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END;
                BEGIN
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END;
                BEGIN
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP;
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END;
                BEGIN
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END;
                BEGIN
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END;
                BEGIN
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1200;
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END;
                BEGIN
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS multiplayer_wins INTEGER DEFAULT 0;
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END;
                BEGIN
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS multiplayer_losses INTEGER DEFAULT 0;
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END;
                BEGIN
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS multiplayer_games INTEGER DEFAULT 0;
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END;
            END $$;
        `);
        
        // Create ELO index after columns are added
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_elo ON users(elo_rating DESC);
        `);

        // Create high_scores table
        await client.query(`
            CREATE TABLE IF NOT EXISTS high_scores (
                score_id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                user_name VARCHAR(50) NOT NULL,
                score INTEGER NOT NULL,
                words_completed INTEGER,
                perfect_words INTEGER,
                accuracy INTEGER,
                max_multiplier DECIMAL(3,1),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_score ON high_scores(score DESC);
            CREATE INDEX IF NOT EXISTS idx_user_scores ON high_scores(user_id, score DESC);
        `);
        
        // Create multiplayer_matches table
        await client.query(`
            CREATE TABLE IF NOT EXISTS multiplayer_matches (
                match_id SERIAL PRIMARY KEY,
                winner_id VARCHAR(255) NOT NULL,
                loser_id VARCHAR(255) NOT NULL,
                winner_name VARCHAR(50) NOT NULL,
                loser_name VARCHAR(50) NOT NULL,
                winner_elo_before INTEGER NOT NULL,
                loser_elo_before INTEGER NOT NULL,
                winner_elo_after INTEGER NOT NULL,
                loser_elo_after INTEGER NOT NULL,
                elo_change INTEGER NOT NULL,
                match_duration INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (winner_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (loser_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_match_winner ON multiplayer_matches(winner_id);
            CREATE INDEX IF NOT EXISTS idx_match_loser ON multiplayer_matches(loser_id);
            CREATE INDEX IF NOT EXISTS idx_match_date ON multiplayer_matches(created_at DESC);
        `);

        // Create achievements table
        await client.query(`
            CREATE TABLE IF NOT EXISTS achievements (
                achievement_id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                icon VARCHAR(10) NOT NULL,
                tier VARCHAR(20) NOT NULL,
                requirement INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create user_achievements table
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_achievements (
                user_id VARCHAR(255) NOT NULL,
                achievement_id VARCHAR(50) NOT NULL,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                progress INTEGER DEFAULT 0,
                PRIMARY KEY (user_id, achievement_id),
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (achievement_id) REFERENCES achievements(achievement_id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_user_achievements ON user_achievements(user_id);
        `);

        // Create endless_scores table
        await client.query(`
            CREATE TABLE IF NOT EXISTS endless_scores (
                score_id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                user_name VARCHAR(50) NOT NULL,
                wave INTEGER NOT NULL,
                words_typed INTEGER NOT NULL,
                critical_hits INTEGER,
                survival_time INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_endless_wave ON endless_scores(wave DESC);
            CREATE INDEX IF NOT EXISTS idx_endless_user ON endless_scores(user_id, wave DESC);
        `);

        // Insert default achievements if not exist
        await client.query(`
            INSERT INTO achievements (achievement_id, name, description, icon, tier, requirement) VALUES
            ('first_blood', 'First Blood', 'Win your first game', '⚔️', 'bronze', 1),
            ('speed_demon', 'Speed Demon', 'Complete 50 words in timed mode', '⚡', 'bronze', 50),
            ('perfectionist', 'Perfectionist', 'Type 10 perfect words in a row', '💎', 'silver', 10),
            ('combo_master', 'Combo Master', 'Achieve a 5x multiplier', '🔥', 'silver', 5),
            ('word_warrior', 'Word Warrior', 'Complete 500 total words', '🗡️', 'gold', 500),
            ('untouchable', 'Untouchable', 'Win without taking damage', '🛡️', 'gold', 1),
            ('speed_runner', 'Speed Runner', 'Score 200+ in timed mode', '🏃', 'gold', 200),
            ('marathon', 'Marathon', 'Play 100 games', '🎮', 'platinum', 100),
            ('legend', 'Legend', 'Reach top 10 on global leaderboard', '👑', 'platinum', 10),
            ('flawless', 'Flawless Victory', 'Win 10 games with 100% accuracy', '✨', 'platinum', 10)
            ON CONFLICT (achievement_id) DO NOTHING;
        `);

        console.log('✅ Database tables initialized');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    } finally {
        client.release();
    }
}

// User Database Functions
const userDb = {
    // Find user by username
    async findByUsername(username) {
        const result = await pool.query(
            'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
            [username]
        );
        return result.rows[0];
    },

    // Find user by email
    async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );
        return result.rows[0];
    },

    // Find user by ID
    async findById(userId) {
        const result = await pool.query(
            'SELECT * FROM users WHERE user_id = $1',
            [userId]
        );
        return result.rows[0];
    },

    // Create new user
    async create(userId, username, email, passwordHash, passwordSalt) {
        const result = await pool.query(
            `INSERT INTO users (user_id, username, email, password_hash, password_salt)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [userId, username, email.toLowerCase(), passwordHash, passwordSalt]
        );
        return result.rows[0];
    },

    // Set email verification token
    async setVerificationToken(userId, token, expires) {
        await pool.query(
            `UPDATE users 
             SET verification_token = $1, verification_token_expires = $2
             WHERE user_id = $3`,
            [token, expires, userId]
        );
    },

    // Verify email with token
    async verifyEmail(token) {
        const result = await pool.query(
            `UPDATE users 
             SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL
             WHERE verification_token = $1 AND verification_token_expires > NOW()
             RETURNING *`,
            [token]
        );
        return result.rows[0];
    },

    // Set password reset token
    async setResetToken(email, token, expires) {
        const result = await pool.query(
            `UPDATE users 
             SET reset_token = $1, reset_token_expires = $2
             WHERE LOWER(email) = LOWER($3)
             RETURNING *`,
            [token, expires, email]
        );
        return result.rows[0];
    },

    // Verify reset token and update password
    async resetPassword(token, passwordHash, passwordSalt) {
        const result = await pool.query(
            `UPDATE users 
             SET password_hash = $1, password_salt = $2, reset_token = NULL, reset_token_expires = NULL
             WHERE reset_token = $3 AND reset_token_expires > NOW()
             RETURNING *`,
            [passwordHash, passwordSalt, token]
        );
        return result.rows[0];
    }
};

// High Score Database Functions
const scoreDb = {
    // Submit a new score
    async submitScore(userId, userName, score, stats) {
        const result = await pool.query(
            `INSERT INTO high_scores 
             (user_id, user_name, score, words_completed, perfect_words, accuracy, max_multiplier)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                userId,
                userName,
                score,
                stats.wordsCompleted || 0,
                stats.perfectWords || 0,
                stats.accuracy || 0,
                stats.maxMultiplier || 1.0
            ]
        );
        return result.rows[0];
    },

    // Get top N scores (leaderboard)
    async getLeaderboard(limit = 10) {
        const result = await pool.query(
            `SELECT DISTINCT ON (user_id)
                user_id as "userId",
                user_name as "userName",
                score,
                words_completed as "wordsCompleted",
                perfect_words as "perfectWords",
                accuracy,
                max_multiplier as "maxMultiplier",
                created_at as "timestamp"
             FROM high_scores
             ORDER BY user_id, score DESC, created_at DESC
             LIMIT $1`,
            [limit * 3] // Get more to filter duplicates
        );
        
        // Sort by score and take top N
        const topScores = result.rows
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        
        return topScores;
    },

    // Get user's best score
    async getUserBestScore(userId) {
        const result = await pool.query(
            `SELECT 
                user_id as "userId",
                user_name as "userName",
                score,
                words_completed as "wordsCompleted",
                perfect_words as "perfectWords",
                accuracy,
                max_multiplier as "maxMultiplier",
                created_at as "timestamp"
             FROM high_scores
             WHERE user_id = $1
             ORDER BY score DESC
             LIMIT 1`,
            [userId]
        );
        return result.rows[0];
    },

    // Get global statistics
    async getGlobalStats() {
        const result = await pool.query(
            `SELECT 
                COUNT(DISTINCT user_id) as total_players,
                COUNT(*) as total_games,
                COALESCE(AVG(score), 0) as average_score,
                COALESCE(MAX(score), 0) as highest_score
             FROM high_scores`
        );
        return result.rows[0];
    },

    // Get user's total stats
    async getUserStats(userId) {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as games_played,
                SUM(words_completed) as total_words,
                SUM(perfect_words) as total_perfect_words,
                MAX(score) as best_score,
                MAX(max_multiplier) as best_multiplier
             FROM high_scores
             WHERE user_id = $1`,
            [userId]
        );
        return result.rows[0];
    }
};

// Achievement Database Functions
const achievementDb = {
    // Get all achievements
    async getAllAchievements() {
        const result = await pool.query(
            `SELECT achievement_id as "achievementId", name, description, icon, tier, requirement
             FROM achievements
             ORDER BY 
                CASE tier 
                    WHEN 'bronze' THEN 1 
                    WHEN 'silver' THEN 2 
                    WHEN 'gold' THEN 3 
                    WHEN 'platinum' THEN 4 
                END,
                requirement ASC`
        );
        return result.rows;
    },

    // Get user's achievements
    async getUserAchievements(userId) {
        const result = await pool.query(
            `SELECT 
                a.achievement_id as "achievementId",
                a.name,
                a.description,
                a.icon,
                a.tier,
                a.requirement,
                ua.unlocked_at as "unlockedAt",
                ua.progress
             FROM achievements a
             LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = $1
             ORDER BY 
                CASE a.tier 
                    WHEN 'bronze' THEN 1 
                    WHEN 'silver' THEN 2 
                    WHEN 'gold' THEN 3 
                    WHEN 'platinum' THEN 4 
                END,
                a.requirement ASC`,
            [userId]
        );
        return result.rows;
    },

    // Unlock achievement for user
    async unlockAchievement(userId, achievementId) {
        const result = await pool.query(
            `INSERT INTO user_achievements (user_id, achievement_id, progress)
             VALUES ($1, $2, (SELECT requirement FROM achievements WHERE achievement_id = $2))
             ON CONFLICT (user_id, achievement_id) DO NOTHING
             RETURNING *`,
            [userId, achievementId]
        );
        return result.rows[0];
    },

    // Update achievement progress
    async updateProgress(userId, achievementId, progress) {
        const result = await pool.query(
            `INSERT INTO user_achievements (user_id, achievement_id, progress)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, achievement_id) 
             DO UPDATE SET progress = $3
             RETURNING *`,
            [userId, achievementId, progress]
        );
        return result.rows[0];
    },

    // Check and unlock achievements based on stats
    async checkAndUnlock(userId) {
        const stats = await scoreDb.getUserStats(userId);
        const userAchievements = await this.getUserAchievements(userId);
        const newUnlocks = [];

        // Check each achievement condition
        const checks = [
            { id: 'first_blood', condition: parseInt(stats.games_played) >= 1 },
            { id: 'speed_demon', condition: parseInt(stats.total_words) >= 50 },
            { id: 'word_warrior', condition: parseInt(stats.total_words) >= 500 },
            { id: 'marathon', condition: parseInt(stats.games_played) >= 100 },
            { id: 'speed_runner', condition: parseInt(stats.best_score) >= 200 },
            { id: 'combo_master', condition: parseFloat(stats.best_multiplier) >= 5.0 }
        ];

        for (const check of checks) {
            const existing = userAchievements.find(a => a.achievementId === check.id);
            if (check.condition && !existing?.unlockedAt) {
                const unlocked = await this.unlockAchievement(userId, check.id);
                if (unlocked) {
                    const achievement = userAchievements.find(a => a.achievementId === check.id);
                    newUnlocks.push(achievement);
                }
            }
        }

        return newUnlocks;
    }
};

// ELO Rating System
const eloDb = {
    // Calculate ELO change based on match result
    calculateEloChange(winnerRating, loserRating, kFactor = 32) {
        const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
        const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
        
        const winnerChange = Math.round(kFactor * (1 - expectedWinner));
        const loserChange = Math.round(kFactor * (0 - expectedLoser));
        
        return { winnerChange, loserChange };
    },
    
    // Record match result and update ELO ratings
    async recordMatch(winnerId, loserId, matchDuration = null) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Get current ratings and names
            const winnerResult = await client.query(
                'SELECT username, elo_rating FROM users WHERE user_id = $1',
                [winnerId]
            );
            const loserResult = await client.query(
                'SELECT username, elo_rating FROM users WHERE user_id = $1',
                [loserId]
            );
            
            if (!winnerResult.rows[0] || !loserResult.rows[0]) {
                throw new Error('User not found');
            }
            
            const winner = winnerResult.rows[0];
            const loser = loserResult.rows[0];
            
            const winnerEloBefore = winner.elo_rating || 1200;
            const loserEloBefore = loser.elo_rating || 1200;
            
            // Calculate ELO changes
            const { winnerChange, loserChange } = this.calculateEloChange(winnerEloBefore, loserEloBefore);
            
            const winnerEloAfter = winnerEloBefore + winnerChange;
            const loserEloAfter = Math.max(100, loserEloBefore + loserChange); // Min ELO of 100
            
            // Update winner stats
            await client.query(
                `UPDATE users 
                 SET elo_rating = $1, 
                     multiplayer_wins = multiplayer_wins + 1,
                     multiplayer_games = multiplayer_games + 1
                 WHERE user_id = $2`,
                [winnerEloAfter, winnerId]
            );
            
            // Update loser stats
            await client.query(
                `UPDATE users 
                 SET elo_rating = $1,
                     multiplayer_losses = multiplayer_losses + 1,
                     multiplayer_games = multiplayer_games + 1
                 WHERE user_id = $2`,
                [loserEloAfter, loserId]
            );
            
            // Record match in history
            const matchResult = await client.query(
                `INSERT INTO multiplayer_matches 
                 (winner_id, loser_id, winner_name, loser_name, 
                  winner_elo_before, loser_elo_before, winner_elo_after, loser_elo_after,
                  elo_change, match_duration)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING match_id`,
                [winnerId, loserId, winner.username, loser.username,
                 winnerEloBefore, loserEloBefore, winnerEloAfter, loserEloAfter,
                 winnerChange, matchDuration]
            );
            
            await client.query('COMMIT');
            
            return {
                matchId: matchResult.rows[0].match_id,
                winner: {
                    id: winnerId,
                    name: winner.username,
                    eloBefore: winnerEloBefore,
                    eloAfter: winnerEloAfter,
                    eloChange: winnerChange
                },
                loser: {
                    id: loserId,
                    name: loser.username,
                    eloBefore: loserEloBefore,
                    eloAfter: loserEloAfter,
                    eloChange: loserChange
                }
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },
    
    // Get user's ELO and multiplayer stats
    async getUserEloStats(userId) {
        const result = await pool.query(
            `SELECT elo_rating, multiplayer_wins, multiplayer_losses, multiplayer_games
             FROM users WHERE user_id = $1`,
            [userId]
        );
        
        if (result.rows.length === 0) return null;
        
        const stats = result.rows[0];
        const winRate = stats.multiplayer_games > 0 
            ? Math.round((stats.multiplayer_wins / stats.multiplayer_games) * 100)
            : 0;
            
        return {
            eloRating: stats.elo_rating || 1200,
            wins: stats.multiplayer_wins || 0,
            losses: stats.multiplayer_losses || 0,
            games: stats.multiplayer_games || 0,
            winRate
        };
    },
    
    // Get ELO leaderboard
    async getEloLeaderboard(limit = 50) {
        const result = await pool.query(
            `SELECT user_id, username, elo_rating, multiplayer_wins, multiplayer_losses, multiplayer_games
             FROM users
             WHERE multiplayer_games > 0
             ORDER BY elo_rating DESC, multiplayer_wins DESC
             LIMIT $1`,
            [limit]
        );
        
        return result.rows.map((row, index) => ({
            rank: index + 1,
            userId: row.user_id,
            username: row.username,
            eloRating: row.elo_rating || 1200,
            wins: row.multiplayer_wins || 0,
            losses: row.multiplayer_losses || 0,
            games: row.multiplayer_games || 0,
            winRate: row.multiplayer_games > 0 
                ? Math.round((row.multiplayer_wins / row.multiplayer_games) * 100)
                : 0
        }));
    },
    
    // Get user's match history
    async getMatchHistory(userId, limit = 10) {
        const result = await pool.query(
            `SELECT 
                match_id,
                winner_id,
                loser_id,
                winner_name,
                loser_name,
                winner_elo_before,
                loser_elo_before,
                winner_elo_after,
                loser_elo_after,
                elo_change,
                match_duration,
                created_at,
                CASE WHEN winner_id = $1 THEN true ELSE false END as won
             FROM multiplayer_matches
             WHERE winner_id = $1 OR loser_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [userId, limit]
        );
        
        return result.rows.map(match => ({
            matchId: match.match_id,
            won: match.won,
            opponent: match.won ? match.loser_name : match.winner_name,
            myEloBefore: match.won ? match.winner_elo_before : match.loser_elo_before,
            myEloAfter: match.won ? match.winner_elo_after : match.loser_elo_after,
            eloChange: match.won ? match.elo_change : -Math.abs(match.elo_change),
            duration: match.match_duration,
            playedAt: match.created_at
        }));
    }
};

// Endless Mode Score Database Functions
const endlessScoreDb = {
    // Submit a new endless mode score
    async submitScore(userId, userName, wave, wordsTyped, criticalHits, survivalTime) {
        const result = await pool.query(
            `INSERT INTO endless_scores 
             (user_id, user_name, wave, words_typed, critical_hits, survival_time)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [userId, userName, wave, wordsTyped, criticalHits || 0, survivalTime || 0]
        );
        return result.rows[0];
    },

    // Get top N scores by wave (leaderboard)
    async getLeaderboard(limit = 10) {
        const result = await pool.query(
            `SELECT DISTINCT ON (user_id)
                user_id as "userId",
                user_name as "userName",
                wave,
                words_typed as "wordsTyped",
                critical_hits as "criticalHits",
                survival_time as "survivalTime",
                created_at as "timestamp"
             FROM endless_scores
             ORDER BY user_id, wave DESC, words_typed DESC, created_at DESC
             LIMIT $1`,
            [limit * 3] // Get more to filter duplicates
        );
        
        // Sort by wave (primary) and words typed (secondary), then take top N
        const topScores = result.rows
            .sort((a, b) => {
                if (b.wave !== a.wave) return b.wave - a.wave;
                return b.wordsTyped - a.wordsTyped;
            })
            .slice(0, limit);
        
        return topScores;
    },

    // Get user's best score
    async getUserBestScore(userId) {
        const result = await pool.query(
            `SELECT 
                user_id as "userId",
                user_name as "userName",
                wave,
                words_typed as "wordsTyped",
                critical_hits as "criticalHits",
                survival_time as "survivalTime",
                created_at as "timestamp"
             FROM endless_scores
             WHERE user_id = $1
             ORDER BY wave DESC, words_typed DESC
             LIMIT 1`,
            [userId]
        );
        return result.rows[0];
    }
};

module.exports = {
    initDatabase,
    userDb,
    scoreDb,
    achievementDb,
    eloDb,
    endlessScoreDb,
    pool
};
