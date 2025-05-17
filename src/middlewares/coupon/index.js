const resStatus = require('../../utils/resStatus.js');
const { pool } = require('../../config/database');

const coupon_Validator = require('../../utils/Validator/coupon_Validator.js');

// [POST] 編號 61 : 管理者新增優惠卷
async function postCoupon(req, res, next) {
  const { error } = coupon_Validator.createCouponSchema.validate(req.body);

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

  // [HTTP 409] 優惠券代碼重複
  const couponRepo = await pool.query('SELECT * FROM public."coupon" where code = $1', [
    req.body.coupon,
  ]);

  if (couponRepo.rowCount > 0) {
    resStatus({
      res: res,
      status: 409,
      message: '優惠券代碼重複',
    });
    return;
  }

  next();
}

// [GET] 編號 62 : 管理者查看優惠卷清單
async function getCoupon(req, res, next) {
  const { error } = coupon_Validator.queryCouponSchema.validate(req.query);

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

// [GET] 編號 63 : 管理者查看優惠卷細項
async function get_DetailCoupon(req, res, next) {
  const { error } = coupon_Validator.getCouponDetailSchema.validate(req.params);

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

  // [HTTP 404] 查無此優惠卷
  const couponRepo = await pool.query('SELECT * FROM public."coupon" where coupon_id = $1', [
    req.params.coupon_id,
  ]);

  if (couponRepo.rowCount === 0) {
    resStatus({
      res: res,
      status: 404,
      message: '查無此優惠卷',
    });
    return;
  }

  next();
}

// [PATCH] 編號 64 : 管理者修改優惠卷細項
async function patch_DetailCoupon(req, res, next) {
  const { error: paramsError } = coupon_Validator.getCouponDetailSchema.validate(req.params);
  const { error: bodyError } = coupon_Validator.updateCouponSchema.validate(req.body);

  // [HTTP 400] 資料錯誤
  if (paramsError || bodyError) {
    const message =
      paramsError?.details?.[0]?.message || bodyError?.details?.[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [HTTP 404] 查無此優惠卷
  const couponRepo = await pool.query('SELECT * FROM public."coupon" where coupon_id = $1', [
    req.params.coupon_id,
  ]);

  if (couponRepo.rowCount === 0) {
    resStatus({
      res: res,
      status: 404,
      message: '查無此優惠卷',
    });
    return;
  }
  next();
}

// [PATCH] 編號 65 : 管理者修改優惠卷結束期限

// [DETELE] 編號 66 : 管理者刪除優惠卷

// [POST] 編號 67 : 管理者綁定優惠卷

module.exports = {
  postCoupon,
  getCoupon,
  get_DetailCoupon,
  patch_DetailCoupon,
};
