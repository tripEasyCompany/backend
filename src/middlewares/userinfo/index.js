const resStatus = require('../../utils/resStatus.js');
const userValidator = require("../../utils/userInfoValidator");
const preferenceNameToId = require('../../utils/preferenceMap');
const { pool } = require('../../config/database');

// [POST] 使用者註冊
async function postuserSignup(req, res, next) {
    const { error, value } = userValidator.validate(req.body, {
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

module.exports = {
    postuserSignup
}