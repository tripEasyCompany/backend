const express = require('express');

const router = express.Router();
const auth = require('../middlewares/auth');

// [GET] 編號 57 : 管理者查看促銷清單
router.get('/', auth);

// [POST] 編號 58 : 管理者新增/修改促銷內容
router.post('/upsert', auth);

// [DETELE] 編號 59 : 管理者刪除促銷內容
router.delete('/', auth);

module.exports = router;
