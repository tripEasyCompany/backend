const resStatus = require('../../utils/resStatus.js');
const { pool } = require('../../config/database');
const multer = require('multer');

const product_Validator = require('../../utils/Validator/product_Validator.js');

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

module.exports = {
  get_tourData,
  get_tourDetail,
  get_tourReview,
  get_tourHiddenPlay,
  post_Product,
  productImageUpload
};
