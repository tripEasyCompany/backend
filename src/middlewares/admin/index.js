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
  const { coupon_ids } = req.body;
  const couponIdList = Array.isArray(coupon_ids) ? coupon_ids : [coupon_ids];
  const couponRepo = await pool.query(
    'SELECT coupon_id FROM public."coupon" WHERE coupon_id = ANY($1::uuid[])',
    [couponIdList]
  );

  const foundIds = couponRepo.rows.map((row) => row.coupon_id);
  const missingIds = couponIdList.filter((id) => !foundIds.includes(id));

  if (missingIds.length > 0) {
    return resStatus({
      res,
      status: 404,
      message: `查無以下優惠卷: ${missingIds.join(', ')}`,
    });
  }

  next();
}

module.exports = {
  get_userCoupon,
  delete_userCoupon,
};
