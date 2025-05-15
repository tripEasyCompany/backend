const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { connectDB } = require('./config/database');

// 載入路由
const healthRouter = require('./routes/health');
const userinfoRouter = require('./routes/userinfo');
const userprofileRouter = require('./routes/userProfile');
const collectionRouter = require('./routes/collection');
const automationRouter = require('./routes/automation');
const purchasesRouter = require('./routes/purchases');
const homeRouter = require('./routes/home');
const otherRouter = require('./routes/other');

const app = express();
const PORT = process.env.PORT || 3000;
const version = 'v1';

// ─── 允許前端存取 cookie ─────────────────────────────────────

const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  process.env.FRONTEND_PATH,
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('不允許的來源'));
      }
    },
    credentials: true,
  })
);

// ─── Middleware ─────────────────────────────────────
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── 路由設定 ───────────────────────────────────────
app.get('/', (req, res) => {
  res.send('伺服器運行中');
});

// 健康檢查
app.use(`/api/${version}`, healthRouter);

// 編號 01~09 : 登入註冊驗證
app.use(`/api/${version}/auth/userinfo`, userinfoRouter);

// 編號 10~13 : 個人基本資料
app.use(`/api/${version}/user/userinfo`, userprofileRouter);

// 編號 14~16 : 自動化通知
app.use(`/api/${version}/user/automation`, automationRouter);

// 編號 17~19 : 個人收藏
app.use(`/api/${version}/user/collection`, collectionRouter);

// 編號 20~21 : 個人訂單項目
app.use(`/api/${version}/user/purchases`, purchasesRouter);

// 編號 26~27 : 首頁查詢項目
app.use(`/api/${version}/user/home/search`, homeRouter);

// 編號 70~71 : 其他
app.use(`/api/${version}/web/filter`, otherRouter);

// ─── 404 處理 ───────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({
    status: 'false',
    message: '找不到此網站',
  });
});

// ─── 500 錯誤處理 ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ 系統錯誤:', err);
  if (err.status) {
    res.status(err.status).json({
      status: 'failed',
      message: err.message || '伺服器內部錯誤',
    });
    return;
  }
  res.status(500).json({
    status: 'error',
    message: '伺服器錯誤',
  });
});

// ─── 伺服器啟動 ───────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`伺服器已啟動，正在監聽埠號 ${PORT}`);
    });
  } catch (error) {
    console.error('伺服器啟動失敗:', error);
    process.exit(1);
  }
};

startServer();
