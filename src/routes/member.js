const express = require('express');

const router = express.Router();
const auth = require('../middlewares/auth');

// [GET] 編號 68 : 管理者查看使用者的優惠卷清單
router.get('/:user_id/coupons', auth);

// [DELETE] 編號 69 : 管理者刪除優惠卷綁定
router.delete('/:user_id/coupons/unbind', auth);

module.exports = router;
