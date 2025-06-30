const resStatus = require('../../utils/resStatus.js');
const { pool } = require('../../config/database');
const multer = require('multer');

const product_Validator = require('../../utils/Validator/product_Validator.js');
const { query } = require('express');

// ============= 圖片上傳相關設定 =============

// 圖片上傳限制設定
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 5 * 1024 * 1024,  // 限制 5MB
    files: 15  // 最多7張圖片
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      const err = new Error('只允許上傳圖片格式');
      err.code = 'INVALID_FILE_TYPE';
      return cb(err, false);
    }
    cb(null, true);
  },
});

// [POST] 編號 46 : 管理者新增旅遊項目 - 圖片上傳處理
function productImageUpload() {
  const multipleUpload = upload.fields([
    { name: 'product_cover_image', maxCount: 1 },
    { name: 'product_img1', maxCount: 1 },
    { name: 'product_img2', maxCount: 1 },
    { name: 'product_img3', maxCount: 1 },
    { name: 'product_img4', maxCount: 1 },
    { name: 'product_img5', maxCount: 1 },
    { name: 'product_img6', maxCount: 1 },
    // 新增以下三個欄位
    { name: 'feature_img1', maxCount: 1 },
    { name: 'feature_img2', maxCount: 1 },
    { name: 'feature_img3', maxCount: 1 },
  ]);

  return (req, res, next) => {
    multipleUpload(req, res, (err) => {
      if (err) {
        // 處理 Multer 錯誤
        if (err instanceof multer.MulterError) {
          const codeMap = {
            LIMIT_FILE_SIZE: '圖片太大，請小於 5MB',
            LIMIT_FILE_COUNT: '每個欄位只能上傳一張圖片',
            LIMIT_FILES: '總共只能上傳 15 張圖片',
            LIMIT_UNEXPECTED_FILE: '不支援的檔案欄位',
          };
          const message = codeMap[err.code] || '圖片上傳失敗';
          return resStatus({
            res,
            status: 400,
            message,
          });
        }

        // 自訂錯誤（圖片格式）
        if (err.code === 'INVALID_FILE_TYPE') {
          return resStatus({
            res,
            status: 400,
            message: err.message,
          });
        }

        // 其他未知錯誤
        return resStatus({
          res,
          status: 500,
          message: err.message || '圖片上傳時發生未知錯誤',
        });
      }

      // 檢查必要的圖片欄位
      const requiredImages = [
        'product_cover_image',
        'product_img1',
        'product_img2', 
        'product_img3',
        'product_img4',
        'product_img5',
        'product_img6',
        // 新增以下三個欄位
        'feature_img1',
        'feature_img2',
        'feature_img3',
      ];

      const missingImages = [];
      requiredImages.forEach(fieldName => {
        if (!req.files || !req.files[fieldName] || req.files[fieldName].length === 0) {
          missingImages.push(fieldName);
        }
      });

      if (missingImages.length > 0) {
        return resStatus({
          res,
          status: 400,
          message: `請提供以下圖片: ${missingImages.join(', ')}`,
        });
      }

      next();
    });
  };
}

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

// [POST] 編號 46 : 管理者新增旅遊項目 - 資料驗證
async function post_Product(req, res, next) {
  // 在驗證前，先嘗試解析 JSON 字串
  try {
    if (req.body.product_detail) {
      req.body.product_detail = JSON.parse(req.body.product_detail);
    }
    if (req.body.product_hotel) {
      req.body.product_hotel = JSON.parse(req.body.product_hotel);
    }
    // 預留給未來可能的 product_restaurant
    if (req.body.product_restaurant) {
        req.body.product_restaurant = JSON.parse(req.body.product_restaurant);
    }
  } catch (e) {
    // 如果 JSON 格式錯誤，直接回傳 400 錯誤
    return resStatus({ res, status: 400, message: 'product_detail 或 product_hotel 的 JSON 格式不正確' });
  }

  // 現在 req.body 中的欄位是物件了，可以進行驗證
  const { error } = product_Validator.createProductSchemaWithoutImageUrls.validate(req.body);

  // [HTTP 400] 資料錯誤
  if (error) {
    // 使用我們之前加入的詳細錯誤回報
    const detailedMessage = error.details.map(d => d.message).join(', ');
    return resStatus({
      res,
      status: 400,
      message: detailedMessage || '欄位驗證錯誤',
    });
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
/**/
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
  const { tour_product, travel, food, hotel } = req.body;
  const { tour_id } = req.params;
  if( tour_product ){
  // [404] 查無此項目
    const idRepo = await pool.query(
    'SELECT tour_id FROM public."tour" WHERE tour_id = $1',
    [tour_id]);
    if(idRepo.rowCount <= 0 ){
      resStatus({
          res: res,
          status: 400,
          message: '查無此項目',
        });
      return;
    }

    if( travel ){
    // [404] 查無此項目
      const idRepo = await pool.query(
      'SELECT tour_id FROM public."tour_detail" WHERE tour_id = $1',
      [tour_id]);
      if(idRepo.rowCount <= 0 ){
        resStatus({
            res: res,
            status: 400,
            message: '查無此項目',
          });
        return;
      }

    // [400] 欄位未填寫正確
      const { error: travelError } = product_Validator.travelSchema.validate(travel, {
        abortEarly: false,
        stripUnknown: true
      });
      if (travelError) {
        resStatus({
          res: res,
          status: 400,
          message: '欄位未填寫正確',
        });
        return;
      } 
    }

    if( food ){
    // [404] 查無此項目
      const idRepo = await pool.query(
      'SELECT tour_id FROM public."restaurant" WHERE tour_id = $1',
      [tour_id]);
      if(idRepo.rowCount <= 0 ){
        resStatus({
            res: res,
            status: 400,
            message: '查無此項目',
          });
        return;
      }

    // [400] 欄位未填寫正確
      const { error: foodError } = product_Validator.foodSchema.validate(food, {
        abortEarly: false,
        stripUnknown: true
      });
      if (foodError) {
        resStatus({
          res: res,
          status: 400,
          message: '欄位未填寫正確',
        });
        return;
      }     
    }

    if( hotel ){
    // [404] 查無此項目
      const idRepo = await pool.query(
      'SELECT tour_id FROM public."hotel" WHERE tour_id = $1',
      [tour_id]);
      if(idRepo.rowCount <= 0 ){
        resStatus({
            res: res,
            status: 400,
            message: '查無此項目',
          });
        return;
      }

    // [400] 欄位未填寫正確
      const { error: hotelError } = product_Validator.hotelSchemas.validate(hotel, {
        abortEarly: false,
        stripUnknown: true
      });
      if (hotelError) {
        resStatus({
          res: res,
          status: 400,
          message: '欄位未填寫正確',
        });
        return;
      }      
    }
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
async function delete_tourProduct(req, res, next) {
  const { tour_ids } = req.body;

  // [400] 欄位未填寫正確
    const { error } = product_Validator.delete_tourProduct.validate( {tour_ids}, {
      abortEarly: false,
      stripUnknown: true
    });
    console.log(error)
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
  delete_tourProduct
  productImageUpload

};
