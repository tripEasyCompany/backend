const resStatus = require('../../utils/resStatus.js');
const { pool } = require('../../config/database');

// 資料驗證相關模組
const promotion_Validator = require('../../utils/Validator/promotion_Validator.js');

// [GET] 編號 57 : 管理者查看促銷清單


// [POST] 編號 58 : 管理者新增/修改促銷內容
async function postPromotions(req, res, next) {
  const { error } = promotion_Validator.createPromotionSchema.validate(req.body);

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

  // [HTTP 404] 查無此旅遊項目
  const { tour_ids } = req.body;
  const tourIdList = Array.isArray(tour_ids) ? tour_ids : [tour_ids];
  const { rows } = await pool.query(
    `SELECT tour_id FROM public."tour" WHERE tour_id = ANY($1::uuid[])`,
    [tourIdList]
  );

  const foundTourIds = rows.map((row) => row.tour_id);
  const notFoundIds = tourIdList.filter((id) => !foundTourIds.includes(id));

  if (notFoundIds.length > 0) {
    return resStatus({
      res: res,
      status: 404,
      message: `查無旅遊項目：${notFoundIds.join(', ')}`,
    });
  }

  next();
}

// [DETELE] 編號 59 : 管理者刪除促銷內容


module.exports = {
  postPromotions,
};
