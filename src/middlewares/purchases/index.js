const resStatus = require('../../utils/resStatus.js');
const { pool } = require('../../config/database');

// 資料驗證相關模組
const purchases_Validator = require('../../utils/Validator/purchases_Validator.js');

// [GET] 編號 20 : 使用者已購買項目清單
// 無

// [GET] 編號 21 : 使用者查看訂單明細
async function getpurchasesOrder(req, res, next) {
  const { error: paramsError, value: paramsValue } = purchases_Validator.paramSchema.validate(
    req.params
  );
  const { error: queryError, value: queryValue } = purchases_Validator.querySchema.validate(
    req.query
  );

  // [HTTP 400] 資料錯誤
  if (paramsError || queryError) {
    const message =
      paramsError?.details[0]?.message || queryError?.details[0]?.message || '欄位驗證錯誤';
    return resStatus({
      res: res,
      status: 400,
      message: message,
    });
  }

  // [HTTP 404] 無此訂單編號
  const dataRepo = await pool.query('SELECT * FROM public."order_item" where order_item_id = $1', [
    req.params.order_item_id,
  ]);
  if (!dataRepo) {
    return resStatus({
      res: res,
      status: 404,
      message: '無此訂單細項編號',
    });
  }

  // ✅ 將驗證後的資料存回 req 供後續使用
  req.validatedParams = paramsValue;
  req.validatedQuery = queryValue;
  next();
}

module.exports = {
  getpurchasesOrder,
};
