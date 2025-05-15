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
    const result = await pool.query(
      'Update public."auto_setting" set early_notify = $1 where user_id = $2',
      [Number(setting),user_id]
    );

    if (result.rowCount > 0) {
      // [HTTP 200] 呈現資料
      resStatus({
        res: res,
        status: 200,
        message: '提醒設定已更新'
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

module.exports = {
  get_allnotifiSettings,
  patch_early_notifiSettings
};
