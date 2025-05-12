const express = require('express');
const router = express.Router();
const controller = require('../controllers/other');

// middleware 的內容
const mw = require('../middlewares/other/index');

// [GET] 編號 70 : 篩選按鈕 - 國家清單
router.get('/countries', controller.get_filter_country);

// [GET] 編號 71 : 篩選按鈕 - 地區清單
router.get('/:country_id/region', mw.getfilterRegion, controller.get_filter_region);

module.exports = router;
