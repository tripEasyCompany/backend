const bcrypt = require('bcrypt');
const resStatus = require('../utils/resStatus');

const { pool } = require('../config/database');

// [POST] 使用者註冊
async function post_user_SignUp(req, res, next){
    const {name,email,password, preference} = req.body;
    const [pref1, pref2, pref3] = preference;

    let client;
    try{
        const salt = await bcrypt.genSalt(10);
        const databasePassword = await bcrypt.hash(password, salt);

        // 開始一個 transaction client
        client = await pool.connect(); 
        // 上傳數據
        // 1. 開啟 transaction
        await client.query('BEGIN'); 

        const userResult = await client.query(
            'INSERT INTO public."user" (name, email, role, password, preference1, preference2, preference3) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, email, "User", databasePassword, pref1,pref2,pref3 ]
        );
        const user = userResult.rows[0];

        const levelResult = await client.query(
            'INSERT INTO public."user_level" (user_id,level,name,badge_url,travel_point) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user.user_id, "Level 1", "初心旅人", "https://example.com/badges/level1.png", 0 ]
        );
        const level = levelResult.rows[0];

        const pointResult = await client.query(
            'INSERT INTO public."point_record" (user_id,type,point) VALUES ($1, $2, $3) RETURNING *',
            [user.user_id, "新增", 0 ]
        );

        // 4. 提交 transaction
        await client.query('COMMIT'); // 🔁 4. 提交 transaction

        // [HTTP 201] 呈現上傳後資料
        resStatus({
            res:res,
            status:201,
            dbdata:{ 
                user: {
                    id : user.user_id,
                    name : user.name,
                    role : user.role
                },
                level : {
                    level : level.level,
                    name : level.name,
                    points : level.travel_point
                }
            }
        });
       
    }catch(error){
        // [HTTP 500] 伺服器異常
        if (client) await client.query('ROLLBACK');
        console.error('❌ 伺服器內部錯誤:', error);
        next(error);
    }finally {
        if (client) client.release();
    }

}

module.exports = {
    post_user_SignUp
}