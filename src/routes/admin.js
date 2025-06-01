const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin');

// middleware 的內容
const auth = require('../middlewares/auth');
const authRole = require('../middlewares/authorizeRoles');
const mw = require('../middlewares/admin/index');

// [GET] 42 : 管理者查看註冊用戶資料
router.get('/members', auth, authRole('admin'), mw.getUserinfo, controller.get_userinfo);

// [GET] 43 : 管理者查看註冊用戶詳細資料
router.get(
  '/members/:user_id',
  auth,
  authRole('admin'),
  mw.getUserDetailinfo,
  controller.get_userDetailinfo
);

// [PATCH] 44 : 管理者修改註冊用戶權限
router.patch(
  '/members/roles',
  auth,
  // authRole('admin'),
  mw.patchUserPurview,
  controller.patch_userPurview
);

// [GET] 45 : 管理者查找使用者資料
router.get(
  '/members/list/:user_id',
  auth,
  authRole('admin'),
  mw.getUserSearch,
  controller.get_userSearch
);

// [POST] 53 : 管理者新增異動通知
router.post('/change-info', auth, authRole('admin'), mw.post_Changeinfo, controller.post_Changeinfo);

// [GET] 54 : 管理者查看異動通知
router.get('/change-info', auth, authRole('admin'), mw.get_Changeinfo, controller.get_Changeinfo);

// [PATCH] 55 : 管理者修改異動通知
router.patch('/change-info', auth, authRole('admin'), mw.patch_Changeinfo, controller.patch_Changeinfo);

// [DELETE] 56 : 管理者刪除異動通知
router.delete('/change-info', auth, authRole('admin'), mw.delete_Changeinfo, controller.delete_Changeinfo);

// [GET] 編號 68 : 管理者查看使用者的優惠卷清單
router.get(
  '/members/:user_id/coupons',
  auth,
  authRole('admin'),
  mw.get_userCoupon,
  controller.get_user_couponList
);

// [DELETE] 編號 69 : 管理者刪除優惠卷綁定
router.delete(
  '/members/:user_id/coupons/unbind',
  auth,
  authRole('admin'),
  mw.delete_userCoupon,
  controller.delete_user_couponAssign
);

module.exports = router;
