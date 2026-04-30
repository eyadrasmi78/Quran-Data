// config.mjs
import dotenv from 'dotenv';
dotenv.config();

const config = {
    port: process.env.PORT || 5000,
    apiRateLimit: process.env.API_RATE_LIMIT || 300
};

export default config;
