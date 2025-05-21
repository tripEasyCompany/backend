const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');

const adminController = {
    // [GET] 42 : 管理者查看註冊用戶資料
    async get_userinfo(req, res, next){
        try{
            const { lang, page, limit } = req.query;

            const userRepo = await pool.query(
                'SELECT user_id, name, email FROM public."user" ORDER BY created_at DESC LIMIT $1 OFFSET $2',
                [limit, (page - 1) * limit]
            );

            resStatus({
                res: res,
                status: 200,
                message: '查詢成功',
                dbdata: userRepo.rows
            });
        }catch(error){
            // [HTTP 500] 伺服器異常
            console.error('❌ 伺服器內部錯誤:', error);
            next(error);
        }
    },

    // [GET] 43 : 管理者查看註冊用戶詳細資料
    async get_userDetailinfo(req, res, next){
        try{
            const { lang } = req.query;

            const userRepo = await pool.query(
                'SELECT * FROM public."user" WHERE user_id = $1',
                [req.params.user_id]
            );

            resStatus({
                res: res,
                status: 200,
                message: '查詢成功',
                dbdata: {
                    data: userRepo.rows
                }
            });
        }catch(error){
            // [HTTP 500] 伺服器異常
            console.error('❌ 伺服器內部錯誤:', error);
            next(error);
        }
    },

    // [PATCH] 44 : 管理者修改註冊用戶權限
    async patch_userPurview(req, res, next){
        try{
            const { user_ids, role } = req.body;

            const updatePromises = user_ids.map(user_id =>
                pool.query('UPDATE public."user" SET role = $1 WHERE user_id = $2', [role, user_id])
            );
            const results = await Promise.all(updatePromises);
            // const updatedUsers = results.flatMap(r => r.rows);

            const userRepo = await pool.query(
                'SELECT user_id, name, email FROM public."user" WHERE user_id = ANY($1)',
                [user_ids]
            );

            resStatus({
                res,
                status: 200,
                message: '權限修改成功',
                dbdata: userRepo.rows
            });
        }catch(error){
            // [HTTP 500] 伺服器異常
            console.error('❌ 伺服器內部錯誤:', error);
            next(error);
        }
    },

    // [GET] 45 : 管理者查找使用者資料
    async get_userSearch(req, res, next){
        try{
            const { user_id } = req.params;
            const Repo = await pool.query(
                'SELECT user_id, name, email FROM public."user" WHERE user_id = $1 ORDER BY created_at DESC',
                [user_id]
            );

            resStatus({
                res: res,
                status: 200,
                message: '查詢成功',
                dbdata: {
                    data: Repo.rows
                }
            });
        }catch(error){
            // [HTTP 500] 伺服器異常
            console.error('❌ 伺服器內部錯誤:', error);
            next(error);
        }
    },
}

module.exports = adminController;