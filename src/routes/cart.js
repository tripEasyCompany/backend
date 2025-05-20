const express = require('express');
const router = express.Router();

// middleware 的內容
const auth = require('../middlewares/auth');
const authRole = require('../middlewares/authorizeRoles');
const mw = require('../middlewares/cart/index');

// [POST] 編號 28 : 使用者加入項目至購物車
router.post('/:tour_id', auth, authRole('User'), mw.post_userCart);

// [DELETE] 編號 29 : 使用者取消購物車項目
router.delete('/:tour_id', auth, authRole('User'));

// [PATCH] 編號 30 : 使用者編輯購物車內容
router.patch('/:tour_id', auth, authRole('User'));

// [GET] 編號 31 : 使用者查看購物車內容
router.get('/', auth, authRole('User'));

module.exports = router;
