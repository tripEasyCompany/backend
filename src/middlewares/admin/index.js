const resStatus = require('../../utils/resStatus.js');
const { pool } = require('../../config/database');

const coupon_Validator = require('../../utils/Validator/coupon_Validator.js');
const isValidator = require('../../utils/Validator/admin_Validator.js');

// [GET] 42 : 管理者查看註冊用戶資料
async function getUserinfo(req, res, next) {
  const { error } = isValidator.userinfoSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }
  next();
}

// [GET] 43 : 管理者查看註冊用戶詳細資料
async function getUserDetailinfo(req, res, next) {
  const { user_id } = req.params;

  //[400] 欄位未填寫正確
  const allParams = { ...req.params, ...req.query };
  const { error } = isValidator.userDetailinfoSchema.validate(allParams, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [404] 查無此用戶
  const userResult = await pool.query('SELECT * FROM public."user" WHERE user_id = $1', [user_id]);
  if (userResult.rows.length === 0) {
    resStatus({
      res: res,
      status: 404,
      message: '查無此人',
    });
    return;
  }

  next();
}

// [PATCH] 44 : 管理者修改註冊用戶權限
async function patchUserPurview(req, res, next) {
  const { user_ids, role } = req.body;

  // [400] 欄位未填寫正確
  const { error } = isValidator.userPurviewSchema.validate({ user_ids, role },
    {
      abortEarly: false,
      stripUnknown: true,
    }
  );

  if (error) {
    const message = error.details[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [404] 查無此用戶
  const userResult = await pool.query(
    'SELECT user_id, name, email FROM public."user" WHERE user_id = ANY($1)',
    [user_ids]
  );
  const foundIds = userResult.rows.map((row) => row.user_id);
  const fail_ids = user_ids.filter((id) => !foundIds.includes(id));

  if (fail_ids.length > 0) {
    resStatus({
      res: res,
      status: 404,
      message: 'user_id 不存在',
      dbdata: {
        user_ids: fail_ids,
      },
    });
    return;
  }

  next();
}

// [GET] 45 : 管理者查找使用者資料
async function getUserSearch(req, res, next) {
  const { user_id } = req.params; //搜尋id
  const { id } = req.user;

  // [400] 欄位未填寫正確
  const { error } = isValidator.userSearchSchema.validate(req.params, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [404] 查無此用戶
  const userResult = await pool.query('SELECT * FROM public."user" WHERE user_id = $1', [user_id]);
  if (userResult.rows.length === 0) {
    resStatus({
      res: res,
      status: 404,
      message: '查無此人',
    });
    return;
  }

  next();
}

// [POST] 53 : 管理者新增異動通知
async function post_Changeinfo(req, res, next) {
  const { tour_ids, message } = req.body;

  // [400] 欄位未填寫正確 tour_ids=[]
  if( tour_ids.length === 0) {
    resStatus({
      res: res,
      status: 400,
      message: '欄位未填寫正確',
    })
    return;
  };

  // [400] 已存在異動通知
  for (const tour_id of tour_ids) {
    const notificationResult = await pool.query(
      'SELECT tour_id FROM public."notification" WHERE tour_id = $1',
      [tour_id]
    );
  const foundIds = notificationResult.rows.map(row => row.tour_id);
  const fail_ids = tour_ids.filter(id => foundIds.includes(id));
  if (fail_ids.length > 0) {
      resStatus({
        res: res,
        status: 400,
        message: '已存在異動通知',
      });
      return;
    }

  // [400] 欄位未填寫正確
  const { error } = isValidator.postChangeinfo.validate({ tour_id, message }, {
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
  }

  // [404] 查無此項目
  const dbResult = await pool.query(
    'SELECT tour_id FROM public."tour" WHERE tour_id = ANY($1)',
    [tour_ids]
  );
  if (dbResult.rows.length !== tour_ids.length) {
    resStatus({
      res: res,
      status: 404,
      message: '查無此項目',
    });
    return;
  }

  next();
}

// [GET] 54 : 管理者查看異動通知
async function get_Changeinfo(req, res, next) {
  // [400] 欄位未填寫正確
  const { error } = isValidator.getChangeinfo.validate(req.query, {
    abortEarly: false,
    stripUnknown: true
  });
console.log('error', error);
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

// [PATCH] 55 : 管理者修改異動通知
async function patch_Changeinfo(req, res, next) {
  const { tour_ids, message } = req.body;

  // [400] 欄位未填寫正確
    const { error } = isValidator.patchChangeinfo.validate({ tour_ids, message }, {
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
    'SELECT tour_id FROM public."notification" WHERE tour_id = ANY($1)',
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

// [DELETE] 56 : 管理者刪除異動通知
async function delete_Changeinfo(req, res, next) {
  const { tour_ids } = req.body;
  
  // [400] 欄位未填寫正確 tour_ids=[]
  if(tour_ids.length === 0) {
    resStatus({
        res: res,
        status: 400,
        message: '欄位未填寫正確',
      });
      return;
  }

  // [400] 欄位未填寫正確
  for (const tour_id of tour_ids) {
    const { error } = isValidator.deleteChangeinfo.validate({ tour_id }, {
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
  }

  // [404] 查無此項目
  const dbResult = await pool.query(
    'SELECT tour_id FROM public."notification" WHERE tour_id = ANY($1)',
    [tour_ids]
  );
  const foundIds = dbResult.rows.map(row => row.tour_id);
  const fail_ids = tour_ids.filter(id => !foundIds.includes(id));
  if (fail_ids.length > 0) {
    resStatus({
      res: res,
      status: 404,
      message: '查無此項目',
    });
    return;
  }
  next();
}

// [GET] 編號 68 : 管理者查看使用者的優惠卷清單
async function get_userCoupon(req, res, next) {
  const { error } = coupon_Validator.getuserCouponSchema.validate(req.params);

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

  // [HTTP 404] 查無此使用者
  const { user_id } = req.params;
  const userRepo = await pool.query('SELECT user_id FROM public."user" WHERE user_id = $1', [
    user_id,
  ]);
  if (userRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此使用者',
    });
  }

  next();
}

// [DELETE] 編號 69 : 管理者刪除優惠卷綁定
async function delete_userCoupon(req, res, next) {
  const { error: paramsError } = coupon_Validator.getuserCouponSchema.validate(req.params);
  const { error: bodyError } = coupon_Validator.deleteuserCouponSchema.validate(req.body);

  // [HTTP 400] 資料錯誤
  if (paramsError || bodyError) {
    const message =
      paramsError?.details?.[0]?.message || bodyError?.details?.[0]?.message || '欄位驗證錯誤';
    resStatus({
      res: res,
      status: 400,
      message: message,
    });
    return;
  }

  // [HTTP 404] 查無此使用者
  const { user_id } = req.params;
  const userRepo = await pool.query('SELECT user_id FROM public."user" WHERE user_id = $1', [
    user_id,
  ]);
  if (userRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此使用者',
    });
  }

  // [HTTP 404] 查無此優惠卷
  const { coupon_id } = req.body;
  const couponRepo = await pool.query('SELECT * FROM public."coupon" WHERE coupon_id = $1', [
    coupon_id,
  ]);
  if (couponRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此優惠卷',
    });
  }

  // [HTTP 404] 查無此優惠卷綁定
  const userAssignRepo = await pool.query(
    'SELECT * FROM public."user_coupon" WHERE user_id = $1 AND coupon_id = $2',
    [user_id, coupon_id]
  );
  if (userAssignRepo.rowCount === 0) {
    return resStatus({
      res,
      status: 404,
      message: '查無此優惠卷綁定',
    });
  }

  next();
}

module.exports = {
  get_userCoupon,
  delete_userCoupon,
  getUserinfo,
  getUserDetailinfo,
  patchUserPurview,
  getUserSearch,
  post_Changeinfo,
  get_Changeinfo,
  patch_Changeinfo,
  delete_Changeinfo
};
