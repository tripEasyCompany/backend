const resStatus = require('../../utils/resStatus.js');
const { pool } = require('../../config/database');

const cart_Validator = require('../../utils/Validator/cart_Validator.js');

// [POST] 編號 28 : 使用者加入項目至購物車
async function post_userCart(req, res, next) {
  const { error } = cart_Validator.baseSchema.validate(req.params);

  // [HTTP 400] 資料錯誤
  if (error) {
    const message = error?.details?.[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [HTTP 404] 查無此旅遊項目
  const { tour_id } = req.params;
  const tourRepo = await pool.query('SELECT * FROM public."tour" WHERE tour_id = $1', [tour_id]);
  if (tourRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此旅遊項目',
    });
  }

  // [HTTP 400] 購物車內已有相同項目
  const cartItemRepo = await pool.query('SELECT * FROM public."cart_item" WHERE tour_id = $1', [
    tour_id,
  ]);
  if (cartItemRepo.rowCount > 0) {
    return resStatus({
      res,
      status: 404,
      message: '已加至購物車，請勿重複加入，謝謝。',
    });
  }

  const { type, item, people, options } = req.body;
  if (item === 'hotel') {
    // [HTTP 400] 選擇的房間已無空房
  } else if (item === 'food') {
    // [HTTP 400] 預約已額滿
    // [HTTP 400] 此時段無營業
  }
  next();
}

// [DELETE] 編號 29 : 使用者取消購物車項目

// [PATCH] 編號 30 : 使用者編輯購物車內容

// [GET] 編號 31 : 使用者查看購物車內容

module.exports = {
  post_userCart,
};
