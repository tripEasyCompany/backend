const bcrypt = require('bcrypt');
const resStatus = require('../../utils/resStatus.js');
const { pool } = require('../../config/database');

// 資料驗證相關模組
const signupValidator = require("../../utils/Validator/userInfo_signupValidator.js");
const loginValidator = require("../../utils/Validator/userInfo_loginValidator.js");
const preferenceNameToId = require('../../utils/preferenceMap');


// [POST] 編號 01 : 使用者註冊、個人偏好設定
async function postuserSignup(req, res, next) {
    const { error, value } = signupValidator.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });
    
    // [HTTP 400] 資料錯誤
    if (error) {
        const message = error.details[0]?.message || '欄位驗證錯誤';
        resStatus({
            res:res,
            status:400,
            message: message
        });
        return;
    }

    // 偏好設定的 Mapping 分類
    const { preference } = value;
    const preferenceIds = preference.map(name => preferenceNameToId[name]);
    if (preferenceIds.includes(undefined)) {
        return resStatus({
            res:res,
            status:409,
            message: '包含無效的偏好名稱'
        });
    }

    // [HTTP 409] 資料重複異常
    const { email } = value;
    const emailData = await pool.query('SELECT * FROM public."user" where email = $1',[email]);
    if (emailData.rows.length > 0){
        resStatus({
            res:res,
            status:409,
            message:"Email已被使用"
        });
        return;
    }

    req.body = value; // 保留乾淨資料
    req.body.preference = preferenceIds;
    next();
}

// [POST] 編號 02 : 使用者登入 - Email 登入
async function postuserLoginEmail(req, res, next) {
    const { error, value } = loginValidator.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });
    
    // [HTTP 400] 資料錯誤
    if (error) {
        const message = error.details[0]?.message || '欄位驗證錯誤';
        resStatus({
            res:res,
            status:400,
            message: message
        });
        return;
    }

    // [HTTP 404] 帳號密碼不存在
    const {email, password} = value;
    const emailData = await pool.query('SELECT * FROM public."user" where email = $1',[email]);
    const user = emailData.rows[0];
    if (!user) {
        resStatus({
            res:res,
            status:404,
            message: "帳號密碼不存在。"
        });
        return;
    }

    // [HTTP 403] 帳號已鎖定
    const now = new Date();
    const lockedUntil = user.locked_datetime ? new Date(user.locked_datetime) : null;
    if (lockedUntil && lockedUntil > now) {
      const waitMinutes = Math.ceil((lockedUntil - now) / (60 * 1000));

      resStatus({
        res:res,
        status: 403,
        message: `帳號鎖定中，請於 ${waitMinutes} 分鐘後再試`
      });
      return;
    }

    // [HTTP 401] 帳號密碼輸入錯誤
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        const failCount = user.login_attempts + 1;
        const lockTime = failCount >= 3 ? new Date(now.getTime() + 30 * 60000) : null;

        await pool.query(
            'UPDATE public."user" SET login_attempts = $1, locked_datetime = $2 WHERE user_id = $3',
            [failCount, lockTime, user.user_id]
        );

        let msg = failCount >= 3 ? '錯誤次數過多，帳號已鎖定 30 分鐘' : `帳號密碼輸入錯誤。(已錯誤 ${failCount} 次)`;
        resStatus({
            res:res,
            status: 401,
            message: msg
        });
        return;
    }

    req.body = value; // 保留乾淨資料
    next();
}

module.exports = {
    postuserSignup,
    postuserLoginEmail
}