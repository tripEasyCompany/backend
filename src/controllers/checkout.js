const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');
const { options } = require('joi');

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
        else 0 end as price from tour_base tb  WHERE 旅遊編號 = $1`,
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

// [PATCH] 編號 35 : 使用者輸入個人資料、選擇想要付款方式
async function patch_user_CheckoutUserInfo(req, res, next) {
  const { id } = req.user;
  const { address, phone_number } = req.body.user;
  const { payment_method, installment } = req.body;
  const { type, coupon_id, used_point } = req.body.discount;
  const { order_id } = req.params;

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const orderRepo = await client.query(
      `UPDATE public."orders" SET address = $1, phone = $2,payment_type = $3,discount_type = $4,payment_status = $5 WHERE order_id = $6 and user_id = $7 RETURNING *`,
      [address, phone_number, payment_method, type, 0, order_id, id]
    );

    await client.query(
      `UPDATE public."order_item" SET payment_status = $1 WHERE order_id = $2 RETURNING *`,
      [0, order_id]
    );


    if (type === 'coupon') {
      const couponRepo = await client.query(
        `SELECT * FROM public."user_couponList" where coupon_id = $1 and user_id = $2`,
        [coupon_id, id]
      );

      await client.query(
        `UPDATE public."user_coupon" SET status = $1, order_id = $4 WHERE coupon_id = $2 and user_id = $3 RETURNING *`,
        [-1, coupon_id, id, order_id]
      );

      await client.query(
        `UPDATE public."orders" SET discount_price = $1 WHERE order_id = $2 and user_id = $3 RETURNING *`,
        [orderRepo.rows[0].total_price * couponRepo.rows[0].discount, order_id, id]
      );
    } else if (type === 'point') {
      await client.query(
        `Insert into public."point_record" (user_id,order_id,type,point) Values ($1,$2,$3,$4) RETURNING *`,
        [id, order_id, '減少_確認中', 0 - used_point]
      );

      await client.query(
        `UPDATE public."orders" SET discount_price = $1 WHERE order_id = $2 and user_id = $3 RETURNING *`,
        [orderRepo.rows[0].total_price - used_point * 0.8, order_id, id]
      );
    }

    const orderAllRepo = await client.query(
      `select * from public."orders" WHERE order_id = $1 and user_id = $2`,
      [order_id, id]
    );

    const orderItemRepo = await client.query(
      `select * from public."order_item" WHERE order_id = $1`,
      [order_id]
    );

    await client.query('COMMIT');

    resStatus({
      res,
      status: 200,
      message: '資料更新成功',
      dbdata: {
        order_id: orderAllRepo.rows[0].order_id,
        total_price: orderAllRepo.rows[0].total_price,
        discount_price: orderAllRepo.rows[0].discount_price,
      },
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 編號 36 : 使用者確認購買項目、總金額
async function get_user_CheckoutOrder(req, res, next) {
  const { id } = req.user;
  const { order_id } = req.params;

  try {
    const userRepo = await pool.query(`select * from public."user" where user_id = $1`, [id]);
    const orderRepo = await pool.query(
      `select * from public."orders" where order_id = $1 and user_id = $2`,
      [order_id, id]
    );
    const orderItemRepo = await pool.query(
      `select * from public."user_orderList" where order_id = $1`,
      [order_id]
    );

    const couponRepo = await pool.query(
      `select * from public."user_couponList" where user_id = $1 and order_id = $2 and status = -1`,
      [id, order_id]
    );

    const pointRepo = await pool.query(
      `select * from public."point_record" where user_id = $1 and order_id = $2 and type = '減少_確認中'`,
      [id, order_id]
    );

    const get_point = orderRepo.rows[0].total_price * 0.1;

    resStatus({
      res,
      status: 200,
      message: '查詢成功',
      dbdata: {
        user: {
          name: userRepo.rows[0].name,
          email: userRepo.rows[0].email,
          address: orderRepo.rows[0].address,
          phone_number: orderRepo.rows[0].phone,
        },
        payment_method: orderRepo.rows[0].payment_type,
        discount: {
          type: orderRepo.rows[0].discount_type,
          coupon_id: couponRepo.rowCount > 0 ? couponRepo.rows[0].coupon_id : null,
          coupon: couponRepo.rowCount > 0 ? couponRepo.rows[0].code : null,
          used_point: pointRepo.rowCount > 0 ? Math.abs(pointRepo.rows[0].point) : 0,
        },
        orders: orderItemRepo.rows.map((item) => ({
          order_id: item.order_id,
          tour_id: item.tour_id,
          type: item.大分類,
          item: item.小分類,
          title: item.旅遊名稱,
          cover_image: item['旅遊代表圖 Url'],
          price: item.價錢,
          discount_price: item.促銷價錢,
          options: {
            people: item.quantity,
            start_date: item.start_date,
            end_date: item.end_date,
            room_type: item.room_type,
          },
          total_price: item.singleTotal_Price,
        })),
        summary: {
          total_items: orderItemRepo.rows[0].total_count,
          total_price: orderRepo.rows[0].total_price,
          discount_price: orderRepo.rows[0].discount_price,
          get_point: get_point,
        },
      },
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

module.exports = {
  post_user_Order,
  get_user_CheckoutUserInfo,
  patch_user_CheckoutUserInfo,
  get_user_CheckoutOrder,
};
