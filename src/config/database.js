// src/config/database.js
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const env = process.env.NODE_ENV || 'development';

const localEnvPath = path.resolve(__dirname, '../../.env.local');
const envPath = path.resolve(__dirname, `../../.env.${env}`);
const defaultEnv = path.resolve(__dirname, '../../.env');

// === 載入環境變數（優先順序）===
if (env === 'development' && fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
  console.log('✅ 使用 .env.local（本機開發環境）');
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`✅ 使用 ${envPath}`);
} else if (fs.existsSync(defaultEnv)) {
  dotenv.config({ path: defaultEnv });
  console.log('✅ 使用預設 .env');
} else {
  console.warn('⚠️ 未找到任何環境變數檔案');
}

// 驗證必要環境變數
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ 缺少必要環境變數: ${varName}`);
    process.exit(1);
  }
});

// 建立 PostgreSQL 連線池
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// 測試連線用
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(`✅ 成功連接 PostgreSQL（環境：${env}，DB host：${process.env.DB_HOST}）`);
    client.release();
  } catch (error) {
    console.error('❌ PostgreSQL 連線錯誤:', error);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
