const resStatus = require('../../utils/resStatus.js');
const { pool } = require('../../config/database');

const discounts_Validatior = require('../../utils/Validator/discounts_Validatior.js');

// [POST] 編號 32 : 使用者輸入優惠卷、累積積分
async function postDiscounts(req, res, next) {
  const userId = req.user.id;
  const { error } = discounts_Validatior.baseschema.validate(req.body);

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
    console.log(endDate);
    if (now > endDate) {
      resStatus({
        res: res,
        status: 409,
        message: '優惠券已過期',
      });
      return;
    }
  } else if (req.body.type === 'point') {
    // [HTTP 422] 超出可使用的點數
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

// [DELETE] 編號 33 : 使用者取消優惠卷、累積積分

module.exports = {
  postDiscounts,
};
