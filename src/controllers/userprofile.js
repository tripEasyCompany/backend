const bcrypt = require('bcrypt');//密碼加密套件
const jwt = require('jsonwebtoken');//登入驗證(token)
const sgMail = require('@sendgrid/mail');//sendgrid的信件串接
const svgCaptcha = require('svg-captcha');//svg格式驗證碼的套件

const resStatus = require('../utils/resStatus');//佩庭寫的http狀態碼回應格式
const { pool } = require('../config/database');//資料庫連線



//[GET] 編號 10 使用者用戶資料呈現
async function get_info(req, res, next){
    //const {}=req.body; //前端傳過來的資料
    try{
        const user = await pool.query('SELECT * FROM public."user" where user_id = $1',['a1b2c3d4-e5f6-7890-abcd-ef1234567890']);//測試用
        //const user = await pool.query('SELECT * FROM public."user" where user_id = $1',[req.user.id]);//正式使用
        

        // [HTTP 200] 呈現資料
        resStatus({
            res:res,
            status:210,
            message:"查詢成功",
            dbdata:{ 
                "is_logged_in": true ,
                user: {
                    id : user.rows[0].user_id,
                    name : user.rows[0].name,
                    email : user.rows[0].email,
                    avatar_url : user.rows[0].avatar_url,
                    preference1 : user.rows[0].preference1,
                    preference2 : user.rows[0].preference2,
                    preference3 : user.rows[0].preference3
                }
            }
        });

    }catch(error){
        // [HTTP 500] 伺服器異常
        console.error('❌ 伺服器內部錯誤:', error);
        next(error);
    }

}



//[PATCH] 編號 11 使用者用戶資料修改
async function patch_infoedit(req, res, next){

}


//[PATCH] 編號 12 使用者個人照片修改
async function patch_avatar(req, res, next){

}




//[GET] 編號 13 使用者會員等級積分
async function get_pointslevel(req, res, next){

}


module.exports = {
    get_info,
    patch_infoedit,
    patch_avatar,
    get_pointslevel
}