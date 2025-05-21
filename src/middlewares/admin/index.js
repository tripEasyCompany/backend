const e = require('express');
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
    const { error } = isValidator.userDetailinfoSchema.validate(allParams, {
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
    const { user_ids, role } = req.body;

    // [400] 欄位未填寫正確
    for (const user_id of user_ids) {
        const { error } = isValidator.userPurviewSchema.validate({ user_id, role }, {
            abortEarly: false,
            stripUnknown: true
        });

        if(error) {
            resStatus({
                res: res,
                status: 400,
                message: '欄位未填寫正確',
            });
            return;
        }
    }

    // [404] 查無此用戶
    const dbResult = await pool.query(
        'SELECT user_id, name, email FROM public."user" WHERE user_id = ANY($1)',
        [user_ids]
    );
    const foundIds = dbResult.rows.map(row => row.user_id);
    const fail_ids = user_ids.filter(id => !foundIds.includes(id));

    if (fail_ids.length > 0) {
        resStatus({
            res: res,
            status: 404,
            message: 'user_id 不存在',
            dbdata:{
                user_ids: fail_ids
            }
        });
        return;
    }

    next();
}

// [GET] 45 : 管理者查找使用者資料
async function getUserSearch(req, res, next) {
    const { user_id } = req.params;     //搜尋id
    const { id } = req.user;

    // [400] 欄位未填寫正確
    const { error } = isValidator.userSearchSchema.validate(req.params, {
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

    // [403] 權限不足
    const roleRepo = await pool.query(
        'SELECT role FROM public."user" WHERE user_id = $1',
        [id]
    )
    if (roleRepo.rows.length === 0 || roleRepo.rows[0].role !== 'admin') {
        resStatus({
            res: res,
            status: 403,
            message: '權限不足'
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

module.exports = {
    getUserinfo,
    getUserDetailinfo,
    patchUserPurview,
    getUserSearch
};