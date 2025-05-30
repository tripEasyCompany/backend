const express = require('express');
const router = express.Router();

// middleware 的內容
const auth = require('../middlewares/auth');
const authRole = require('../middlewares/authorizeRoles');

// [GET] 編號 34 : 使用者進入填寫畫面後預帶使用者資訊
router.get('/userinfo', auth, authRole('user'));

// [POST]] 編號 35 : 使用者輸入個人資料、選擇想要付款方式
router.post('/preview', auth, authRole('user'));

// [GET] 編號 36 : 使用者確認購買項目、總金額
router.get('/summary', auth, authRole('user'));

module.exports = router;
