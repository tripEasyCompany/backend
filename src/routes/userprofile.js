const express = require('express');
const router = express.Router();
const controller = require('../controllers/userprofile');



//middlewares內容
const mw = require('../middlewares/userinfo/index');
const auth = require("../middlewares/auth");//登入驗證



//API路由

//[GET] 編號 10 使用者用戶資料呈現
router.post('/info', mw., controller.);

//[PATCH] 編號 11 使用者用戶資料修改
router.post('/infoedit', mw., controller.);



//[PATCH] 編號 12 使用者個人照片修改
router.post('/avatar', mw., controller.);


//[GET] 編號 13 使用者會員等級積分
router.post('/pointslevel', mw., controller.);




module.exports = router;