const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI,
  dbRetryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS, 10) || 5,
  dbRetryInterval: parseInt(process.env.DB_RETRY_INTERVAL, 10) || 5000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  nodeEnv: process.env.NODE_ENV || 'development',
  email: {
    service: process.env.EMAIL_SERVICE || 'mock',
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT, 10) || 2525,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    }
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 3600,
    redisUrl: process.env.REDIS_URL,
  },
  finance: {
    growthFactor: parseFloat(process.env.FINANCE_GROWTH_FACTOR) || 1.05,
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  skipEmailVerification: process.env.SKIP_EMAIL_VERIFICATION === 'true',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

const validateConfig = () => {
  const required = ['mongoUri', 'jwtSecret', 'refreshTokenSecret'];
  const missing = required.filter(key => !config[key]);

  if (missing.length > 0) {
    throw new Error(`❌ Missing required configuration: ${missing.join(', ')}. Please check your .env file.`);
  }
};

module.exports = { config, validateConfig };
