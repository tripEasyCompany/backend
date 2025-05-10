const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const env = process.env.NODE_ENV || 'development';

const envPath = path.resolve(__dirname, `../../.env.${env}`);
const defaultEnv = path.resolve(__dirname, '../../.env.example');

// ─── 環境變數檔案整理 ─────────────────────────────────────
if (env !== 'production') {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ 使用 ${envPath}`);
  } else if (fs.existsSync(defaultEnv)) {
    dotenv.config({ path: defaultEnv });
    console.log('✅ 使用預設 .env.example');
  } else {
    console.warn('⚠️ 未找到任何環境變數檔案');
  }
}

// ─── PostgreSQL 驗證必要環境變數 ─────────────────────────────────────
const requiredEnvVars = [
  'POSTGRES_DB_HOST',
  'POSTGRES_DB_PORT',
  'POSTGRES_DB_USER',
  'POSTGRES_DB_PASSWORD',
  'POSTGRES_DB_NAME',
  'JWT_SECRET',
];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ 缺少必要環境變數: ${varName}`);
    process.exit(1);
  }
});

// ─── PostgreSQL 連線必要參數 ─────────────────────────────────────
const pool = new Pool({
  host: process.env.POSTGRES_DB_HOST,
  port: Number(process.env.POSTGRES_DB_PORT),
  user: process.env.POSTGRES_DB_USER,
  password: process.env.POSTGRES_DB_PASSWORD,
  database: process.env.POSTGRES_DB_NAME,
  ssl: process.env.POSTGRES_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// ─── PostgreSQL 連線狀態 ─────────────────────────────────────
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(`✅ 成功連接 PostgreSQL（環境：${env}，DB host：${process.env.POSTGRES_DB_HOST}）`);
    client.release();
  } catch (error) {
    console.error('❌ PostgreSQL 連線錯誤:', error);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
