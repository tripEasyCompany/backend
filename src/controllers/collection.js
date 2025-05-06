const isValid = require('../utils/isValid');
const { pool } = require('../config/database');

const collectionController = {
    // [GET] 使用者查看收藏項目
    async get_collection(req, res, next){
        //取參數
        const { lang, page, limit } = req.query;
        const user_id = req.user.id;

        // if(isValid.isUndefined(lang) || 
        // isValid.isUndefined(page) || isValid.isNotValidString(page) ||
        // isValid.isUndefined(limit) || isValid.isNotValidString(limit))
        // {
        //     res.status(400).json({
        //         "status" : "failed",
	    //         "message" : "欄位未填寫正確"
        //     })
        //     return;
        // }

        //TODO取資料庫資料
        const collectionRepo = await pool.query(
            'SELECT * FROM favorite WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
            [user_id, limit, (page - 1) * limit]
        );
        // if(collectionRepo.rows.length === 0){
        //     res.status(400).json({
        //         "status" : "failed",
        //         "message" : "查無此項目"
        //     })
        //     return;
        // }

        //送出結果 200
        res.status(200).json({
            "status" : "success",
            "message" : "查詢成功",
            "data" : collectionRepo.rows
        })
    },

    // [POST] 使用者加入收藏項目
    async post_collection(req, res, next){
        const { tour_id } = req.params;
        
        // if(isValid.isUndefined(tour_id) || isValid.isNotValidString(tour_id)){ 
        //     res.status(400).json({
        //         "status" : "failed",
        //         "message" : "欄位未填寫正確"
        //     })
        //     return;
        // }

        // //檢查有無此商品
        // const result = await pool.query('SELECT * FROM tour WHERE tour_id = $1', [tour_id]);
        // if(result.rows.length === 0){
        //     res.status(400).json({
        //         "status" : "failed",
        //         "message" : "查無此項目"
        //     })
        //     return;
        // }

        //檢查是否已收藏
        // const favoriteCheck = await pool.query(
        //     'SELECT 1 FROM favorite WHERE user_id = $1 AND tour_id = $2',
        //     [user_id, tour_id]
        // );

        // if (favoriteCheck.rows.length > 0) {
        //     return res.status(400).json({
        //         status: "failed",
        //         message: "已經收藏過此項目"
        //     });
        // }

        await pool.query('INSERT INTO favorite (user_id, tour_id) VALUES ($1, $2)', [req.user.id, tour_id]);
        res.status(200).json({
            "status" : "success",
            "message" : "新增成功",
        })
        
    },

    // [DELETE] 使用者取消收藏項目
    async delete_collection(req, res, next){
        const { favorite_id } = req.params;
        const user_id = req.user.id;

        if(isValid.isUndefined(favorite_id) || isValid.isNotValidString(favorite_id)){ 
            res.status(400).json({
                "status" : "failed",
                "message" : "欄位未填寫正確"
            })
            return;
        }

        const result = await pool.query('SELECT * FROM favorite WHERE user_id = $1 AND favorite_id = $2', [user_id, favorite_id]);
        if(result.rows.length === 0){
            res.status(400).json({
                "status" : "failed",
                "message" : "查無此項目"
            })
            return;
        }

        await pool.query('DELETE FROM favorite WHERE user_id = $1 AND favorite_id = $2', [user_id, favorite_id]);
        res.status(200).json({
            "status" : "success",
            "message" : "刪除成功",
        })
    }
}

module.exports = collectionController;