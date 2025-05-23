const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');
const e = require('express');

// [POST] 編號 32 : 使用者輸入優惠卷、累積積分
async function post_user_discounts(req, res, next) {
  const { type, discount } = req.body;
  const userId = req.user.id;
  const { order_id } = req.params;

  try {
    if (type === 'coupon') {
      const couponRepo = await pool.query(
        'SELECT * FROM public."user_couponList" where code = $1 and user_id = $2',
        [discount.coupon, userId]
      );

      const orderRepo = await pool.query(
        'SELECT * FROM public."orders" where order_id = $1 and user_id = $2',
        [order_id, userId]
      );

      resStatus({
        res: res,
        status: 200,
        message: '優惠成功',
        dbdata: {
          discount: {
            coupon_id: couponRepo.rows[0].coupon_id,
            type: 'coupon',
            name: couponRepo.rows[0].code,
            discount: couponRepo.rows[0].discount,
            description: couponRepo.rows[0].description,
            date_period: couponRepo.rows[0].expired_date,
          },
          summary: {
            total_price: orderRepo.rows[0].total_price,
            discount_price: orderRepo.rows[0].total_price * couponRepo.rows[0].discount,
          },
        },
      });
    } else if (type === 'point') {
      const pointRepo = await pool.query(
        'SELECT * FROM public."user_level_point_coupon" where 使用者編號 = $1',
        [userId]
      );

      const orderRepo = await pool.query(
        'SELECT * FROM public."orders" where order_id = $1 and user_id = $2',
        [order_id, userId]
      );

      resStatus({
        res: res,
        status: 200,
        message: '優惠成功',
        dbdata: {
          discount: {
            type: 'point',
            user_point: pointRepo.rows[0].使用者旅遊積分,
            point: discount.point,
            remaining_point: pointRepo.rows[0].使用者旅遊積分 - discount.point,
          },
          summary: {
            total_price: orderRepo.rows[0].total_price,
            discount_price: orderRepo.rows[0].total_price - discount.point * 0.8,
          },
        },
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [POST] 編號 33 : 使用者取消優惠卷、累積積分

module.exports = {
  post_user_discounts,
};
