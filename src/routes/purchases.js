const express = require('express');
const router = express.Router();
const controller = require('../controllers/purchases');

// middleware 的內容
const auth = require('../middlewares/auth');

// [GET] 編號 20 : 使用者已購買項目清單
router.get('/info', auth, controller.get_user_Purchases);

// [GET] 編號 21 : 使用者查看訂單明細
router.get('/info/:order_id', auth);

module.exports = router;
