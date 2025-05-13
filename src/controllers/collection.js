const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');

const collectionController = {
  // [GET] 17 : 使用者查看收藏項目
  async get_collection(req, res, next) {
    try {
      //取參數
      const { lang, page, limit } = req.query;
      const user_id = req.user.id;

      //取資料庫資料
      const collectionRepo = await pool.query(
        'SELECT * FROM favorite WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [user_id, limit, (page - 1) * limit]
      );
      // [HTTP 201]
      resStatus({
            res: res,
            status: 200,
            message: '查詢成功',
            dbdata: {
              data:collectionRepo.rows
            }
      });
    } catch (error) {
        // [HTTP 500] 伺服器異常
        if (client) await client.query('ROLLBACK');
        console.error('❌ 伺服器內部錯誤:', error);
        next(error);
    } 
  },

  // [POST] 18 : 使用者加入收藏項目
  async post_collection(req, res, next) {
    try {
      const { tour_id } = req.params;
      const user_id = req.user.id;
``
      await pool.query('INSERT INTO favorite (user_id, tour_id) VALUES ($1, $2)', [
        user_id,
        tour_id,
      ]);
      resStatus({
        res: res,
        status: 200,
        message: '新增成功',
      });
    } catch (error) {
        // [HTTP 500] 伺服器異常
        if (client) await client.query('ROLLBACK');
        console.error('❌ 伺服器內部錯誤:', error);
        next(error);
      } 
  },

  // [DELETE] 19 : 使用者取消收藏項目
  async delete_collection(req, res, next) {
    try {
      const { favorite_id } = req.params;
      const user_id = req.user.id;

      await pool.query('DELETE FROM favorite WHERE user_id = $1 AND favorite_id = $2', [
        user_id,
        favorite_id,
      ]);
      resStatus({
        res: res,
        status: 200,
        message: '刪除成功',
      });
    }catch (error) {
        // [HTTP 500] 伺服器異常
        if (client) await client.query('ROLLBACK');
        console.error('❌ 伺服器內部錯誤:', error);
        next(error);
      } 
  }
};

module.exports = collectionController;
