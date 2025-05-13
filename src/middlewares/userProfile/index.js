const resStatus = require('../../utils/resStatus');
const { pool } = require('../../config/database');
const multer = require('multer');

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

// 上傳限制設定
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 限制 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      const err = new Error('只允許上傳圖片格式');
      err.code = 'INVALID_FILE_TYPE';

      return cb(err, false);
    }
    cb(null, true);
  },
});

// [PATCH] 編號 12 : 使用者照片個人上傳
function patchuserprofilePhoto(fieldName = 'image') {
  const singleUpload = upload.single(fieldName);

  return (req, res, next) => {
    singleUpload(req, res, (err) => {
      if (err) {
        // 處理 Multer 錯誤
        if (err instanceof multer.MulterError) {
          const codeMap = {
            LIMIT_FILE_SIZE: '圖片太大，請小於 2MB',
            LIMIT_FILE_COUNT: '只能上傳一張圖片',
            LIMIT_UNEXPECTED_FILE: '欄位名稱不正確或不支援多檔上傳',
          };
          const message = codeMap[err.code] || '圖片上傳失敗';
          return resStatus({
            res,
            status: 400,
            message,
          });
        }

        // 自訂錯誤（圖片格式）
        if (err.code === 'INVALID_FILE_TYPE') {
          return resStatus({
            res,
            status: 400,
            message: err.message,
          });
        }

        // 其他未知錯誤
        return resStatus({
          res,
          status: 500,
          message: err.message || '圖片上傳時發生未知錯誤',
        });
      }

      // 檢查是否真的有檔案
      if (!req.file) {
        return resStatus({
          res,
          status: 400,
          message: '請提供圖片',
        });
      }

      next();
    });
  };
}

// [GET] 編號 13 : 使用者會員等級積分
// 無

module.exports = {
  patchuserprofileData,
  patchuserprofilePhoto,
};
