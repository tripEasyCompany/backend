const resStatus = require('../../utils/resStatus');
const { pool } = require('../../config/database');

const checkout_Vaildator = require('../../utils/Validator/checkout_Vaildator');

// [POST] 編號 89 : 使用者進入填寫畫面後產生訂單
async function post_userOrder(req, res, next) {
  const { error } = checkout_Vaildator.cartIDSchema.validate(req.params);

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

  // [HTTP 404] 查無此購物車項目
  const { cart_id } = req.params;
  const cartRepo = await pool.query('SELECT * FROM public."cart" WHERE cart_id = $1', [cart_id]);
  if (cartRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此購物車項目',
    });
  }

  next();
}

// [GET] 編號 34 : 使用者進入填寫畫面後預帶使用者資訊
async function get_userOrderPrfile(req, res, next) {
  const { error } = checkout_Vaildator.orderIDSchema.validate(req.params);

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

  // [HTTP 404] 查無此訂單項目
  const { order_id } = req.params;
  const orderRepo = await pool.query('SELECT * FROM public."orders" WHERE order_id = $1', [
    order_id,
  ]);
  if (orderRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此訂單項目',
    });
  }

  next();
}

// [PATCH] 編號 35 : 使用者輸入個人資料、選擇想要付款方式
async function patch_userOrderPreview(req, res, next) {
  const userId = req.user.id;
  const { error: paramsError } = checkout_Vaildator.orderIDSchema.validate(req.params);
  const { error: bodyError } = checkout_Vaildator.postSchema.validate(req.body);

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
  const userRepo = await pool.query('SELECT * FROM public."user" WHERE email = $1', [
    req.body.user.email,
  ]);
  if (userRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此使用者',
    });
  }

  // [HTTP 404] 查無此訂單項目
  const { order_id } = req.params;
  const orderRepo = await pool.query('SELECT * FROM public."orders" WHERE order_id = $1', [
    order_id,
  ]);
  if (orderRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此訂單項目',
    });
  }

  if (req.body.discount.type === 'coupon') {
    // [HTTP 404] 查無此優惠卷
    const couponRepo = await pool.query(
      'SELECT * FROM public."user_couponList" where coupon_id = $1 and user_id = $2',
      [req.body.discount.coupon_id, userId]
    );
    if (couponRepo.rowCount === 0) {
      resStatus({
        res: res,
        status: 404,
        message: '查無此優惠卷',
      });
      return;
    }

    // [HTTP 409] 優惠券已使用
    if (couponRepo.rows[0].status === 1) {
      resStatus({
        res: res,
        status: 409,
        message: '優惠券已使用',
      });
      return;
    }

    // [HTTP 409] 優惠券已過期
    const now = new Date();
    const endDate = new Date(couponRepo.rows[0].expire_date);
    if (now > endDate) {
      resStatus({
        res: res,
        status: 409,
        message: '優惠券已過期',
      });
      return;
    }
  } else if (req.body.discount.type === 'point') {
    // [HTTP 409] 超出可使用的點數
    const pointRepo = await pool.query(
      'SELECT * FROM public."user_level_point_coupon" ucl where 使用者編號 = $1',
      [userId]
    );

    if (pointRepo.rowCount === 0) {
      resStatus({
        res: res,
        status: 409,
        message: '查無可使用的點數',
      });
      return;
    }
    if (pointRepo.rows[0].使用者旅遊積分 < req.body.discount.used_point) {
      resStatus({
        res: res,
        status: 409,
        message: '超出可使用的點數',
      });
      return;
    }
  }

  next();
}

// [GET] 編號 36 : 使用者確認購買項目、總金額
async function get_userCheckOrder(req, res, next) {
  const { error } = checkout_Vaildator.orderIDSchema.validate(req.params);

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

  // [HTTP 404] 查無此訂單項目
  const { order_id } = req.params;
  const orderRepo = await pool.query('SELECT * FROM public."orders" WHERE order_id = $1', [
    order_id,
  ]);
  if (orderRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此訂單項目',
    });
  }

  next();
}

module.exports = {
  post_userOrder,
  get_userOrderPrfile,
  patch_userOrderPreview,
  get_userCheckOrder,
};
