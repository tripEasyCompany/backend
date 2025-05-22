const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');

// [GET] 編號 14 : 使用者取得自動化設定狀態
async function get_allnotifiSettings(req, res, next) {
  try {
    const user_id = req.user.id;
    const notiSettings = await pool.query(
      'SELECT * FROM public."auto_setting" where user_id = $1',
      [user_id]
    );

    if (notiSettings.rowCount > 0) {
      // [HTTP 200] 呈現資料
      resStatus({
        res: res,
        status: 200,
        message: '查詢成功',
        dbdata: {
          notifi_settings_enabled: notiSettings.rows[0].early_notify,
          price_tracking: {
            price_tracking_enabled: notiSettings.rows[0].flexible_notify,
            country: notiSettings.rows[0].country,
            region: notiSettings.rows[0].region,
            max_price: notiSettings.rows[0].price,
          },
        },
      });
    } else {
      resStatus({
        res: res,
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

// [PATCH] 編號 15 : 使用者勾選要有旅遊提醒
async function patch_early_notifiSettings(req, res, next) {
  try {
    const user_id = req.user.id;
    const setting = req.body.notifi_settings_enabled;
    let result = '';
    const userData = await pool.query('select * from public."auto_setting" where user_id = $1', [
      user_id,
    ]);

    if (userData.rowCount > 0) {
      result = await pool.query(
        'Update public."auto_setting" set early_notify = $1 where user_id = $2',
        [Number(setting), user_id]
      );
    } else {
      result = await pool.query(
        'Insert into public."auto_setting" (user_id, early_notify) VALUES ($1, $2)',
        [user_id, Number(setting)]
      );
    }

    if (result.rowCount > 0) {
      // [HTTP 200] 呈現資料
      resStatus({
        res: res,
        status: 200,
        message: '提醒設定已更新',
      });
    } else {
      resStatus({
        res: res,
        status: 400,
        message: '提醒設定失敗',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [PATCH] 編號 16 : 使用者勾選預期價格通知提醒
async function patch_price_notifiSettings(req, res, next) {
  try {
    const user_id = req.user.id;
    const { price_tracking_enabled, country, region, max_price } = req.body;
    let result = '';
    const userData = await pool.query('select * from public."auto_setting" where user_id = $1', [
      user_id,
    ]);

    if (userData.rowCount > 0) {
      result = await pool.query(
        'Update public."auto_setting" set flexible_notify = $1,country = $2,region = $3,price = $4 where user_id = $5',
        [
          Number(price_tracking_enabled),
          Number(price_tracking_enabled) ? country : null,
          Number(price_tracking_enabled) ? region : null,
          Number(price_tracking_enabled) ? max_price : null,
          user_id,
        ]
      );
    } else {
      result = await pool.query(
        'Insert into public."auto_setting" (user_id, flexible_notify,country,region,price) VALUES ($1, $2, $3, $4, $5)',
        [
          user_id,
          Number(price_tracking_enabled),
          Number(price_tracking_enabled) ? country : null,
          Number(price_tracking_enabled) ? region : null,
          Number(price_tracking_enabled) ? max_price : null,
        ]
      );
    }

    if (result.rowCount > 0) {
      // [HTTP 200] 呈現資料
      resStatus({
        res: res,
        status: 200,
        message: '彈性價格提醒狀態已更新',
      });
    } else {
      resStatus({
        res: res,
        status: 400,
        message: '彈性價格提醒狀態設定失敗',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

module.exports = {
  get_allnotifiSettings,
  patch_early_notifiSettings,
  patch_price_notifiSettings,
};
