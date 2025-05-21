const express = require('express');
const router = express.Router();
const controller = require('../controllers/cart');

// middleware 的內容
const auth = require('../middlewares/auth');
const authRole = require('../middlewares/authorizeRoles');
const mw = require('../middlewares/cart/index');

// [POST] 編號 28 : 使用者加入項目至購物車
router.post('/:tour_id', auth, authRole('User'), mw.post_userCart,controller.post_cartItem);

// [DELETE] 編號 29 : 使用者取消購物車項目
router.delete('/:cart_item_id', auth, authRole('User'),mw.delete_userCart,controller.delete_cartItem);

// [PATCH] 編號 30 : 使用者編輯購物車內容
router.patch('/:cart_item_id', auth, authRole('User'),mw.patch_userCart);

// [GET] 編號 31 : 使用者查看購物車內容
router.get('/list', auth, authRole('User'));

module.exports = router;
