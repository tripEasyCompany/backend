const express = require('express');
const router = express.Router();
const controller = require('../controllers/userinfo');

// middleware 的內容
const mw = require('../middlewares/userinfo/index');

// [POST] 使用者註冊、個人偏好設定
router.post('/signup', mw.postuserSignup, controller.post_user_SignUp);

module.exports = router;