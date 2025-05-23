const resStatus = require('../../utils/resStatus');
const { pool } = require('../../config/database');

const checkout_Vaildator = require('../../utils/Validator/checkout_Vaildator');

// [POST] 編號 89 : 使用者進入填寫畫面後產生訂單
async function post_userOrder(req, res, next) {
  const { error } = checkout_Vaildator.cartIDSchema.validate(req.params);

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

  // [HTTP 404] 查無此購物車項目
  const { cart_id } = req.params;
  const cartRepo = await pool.query('SELECT * FROM public."cart" WHERE cart_id = $1', [cart_id]);
  if (cartRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此購物車項目',
    });
  }

  next();
}

// [GET] 編號 34 : 使用者進入填寫畫面後預帶使用者資訊
async function get_userOrderPrfile(req, res, next) {
  const { error } = checkout_Vaildator.orderIDSchema.validate(req.params);

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

  // [HTTP 404] 查無此訂單項目
  const { order_id } = req.params;
  const orderRepo = await pool.query('SELECT * FROM public."orders" WHERE order_id = $1', [
    order_id,
  ]);
  if (orderRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此訂單項目',
    });
  }

  next();
}

// [POST]] 編號 35 : 使用者輸入個人資料、選擇想要付款方式

// [GET] 編號 36 : 使用者確認購買項目、總金額

module.exports = {
  post_userOrder,
  get_userOrderPrfile,
};
