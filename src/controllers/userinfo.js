const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const svgCaptcha = require('svg-captcha');

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
            'UPDATE public."user" SET login_attempts = 0, locked_datetime = null, login_method = 1 WHERE user_id = $1',
            [user.user_id]
        );

        const levelResult = await pool.query(
            'SELECT * FROM public."user_level" where user_id = $1',
            [user.user_id]
        );
        const level = levelResult.rows[0];

        await client.query('COMMIT'); 

        // 簽發 JWT（依你專案調整）
        const payload = { id: user.user_id };
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
                    email : user.email,
                    avatar_url : user.picture
                },
                level : {
                    level : level.level,
                    name : level.name,
                    points : level.travel_point,
                    badge_url : level.badge_url
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

// [POST] 編號 03 : 使用者登入 - Google 登入
async function post_user_LoginGoogle(req, res, next){
    const {code} = req.body;
    const {googleUser,access_token} = req.user;
    const email = googleUser.email;

    let client;
    try{
        const emailData = await pool.query('SELECT * FROM public."user" where email = $1',[email]);
        const userData = emailData.rows[0];

        // 第一次用第三方登入進行登入
        if(!userData){
            const salt = await bcrypt.genSalt(10);
            const databasePassword = await bcrypt.hash('Aa123456', salt);

            client = await pool.connect(); 
            // 上傳數據
            await client.query('BEGIN'); 

            const userResult = await client.query(
                'INSERT INTO public."user" (name, email, role, password,avatar_url,login_method) VALUES ($1, $2, $3, $4,$5,$6) RETURNING *',
                [googleUser.name, email, "User", databasePassword,googleUser.picture,2 ]
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

            const socialLoginResult = await client.query(
                'INSERT INTO public."socialLogin" (user_id, provider_method, provider_id, provider_token) VALUES ($1, $2, $3, $4) RETURNING *',
                [user.user_id, 'google', code, access_token ]
            );

            await client.query('COMMIT'); 
        }

        // 簽發 JWT（依你專案調整）
        const user = await pool.query('SELECT * FROM public."user" where email = $1',[email]);
        const level = await pool.query('SELECT * FROM public."user_level" where user_id = $1',[user.rows[0].user_id]);
        const payload = { id: user.rows[0].user_id };
        const token = jwt.sign( payload, process.env.JWT_SECRET,
                      { expiresIn: process.env.JWT_EXPIRES_DAY || '30d'});

        resStatus({
            res:res,
            status:200,
            message:"登入成功",
            dbdata:{ 
                token : token,
                user: {
                    id : user.rows[0].user_id,
                    name : user.rows[0].name,
                    email : user.rows[0].email,
                    avatar_url : googleUser.picture
                },
                level : {
                    level : level.rows[0].level,
                    name : level.rows[0].name,
                    points : level.rows[0].travel_point,
                    badge_url : level.rows[0].badge_url
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

// [POST] 編號 04 : 使用者登入 - FB 登入


// [POST] 編號 05 : 使用者忘記密碼 ( 修改密碼畫面 )
async function post_user_forgetPW(req, res, next){
    const {email} = req.body;

    try{
        // 簽發 JWT（依你專案調整）
        const emailData = await pool.query('SELECT * FROM public."user" where email = $1',[email]);
        const user = emailData.rows[0];

        const payload = { id: user.user_id };
        const reset_token = jwt.sign( payload, process.env.JWT_SECRET,
                      { expiresIn: '15m' });
                      
        // 📬 發送 Email
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const resetUrl = `http://127.0.0.1:5500/reset-password.html?token=${reset_token}`;

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

// [PATCH] 編號 06 : 使用者密碼修改
async function patch_user_resetPW(req, res, next){
    try{
        // [HTTP 200] 呈現資料
        resStatus({
            res:res,
            status:200,
            message:"密碼修改成功"
        });

    }catch(error){
        // [HTTP 500] 伺服器異常
        console.error('❌ 伺服器內部錯誤:', error);
        next(error);
    }

}

// [GET] 編號 07 : 圖片、文字驗證碼判斷機器人
async function get_user_captcha(req, res, next){

    try{
        const captcha = svgCaptcha.create({
            size: 5,
            noise: 3,
            color: false,
            background: '#eee'
        });

        // 將驗證碼存在 cookie，5 分鐘內有效
        res.cookie('captcha', captcha.text, { maxAge: 5 * 60 * 1000, httpOnly: true });
        res.type('svg');
        res.send(captcha.data);
    
    }catch(error){
        // [HTTP 500] 伺服器異常
        console.error('❌ 伺服器內部錯誤:', error);
        next(error);
    }

}

// [POST] 編號 08 : 使用者登出 ( 以前端處理，不用開發 )
// 無

// [GET] 編號 09 : 驗證使用者登入狀態
async function get_user_loginStatus(req, res, next){
    try{
        const user = await pool.query('SELECT * FROM public."user" where user_id = $1',[req.user.id]);
        const level = await pool.query('SELECT * FROM public."user_level" where user_id = $1',[user.rows[0].user_id]);

        // [HTTP 200] 呈現資料
        resStatus({
            res:res,
            status:200,
            message:"登入中",
            dbdata:{ 
                "is_logged_in": true ,
                user: {
                    id : user.rows[0].user_id,
                    name : user.rows[0].name,
                    email : user.rows[0].email,
                    avatar_url : user.rows[0].picture
                },
                level : {
                    level : level.rows[0].level,
                    name : level.rows[0].name,
                    points : level.rows[0].travel_point,
                    badge_url : level.rows[0].badge_url
                }
            }
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
    post_user_LoginGoogle,
    post_user_forgetPW,
    patch_user_resetPW,
    get_user_captcha,
    get_user_loginStatus
}