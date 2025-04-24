const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database'); // 引入資料庫連線模組

const app = express();
const PORT = process.env.PORT || 3000;

// 中介軟體 (Middleware)
app.use(cors());
app.use(express.json()); // 用於解析 JSON 請求
app.use(express.urlencoded({ extended: true })); // 用於解析 URL 編碼的請求

// 健康檢查路由（供 docker healthcheck 使用）
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// 基本路由
app.get('/', (req, res) => {
  res.send('伺服器運行中');
});

// 啟動伺服器並連接資料庫
const startServer = async () => {
  try {
    await connectDB(); // 嘗試連接資料庫
    app.listen(PORT, () => {
      console.log(`伺服器已啟動，正在監聽埠號 ${PORT}`);
    });
  } catch (error) {
    console.error('伺服器啟動失敗:', error);
    process.exit(1); // 結束程式
  }
};

startServer();