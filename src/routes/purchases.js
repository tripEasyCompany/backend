const express = require('express');
const router = express.Router();

// middleware 的內容
const auth = require('../middlewares/auth');

// [GET] 編號 20 : 使用者已購買項目清單
router.get('/info',auth);

// [GET] 編號 21 : 使用者查看訂單明細
router.get('/info/:order_id',auth);