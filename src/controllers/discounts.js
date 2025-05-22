const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');
const e = require('express');

// [POST] 編號 32 : 使用者輸入優惠卷、累積積分
async function post_user_discounts(req, res, next) {
  const { type } = req.body;

  try {
    if(type === 'coupon') {
      console.log('優惠卷');
    }else if(type === 'point') {
      console.log('累積點數');
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [DELETE] 編號 33 : 使用者取消優惠卷、累積積分

module.exports = {
  post_user_discounts
};
