const resStatus = require('../../utils/resStatus');

const automation_Validator = require('../../utils/Validator/automation_Validator.js');

// [GET] 編號 14 : 使用者取得自動化設定狀態
// 無

// [PATCH] 編號 15 : 使用者勾選要有旅遊提醒
async function patchearlyNoti(req, res, next) {
  const { error } = automation_Validator.early_schema.validate(req.body);

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

// [PATCH] 編號 16 : 使用者勾選預期價格通知提醒
async function patchpriceNoti(req, res, next) {
  const { error, value } = automation_Validator.price_schema.validate(req.body);

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

  req.body = value;
  next();
}

module.exports = {
  patchearlyNoti,
  patchpriceNoti,
};
