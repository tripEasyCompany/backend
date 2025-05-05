const express = require('express');

const router = express.Router();
const controller = require('../controllers/collection');
const auth = require('../middlewares/auth');

// middlewave

// [GET] 使用者查看收藏項目
router.get('/info', auth, controller.get_collection);

// [POST] 使用者加入收藏項目
router.post('/info/:tour_id', auth, controller.post_collection);

// [DELETE] 使用者刪除收藏項目
router.delete('/info/:favorite_id', auth, controller.delete_collection);

module.exports = router;