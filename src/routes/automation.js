const express = require('express');
const router = express.Router();
const controller = require('../controllers/automation');

// middleware 的內容
const auth = require('../middlewares/auth');
const mw = require('../middlewares/automation/index');
const authRole = require('../middlewares/authorizeRoles');

// [GET] 編號 14 : 使用者取得自動化設定狀態
router.get('/allnotifi-settings', auth, authRole('User'), controller.get_allnotifiSettings);

// [PATCH] 編號 15 : 使用者勾選要有旅遊提醒
router.patch(
  '/notifi-settings',
  auth,
  authRole('User'),
  mw.patchearlyNoti,
  controller.patch_early_notifiSettings
);

// [PATCH] 編號 16 : 使用者勾選預期價格通知提醒
router.patch(
  '/price-tracking',
  auth,
  authRole('User'),
  mw.patchpriceNoti,
  controller.patch_price_notifiSettings
);

module.exports = router;
