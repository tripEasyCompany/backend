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
// X [POST] 46 : 管理者新增旅遊項目
// async function postTouradd(req, res, next) {
//   // [400] 欄位未填寫正確
//   const { error } = isValidator.postTouradd.validate(req.query, {
//     abortEarly: false,
//     stripUnknown: true
//   });
//   if (error) {
//     resStatus({
//       res: res,
//       status: 400,
//       message: '欄位未填寫正確',
//     });
//     return;
//   }

//   next();
// }

// [GET] 47 : 管理者查看刊登的旅遊項目
async function get_tourSearch(req, res, next) {
  const { tour_ids } = req.user;

  // [400] 欄位未填寫正確
  const { error: Status } = product_Validator.getTourSearch.validate(req.query, {
    abortEarly: false,
    stripUnknown: true
  });
  if (Status) {
    resStatus({
      res: res,
      status: 400,
      message: '欄位未填寫正確',
    });
    return;
  }
  // [404] 查無此項目
  const userResult = tour_ids.map((tour_id) => pool.query(
    'SELECT * FROM public."tour" WHERE tour_id = $1', 
    [tour_id]));
    if (userResult.rows.length === 0) {
      resStatus({
        res: res,
        status: 404,
        message: '查無此項目',
      });
      return;
    }
  
  next();
}

// [GET] 48 : 管理者查看旅遊項目詳細內容
async function get_admin_tourDetail(req, res, next) {
// [400] 欄位未填寫正確
  const { error } = product_Validator.getAdmin_tourDetail.validate(req.params, {
    abortEarly: false,
    stripUnknown: true
  });
  if (error) {
    resStatus({
      res: res,
      status: 400,
      message: '欄位未填寫正確',
    });
    return;
  }
  
  next();
}

// [PATCH] 49 : 管理者修改旅遊項目細項內容
async function patch_admin_tourDetail(req, res, next) {
  // [400] 欄位未填寫正確
    const { error } = product_Validator.patchTourProduct.validate({ }, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      resStatus({
        res: res,
        status: 400,
        message: '欄位未填寫正確',
      });
      return;
    }
    

  next();
}

// [PATCH] 50 : 管理者上架刊登旅遊項目
async function patch_tourStatus(req, res, next) {
  const { tour_ids, tour_status } = req.body;

  // [400] 欄位未填寫正確
    const { error } = product_Validator.patchTourProduct.validate({ tour_ids, tour_status }, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      resStatus({
        res: res,
        status: 400,
        message: '欄位未填寫正確',
      });
      return;
    }

  // [404] 查無此項目
  const dbResult = await pool.query(
    'SELECT tour_id FROM public."tour" WHERE tour_id = ANY($1)',
    [tour_ids]
  );
  const foundIds = dbResult.rows.map(row => row.tour_id);
  const fail_ids = tour_ids.filter(id => !foundIds.includes(id));
  if (fail_ids.length > 0) {
    resStatus({
      res: res,
      status: 404,
      message: '查無此項目'
    });
    return;
  }

  next();
}

// [DELETE] 51 : 管理者刪除旅遊項目

module.exports = {
  get_tourData,
  get_tourDetail,
  get_tourReview,
  get_tourHiddenPlay,
  post_Product,
  patch_admin_tourDetail,
  get_tourSearch,
  get_admin_tourDetail,
  patch_tourStatus,
};
