const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const svgCaptcha = require('svg-captcha');

const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');

// [POST] 編號 01 : 使用者註冊、個人偏好設定
async function post_user_SignUp(req, res, next) {
  const { name, email, password, preference } = req.body;
  const [pref1, pref2, pref3] = preference;

  let client;
  try {
    const salt = await bcrypt.genSalt(10);
    const databasePassword = await bcrypt.hash(password, salt);

    client = await pool.connect();
    // 上傳數據
    await client.query('BEGIN');

    const userResult = await client.query(
      'INSERT INTO public."user" (name, email, role, password, preference1, preference2, preference3) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, email, 'User', databasePassword, pref1, pref2, pref3]
    );
    const user = userResult.rows[0];

    const levelResult = await client.query(
      'INSERT INTO public."user_level" (user_id,level,name,badge_url,travel_point) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.user_id, 'Level 1', '初心旅人', 'https://example.com/badges/level1.png', 0]
    );
    const level = levelResult.rows[0];

    await client.query(
      'INSERT INTO public."point_record" (user_id,type,point) VALUES ($1, $2, $3) RETURNING *',
      [user.user_id, '新增', 0]
    );

    await client.query('COMMIT');

    // [HTTP 201] 呈現上傳後資料
    resStatus({
      res: res,
      status: 201,
      message: '註冊成功',
      dbdata: {
        user: {
          id: user.user_id,
          name: user.name,
          role: user.role,
        },
        level: {
          level: level.level,
          name: level.name,
          points: level.travel_point,
        },
      },
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    if (client) await client.query('ROLLBACK');
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  } finally {
    if (client) client.release();
  }
}

// [POST] 編號 02 : 使用者登入 - Email 登入
async function post_user_LoginEmail(req, res, next) {
  const { email } = req.body;

  let client;
  try {
    client = await pool.connect();
    // 更新數據
    await client.query('BEGIN');

    const emailData = await pool.query('SELECT * FROM public."user" where email = $1', [email]);
    const user = emailData.rows[0];
    // 登入成功後，清除鎖住功能
    await pool.query(
      'UPDATE public."user" SET login_attempts = 0, locked_datetime = null, login_method = 1 WHERE user_id = $1',
      [user.user_id]
    );

    const levelResult = await pool.query('SELECT * FROM public."user_level" where user_id = $1', [
      user.user_id,
    ]);
    const level = levelResult.rows[0];

    await client.query('COMMIT');

    // 簽發 JWT（依你專案調整）
    const payload = { id: user.user_id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_DAY || '7d',
    });

    // [HTTP 200] 呈現資料
    resStatus({
      res: res,
      status: 200,
      message: '登入成功',
      dbdata: {
        token: token,
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          avatar_url: user.picture,
        },
        level: {
          level: level.level,
          name: level.name,
          points: level.travel_point,
          badge_url: level.badge_url,
        },
      },
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    if (client) await client.query('ROLLBACK');
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  } finally {
    if (client) client.release();
  }
}

// [POST] 編號 03 : 使用者登入 - Google 登入
async function post_user_LoginGoogle(req, res, next) {
  // 從中介軟體取得已驗證的 Google 使用者資訊和權杖
  const { googleUser, access_token } = req.user;
  const { email, name, picture } = googleUser;
  // Google 的使用者唯一 ID，用來存儲在 socialLogin 表中
  const provider_id = googleUser.sub;

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN'); // 開始資料庫交易

    // 1. 檢查使用者是否已存在於資料庫中
    const { rows: existingUsers } = await client.query('SELECT * FROM public."user" WHERE email = $1', [email]);
    let user = existingUsers[0];
    
    // 2. 根據使用者是否存在，執行不同邏輯
    if (user) {
      // 2a. 如果使用者已存在（例如用 Email 註冊過）
      // 更新其頭像和登入方式，並確保 socialLogin 紀錄存在
      const updatedUserResult = await client.query(
        `UPDATE public."user" 
         SET avatar_url = $1, login_method = 2, updated_at = NOW() 
         WHERE user_id = $2 RETURNING *`,
        [picture, user.user_id]
      );
      user = updatedUserResult.rows[0];

      // 使用 ON CONFLICT 語法來安全地插入或更新 socialLogin 紀錄
      // 這能處理使用者第一次用 Google 登入，或更新已存在的 Google 登入權杖
      await client.query(
        `INSERT INTO public."socialLogin" (user_id, provider_method, provider_id, provider_token) 
         VALUES ($1, 'google', $2, $3) 
         ON CONFLICT (user_id, provider_method) DO UPDATE SET provider_id = $2, provider_token = $3, updated_at = NOW()`,
        [user.user_id, provider_id, access_token]
      );

    } else {
      // 2b. 如果使用者不存在，執行完整的全新註冊流程
      const salt = await bcrypt.genSalt(10);
      // 為第三方登入的用戶設定一個高強度的預設密碼
      const databasePassword = await bcrypt.hash(process.env.DEFAULT_OAUTH_PASSWORD || 'DefaultPassword123!', salt); 

      // 插入新使用者，並給予預設的偏好設定 (例如 1, 2, 3)
      const newUserResult = await client.query(
        'INSERT INTO public."user" (name, email, role, password, avatar_url, login_method, preference1, preference2, preference3) VALUES ($1, $2, $3, $4, $5, 2, 1, 2, 3) RETURNING *',
        [name, email, 'User', databasePassword, picture]
      );
      user = newUserResult.rows[0];

      // 為新使用者建立相關的初始紀錄
      await client.query(
        'INSERT INTO public."user_level" (user_id,level,name,badge_url,travel_point) VALUES ($1, $2, $3, $4, $5)',
        [user.user_id, 'Level 1', '初心旅人', 'https://example.com/badges/level1.png', 0]
      );
      await client.query(
        'INSERT INTO public."point_record" (user_id,type,point) VALUES ($1, $2, $3)',
        [user.user_id, '新增', 0]
      );
      await client.query(
        'INSERT INTO public."socialLogin" (user_id, provider_method, provider_id, provider_token) VALUES ($1, $2, $3, $4)',
        [user.user_id, 'google', provider_id, access_token]
      );
    }
    
    // 3. 提交資料庫交易
    await client.query('COMMIT');

    // 4. 取得使用者的等級資訊
    const levelResult = await pool.query('SELECT * FROM public."user_level" where user_id = $1', [
      user.user_id,
    ]);
    const level = levelResult.rows[0];

    // 5. 簽發 JWT 權杖並回傳成功的響應
    const payload = { id: user.user_id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_DAY || '7d',
    });

    return resStatus({
      res: res,
      status: 200,
      message: '登入成功',
      dbdata: {
        token: token,
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
        },
        level: {
          level: level.level,
          name: level.name,
          points: level.travel_point,
          badge_url: level.badge_url,
        },
      },
    });

  } catch (error) {
    // 如果過程中發生任何錯誤，則回滾資料庫交易
    if (client) await client.query('ROLLBACK');
    console.error('❌ Google 登入控制器錯誤:', error);
    next(error); // 將錯誤傳遞給 Express 的錯誤處理中介軟體
  } finally {
    // 無論成功或失敗，最後都釋放資料庫連線
    if (client) client.release();
  }
}

// [POST] 編號 04 : 使用者登入 - FB 登入

// [POST] 編號 05 : 使用者忘記密碼 ( 修改密碼畫面 )
async function post_user_forgetPW(req, res, next) {
  const { email } = req.body;

  try {
    // 簽發 JWT（依你專案調整）
    const emailData = await pool.query('SELECT * FROM public."user" where email = $1', [email]);
    const user = emailData.rows[0];

    const payload = { id: user.user_id };
    const reset_token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

    // 📬 發送 Email
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const resetUrl = `${process.env.FRONTEND_PATH}/admin/resetpw?token=${reset_token}`;

    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'TripEasy 密碼重設連結',
      html: `
                <p>您好，親愛的用戶 : </p><br>
                <p>請於 15 分鐘內點擊以下連結以重設密碼：</p><br>
                <a href="${resetUrl}">連結 : ${resetUrl}</a>
                <p>若您未曾申請重設密碼，請忽略此信件，謝謝。</p>
            `,
    });

    // [HTTP 200] 呈現資料
    resStatus({
      res: res,
      status: 200,
      message: '連結寄送成功',
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [PATCH] 編號 06 : 使用者密碼修改
async function patch_user_resetPW(req, res, next) {
  try {
    // [HTTP 200] 呈現資料
    resStatus({
      res: res,
      status: 200,
      message: '密碼修改成功',
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 編號 07 : 圖片、文字驗證碼判斷機器人
async function get_user_captcha(req, res, next) {
  try {
    const captcha = svgCaptcha.create({
      size: 5,
      noise: 3,
      color: false,
      background: '#eee',
    });

    // 將驗證碼存在 cookie，5 分鐘內有效
    res.cookie('captcha', captcha.text, {
      maxAge: 5 * 60 * 1000,
      httpOnly: true,
      secure: true, // ✅ 要設 true！因為 Render 是 HTTPS
      sameSite: 'None', // ✅ 跨網域一定要設成 None
    });

    res.type('svg');
    res.send(captcha.data);
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [POST] 編號 08 : 使用者登出 ( 以前端處理，不用開發 )
// 無

// [GET] 編號 09 : 驗證使用者登入狀態
async function get_user_loginStatus(req, res, next) {
  try {
    const user = await pool.query('SELECT * FROM public."user" where user_id = $1', [req.user.id]);
    const level = await pool.query('SELECT * FROM public."user_level" where user_id = $1', [
      user.rows[0].user_id,
    ]);

    // [HTTP 200] 呈現資料
    resStatus({
      res: res,
      status: 200,
      message: '登入中',
      dbdata: {
        is_logged_in: true,
        user: {
          id: user.rows[0].user_id,
          name: user.rows[0].name,
          email: user.rows[0].email,
          avatar_url: user.rows[0].picture,
        },
        level: {
          level: level.rows[0].level,
          name: level.rows[0].name,
          points: level.rows[0].travel_point,
          badge_url: level.rows[0].badge_url,
        },
      },
    });
  } catch (error) {
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
  get_user_loginStatus,
};
