const express = require('express');
const router = express.Router();
const controller = require('../controllers/discounts');

// middleware 的內容
const auth = require('../middlewares/auth');
const authRole = require('../middlewares/authorizeRoles');
const mw = require('../middlewares/discounts/index');

// [POST] 編號 32 : 使用者輸入優惠卷、累積積分
router.post('/:order_id', auth, authRole('User'), mw.postDiscounts, controller.post_user_discounts);

// [GET] 編號 33 : 使用者取消優惠卷、累積積分
router.get('/:order_id', auth, authRole('User'), mw.getDiscounts, controller.get_user_discounts);

module.exports = router;
