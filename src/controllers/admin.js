const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');
const { CONFLICT } = require('http-status-codes');

// [GET] 42 : 管理者查看註冊用戶資料
async function get_userinfo(req, res, next) {
  try {
    const { lang, page, limit } = req.query;

    const userRepo = await pool.query(
      'SELECT user_id, name, email FROM public."user" ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, (page - 1) * limit]
    );

    resStatus({
      res: res,
      status: 200,
      message: '查詢成功',
      dbdata: userRepo.rows,
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 43 : 管理者查看註冊用戶詳細資料
async function get_userDetailinfo(req, res, next) {
  try {
    const { lang } = req.query;

    const userRepo = await pool.query(
      'select * from public."user_adminList" WHERE 使用者編號 = $1',
      [req.params.user_id]
    );

    resStatus({
      res: res,
      status: 200,
      message: '查詢成功',
      dbdata: {
        data: userRepo.rows,
      },
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [PATCH] 44 : 管理者修改註冊用戶權限
async function patch_userPurview(req, res, next) {
  try {
    const { user_ids, role } = req.body;

    const updatePromises = user_ids.map((user_id) =>
      pool.query('UPDATE public."user" SET role = $1 WHERE user_id = $2', [role, user_id])
    );
    const results = await Promise.all(updatePromises);

    const userRepo = await pool.query(
      'SELECT user_id, name, email FROM public."user" WHERE user_id = ANY($1)',
      [user_ids]
    );

    resStatus({
      res,
      status: 200,
      message: '權限修改成功',
      dbdata: userRepo.rows,
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 45 : 管理者查找使用者資料
async function get_userSearch(req, res, next) {
  try {
    const { user_id } = req.params;
    const Repo = await pool.query(
      'SELECT user_id, name, email FROM public."user" WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );

    resStatus({
      res: res,
      status: 200,
      message: '查詢成功',
      dbdata: {
        data: Repo.rows,
      },
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [POST] 53 : 管理者新增異動通知
async function post_Changeinfo(req, res, next) {
  try {
    const { tour_ids, message } = req.body;

    const insertPromises = tour_ids.map((tour_id) => pool.query(
        'INSERT INTO public."notification" (tour_id, type, change_desc) VALUES ($1, $2, $3)',
        [tour_id, "異動", message]
      )
    );
    await Promise.all(insertPromises);

    resStatus({
      res: res,
      status: 200,
      message: '新增成功',
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 54 : 管理者查看異動通知
async function get_Changeinfo(req, res, next) {
  try {
    const { status, country, region, create_date, keyword, page = 1, limit = 10 } = req.query;

    const conditions = [];
    const values = [];
    let index = 1;
    if (status) {
      conditions.push(`"上下架狀態" = $${index++}`);
      values.push(status);
    }
    if (country) {
      conditions.push(`"所屬國家" = $${index++}`);
      values.push(country);
    }
    if (region) {
      conditions.push(`"所屬地區" = $${index++}`);
      values.push(region);
    }
    if (create_date) {
      conditions.push(`"建立時間" = $${index++}`);
      values.push(create_date);
    }
    if (keyword) {
      conditions.push(`("旅遊名稱" ILIKE $${index} OR "旅遊描述" ILIKE $${index})`);
      values.push(`%${keyword}%`);
      index++;
    }

    // 分頁設定
    const offset = (Number(page) - 1) * Number(limit);
    values.push(limit);
    values.push(offset);

    const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const select = '旅遊編號, 上下架狀態, 通知狀態, 旅遊名稱, 旅遊描述, 所屬國家, 所屬地區, 建立時間, 價錢, "旅遊代表圖 Url"';
  
    const query = `
      SELECT ${select} FROM public."tour_base"
      ${whereSQL}
      ORDER BY "建立時間" DESC
      LIMIT $${index++}
      OFFSET $${index}
    `;
    const repo = await pool.query(query, values);

    resStatus({
      res: res,
      status: 200,
      message: '查詢成功',
      dbdata: repo.rows,
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [PATCH] 55 : 管理者修改異動通知
async function patch_Changeinfo(req, res, next){
  try{
    const { tour_ids, message } = req.body;
    const updatePromises = tour_ids.map((tour_id) => pool.query(
        'UPDATE public."notification" SET change_desc = $1 WHERE tour_id = $2',
        [message, tour_id]
      )
    );
    await Promise.all(updatePromises);

    resStatus({
      res: res,
      status: 200,
      message: '更新成功',
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [DELETE] 56 : 管理者刪除異動通知
async function delete_Changeinfo(req, res, next){
  try {
    const { tour_ids } = req.body;

    const deletePromises = tour_ids.map((tour_id) =>
      pool.query('DELETE FROM public."notification" WHERE tour_id = $1', [tour_id])
    );
    await Promise.all(deletePromises);

    resStatus({
      res: res,
      status: 200,
      message: '刪除成功',
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 編號 68 : 管理者查看使用者的優惠卷清單
async function get_user_couponList(req, res, next) {
  const { user_id } = req.params;

  try {
    const result = await pool.query(`select * from public."user_couponList" where user_id = $1`, [
      user_id,
    ]);

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
        message: '查無此資料',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [DELETE] 編號 69 : 管理者刪除優惠卷綁定
async function delete_user_couponAssign(req, res, next) {
  const { user_id } = req.params;
  const { coupon_id } = req.body;

  try {
    const result = await pool.query(
      `delete from public."user_coupon" where user_id = $1 and coupon_id = $2`,
      [user_id, coupon_id]
    );

    if (result.rowCount > 0) {
      resStatus({
        res,
        status: 200,
        message: '解除綁定成功',
      });
    } else {
      resStatus({
        res,
        status: 200,
        message: '解除綁定失敗',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

module.exports = {
  get_userinfo,
  get_userDetailinfo,
  patch_userPurview,
  get_userSearch,
  post_Changeinfo,
  get_Changeinfo,
  patch_Changeinfo,
  delete_Changeinfo,
  get_user_couponList,
  delete_user_couponAssign,
};
