// src/config/database.js
const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

// 載入環境變數
const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(__dirname, `../../.env.${env}.local`);
dotenv.config({ path: envPath });

// 如果指定環境的 .env 檔案不存在，則載入預設的 .env 檔案
if (!process.env.DATABASE_URL && env !== 'test') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

// 驗證必要的環境變數
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`缺少必要的環境變數: ${varName}`);
    process.exit(1);
  }
});

// 建立資料庫連線池
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// 連線資料庫
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(`成功連接到 PostgreSQL (${env} 環境)`);
    client.release();
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('無法連接到資料庫，請確認資料庫服務是否啟動:', error.message);
    } else {
      console.error('PostgreSQL 連線錯誤:', error);
    }
    process.exit(1);
  }
};

module.exports = { pool, connectDB };