const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');

// [POST] 編號 89 : 使用者進入填寫畫面後產生訂單
async function post_user_Order(req, res, next) {
  const { id } = req.user;
  const { cart_id } = req.params;

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const cartRepo = await client.query(
      'SELECT * FROM public."cart" WHERE cart_id = $1 AND user_id = $2',
      [cart_id, id]
    );

    const cartItemRepo = await client.query('SELECT * FROM public."cart_item" WHERE cart_id = $1', [
      cart_id,
    ]);

    const tourRepo = await client.query('SELECT * FROM public."tour_base" WHERE 旅遊編號 = $1', [
      cartItemRepo.rows[0].tour_id,
    ]);

    const discount_price = await client.query(
      `select 
        case when 通知狀態 = '促銷' and now() between 促銷開始日期 and 促銷結束日期 then 促銷價錢
        else 價錢 end as price from tour_base tb  WHERE 旅遊編號 = $1`,
      [cartItemRepo.rows[0].tour_id]
    );

    const orderRepo = await client.query(
      `INSERT INTO public."orders" (user_id, payment_status, total_price) 
      VALUES ($1, $2, $3) RETURNING *`,
      [id, -1, cartRepo.rows[0].total_price]
    );

    console.log(tourRepo.rows[0]);
    const orderItemRepo = await client.query(
      `INSERT INTO public."order_item" (order_id, tour_id, payment_status, total_price, discount_price, quantity, start_date, end_date, room_type) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        orderRepo.rows[0].order_id,
        cartItemRepo.rows[0].tour_id,
        -1,
        tourRepo.rows[0].價錢 * cartItemRepo.rows[0].quantity,
        discount_price.rows[0].price * cartItemRepo.rows[0].quantity,
        cartItemRepo.rows[0].quantity,
        cartItemRepo.rows[0].start_date,
        cartItemRepo.rows[0].end_date,
        cartItemRepo.rows[0].room_type,
      ]
    );

    await client.query('COMMIT');

    if (orderItemRepo.rowCount > 0) {
      resStatus({
        res,
        status: 200,
        message: '訂單產生成功',
        dbdata: {
          order_id: orderRepo.rows[0].order_id,
          cart_id: cartRepo.rows[0].cart_id,
          total_price: orderRepo.rows[0].total_price,
        },
      });
    } else {
      resStatus({
        res,
        status: 200,
        message: '訂單產生失敗',
      });
    }
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 編號 34 : 使用者進入填寫畫面後預帶使用者資訊
async function get_user_CheckoutUserInfo(req, res, next) {
  const { id } = req.user;
  console.log('user id:', id);

  try {
    const result = await pool.query(`select * from public."user" where user_id = $1`, [id]);

    // [HTTP 200] 查詢成功
    if (result.rowCount > 0) {
      resStatus({
        res,
        status: 200,
        message: '查詢成功',
        dbdata: {
          user_id: id,
          name: result.rows[0].name,
          email: result.rows[0].email,
        },
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

// [POST]] 編號 35 : 使用者輸入個人資料、選擇想要付款方式

// [GET] 編號 36 : 使用者確認購買項目、總金額

module.exports = {
  post_user_Order,
  get_user_CheckoutUserInfo,
};
