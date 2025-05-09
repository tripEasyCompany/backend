const express = require('express');
const router = express.Router();
const controller = require('../controllers/userprofile');



//middlewares內容
const mw = require('../middlewares/userprofile/index');
const auth = require("../middlewares/auth");//登入驗證



//API路由

//[GET] 編號 10 使用者用戶資料呈現
router.get('/info', controller.get_info);//執行`mw.postuserInfo`這個middlewares，在接續執行auth，後才會執行controller
//router.post('/info', mw.postuserInfo, auth,controller.get_info);//正式使用

/*
//[PATCH] 編號 11 使用者用戶資料修改
router.patch('/infoedit', mw.postuserInfoedit, controller.patch_infoedit);



//[PATCH] 編號 12 使用者個人照片修改
router.patch('/avatar', mw.postuserAvatar, controller.patch_avatar);


//[GET] 編號 13 使用者會員等級積分
router.get('/pointslevel', mw.postuserPointslevel, controller.get_pointslevel);

*/


module.exports = router;