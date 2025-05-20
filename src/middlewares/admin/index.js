const resStatus = require('../../utils/resStatus.js');
const { pool } = require('../../config/database');

const coupon_Validator = require('../../utils/Validator/coupon_Validator.js');

// [GET] 編號 68 : 管理者查看使用者的優惠卷清單
async function get_userCoupon(req, res, next) {
  const { error } = coupon_Validator.getuserCouponSchema.validate(req.params);

  // [HTTP 400] 資料錯誤
  if (error) {
    const message = error?.details?.[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [HTTP 404] 查無此使用者
  const { user_id } = req.params;
  const userRepo = await pool.query('SELECT user_id FROM public."user" WHERE user_id = $1', [
    user_id,
  ]);
  if (userRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此使用者',
    });
  }

  next();
}

// [DELETE] 編號 69 : 管理者刪除優惠卷綁定
async function delete_userCoupon(req, res, next) {
  const { error: paramsError } = coupon_Validator.getuserCouponSchema.validate(req.params);
  const { error: bodyError } = coupon_Validator.deleteuserCouponSchema.validate(req.body);

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

  // [HTTP 404] 查無此使用者
  const { user_id } = req.params;
  const userRepo = await pool.query('SELECT user_id FROM public."user" WHERE user_id = $1', [
    user_id,
  ]);
  if (userRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此使用者',
    });
  }

  // [HTTP 404] 查無此優惠卷
  const { coupon_id } = req.body;
  const couponRepo = await pool.query('SELECT * FROM public."coupon" WHERE coupon_id = $1', [
    coupon_id,
  ]);
  if (couponRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此優惠卷',
    });
  }

  // [HTTP 404] 查無此優惠卷綁定
  const userAssignRepo = await pool.query(
    'SELECT * FROM public."user_coupon" WHERE user_id = $1 AND coupon_id = $2',
    [user_id, coupon_id]
  );
  if (userAssignRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此優惠卷綁定',
    });
  }

  next();
}

module.exports = {
  get_userCoupon,
  delete_userCoupon,
};
