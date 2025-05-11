const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');

// [GET] 編號 26 : 使用者查看旅行團、背包客熱門、促銷等項目
async function get_home_Product(req, res, next) {
  try {
    // [HTTP 200] 呈現資料
    resStatus({
      res: res,
      status: 200,
      message: '密碼修改成功',
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 編號 27 : 使用者查看此網頁好評內容
async function get_home_Review(req, res, next) {
  const { lang, page, limit } = req.query;

  try {
    //取資料庫資料
      const reviewData = await pool.query(
        'select * from public."user_level_review_forHome" ORDER BY 評論時間 DESC LIMIT $1 OFFSET $2;',
        [limit, (page - 1) * limit]
      );

      console.log(reviewData)
    // [HTTP 200] 呈現資料
    resStatus({
      res: res,
      status: 200,
      message: '查詢成功',
      dbdata: reviewData.rows
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

module.exports = {
  get_home_Product,
  get_home_Review
};
