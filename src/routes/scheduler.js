const express = require('express');

const router = express.Router();

// [POST] 編號 60 : 促銷內容時間到期後自動取消促銷
router.post('/auto-offline-promotions');

module.exports = router;
