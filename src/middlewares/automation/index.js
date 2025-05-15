const Joi = require('joi');
const resStatus = require('../../utils/resStatus');

const schema = Joi.object({
  notifi_settings_enabled: Joi.boolean().required().messages({
      'any.required': '「notifi_settings_enabled」 為必填欄位',
      'boolean.base': '「notifi_settings_enabled」 必須是布林值 true 或 false',
    })
});

// [GET] 編號 14 : 使用者取得自動化設定狀態
// 無

// [PATCH] 編號 15 : 使用者勾選要有旅遊提醒
async function patchearlyNoti(req, res, next) {
  const { error } = schema.validate(req.body);

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

module.exports = {
  patchearlyNoti,
};
