const express = require('express');
const router = express.Router();
const controller = require('../controllers/userinfo');

// middleware 的內容
const mw = require('../middlewares/userinfo/index');

// [POST] 編號 01 : 使用者註冊、個人偏好設定
router.post('/signup', mw.postuserSignup, controller.post_user_SignUp);

// [POST] 編號 02 : 使用者登入 - Email 登入
router.post('/login/email',mw.postuserLoginEmail,controller.post_user_LoginEmail);

// [POST] 編號 03 : 使用者登入 - Google 登入
router.post('/login/google',mw.postuserLoginGoogle,controller.post_user_LoginGoogle);

// [POST] 編號 04 : 使用者登入 - FB 登入
router.post('/login/facebook');

// [POST] 編號 05 : 使用者忘記密碼
router.post('/forgetpw',mw.postuserforgetPW, controller.post_user_forgetPW);

// [PATCH] 編號 06 : 使用者密碼修改 ( 修改密碼畫面 )
router.patch('/resetpw',mw.patchuserresetPW,controller.patch_user_resetPW);

// [GET] 編號 07 : 圖片、文字驗證碼判斷機器人
router.get('/captcha', controller.get_user_captcha);

// [POST] 編號 08 : 使用者登出 ( 以前端處理，不用開發 )


// [GET] 編號 09 : 驗證使用者登入狀態


module.exports = router;