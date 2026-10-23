import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/JanSolveCommunity',
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'jansolve_dev_access_secret_12345',
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'jansolve_dev_refresh_secret_12345',
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES || '7d',
  ADMIN_NAME: process.env.ADMIN_NAME || 'JanSolve Administrator',
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || 'admin@jansolve.org').toLowerCase(),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'AdminSecurePass@2026',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
