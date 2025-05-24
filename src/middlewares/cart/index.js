const resStatus = require('../../utils/resStatus.js');
const { pool } = require('../../config/database');

const cart_Validator = require('../../utils/Validator/cart_Validator.js');

// [POST] 編號 28 : 使用者加入項目至購物車
async function post_userCart(req, res, next) {
  const { id } = req.user;
  const { error: bodyError } = cart_Validator.baseSchema.validate(req.body);
  const { error: paramsError } = cart_Validator.paramsSchema.validate(req.params);

  // [HTTP 400] 資料錯誤
  if (bodyError || paramsError) {
    const message =
      bodyError?.details?.[0]?.message || paramsError?.details?.[0]?.message || '欄位驗證錯誤';
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
  const cartItemRepo = await pool.query(
    'select ci.* from cart c inner join cart_item ci on c.cart_id = ci.cart_id WHERE tour_id = $1 and user_id = $2',
    [tour_id, id]
  );

  if (cartItemRepo.rowCount > 0) {
    return resStatus({
      res,
      status: 404,
      message: '已加至購物車，請勿重複加入，謝謝。',
    });
  }

  const { item, options } = req.body;
  if (item === 'hotel') {
    // [HTTP 400] 選擇的房間已無空房
    const booking_room = await pool.query('select * from public.hotel_booking($1,$2,$3,$4);', [
      options.room_type,
      options.start_date,
      options.end_date,
      tour_id,
    ]);

    if (booking_room.rowCount > 0) {
      const booking_count = booking_room.rows[0].booking_count;
      const room_count = booking_room.rows[0].room_count;
      if (booking_count >= room_count) {
        return resStatus({
          res,
          status: 400,
          message: '選擇的房間已無空房',
        });
      }
    }
  } else if (item === 'food') {
    // [HTTP 400] 預約已額滿
    const booking_food = await pool.query('select * from public.restaurant_booking($1,$2);', [
      options.start_time,
      tour_id,
    ]);

    if (booking_food.rowCount > 0) {
      const booking_count = booking_food.rows[0].booking_count;
      const food_count = booking_food.rows[0].reservation_limit;
      if (booking_count >= food_count) {
        return resStatus({
          res,
          status: 400,
          message: '預約已額滿',
        });
      }
    }

    // [HTTP 400] 餐廳已關閉
    const food_time = await pool.query(
      `SELECT * FROM restaurant_business_parsed 
       WHERE tour_id = $1 AND $2::timestamp::time BETWEEN start_time AND end_time 
       AND week = TRIM(TO_CHAR($2::timestamp, 'FMDay'));`,
      [tour_id, options.start_date]
    );
    if (food_time.rowCount === 0) {
      return resStatus({
        res,
        status: 400,
        message: '餐廳已關閉',
      });
    }

    // [HTTP 400] 此時段無營業
    const food_closed = await pool.query('select * from restaurant_isClosed($1,$2);', [
      options.start_date,
      tour_id,
    ]);

    if (food_closed.rows[0].isclosed === true) {
      return resStatus({
        res,
        status: 400,
        message: '此時段無營業',
      });
    }
  }
  next();
}

// [DELETE] 編號 29 : 使用者取消購物車項目
async function delete_userCart(req, res, next) {
  const { error: paramsError } = cart_Validator.cartIDSchema.validate(req.params);

  // [HTTP 400] 資料錯誤
  if (paramsError) {
    const message = paramsError?.details?.[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [HTTP 404] 查無此購物車項目
  const { cart_item_id } = req.params;
  const tourRepo = await pool.query('SELECT * FROM public."cart_item" WHERE cart_item_id = $1', [
    cart_item_id,
  ]);
  if (tourRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此購物車項目',
    });
  }

  next();
}

// [PATCH] 編號 30 : 使用者編輯購物車內容
async function patch_userCart(req, res, next) {
  const { error: bodyError } = cart_Validator.baseSchema.validate(req.body);
  const { error: paramsError } = cart_Validator.cartIDSchema.validate(req.params);

  // [HTTP 400] 資料錯誤
  if (bodyError || paramsError) {
    const message =
      bodyError?.details?.[0]?.message || paramsError?.details?.[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [HTTP 404] 查無此購物車項目
  const { cart_item_id } = req.params;
  const cartItemRepo = await pool.query(
    'SELECT * FROM public."cart_item" WHERE cart_item_id = $1',
    [cart_item_id]
  );
  if (cartItemRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此購物車項目',
    });
  }

  const tour_id = cartItemRepo.rows[0].tour_id;
  const { item, options } = req.body;
  if (item === 'hotel') {
    // [HTTP 400] 選擇的房間已無空房
    const booking_room = await pool.query('select * from public.hotel_booking($1,$2,$3,$4);', [
      options.room_type,
      options.start_date,
      options.end_date,
      tour_id,
    ]);

    if (booking_room.rowCount > 0) {
      const booking_count = booking_room.rows[0].booking_count;
      const room_count = booking_room.rows[0].room_count;
      if (booking_count >= room_count) {
        return resStatus({
          res,
          status: 400,
          message: '選擇的房間已無空房',
        });
      }
    }
  } else if (item === 'food') {
    // [HTTP 400] 預約已額滿
    const booking_food = await pool.query('select * from public.restaurant_booking($1,$2);', [
      options.start_time,
      tour_id,
    ]);

    if (booking_food.rowCount > 0) {
      const booking_count = booking_food.rows[0].booking_count;
      const food_count = booking_food.rows[0].reservation_limit;
      if (booking_count >= food_count) {
        return resStatus({
          res,
          status: 400,
          message: '預約已額滿',
        });
      }
    }

    // [HTTP 400] 餐廳已關閉
    const food_time = await pool.query(
      `SELECT * FROM restaurant_business_parsed 
       WHERE tour_id = $1 AND $2::timestamp::time BETWEEN start_time AND end_time 
       AND week = TRIM(TO_CHAR($2::timestamp, 'FMDay'));`,
      [tour_id, options.start_date]
    );
    if (food_time.rowCount === 0) {
      return resStatus({
        res,
        status: 400,
        message: '餐廳已關閉',
      });
    }

    // [HTTP 400] 此時段無營業
    const food_closed = await pool.query('select * from restaurant_isClosed($1,$2);', [
      options.start_date,
      tour_id,
    ]);

    if (food_closed.rows[0].isclosed === true) {
      return resStatus({
        res,
        status: 400,
        message: '此時段無營業',
      });
    }
  }
  next();
}

// [GET] 編號 31 : 使用者查看購物車內容
async function get_userCart(req, res, next) {
  const { error: queryError } = cart_Validator.commonSchema.validate(req.query);

  // [HTTP 400] 資料錯誤
  if (queryError) {
    const message = queryError?.details?.[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [HTTP 404] 查無此人物
  const { id } = req.user;
  const userRepo = await pool.query('SELECT * FROM public."user" WHERE user_id = $1', [id]);
  if (userRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此人物',
    });
  }

  next();
}

module.exports = {
  post_userCart,
  delete_userCart,
  patch_userCart,
  get_userCart,
};
