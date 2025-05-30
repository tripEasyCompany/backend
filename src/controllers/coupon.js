const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');

// [POST] 編號 61 : 管理者新增優惠卷
async function post_admin_coupon(req, res, next) {
  const { coupon, end_date, discount_amount, description } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO public.coupon (code, discount, description, expire_date)
        VALUES ($1, $2, $3, $4)`,
      [coupon, discount_amount, description, end_date]
    );

    if (result.rowCount > 0) {
      resStatus({
        res,
        status: 201,
        message: '新增成功',
      });
    } else {
      resStatus({
        res,
        status: 201,
        message: '新增失敗',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 編號 62 : 管理者查看優惠卷清單
async function get_admin_coupon(req, res, next) {
  const { coupon } = req.query;
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  try {
    if (coupon) {
      conditions.push(`code = $${paramIndex++}`);
      values.push(coupon);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await pool.query(`select * from coupon c ${whereClause}`, values);

    if (result.rowCount > 0) {
      resStatus({
        res,
        status: 200,
        message: '查詢成功',
        dbdata: result.rows,
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

// [GET] 編號 63 : 管理者查看優惠卷細項
async function get_admin_couponDetails(req, res, next) {
  const { coupon_id } = req.params;

  try {
    const result = await pool.query(`select * from coupon c where coupon_id = $1`, [coupon_id]);

    if (result.rowCount > 0) {
      resStatus({
        res,
        status: 200,
        message: '查詢成功',
        dbdata: result.rows[0],
      });
    } else {
      resStatus({
        res,
        status: 200,
        message: '查無此資料',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [PATCH] 編號 64 : 管理者修改優惠卷細項
async function patch_admin_couponDetails(req, res, next) {
  const { coupon_id } = req.params;
  const { coupon, end_date, discount_amount, description } = req.body;

  try {
    const result = await pool.query(
      `update coupon set code = $1,discount = $2,description = $3,expire_date = $4 where coupon_id = $5`,
      [coupon, discount_amount, description, end_date, coupon_id]
    );

    if (result.rowCount > 0) {
      resStatus({
        res,
        status: 200,
        message: '修改成功',
      });
    } else {
      resStatus({
        res,
        status: 200,
        message: '修改失敗',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [PATCH] 編號 65 : 管理者修改優惠卷結束期限
async function patch_admin_couponExpiry(req, res, next) {
  const { coupon_ids, end_date } = req.body;
  const couponIdList = Array.isArray(coupon_ids) ? coupon_ids : [coupon_ids];

  try {
    const result = await pool.query(
      `update coupon set expire_date = $1 where coupon_id = ANY($2::uuid[])`,
      [end_date, couponIdList]
    );

    if (result.rowCount > 0) {
      resStatus({
        res,
        status: 200,
        message: '修改成功',
      });
    } else {
      resStatus({
        res,
        status: 200,
        message: '修改失敗',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [DETELE] 編號 66 : 管理者刪除優惠卷
async function delete_admin_coupon(req, res, next) {
  const { coupon_ids } = req.body;
  const couponIdList = Array.isArray(coupon_ids) ? coupon_ids : [coupon_ids];

  try {
    const result = await pool.query(`delete from coupon where coupon_id = ANY($1::uuid[])`, [
      couponIdList,
    ]);

    if (result.rowCount > 0) {
      resStatus({
        res,
        status: 200,
        message: '刪除成功',
      });
    } else {
      resStatus({
        res,
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

// [POST] 編號 67 : 管理者綁定優惠卷
async function post_admin_assigncoupon(req, res, next) {
  const { coupon, user_ids } = req.body;
  const userIdList = Array.isArray(user_ids) ? user_ids : [user_ids];

  try {
    const couponResult = await pool.query(`select coupon_id from coupon where code = $1`, [coupon]);
    const couponId = couponResult.rows[0]?.coupon_id;
    // 產生安全參數化陣列
    const values = [];
    const params = [];

    userIdList.forEach((user_id, index) => {
      values.push(`($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`);
      params.push(user_id, couponId, 0);
    });
    const insertSql = `
      INSERT INTO public.user_coupon (user_id, coupon_id, status)
      VALUES ${values.join(',')}
      ON CONFLICT (user_id, coupon_id) DO NOTHING
    `;

    const result = await pool.query(insertSql, params);

    resStatus({
      res,
      status: 201,
      message: `成功綁定 ${result.rowCount} 位使用者`,
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

module.exports = {
  post_admin_coupon,
  get_admin_coupon,
  get_admin_couponDetails,
  patch_admin_couponDetails,
  patch_admin_couponExpiry,
  delete_admin_coupon,
  post_admin_assigncoupon,
};
