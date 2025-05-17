const resStatus = require('../../utils/resStatus.js');

// 資料驗證相關模組
const other_Validator = require('../../utils/Validator/other_Validator.js');

// [GET] 編號 70 : 篩選按鈕 - 國家清單
// 無

// [GET] 編號 71 : 篩選按鈕 - 地區清單
async function getfilterRegion(req, res, next) {
  const { error } = other_Validator.paramSchema.validate(req.params);

  // [HTTP 400] 資料錯誤
  if (error) {
    const message = error.details[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  next();
}

module.exports = {
  getfilterRegion,
};
