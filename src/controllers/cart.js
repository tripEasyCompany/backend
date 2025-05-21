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
        [cartRepo.rows[0].cart_id, tour_id, people, options.start_date, options.end_date, options.room_type]
      );
    } else {
      const cartTotal = user_cartRepo.rows[0].total_price;
      cartRepo = await client.query(
        'Update public."cart" set total_price = $2 where user_id = $1 RETURNING *',
        [id, priceRepo.rows[0].price * people + cartTotal]
      );

      cartItemRepo = await client.query(
        'Insert into public."cart_item" (cart_id,tour_id,quantity,start_date,end_date,room_type) values ($1,$2,$3,$4,$5,$6) RETURNING *',
        [cartRepo.rows[0].cart_id, tour_id, people, options.start_date, options.end_date, options.room_type]
      );
    }

    await client.query('COMMIT');

    if(cartItemRepo.rowCount > 0) {
      return resStatus({
        res,
        status: 201,
        message: '加入購物車成功',
      });

    }else{
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

module.exports = {
  post_cartItem,
};
