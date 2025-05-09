const axios = require('axios');//http請求
const qs = require('qs'); //URL解析，用於處理帶有參數的API查詢
const bcrypt = require('bcrypt');//密碼加密套件
const jwt = require('jsonwebtoken');//登入驗證(token)
const resStatus = require('../../utils/resStatus.js');//佩庭寫的http狀態碼回應格式
const { pool } = require('../../config/database');//資料庫連線


//[GET] 編號 10 使用者用戶資料呈現
async function getuserInfo(req, res, next) {
    // [HTTP 400] 提供欄位錯誤


    // [HTTP 500] 例外錯誤，例如 : 資料庫/程式錯誤
}


//[PATCH] 編號 11 使用者用戶資料修改
async function patchuserInfoedit(req, res, next) {
    // [HTTP 400] 提供欄位錯誤

    // [HTTP 500] 例外錯誤，例如 : 資料庫/程式錯誤
}



//[PATCH] 編號 12 使用者個人照片修改
async function patchuserAvatar(req, res, next) {
    // [HTTP 400] 提供欄位錯誤

    // [HTTP 500] 例外錯誤，例如 : 資料庫/程式錯誤
}

//[GET] 編號 13 使用者會員等級積分
async function getuserPointslevel(req, res, next) {
    // [HTTP 400] 提供欄位錯誤

    // [HTTP 500] 例外錯誤，例如 : 資料庫/程式錯誤
}





module.exports = {
    getuserInfo,
    patchuserInfoedit,
    patchuserAvatar,
    getuserPointslevel
}