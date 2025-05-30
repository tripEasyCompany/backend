const express = require('express');
const router = express.Router();
const controller = require('../controllers/userProfile');

// middleware 的內容
const mw = require('../middlewares/userProfile/index');
const auth = require('../middlewares/auth');
const authRole = require('../middlewares/authorizeRoles');

// [GET] 編號 10 : 使用者用戶資料呈現
<<<<<<< HEAD
router.get('/info', auth, authRole('user'), controller.get_user_ProfileData);
=======
router.get('/info', auth, authRole('User'), controller.get_user_ProfileData);
>>>>>>> origin/main

// [PATCH] 編號 11 : 使用者用戶資料修改
router.patch(
  '/info',
  auth,
<<<<<<< HEAD
  authRole('user'),
=======
  authRole('User'),
>>>>>>> origin/main
  mw.patchuserprofileData,
  controller.patch_user_ProfileData
);

// [PATCH] 編號 12 : 使用者照片個人上傳
router.patch(
  '/avatar',
  auth,
<<<<<<< HEAD
  authRole('user'),
=======
  authRole('User'),
>>>>>>> origin/main
  mw.patchuserprofilePhoto('image'),
  controller.patch_userProfile_Photo
);

// [GET] 編號 13 : 使用者會員等級積分
<<<<<<< HEAD
router.get('/pointslevel', auth, authRole('user'), controller.get_user_PointCoupon);
=======
router.get('/pointslevel', auth, authRole('User'), controller.get_user_PointCoupon);
>>>>>>> origin/main

module.exports = router;
