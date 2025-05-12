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
async function get_user_PointCoupon(req, res, next) {
  try {
    const user = req.user;
    const result = await pool.query('SELECT * FROM public."user_level_point_coupon" where 使用者編號 = $1', [user.id]);
    const rows = result.rows;

    const userMap = new Map();

    for (const row of rows) {
      const userId = row['使用者編號'];

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          使用者編號: row['使用者編號'],
          名稱: row['名稱'],
          信箱: row['信箱'],
          角色: row['角色'],
          個人照片: row['個人照片 Url'],
          個人偏好1: row['個人偏好 1'],
          個人偏好2: row['個人偏好 2'],
          個人偏好3: row['個人偏好 3'],
          旅遊等級: row['旅遊等級'],
          旅遊等級名稱: row['旅遊等級名稱'],
          旅遊徽章Url: row['旅遊徽章 Url'],
          使用者旅遊積分: row['使用者旅遊積分'],
          優惠券: [], // 用來收集此人所有優惠券
        });
      }

      userMap.get(userId).優惠券.push({
        優惠卷編號: row['優惠卷編號'],
        優惠卷代碼: row['優惠卷代碼'],
        優惠卷折扣: row['優惠卷折扣'],
        優惠卷描述: row['優惠卷描述'],
        優惠卷期限: row['優惠卷期限'],
      });
    }

    const data = Array.from(userMap.values());

    // [HTTP 200] 呈現資料
    resStatus({
      res: res,
      status: 200,
      message: '查詢成功',
      dbdata: data
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}


module.exports = {
  get_user_ProfileData,
  patch_user_ProfileData,
  get_user_PointCoupon
};
