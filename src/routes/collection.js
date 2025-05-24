const express = require('express');

const router = express.Router();
const controller = require('../controllers/collection');
const auth = require('../middlewares/auth');
const authRole = require('../middlewares/authorizeRoles');

const mw = require('../middlewares/collection/index');

// middlewave

// [GET] 17 : 使用者查看收藏項目
router.get('/info/all', auth, authRole('User'), mw.getCollection, controller.get_collection);

// [POST] 18 : 使用者加入收藏項目
router.post('/info/:tour_id', auth, mw.postCollection, controller.post_collection);

// [DELETE] 19 : 使用者刪除收藏項目
router.delete('/info/:favorite_id', auth, mw.deleteCollection, controller.delete_collection);

module.exports = router;
