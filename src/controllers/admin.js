const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');

// [GET] 編號 68 : 管理者查看使用者的優惠卷清單
async function get_user_couponList(req, res, next) {
  const { user_id } = req.params;

  try {
    const result = await pool.query(`select * from public."user_couponList" where user_id = $1`, [
      user_id,
    ]);

    if (result.rowCount > 0) {
      resStatus({
        res,
        status: 200,
        message: '查詢成功',
        dbdata: result.rows,
      });
    } else {
      resStatus({
        res,
        status: 200,
        message: '查無此資料',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [DELETE] 編號 69 : 管理者刪除優惠卷綁定
async function delete_user_couponAssign(req, res, next) {
  const { user_id } = req.params;
  const { coupon_id } = req.body;

  try {
    const result = await pool.query(
      `delete from public."user_coupon" where user_id = $1 and coupon_id = $2`,
      [user_id, coupon_id]
    );

    if (result.rowCount > 0) {
      resStatus({
        res,
        status: 200,
        message: '解除綁定成功',
      });
    } else {
      resStatus({
        res,
        status: 200,
        message: '解除綁定失敗',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

module.exports = {
  get_user_couponList,
  delete_user_couponAssign,
};
