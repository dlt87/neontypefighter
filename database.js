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
            END $$;
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

module.exports = {
    initDatabase,
    userDb,
    scoreDb,
    achievementDb,
    pool
};
