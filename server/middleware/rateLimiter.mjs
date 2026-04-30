import rateLimit from 'express-rate-limit';
import config from '../config.mjs';

// معدل التحديد مع رسالة تخصيص
export default rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
    max: parseInt(config.apiRateLimit, 10) || 300, // requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: '🛑 Rate Limit Exceeded.',
        message: '🚫 You have exceeded the maximum allowed request limit.',
        suggestion: '⏳ Please wait a few minutes before trying again. If you believe this is an error, contact support.\n⤷ https://github.com/rn0x',
        details: '📅 The rate limit resets every 15 minutes.',
    },
});
