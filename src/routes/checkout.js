const express = require('express');
const router = express.Router();
<<<<<<< HEAD
=======
const controller = require('../controllers/checkout');
>>>>>>> origin/main

// middleware 的內容
const auth = require('../middlewares/auth');
const authRole = require('../middlewares/authorizeRoles');
<<<<<<< HEAD

// [GET] 編號 34 : 使用者進入填寫畫面後預帶使用者資訊
router.get('/userinfo', auth, authRole('user'));

// [POST]] 編號 35 : 使用者輸入個人資料、選擇想要付款方式
router.post('/preview', auth, authRole('user'));

// [GET] 編號 36 : 使用者確認購買項目、總金額
router.get('/summary', auth, authRole('user'));
=======
const mw = require('../middlewares/checkout/index');

// [POST] 編號 89 : 使用者進入填寫畫面後產生訂單
router.post(
  '/order/:cart_id',
  auth,
  authRole('User'),
  mw.post_userOrder,
  controller.post_user_Order
);

// [GET] 編號 34 : 使用者進入填寫畫面後預帶使用者資訊
router.get(
  '/userinfo/:order_id',
  auth,
  authRole('User'),
  mw.get_userOrderPrfile,
  controller.get_user_CheckoutUserInfo
);

// [PATCH] 編號 35 : 使用者輸入個人資料、選擇想要付款方式
router.patch(
  '/preview/:order_id',
  auth,
  authRole('User'),
  mw.patch_userOrderPreview,
  controller.patch_user_CheckoutUserInfo
);

// [GET] 編號 36 : 使用者確認購買項目、總金額
router.get(
  '/summary/:order_id',
  auth,
  authRole('User'),
  mw.get_userCheckOrder,
  controller.get_user_CheckoutOrder
);
>>>>>>> origin/main

module.exports = router;
