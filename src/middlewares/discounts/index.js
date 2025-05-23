const resStatus = require('../../utils/resStatus.js');
const { pool } = require('../../config/database');

const discounts_Validatior = require('../../utils/Validator/discounts_Validatior.js');

// [POST] 編號 32 : 使用者輸入優惠卷、累積積分
async function postDiscounts(req, res, next) {
  const userId = req.user.id;
  const { error: bodyError } = discounts_Validatior.baseschema.validate(req.body);
  const { error: orderError } = discounts_Validatior.orderIDSchema.validate(req.params);

  // [HTTP 400] 資料錯誤
  if (bodyError || orderError) {
    const message =
      bodyError?.details[0]?.message || orderError?.details[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [HTTP 400] 查無訂單編號
  const orderRepo = await pool.query(
    'SELECT * FROM public."orders" where order_id = $1 and user_id = $2',
    [req.params.order_id, userId]
  );
  if (orderRepo.rowCount === 0) {
    resStatus({
      res: res,
      status: 400,
      message: '查無訂單編號',
    });
    return;
  }

  if (req.body.type === 'coupon') {
    // [HTTP 404] 查無此優惠卷
    const couponRepo = await pool.query(
      'SELECT * FROM public."user_couponList" where code = $1 and user_id = $2',
      [req.body.discount.coupon, userId]
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
  } else if (req.body.type === 'point') {
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
    if (pointRepo.rows[0].使用者旅遊積分 < req.body.discount.point) {
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

// [GET] 編號 33 : 使用者取消優惠卷、累積積分
async function getDiscounts(req, res, next) {
  const userId = req.user.id;
  const { error } = discounts_Validatior.orderIDSchema.validate(req.params);

  // [HTTP 400] 資料錯誤
  if (error) {
    const message = error?.details[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [HTTP 400] 查無訂單編號
  const orderRepo = await pool.query(
    'SELECT * FROM public."orders" where order_id = $1 and user_id = $2',
    [req.params.order_id, userId]
  );
  if (orderRepo.rowCount === 0) {
    resStatus({
      res: res,
      status: 400,
      message: '查無訂單編號',
    });
    return;
  }

  next();
}

module.exports = {
  postDiscounts,
  getDiscounts,
};
