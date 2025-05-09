const express = require('express');
const router = express.Router();

// middleware 的內容


// [GET] 編號 70 : 篩選按鈕 - 國家清單
router.get('/countries');

// [GET] 編號 71 : 篩選按鈕 - 地區清單
router.get('/:country_id/region');