const express = require('express');
const router = express.Router();
const controller = require('../controllers/coupon');

// middleware 的內容
const auth = require('../middlewares/auth');
const authRole = require('../middlewares/authorizeRoles');
const mw = require('../middlewares/coupon/index');

// [POST] 編號 61 : 管理者新增優惠卷
router.post('/', auth, authRole('admin'), mw.postCoupon, controller.post_admin_coupon);

// [GET] 編號 62 : 管理者查看優惠卷清單
router.get('/', auth, authRole('admin'), mw.getCoupon, controller.get_admin_coupon);

// [GET] 編號 63 : 管理者查看優惠卷細項
router.get(
  '/:coupon_id',
  auth,
  authRole('admin'),
  mw.get_DetailCoupon,
  controller.get_admin_couponDetails
);

// [PATCH] 編號 64 : 管理者修改優惠卷細項
router.patch(
  '/update/:coupon_id',
  auth,
  authRole('admin'),
  mw.patch_DetailCoupon,
  controller.patch_admin_couponDetails
);

// [PATCH] 編號 65 : 管理者修改優惠卷結束期限
router.patch(
  '/expiry',
  auth,
  authRole('admin'),
  mw.patch_endDateCoupon,
  controller.patch_admin_couponExpiry
);

// [DETELE] 編號 66 : 管理者刪除優惠卷
router.delete('/', auth, authRole('admin'), mw.delete_Coupon, controller.delete_admin_coupon);

// [POST] 編號 67 : 管理者綁定優惠卷
router.post(
  '/assign',
  auth,
  authRole('admin'),
  mw.post_assign_Coupon,
  controller.post_admin_assigncoupon
);

module.exports = router;
