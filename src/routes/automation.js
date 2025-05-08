const express = require('express');
const router = express.Router();

// middleware 的內容
const auth = require('../middlewares/auth');

// [GET] 編號 14 : 使用者取得自動化設定狀態
router.get('/allnotifi-settings',auth);

// [PATCH] 編號 15 : 使用者勾選要有旅遊提醒
router.patch('/notifi-settings',auth);

// [PATCH] 編號 16 : 使用者勾選預期價格通知提醒
router.patch('/price-tracking',auth);
