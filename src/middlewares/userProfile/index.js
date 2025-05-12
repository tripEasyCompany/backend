const resStatus = require('../../utils/resStatus');
const { pool } = require('../../config/database');

// 資料驗證相關模組
const userprofile_Validator = require('../../utils/Validator/userprofile_Validator');
const preferenceNameToId = require('../../utils/preferenceMap');

// [GET] 編號 10 : 使用者用戶資料呈現
// 無

// [PATCH] 編號 11 : 使用者用戶資料修改
async function patchuserprofileData(req, res, next) {
  const { error, value } = userprofile_Validator.updateProfile_schema.validate(req.body, {
    abortEarly: false,
  });

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

  // 偏好設定的 Mapping 分類
  const { preference } = value;
  const preferenceIds = preference.map((name) => preferenceNameToId[name]);
  if (preferenceIds.includes(undefined)) {
    return resStatus({
      res: res,
      status: 409,
      message: '包含無效的偏好名稱',
    });
  }

  req.body = value; // 保留乾淨資料
  req.body.preference = preferenceIds;
  next();
}

// [PATCH] 編號 12 : 使用者照片個人上傳

// [GET] 編號 13 : 使用者會員等級積分
// 無

module.exports = {
  patchuserprofileData,
};
