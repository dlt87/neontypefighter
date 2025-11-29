// ========================================
// EMAIL SERVICE
// Handles sending verification and reset emails
// ========================================

const nodemailer = require('nodemailer');

// Create email transporter
// For production, use environment variables for email credentials
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false // Accept self-signed certificates
    }
});

// Email templates
const emailService = {
    // Send verification email
    async sendVerificationEmail(email, username, token) {
        const verificationUrl = `${process.env.APP_URL || 'https://neontypefighter-production.up.railway.app'}/verify-email?token=${token}`;
        
        const mailOptions = {
            from: `"Neon Type Fighter" <${process.env.SMTP_USER}>`,
            to: email,
            subject: '🎮 Verify Your Neon Type Fighter Account',
            html: `
                <div style="font-family: 'Courier New', monospace; background: #0a0a1e; color: #00ffff; padding: 20px; border: 2px solid #00ffff;">
                    <h1 style="color: #ff00ff; text-shadow: 0 0 10px #ff00ff;">⚡ NEON TYPE FIGHTER ⚡</h1>
                    <p>Hey <strong>${username}</strong>!</p>
                    <p>Welcome to Neon Type Fighter! Click the button below to verify your email and start competing:</p>
                    <div style="margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background: linear-gradient(45deg, #ff00ff, #00ffff); 
                                  color: #000; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  font-weight: bold; 
                                  border-radius: 5px;
                                  display: inline-block;">
                            VERIFY EMAIL
                        </a>
                    </div>
                    <p style="color: #888;">Or copy this link: <a href="${verificationUrl}" style="color: #00ffff;">${verificationUrl}</a></p>
                    <p style="color: #ff6600; font-size: 12px;">This link expires in 24 hours.</p>
                    <p style="color: #666; font-size: 11px; margin-top: 30px;">If you didn't create this account, ignore this email.</p>
                </div>
            `
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ Verification email sent to ${email}`);
            console.log(`📧 Message ID: ${info.messageId}`);
            console.log(`📧 Response: ${info.response}`);
            return true;
        } catch (error) {
            console.error('❌ Error sending verification email:', error);
            console.error('❌ Error details:', {
                code: error.code,
                command: error.command,
                response: error.response,
                responseCode: error.responseCode
            });
            return false;
        }
    },

    // Send password reset email
    async sendPasswordResetEmail(email, username, token) {
        const resetUrl = `${process.env.APP_URL || 'https://neontypefighter-production.up.railway.app'}/reset-password?token=${token}`;
        
        const mailOptions = {
            from: `"Neon Type Fighter" <${process.env.SMTP_USER}>`,
            to: email,
            subject: '🔒 Reset Your Neon Type Fighter Password',
            html: `
                <div style="font-family: 'Courier New', monospace; background: #0a0a1e; color: #00ffff; padding: 20px; border: 2px solid #ff6600;">
                    <h1 style="color: #ff6600; text-shadow: 0 0 10px #ff6600;">🔒 PASSWORD RESET</h1>
                    <p>Hey <strong>${username}</strong>!</p>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <div style="margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background: linear-gradient(45deg, #ff6600, #ffff00); 
                                  color: #000; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  font-weight: bold; 
                                  border-radius: 5px;
                                  display: inline-block;">
                            RESET PASSWORD
                        </a>
                    </div>
                    <p style="color: #888;">Or copy this link: <a href="${resetUrl}" style="color: #00ffff;">${resetUrl}</a></p>
                    <p style="color: #ff6600; font-size: 12px;">This link expires in 1 hour.</p>
                    <p style="color: #666; font-size: 11px; margin-top: 30px;">If you didn't request this reset, ignore this email. Your password won't be changed.</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`✅ Password reset email sent to ${email}`);
            return true;
        } catch (error) {
            console.error('❌ Error sending password reset email:', error);
            return false;
        }
    }
};

module.exports = emailService;
