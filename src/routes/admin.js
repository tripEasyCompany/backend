const express = require('express');

const router = express.Router();
const controller = require('../controllers/admin');
const auth = require('../middlewares/auth');
const mw = require('../middlewares/admin/index');

// [GET] 42 : 管理者查看註冊用戶資料
router.get('/', auth, mw.getUserinfo, controller.get_userinfo);

// [GET] 43 : 管理者查看註冊用戶詳細資料
router.get('/members/:user_id', auth, mw.getUserDetailinfo, controller.get_userDetailinfo);

// [PATCH] 44 : 管理者修改註冊用戶權限
router.patch('/members/roles', auth, mw.patchUserPurview, controller.patch_userPurview);

// [GET] 45 : 管理者查找使用者資料
router.get('/members/list/:user_id', auth, mw.getUserSearch, controller.get_userSearch);

module.exports = router;