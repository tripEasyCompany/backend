const axios = require('axios');
const qs = require('qs'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const resStatus = require('../../utils/resStatus.js');
const { pool } = require('../../config/database');

// 資料驗證相關模組
const userInfo_Validator = require("../../utils/Validator/userInfo_Validator.js");
const preferenceNameToId = require('../../utils/preferenceMap');


// [POST] 編號 01 : 使用者註冊、個人偏好設定
async function postuserSignup(req, res, next) {
    const { error, value } = userInfo_Validator.registerSchema.validate(req.body, {
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
    const { error, value } = userInfo_Validator.loginSchema.validate(req.body, {
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

// [POST] 編號 03 : 使用者登入 - Google 登入
async function postuserLoginGoogle(req, res, next) {
    const {code} = req.body;

    // [HTTP 400] 資料錯誤
    if (!code){
        resStatus({
            res:res,
            status:400,
            message: "Code 欄位未填寫正確"
        });
        return;
    } 

    // 1. 用 code 換 access_token
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token',
        qs.stringify({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
    );

    // Step 2. 拿 user info
    const { access_token } = tokenRes.data;
    const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
    });

    const googleUser = userInfoRes.data;
    // [HTTP 400] Google 帳號資訊異常
    if (!googleUser || !googleUser.email) {
        resStatus({
            res:res,
            status:400,
            message: "Google 帳號資訊異常，無法取得 email"
        });
        return;
    }

    req.user = {
        googleUser,
        access_token
      };
    next();
}

// [POST] 編號 04 : 使用者登入 - FB 登入


// [POST] 編號 05 : 使用者忘記密碼
async function postuserforgetPW(req, res, next) {
    const { error, value } = userInfo_Validator.forgotPasswordSchema.validate(req.body, {
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
    const {email} = value;
    const emailData = await pool.query('SELECT * FROM public."user" where email = $1',[email]);
    const user = emailData.rows[0];
    if (!user) {
        resStatus({
            res:res,
            status:404,
            message: "帳號不存在。"
        });
        return;
    }

    req.body = value; // 保留乾淨資料
    next();
}

// [PATCH] 編號 06 : 使用者密碼修改 ( 修改密碼畫面 )
async function patchuserresetPW(req, res, next) {
    const { error, value } = userInfo_Validator.resetPasswordSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
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

    const {token,new_password} = value;
    let decoded;

    // [HTTP 400] Token 資料錯誤、無效或過期
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        resStatus({
            res:res,
            status:400,
            message: "Token 資料錯誤、無效或過期"
        });
        return;
    }

    const user = decoded;
    const salt = await bcrypt.genSalt(10);
    const databasePassword = await bcrypt.hash(new_password, salt);
    const userData = await pool.query('UPDATE public."user" SET password = $1 WHERE user_id = $2',[databasePassword,user.id]);
    
    // [HTTP 400] 密碼更新失敗
    if(userData.rowCount === 0){
        resStatus({
            res:res,
            status:400,
            message: "密碼更新失敗"
        });
        return;
    }

    req.body = value; // 保留乾淨資料
    next();
}

// [GET] 編號 07 : 圖片、文字驗證碼判斷機器人


// [POST] 編號 08 : 使用者登出 ( 以前端處理，不用開發 )

// [GET] 編號 09 : 驗證使用者登入狀態


module.exports = {
    postuserSignup,
    postuserLoginEmail,
    postuserLoginGoogle,
    postuserforgetPW,
    patchuserresetPW
}