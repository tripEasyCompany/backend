const express = require('express');

const router = express.Router();
const auth = require('../middlewares/auth');

// [POST] 編號 61 : 管理者新增優惠卷
router.post('/', auth);

// [GET] 編號 62 : 管理者查看優惠卷清單
router.get('/', auth);

// [GET] 編號 63 : 管理者查看優惠卷細項
router.get('/:coupon_id', auth);

// [PATCH] 編號 64 : 管理者修改優惠卷細項
router.patch('/:coupon_id', auth);

// [PATCH] 編號 65 : 管理者修改優惠卷結束期限
router.patch('/expiry', auth);

// [DETELE] 編號 66 : 管理者刪除優惠卷
router.delete('/', auth);

// [POST] 編號 67 : 管理者綁定優惠卷
router.post('/assign', auth);

module.exports = router;
