const express = require('express');
const router = express.Router();
const controller = require('../controllers/newebpay');

// middleware 的內容
const auth = require('../middlewares/auth');
const authRole = require('../middlewares/authorizeRoles');



// [POST] 編號 37 : 藍新金流交易處理
router.post('/payment', auth, authRole('User'), controller.post_newebpay_payment);



// [POST] 編號 38 : notify
router.post('/notify', controller.post_newebpay_notify);



// [GET] 編號 39 : return
router.post('/return', controller.get_newebpay_return);



module.exports = router;