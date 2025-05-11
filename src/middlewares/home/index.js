const resStatus = require('../../utils/resStatus.js');

const home_Validator = require('../../utils/Validator/common_Validator.js');

// [GET] 編號 26 : 使用者查看旅行團、背包客熱門、促銷等項目
async function gethomeProduct(req, res, next) {
  const { error } = home_Validator.reviewSchema.validate(req.query);

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

// [GET] 編號 27 : 使用者查看此網頁好評內容
async function gethomeReview(req, res, next) {
  const { error } = home_Validator.reviewSchema.validate(req.query);

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
  gethomeProduct,
  gethomeReview,
};
