const isValid = require('../../utils/isValid');
const { pool } = require('../../config/database');
const resStatus = require('../../utils/resStatus');

// 資料驗證相關模組
const isValidator = require('../../utils/Validator/isValidator.js');

// [GET] 編號 17 : 使用者查看收藏項目
async function getCollection(req, res, next) {
  const { lang, page, limit } = req.query;
  const user_id = req.user.id;

  const { error, value } = getSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true
  });

  if (
    // isValid.isEmpty(lang) ||
    // !isValid.isValidLang(lang) ||
    // isValid.isNotValidString(lang) ||
    // isValid.isEmpty(page) ||
    // !isValid.isStringToInt(page) ||
    // isValid.isEmpty(limit) ||
    // !isValid.isStringToInt(limit)
    error
  ) {
    resStatus({
        res: res,
        status: 400,
        message: '欄位未填寫正確'
    });
    return;
  }

  //???(當page, limit 超出資料庫範圍時)

  next();
}

// [POST] 編號 18 : 使用者加入收藏項目
async function postCollection(req, res, next) {
  const { tour_id } = req.params;
  const user_id = req.user.id;

  if (isValid.isEmpty(tour_id) || isValid.isNotValidString(tour_id)) {
    resStatus({
      res: res,
      status: 400,
      message: '欄位未填寫正確',
    });
    return;
  }

  //檢查有無此商品
  const result = await pool.query('SELECT * FROM tour WHERE tour_id = $1', [tour_id]);
  if (result.rows.length === 0) {
    resStatus({
      res: res,
      status: 400,
      message: '查無此項目',
    });
    return;
  }

  //檢查是否已收藏
  const favoriteCheck = await pool.query(
    'SELECT 1 FROM favorite WHERE user_id = $1 AND tour_id = $2',
    [user_id, tour_id]
  );
  if (favoriteCheck.rows.length > 0) {
    resStatus({
      res: res,
      status: 400,
      message: '已經收藏過此項目',
    });
    return;
  }

  next();
}

// [DELETE] 編號 19 : 使用者刪除收藏項目
async function deleteCollection(req, res, next) {
  const { favorite_id } = req.params;
  const user_id = req.user.id;

  if (
    isValid.isEmpty(favorite_id) ||
    isValid.isNotValidString(favorite_id) ||
    isValid.isUUIDParam(favorite_id)
  ) {
    resStatus({
      res: res,
      status: 400,
      message: '欄位未填寫正確',
    });
    return;
  }

  const result = await pool.query(
    'SELECT * FROM favorite WHERE user_id = $1 AND favorite_id = $2',
    [user_id, favorite_id]
  );
  if (result.rows.length === 0) {
    resStatus({
      res: res,
      status: 400,
      message: '查無此項目',
    });
    return;
  }

  next();
}
module.exports = {
  getCollection,
  postCollection,
  deleteCollection,
};
