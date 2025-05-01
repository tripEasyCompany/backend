const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const resStatus = require('../utils/resStatus');

const { pool } = require('../config/database');

// [POST] 編號 01 : 使用者註冊、個人偏好設定
async function post_user_SignUp(req, res, next){
    const {name,email,password, preference} = req.body;
    const [pref1, pref2, pref3] = preference;

    let client;
    try{
        const salt = await bcrypt.genSalt(10);
        const databasePassword = await bcrypt.hash(password, salt);

        client = await pool.connect(); 
        // 上傳數據
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

        await client.query('COMMIT');

        // [HTTP 201] 呈現上傳後資料
        resStatus({
            res:res,
            status:201,
            message:"註冊成功",
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

// [POST] 編號 02 : 使用者登入 - Email 登入
async function post_user_LoginEmail(req, res, next){
    const {email} = req.body;

    let client;
    try{
        client = await pool.connect(); 
        // 更新數據
        await client.query('BEGIN'); 

        const emailData = await pool.query('SELECT * FROM public."user" where email = $1',[email]);
        const user = emailData.rows[0];
        // 登入成功後，清除鎖住功能
        await pool.query(
            'UPDATE public."user" SET login_attempts = 0, locked_datetime = null WHERE user_id = $1',
            [user.user_id]
        );

        await client.query('COMMIT'); 

        // 簽發 JWT（依你專案調整）
        const payload = { id: user.id };
        const token = jwt.sign( payload, process.env.JWT_SECRET,
                      { expiresIn: process.env.JWT_EXPIRES_DAY || '30d'});

        // [HTTP 200] 呈現資料
        resStatus({
            res:res,
            status:200,
            message:"登入成功",
            dbdata:{ 
                token : token,
                user: {
                    id : user.user_id,
                    name : user.name,
                    email : user.email
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

// [POST] 編號 05 : 使用者忘記密碼
async function post_user_forgetPW(req, res, next){
    const {email} = req.body;

    try{
        // 簽發 JWT（依你專案調整）
        const emailData = await pool.query('SELECT * FROM public."user" where email = $1',[email]);
        const user = emailData.rows[0];

        const payload = { id: user.id,email: user.email };
        const reset_token = jwt.sign( payload, process.env.JWT_SECRET,
                      { expiresIn: '15m' });
                      
        // 📬 發送 Email
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const resetUrl = `https:tripeasycompany.github.io/reset-password?token=${reset_token}`;

        await sgMail.send({
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: 'TripEasy 密碼重設連結',
            html: `
                <p>您好，親愛的用戶 : </p><br>
                <p>請於 15 分鐘內點擊以下連結以重設密碼：</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>若您未曾申請重設密碼，請忽略此信件，謝謝。</p>
            `
        });

        // [HTTP 200] 呈現資料
        resStatus({
            res:res,
            status:200,
            message:"連結寄送成功"
        });

    }catch(error){
        // [HTTP 500] 伺服器異常
        console.error('❌ 伺服器內部錯誤:', error);
        next(error);
    }

}

module.exports = {
    post_user_SignUp,
    post_user_LoginEmail,
    post_user_forgetPW
}