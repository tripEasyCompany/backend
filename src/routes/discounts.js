const express = require('express');
const router = express.Router();

// middleware 的內容
const auth = require('../middlewares/auth');
const authRole = require('../middlewares/authorizeRoles');

// [POST] 編號 32 : 使用者輸入優惠卷、累積積分
router.post('/', auth, authRole('user'));

// [DELETE] 編號 33 : 使用者取消優惠卷、累積積分
router.delete('/', auth, authRole('user'));

module.exports = router;
