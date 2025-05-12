const express = require('express');
const router = express.Router();
const controller = require('../controllers/home');

// middleware 的內容
const mw = require('../middlewares/home/index');
const auth_not_manda = require('../middlewares/auth_not_mandatory');

// [GET] 編號 26 : 使用者查看旅行團、背包客熱門、促銷等項目
router.get('/products', auth_not_manda, mw.gethomeProduct, controller.get_home_Product);

// [GET] 編號 27 : 使用者查看此網頁好評內容
router.get('/reviews', mw.gethomeReview, controller.get_home_Review);

module.exports = router;
