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

  // [HTTP 409] 優惠卷代碼重複
  const result = await pool.query('SELECT * FROM public."coupon" where code = $1', [
    req.body.coupon,
  ]);

  if (result.rowCount > 0) {
    resStatus({
      res: res,
      status: 409,
      message: '優惠卷代碼重複',
    });
    return;
  }

  next();
}

// [PATCH] 編號 65 : 管理者修改優惠卷結束期限
async function patch_endDateCoupon(req, res, next) {
  const { error } = coupon_Validator.updateCouponExpirySchema.validate(req.body);

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

// [DETELE] 編號 66 : 管理者刪除優惠卷
async function delete_Coupon(req, res, next) {
  const { error } = coupon_Validator.deleteCouponSchema.validate(req.body);

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

// [POST] 編號 67 : 管理者綁定優惠卷
async function post_assign_Coupon(req, res, next) {
  const { error } = coupon_Validator.postCouponAssignSchema.validate(req.body);

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
  const { user_ids } = req.body;
  const userIdList = Array.isArray(user_ids) ? user_ids : [user_ids];
  const userRepo = await pool.query(
    'SELECT user_id FROM public."user" WHERE user_id = ANY($1::uuid[])',
    [userIdList]
  );

  const foundIds = userRepo.rows.map((row) => row.user_id);
  const missingIds = userIdList.filter((id) => !foundIds.includes(id));

  if (missingIds.length > 0) {
    return resStatus({
      res,
      status: 404,
      message: `查無以下使用者: ${missingIds.join(', ')}`,
    });
  }

  // [HTTP 404] 查無此優惠卷
  const { coupon } = req.body;
  const couponRepo = await pool.query('SELECT coupon_id FROM public."coupon" WHERE code = $1', [
    coupon,
  ]);
  if (couponRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此優惠卷',
    });
  }

  // [HTTP 409] 優惠卷已被綁定
  const couponId = couponRepo.rows[0].coupon_id;
  const couponAssignRepo = await pool.query(
    'SELECT user_id FROM public."user_coupon" WHERE coupon_id = $1 AND user_id = ANY($2::uuid[])',
    [couponId, userIdList]
  );
  const assignIds = couponAssignRepo.rows.map((row) => row.user_id);
  const alreadyAssignedIds = userIdList.filter((id) => assignIds.includes(id));

  if (alreadyAssignedIds.length > 0) {
    return resStatus({
      res,
      status: 409,
      message: `以下使用者優惠卷已被綁定: ${alreadyAssignedIds.join(', ')}`,
    });
  }

  // [HTTP 409] 優惠卷已過期
  const currentDate = new Date();
  const couponExpiryRepo = await pool.query(
    'SELECT * FROM public."coupon" WHERE coupon_id = $1 AND expire_date < $2',
    [couponId, currentDate]
  );
  if (couponExpiryRepo.rowCount > 0) {
    return resStatus({
      res,
      status: 409,
      message: '優惠卷已過期',
    });
  }

  // [HTTP 409] 優惠卷已使用
  const couponUsedRepo = await pool.query(
    'SELECT user_id FROM public."user_coupon" WHERE coupon_id = $1 AND status = 1 AND user_id = ANY($2::uuid[])',
    [couponId, userIdList]
  );
  const usedIds = couponUsedRepo.rows.map((row) => row.user_id);
  const alreadyUsedIds = userIdList.filter((id) => usedIds.includes(id));

  if (alreadyUsedIds.length > 0) {
    return resStatus({
      res,
      status: 409,
      message: `以下使用者優惠卷已使用: ${alreadyUsedIds.join(', ')}`,
    });
  }

  next();
}

module.exports = {
  postCoupon,
  getCoupon,
  get_DetailCoupon,
  patch_DetailCoupon,
  patch_endDateCoupon,
  delete_Coupon,
  post_assign_Coupon,
};
