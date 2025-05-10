const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');

// [GET] 編號 70 : 篩選按鈕 - 國家清單
async function get_filter_country(req, res, next) {
  try {
    const countries = await pool.query('SELECT country_id,name FROM public."country"');

    // [HTTP 200] 呈現資料
    resStatus({
      res: res,
      status: 200,
      message: '查詢成功',
      dbdata: countries.rows,
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 編號 71 : 篩選按鈕 - 地區清單
async function get_filter_region(req, res, next) {
    const { country_id } = req.params;
  try {
    const region = await pool.query('SELECT region_id,name FROM public."region" where country_id = $1',[country_id]);

    // [HTTP 200] 呈現資料
    resStatus({
      res: res,
      status: 200,
      message: '查詢成功',
      dbdata: region.rows,
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

module.exports = {
  get_filter_country,
  get_filter_region,
};
