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
    }
};

module.exports = {
    initDatabase,
    userDb,
    scoreDb,
    pool
};
