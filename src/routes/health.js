const express = require('express');
const router = express.Router();

// 健康檢查 API
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
