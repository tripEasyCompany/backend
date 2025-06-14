const resStatus = require('../../utils/resStatus.js');
const { pool } = require('../../config/database');

const product_Validator = require('../../utils/Validator/product_Validator.js');

// [GET] 編號 22 : 使用者查詢旅遊項目
async function get_tourData(req, res, next) {
  const { error: queryError } = product_Validator.queryschema.validate(req.query);

  // [HTTP 400] 資料錯誤
  if (queryError) {
    //paramsError ||
    const message = queryError?.details?.[0]?.message || '欄位驗證錯誤'; // paramsError?.details?.[0]?.message ||
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  next();
}

// [GET] 編號 23 : 使用者查看旅遊項目詳細資料
async function get_tourDetail(req, res, next) {
  const { error: paramsError } = product_Validator.tourIDSchema.validate(req.params);
  const { error: queryError } = product_Validator.detailsSchema.validate(req.query);

  // [HTTP 400] 資料錯誤
  if (paramsError || queryError) {
    const message = paramsError?.details?.[0]?.message || queryError?.details?.[0]?.message || '欄位驗證錯誤'; 
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [HTTP 404] 查無此購物車項目
  const { tour_id } = req.params;
  const tourRepo = await pool.query('SELECT * FROM public."tour" WHERE tour_id = $1', [tour_id]);
  if (tourRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此旅遊項目',
    });
  }

  next();
}

// [GET] 編號 24 : 使用者查看細項資料好評分數、評論
async function get_tourReview(req, res, next) {
  const { error: paramsError } = product_Validator.tourIDSchema.validate(req.params);
  const { error: queryError } = product_Validator.reviewSchema.validate(req.query);

  // [HTTP 400] 資料錯誤
  if (paramsError || queryError) {
    const message =
      paramsError?.details?.[0]?.message || queryError?.details?.[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [HTTP 404] 查無此購物車項目
  const { tour_id } = req.params;
  const tourRepo = await pool.query('SELECT * FROM public."tour" WHERE tour_id = $1', [tour_id]);
  if (tourRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此旅遊項目',
    });
  }

  next();
}

// [GET] 編號 25 : 使用者查看細項資料隱藏玩法
async function get_tourHiddenPlay(req, res, next) {
  const { error: paramsError } = product_Validator.tourIDSchema.validate(req.params);
  const { error: queryError } = product_Validator.hiddenPlaySchema.validate(req.query);

  // [HTTP 400] 資料錯誤
  if (paramsError || queryError) {
    const message =
      paramsError?.details?.[0]?.message || queryError?.details?.[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [HTTP 404] 查無此購物車項目
  const { tour_id } = req.params;
  const tourRepo = await pool.query('SELECT * FROM public."tour" WHERE tour_id = $1', [tour_id]);
  if (tourRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此旅遊項目',
    });
  }

  next();
}

// [POST] 編號 46 : 管理者新增旅遊項目
async function post_Product(req, res, next) {
  const { error } = product_Validator.createProductSchema.validate(req.body);

  // [HTTP 400] 資料錯誤
  if (error) {
    const message = error.details[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [HTTP 409] 檢查產品名稱是否已存在
  const { product_name } = req.body;
  const { rows } = await pool.query(
    `SELECT tour_id FROM public."tour" WHERE title = $1`,
    [product_name]
  );

  if (rows.length > 0) {
    return resStatus({
      res: res,
      status: 409,
      message: `旅遊項目名稱「${product_name}」已存在`,
    });
  }

  next();
}

module.exports = {
  get_tourData,
  get_tourDetail,
  get_tourReview,
  get_tourHiddenPlay,
  post_Product,
};
