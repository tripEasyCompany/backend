const express = require('express');
const router = express.Router();
const controller = require('../controllers/userinfo');

// middleware 的內容
const mw = require('../middlewares/userinfo/index');

// [POST] 編號 01 : 使用者註冊、個人偏好設定
router.post('/signup', mw.postuserSignup, controller.post_user_SignUp);

// [POST] 編號 02 : 使用者登入 - Email 登入
router.post('/login/email',mw.postuserLoginEmail,controller.post_user_LoginEmail);

// [POST] 編號 05 : 使用者忘記密碼
router.post('/forgetpw',mw.postuserforgetPW, controller.post_user_forgetPW);

module.exports = router;