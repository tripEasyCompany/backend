const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');
const { reversePreferenceMap } = require('../utils/Validator/userprofile_Validator');

// [GET] 編號 20 : 使用者已購買項目清單
async function get_user_Purchases(req, res, next) {
  try {
    const user = req.user;
    const dataRepo = await pool.query('SELECT * FROM public."user_orders" where 使用者編號 = $1', [
      user.id,
    ]);

    if (dataRepo.rowCount > 0) {
      const transformedRows = dataRepo.rows.map((row) => {
        // 將偏好分類數字轉換為文字陣列
        const preferences = [
          reversePreferenceMap[row.偏好分類1],
          reversePreferenceMap[row.偏好分類2],
          reversePreferenceMap[row.偏好分類3],
        ];

        // 回傳新的物件，保留其他欄位，並加入「偏好分類」欄位，同時移除 1/2/3
        return {
          ...row,
          偏好分類: preferences,
          偏好分類1: undefined,
          偏好分類2: undefined,
          偏好分類3: undefined,
        };
      });

      // [HTTP 200] 呈現資料
      resStatus({
        res: res,
        status: 200,
        message: '查詢成功',
        dbdata: transformedRows,
      });
    } else {
      // [HTTP 200] 呈現資料
      resStatus({
        res: res,
        status: 200,
        message: '查無資料',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 編號 21 : 使用者查看訂單明細
async function get_user_PurchasesItem(req, res, next) {
  try {
    const { order_item_id } = req.validatedParams;
    const dataRepo = await pool.query(
      'SELECT * FROM public."user_order_item" where order_item_id = $1',
      [order_item_id]
    );

    if (dataRepo.rowCount > 0) {
      const transformedRows = dataRepo.rows.map((row) => {
        // 將偏好分類數字轉換為文字陣列
        const preferences = [
          reversePreferenceMap[row.preference1],
          reversePreferenceMap[row.preference2],
          reversePreferenceMap[row.preference3],
        ];

        // 回傳新的物件，保留其他欄位，並加入「偏好分類」欄位，同時移除 1/2/3
        return {
          ...row,
          preference: preferences,
          preference1: undefined,
          preference2: undefined,
          preference3: undefined,
        };
      });

      // [HTTP 200] 呈現資料
      resStatus({
        res: res,
        status: 200,
        message: '查詢成功',
        dbdata: transformedRows,
      });
    } else {
      // [HTTP 200] 呈現資料
      resStatus({
        res: res,
        status: 200,
        message: '查無資料',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

module.exports = {
  get_user_Purchases,
  get_user_PurchasesItem,
};
