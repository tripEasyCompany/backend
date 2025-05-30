const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');
const { reversePreferenceMap } = require('../utils/Validator/userprofile_Validator');

// [GET] 編號 57 : 管理者查看促銷清單
async function get_admin_promotion(req, res, next) {
  const filters = req.query;
  const conditions = [`通知狀態 = '促銷'`];
  const values = [];
  let paramIndex = 1;

  if (filters.country) {
    conditions.push(`所屬國家 = $${paramIndex++}`);
    values.push(filters.country);
  }

  if (filters.region) {
    conditions.push(`所屬地區 = $${paramIndex++}`);
    values.push(filters.region);
  }

  if (filters.create_date) {
    conditions.push(`DATE(建立時間) = $${paramIndex++}`);
    values.push(filters.create_date);
  }

  if (filters.keyword) {
    conditions.push(`旅遊名稱 ILIKE $${paramIndex++}`);
    values.push(`%${filters.keyword}%`);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  // 分頁參數
  const limit = parseInt(filters.limit) || 10;
  const page = parseInt(filters.page) || 1;
  const offset = (page - 1) * limit;

  values.push(limit);
  values.push(offset);

  try {
    const query = `select * from public.tour_base
      ${whereClause}
      ORDER BY 更新時間 DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    const { rows } = await pool.query(query, values);
    if (rows.length > 0) {
      const transformedRows = rows.map((row) => {
        // 將偏好分類數字轉換為文字陣列
        const preferences = [
          reversePreferenceMap[row['偏好分類1']],
          reversePreferenceMap[row['偏好分類2']],
          reversePreferenceMap[row['偏好分類3']],
        ];

        // 回傳新的物件，保留其他欄位，並加入「偏好分類」欄位，同時移除 1/2/3
        const { 偏好分類1, 偏好分類2, 偏好分類3, ...rest } = row;

        return {
          ...rest,
          偏好分類: preferences.filter(Boolean), // 移除 undefined/null
        };
      });

      // [HTTP 200] 呈現數據
      resStatus({
        res,
        status: 200,
        message: '查詢成功',
        dbdata: transformedRows,
      });
    } else {
      resStatus({
        res,
        status: 200,
        message: '查無資料',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

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
async function delete_admin_promotion(req, res, next) {
  const { tour_ids } = req.body;
  const tourIdList = Array.isArray(tour_ids) ? tour_ids : [tour_ids];

  try {
    const result = await pool.query(
      `DELETE FROM public.notification WHERE tour_id = ANY($1::uuid[])`,
      [tourIdList]
    );

    if (result.rowCount > 0) {
      // [HTTP 200] 呈現資料
      resStatus({
        res: res,
        status: 200,
        message: '刪除成功',
      });
    } else {
      resStatus({
        res: res,
        status: 200,
        message: '刪除失敗',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

module.exports = {
  get_admin_promotion,
  post_admin_promotion,
  delete_admin_promotion,
};
