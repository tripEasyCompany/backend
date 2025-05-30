const express = require('express');
const router = express.Router();
const controller = require('../controllers/promotion');

// middleware 的內容
const auth = require('../middlewares/auth');
const authRole = require('../middlewares/authorizeRoles');
const mw = require('../middlewares/promotion/index');

// [GET] 編號 57 : 管理者查看促銷清單
router.get('/', auth, authRole('admin'), mw.getPromotions, controller.get_admin_promotion);

// [POST] 編號 58 : 管理者新增/修改促銷內容
router.post('/upsert', auth, authRole('admin'), mw.postPromotions, controller.post_admin_promotion);

// [DETELE] 編號 59 : 管理者刪除促銷內容
router.delete(
  '/',
  auth,
  authRole('admin'),
  mw.deletetPromotions,
  controller.delete_admin_promotion
);

module.exports = router;
