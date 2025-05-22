const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');

// [POST] 編號 89 : 使用者進入填寫畫面後產生訂單

// [GET] 編號 34 : 使用者進入填寫畫面後預帶使用者資訊
async function get_user_CheckoutUserInfo(req, res, next) {
  const { id } = req.user;

  try {
    const result = await pool.query(`select * from public."user" where user_id = $1`, [
      id,
    ]);

    // [HTTP 200] 查詢成功
    if (result.rowCount > 0) {
      resStatus({
        res,
        status: 200,
        message: '查詢成功',
        dbdata: {
            "user_id": id,
            "name": result.rows[0].name,
            "email": result.rows[0].email
        },
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

// [POST]] 編號 35 : 使用者輸入個人資料、選擇想要付款方式

// [GET] 編號 36 : 使用者確認購買項目、總金額

module.exports = {
  get_user_CheckoutUserInfo
};
