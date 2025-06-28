const express = require('express');
const router = express.Router();
const controller = require('../controllers/product');

// middleware 的內容
const mw = require('../middlewares/product/index');
const auth_not_manda = require('../middlewares/auth_not_mandatory');
const auth = require('../middlewares/auth');
const authRole = require('../middlewares/authorizeRoles');

// [POST] 編號 46 : 管理者新增旅遊項目
router.post('/add', auth, authRole('admin'), mw.post_Product, controller.post_admin_product);
// X [POST] 46 : 管理者新增旅遊項目
// router.post('/add', auth, authRole('admin'),/* mw.,*/ controller.post_Touradd);

// [GET] 47 : 管理者查看刊登的旅遊項目
router.get('/', auth, authRole('admin'), mw.get_tourSearch, controller.get_tourSearch);

// [GET] 48 : 管理者查看旅遊項目詳細內容
router.get('/:tour_id', auth, authRole('admin'), mw.get_admin_tourDetail, controller.get_tourDetail);

// [PATCH] 49 : 管理者修改旅遊項目細項內容
router.patch('/:tour_id', auth, authRole('admin'), mw.patch_admin_tourDetail, controller.patch_tourInfo);

// [PATCH] 50 : 管理者上架刊登旅遊項目
router.patch('/status', auth, authRole('admin'), mw.patch_tourStatus, controller.patch_tourStatus);

// [DELETE] 51 : 管理者刪除旅遊項目
router.delete('/', auth, authRole('admin'), mw.delete_tourProduct, controller.delete_tourProduct);


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
