const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');

const user_Valid = require('../utils/Validator/userprofile_Validator');

// [GET] 編號 10 : 使用者用戶資料呈現
async function get_user_ProfileData(req, res, next) {
  try {
    const user = req.user;
    const userData = await pool.query('SELECT * FROM public."user" where user_id = $1', [user.id]);

    const perfer_ids = [
      userData.rows[0].preference1,
      userData.rows[0].preference2,
      userData.rows[0].preference3,
    ];
    const themeNames = perfer_ids.map((id) => user_Valid.reversePreferenceMap[id]);

    // [HTTP 200] 呈現資料
    resStatus({
      res: res,
      status: 200,
      message: '查詢成功',
      dbdata: {
        user: {
          user_id: userData.rows[0].user_id,
          name: userData.rows[0].name,
          email: userData.rows[0].email,
          avatar_url: userData.rows[0].avatar_url,
          preferences: themeNames,
        },
      },
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [PATCH] 編號 11 : 使用者用戶資料修改
async function patch_user_ProfileData(req, res, next) {
  const user = req.user;
  const { name, preference } = req.body;
  const [pref1, pref2, pref3] = preference;

  let client;
  try {
    client = await pool.connect();
    // 上傳數據
    await client.query('BEGIN');

    await client.query(
      'UPDATE public."user" SET name = $1, preference1 = $2, preference2 = $3, preference3 = $4 WHERE user_id = $5',
      [name, pref1, pref2, pref3, user.id]
    );

    await client.query('COMMIT');

    const userData = await pool.query('SELECT * FROM public."user" where user_id = $1', [user.id]);
    const perfer_ids = [
      userData.rows[0].preference1,
      userData.rows[0].preference2,
      userData.rows[0].preference3,
    ];
    const themeNames = perfer_ids.map((id) => user_Valid.reversePreferenceMap[id]);

    // [HTTP 200] 呈現資料
    resStatus({
      res: res,
      status: 200,
      message: '更新成功',
      dbdata: {
        user: {
          user_id: userData.rows[0].user_id,
          name: userData.rows[0].name,
          preferences: themeNames,
        },
      },
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    if (client) await client.query('ROLLBACK');
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [PATCH] 編號 12 : 使用者照片個人上傳

// [GET] 編號 13 : 使用者會員等級積分

module.exports = {
  get_user_ProfileData,
  patch_user_ProfileData,
};
