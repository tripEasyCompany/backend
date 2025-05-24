const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');

// [POST] 編號 28 : 使用者加入項目至購物車
async function post_cartItem(req, res, next) {
  const { id } = req.user;
  const { tour_id } = req.params;
  const { people, options } = req.body;
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const user_cartRepo = await client.query('SELECT * FROM public."cart" WHERE user_id = $1', [
      id,
    ]);

    const priceRepo = await client.query(
      `select 
        case when 通知狀態 = '促銷' and now() between 促銷開始日期 and 促銷結束日期 then 促銷價錢
        else 價錢 end as price from tour_base tb  WHERE 旅遊編號 = $1`,
      [tour_id]
    );

    let cartRepo;
    let cartItemRepo;
    if (user_cartRepo.rowCount === 0) {
      cartRepo = await client.query(
        'Insert into public."cart" (user_id,total_price) values ($1,$2) RETURNING *',
        [id, priceRepo.rows[0].price * people]
      );

      cartItemRepo = await client.query(
        'Insert into public."cart_item" (cart_id,tour_id,quantity,start_date,end_date,room_type) values ($1,$2,$3,$4,$5,$6) RETURNING *',
        [
          cartRepo.rows[0].cart_id,
          tour_id,
          people,
          options.start_date,
          options.end_date,
          options.room_type,
        ]
      );
    } else {
      const cartTotal = user_cartRepo.rows[0].total_price;
      cartRepo = await client.query(
        'Update public."cart" set total_price = $2 where user_id = $1 RETURNING *',
        [id, priceRepo.rows[0].price * people + cartTotal]
      );

      cartItemRepo = await client.query(
        'Insert into public."cart_item" (cart_id,tour_id,quantity,start_date,end_date,room_type) values ($1,$2,$3,$4,$5,$6) RETURNING *',
        [
          cartRepo.rows[0].cart_id,
          tour_id,
          people,
          options.start_date,
          options.end_date,
          options.room_type,
        ]
      );
    }

    await client.query('COMMIT');

    if (cartItemRepo.rowCount > 0) {
      return resStatus({
        res,
        status: 201,
        message: '加入購物車成功',
      });
    } else {
      return resStatus({
        res,
        status: 201,
        message: '加入購物車失敗',
      });
    }
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [DELETE] 編號 29 : 使用者取消購物車項目
async function delete_cartItem(req, res, next) {
  const { cart_item_id } = req.params;
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const deleteRepo = await client.query(
      'DELETE FROM public."cart_item" WHERE cart_item_id = $1 RETURNING *',
      [cart_item_id]
    );

    const priceRepo = await client.query(
      `select 
        case when 通知狀態 = '促銷' and now() between 促銷開始日期 and 促銷結束日期 then 促銷價錢
        else 價錢 end as price from tour_base tb  WHERE 旅遊編號 = $1`,
      [deleteRepo.rows[0].tour_id]
    );

    await client.query(
      'Update public."cart" set total_price = total_price - $1 where cart_id = $2 RETURNING *',
      [priceRepo.rows[0].price * deleteRepo.rows[0].quantity, deleteRepo.rows[0].cart_id]
    );

    await client.query('COMMIT');

    if (deleteRepo.rowCount > 0) {
      return resStatus({
        res,
        status: 200,
        message: '移除購物車項目成功',
      });
    } else {
      return resStatus({
        res,
        status: 200,
        message: '移除購物車項目失敗',
      });
    }
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [PATCH] 編號 30 : 使用者編輯購物車內容
async function patch_cartItem(req, res, next) {
  const { cart_item_id } = req.params;
  const { people, options } = req.body;
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const oldPeopleRepo = await client.query(
      'SELECT quantity FROM public."cart_item" WHERE cart_item_id = $1',
      [cart_item_id]
    );
    const updateRepo = await client.query(
      'Update public."cart_item" set quantity = $2,start_date = $3,end_date = $4,room_type = $5 WHERE cart_item_id = $1 RETURNING *',
      [cart_item_id, people, options.start_date, options.end_date, options.room_type]
    );

    const priceRepo = await client.query(
      `select 
        case when 通知狀態 = '促銷' and now() between 促銷開始日期 and 促銷結束日期 then 促銷價錢
        else 價錢 end as price from tour_base tb  WHERE 旅遊編號 = $1`,
      [updateRepo.rows[0].tour_id]
    );

    await client.query(
      'Update public."cart" set total_price = total_price - $1 + $2 where cart_id = $3 RETURNING *',
      [
        priceRepo.rows[0].price * oldPeopleRepo.rows[0].quantity,
        priceRepo.rows[0].price * people,
        updateRepo.rows[0].cart_id,
      ]
    );

    await client.query('COMMIT');

    if (updateRepo.rowCount > 0) {
      return resStatus({
        res,
        status: 200,
        message: '購物車項目修改成功',
      });
    } else {
      return resStatus({
        res,
        status: 200,
        message: '購物車項目修改失敗',
      });
    }
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 編號 31 : 使用者查看購物車內容
async function get_cartItem(req, res, next) {
  const { id } = req.user;
  const { page, limit, lang } = req.query;

  try {
    const cartData = await pool.query(
      `select * from public."user_cartList"
            where user_id = $1
            ORDER BY cart_id ASC LIMIT $2 OFFSET $3;`,
      [id, limit, (page - 1) * limit]
    );

    const data = cartData.rows.map((item) => {
      return {
        cart_id: item.cart_id,
        tour_id: item.tour_id,
        type: item['大分類'],
        item: item['小分類'],
        title: item['旅遊名稱'],
        image_url: item['旅遊代表圖 Url'],
        price: item['價錢'],
        promo_price: item['促銷價錢'],
        options: {
          people: item.quantity,
          start_date: item.start_date,
          end_date: item.end_date,
          room_type: item.room_type || '',
        },
        total_price: Number(item.singleTotal_Price),
      };
    });

    const summary = {
      total_items: data.length,
      total_price: data.reduce((sum, d) => sum + d.total_price, 0),
    };

    if (cartData.rowCount > 0) {
      return resStatus({
        res,
        status: 200,
        message: '查詢成功',
        dbdata: {
          data,
          summary,
        },
      });
    } else {
      return resStatus({
        res,
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

module.exports = {
  post_cartItem,
  delete_cartItem,
  patch_cartItem,
  get_cartItem,
};
