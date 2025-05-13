const express = require('express');
const router = express.Router();
const controller = require('../controllers/userProfile');

// middleware 的內容
const mw = require('../middlewares/userProfile/index');
const auth = require('../middlewares/auth');

// [GET] 編號 10 : 使用者用戶資料呈現
router.get('/info', auth, controller.get_user_ProfileData);

// [PATCH] 編號 11 : 使用者用戶資料修改
router.patch('/info', auth, mw.patchuserprofileData, controller.patch_user_ProfileData);

// [PATCH] 編號 12 : 使用者照片個人上傳
router.patch('/avatar', auth, mw.patchuserprofilePhoto('image'),controller.patch_userProfile_Photo);

// [GET] 編號 13 : 使用者會員等級積分
router.get('/pointslevel', auth, controller.get_user_PointCoupon);

module.exports = router;
