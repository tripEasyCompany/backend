const isValid = require('../utils/isValid');
const { pool } = require('../config/database');

const collectionController = {
    // [GET] 使用者查看收藏項目
    async get_collection(req, res, next){
        //取URL內參數
        const { lang, page, limit } = req.query;
        if(isValid.isUndefined(lang) || 
        isValid.isUndefined(page) || isValid.isNotValidInteger(page) ||
        isValid.isUndefined(limit) || isValid.isNotValidInteger(limit))
        {
            res.status(400).json({
                "status" : "failed",
	            "message" : "欄位未填寫正確"
            })
        }

        //TODO取資料庫資料
        const collectionRepo = await pool.query(
            'SELECT * FROM favorite WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
            [user_id, limit, (page - 1) * limit]
        );

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

        if(isValid.isUndefined(tour_id) || isValid.isNotValidInteger(tour_id)){ 
            res.status(400).json({
                "status" : "failed",
                "message" : "欄位未填寫正確"
            })
            return;
        }

        const result = await pool.query('SELECT * FROM tour WHERE id = $1', [tour_id]);
        if(result.rows.length === 0){
            res.status(400).json({
                "status" : "failed",
                "message" : "查無此項目"
            })
            return;
        }

        await pool.query('INSERT INTO favorite (user_id, tour_id) VALUES ($1, $2)', [user_id, tour_id]);
        res.status(200).json({
            "status" : "success",
            "message" : "新增成功",
        })
    },

    // [DELETE] 使用者取消收藏項目
    async delete_collection(req, res, next){
        const { collection_id } = req.params;

        if(isValid.isUndefined(collection_id) || isValid.isNotValidInteger(collection_id)){ 
            res.status(400).json({
                "status" : "failed",
                "message" : "欄位未填寫正確"
            })
            return;
        }

        const result = await pool.query('SELECT * FROM favorite WHERE user_id = $1 AND collection_id = $2', [user_id, collection_id]);
        if(result.rows.length === 0){
            res.status(400).json({
                "status" : "failed",
                "message" : "查無此項目"
            })
            return;
        }

        await pool.query('DELETE FROM favorite WHERE user_id = $1 AND collection_id = $2', [user_id, collection_id]);
        res.status(200).json({
            "status" : "success",
            "message" : "刪除成功",
        })
    }
}

module.exports = collectionController;