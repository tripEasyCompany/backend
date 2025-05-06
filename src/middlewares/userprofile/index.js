const axios = require('axios');//http請求
const qs = require('qs'); //URL解析，用於處理帶有參數的API查詢
const bcrypt = require('bcrypt');//密碼加密套件
const jwt = require('jsonwebtoken');//登入驗證(token)
const resStatus = require('../../utils/resStatus.js');//佩庭寫的http狀態碼回應格式
const { pool } = require('../../config/database');//資料庫連線


//[GET] 編號 10 使用者用戶資料呈現
async function postuserInfo(req, res, next) {

}


//[PATCH] 編號 11 使用者用戶資料修改
async function postuserInfoedit(req, res, next) {

}



//[PATCH] 編號 12 使用者個人照片修改
async function postuserAvatar(req, res, next) {

}

//[GET] 編號 13 使用者會員等級積分
async function postuserPointslevel(req, res, next) {

}





module.exports = {
    postuserInfo,
    postuserInfoedit,
    postuserAvatar,
    postuserPointslevel
}