// routes/index.js - 首頁路由
const express = require('express');
const router = express.Router();

/* GET 首頁 */
router.get('/', (req, res) => {
  res.json({ message: '歡迎使用 Node.js + Express API' });
});

/* 健康檢查端點 */
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;