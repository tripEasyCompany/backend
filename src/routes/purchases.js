const express = require('express');
const router = express.Router();
const controller = require('../controllers/purchases');

// middleware 的內容
const auth = require('../middlewares/auth');
const mw = require('../middlewares/purchases/index');
const authRole = require('../middlewares/authorizeRoles');

// [GET] 編號 20 : 使用者已購買項目清單
router.get('/info', auth, authRole('User'), controller.get_user_Purchases);

// [GET] 編號 21 : 使用者查看訂單明細
router.get(
  '/info/:order_item_id',
  auth,
  authRole('User'),
  mw.getpurchasesOrder,
  controller.get_user_PurchasesItem
);

module.exports = router;
