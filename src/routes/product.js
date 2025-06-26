const express = require('express');
const router = express.Router();
const controller = require('../controllers/product');

// middleware 的內容
const mw = require('../middlewares/product/index');
const auth_not_manda = require('../middlewares/auth_not_mandatory');
const auth = require('../middlewares/auth');
const authRole = require('../middlewares/authorizeRoles');

// [POST] 編號 46 : 管理者新增旅遊項目
router.post('/add', auth, authRole('admin'), mw.productImageUpload(), mw.post_Product, controller.post_admin_product);

// [GET] 編號 22 : 使用者查詢旅遊項目
router.get('/', auth_not_manda, mw.get_tourData, controller.get_tourData);

// [GET] 編號 23 : 使用者查看旅遊項目詳細資料
router.get('/:tour_id', auth_not_manda, mw.get_tourDetail, controller.get_tourDetails);

// [GET] 編號 24 : 使用者查看細項資料好評分數、評論
router.get('/:tour_id/reviews', auth_not_manda, mw.get_tourReview, controller.get_tourReview);

// [GET] 編號 25 : 使用者查看細項資料隱藏玩法
router.get(
  '/:tour_id/hidden-shares',
  auth_not_manda,
  mw.get_tourHiddenPlay,
  controller.get_tourHiddenPlay
);

module.exports = router;
