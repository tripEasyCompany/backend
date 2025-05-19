const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin');

// middleware 的內容
const auth = require('../middlewares/auth');
const authRole = require('../middlewares/authorizeRoles');
const mw = require('../middlewares/admin/index');

// [GET] 編號 68 : 管理者查看使用者的優惠卷清單
router.get('/members/:user_id/coupons', auth, authRole('admin'), mw.get_userCoupon);

// [DELETE] 編號 69 : 管理者刪除優惠卷綁定
router.delete('/members/:user_id/coupons/unbind', auth, authRole('admin'), mw.delete_userCoupon);

module.exports = router;
