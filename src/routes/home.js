const express = require('express');
const router = express.Router();

// middleware 的內容


// [GET] 編號 26 : 使用者查看旅行團、背包客熱門、促銷等項目
router.get('/products');

// [GET] 編號 27 : 使用者查看此網頁好評內容
router.get('/reviews');