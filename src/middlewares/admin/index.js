const { pool } = require('../../config/database');
const resStatus = require('../../utils/resStatus');

const isValidator = require('../../utils/Validator/admin_Validator.js');

// [GET] 42 : 管理者查看註冊用戶資料
async function getUserinfo(req, res, next) {
    const { error } = isValidator.userinfoSchema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        resStatus({
            res: res,
            status: 400,
            message: '欄位未填寫正確'
        });
        return;
    }
    next();
}

// [GET] 43 : 管理者查看註冊用戶詳細資料
async function getUserDetailinfo(req, res, next) {
    const { user_id } = req.params;

    //[400] 欄位未填寫正確
    const allParams = {...req.params, ...req.query};
    const { error } = isValidator.userDetailinfoSchema.validate(req.params, req.query, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        resStatus({
            res: res,
            status: 400,
            message: '欄位未填寫正確'
        });
        return;
    }

    // [404] 查無此用戶
    const userResult = await pool.query(
        'SELECT * FROM public."user" WHERE user_id = $1',
        [user_id]
    );
    if (userResult.rows.length === 0) {
        resStatus({
            res: res,
            status: 404,
            message: '查無此人'
        });
        return;
    }

    next();
}

// [PATCH] 44 : 管理者修改註冊用戶權限
async function patchUserPurview(req, res, next) {

    next();
}

// [GET] 45 : 管理者查找使用者資料
async function getUserSearch(req, res, next) {

    next();
}

module.exports = {
    getUserinfo,
    getUserDetailinfo,
    patchUserPurview,
    getUserSearch
};