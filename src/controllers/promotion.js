const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');

// [GET] 編號 57 : 管理者查看促銷清單


// [POST] 編號 58 : 管理者新增/修改促銷內容
async function post_admin_promotion(req, res, next) {
  const { tour_ids, discount_rate, start_date, end_date } = req.body;
  const tourIdList = Array.isArray(tour_ids) ? tour_ids : [tour_ids];
  let successCount = 0;

  try {
    for (const tour_id of tourIdList) {
      const [promotionResult, priceResult] = await Promise.all([
        pool.query(`SELECT tour_id FROM public.notification WHERE tour_id = $1`, [tour_id]),
        pool.query(`SELECT price FROM public."tour" WHERE tour_id = $1`, [tour_id]),
      ]);

      const price = priceResult.rows[0]?.price;
      const promoPrice = price * discount_rate;

      let result;
      if (promotionResult.rowCount === 0) {
        result = await pool.query(
          `INSERT INTO public.notification (tour_id, type, discount, start_date, end_date, promo_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [tour_id, '促銷', discount_rate, start_date, end_date, promoPrice]
        );
      } else {
        result = await pool.query(
          `UPDATE public.notification 
           SET type = $2, discount = $3, start_date = $4, end_date = $5, promo_price = $6 
           WHERE tour_id = $1`,
          [tour_id, '促銷', discount_rate, start_date, end_date, promoPrice]
        );
      }

      if (result.rowCount > 0) {
        successCount++;
      }
    }

    // [HTTP 200] 呈現數據
    resStatus({
      res,
      status: 200,
      message: successCount > 0 ? '新增/修改成功' : '新增/修改失敗',
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [DETELE] 編號 59 : 管理者刪除促銷內容


module.exports = {
  post_admin_promotion,
};
