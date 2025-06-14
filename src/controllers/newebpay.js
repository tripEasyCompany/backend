const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');
const { options } = require('joi');
const crypto = require('crypto');
require('dotenv').config();


const {
  MerchantID, HASHKEY, HASHIV, Version, PayGateWay,
  NotifyUrl, ReturnUrl, RespondType
} = process.env;




// AES 加密（生成 TradeInfo）
function createSesEncrypt(order) {
  const data = new URLSearchParams(order).toString();
  const cipher = crypto.createCipheriv('aes-256-cbc', HASHKEY, HASHIV);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// SHA256 加密（生成 TradeSha）
function createShaEncrypt(encrypted) {
  const plainText = `HashKey=${HASHKEY}&${encrypted}&HashIV=${HASHIV}`;
  const sha = crypto.createHash('sha256');
  return sha.update(plainText).digest('hex').toUpperCase();
}

// 對應文件 21, 22 頁：將 aes 解密
function createSesDecrypt(TradeInfo) {
  const decrypt = crypto.createDecipheriv('aes-256-cbc', HASHKEY, HASHIV);
  decrypt.setAutoPadding(true);
  const text = decrypt.update(TradeInfo, 'hex', 'utf8');
  const plainText = text + decrypt.final('utf8');
  //const result = plainText.replace(/[\x00-\x20]+/g, '');
  //return JSON.parse(result);
  return JSON.parse(plainText);
}

// [POST] 編號 37 : 藍新金流交易處理(訂單新增，付款狀態狀態預設0)
async function post_newebpay_payment(req, res, next) {
  const { id } = req.user;
  const {
    order_items,
    payment_method,
    installment,
    discount,
    user,
    order_id
  } = req.body;




  const TimeStamp = Math.round(new Date().getTime() / 1000); //時間戳記
  const Amt = order_items.reduce((total, item) => total + item.price, 0); //金額加總
  const Email = user.email;// 取 Email
  const ItemDesc = order_items.map(item => item.title).join('、'); //產品說明(金流要求)

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 更新訂單狀態為0
    const updateResult = await client.query(`
      UPDATE public."orders"
      SET payment_status = 0
      WHERE order_id = $1 AND user_id = $2
    `, [order_id, id]);

    if (updateResult.rowCount === 0) {
      throw new Error('找不到訂單或訂單不屬於此使用者');
    }

    // 更新訂單明細狀態為0  未完成
    await client.query(`
      UPDATE public."order_item"
      SET payment = 0
      WHERE order_id = $1
    `, [order_id]);

    await client.query('COMMIT');

    //金流處理--------------------------------------------------------------------------------------------------------------------------------------------

    // 準備金流資料
    const order = {
      Amt: parseInt(Amt),
      ItemDesc,
      Email,
      TimeStamp,
      MerchantOrderNo: order_id,
    };

    const aesEncrypt = createSesEncrypt(order);
    const shaEncrypt = createShaEncrypt(aesEncrypt);

    // 回傳 HTML 表單給前端導向藍新付款頁
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"><title>Redirecting...</title></head>
        <body>
          <form id="payForm" method="post" action="${PayGateWay}">
            <input type="hidden" name="MerchantID" value="${MerchantID}" />
            <input type="hidden" name="TradeInfo" value="${aesEncrypt}" />
            <input type="hidden" name="TradeSha" value="${shaEncrypt}" />
            <input type="hidden" name="Version" value="${Version}" />
            <input type="hidden" name="RespondType" value="${RespondType}" />
            <input type="hidden" name="TimeStamp" value="${order.TimeStamp}" />
            <input type="hidden" name="MerchantOrderNo" value="${order.MerchantOrderNo}" />
            <input type="hidden" name="Amt" value="${order.Amt}" />
            <input type="hidden" name="ItemDesc" value="${order.ItemDesc}" />
            <input type="hidden" name="Email" value="${order.Email}" />
            <input type="hidden" name="ReturnURL" value="${ReturnUrl}" />
            <input type="hidden" name="NotifyURL" value="${NotifyUrl}" />
          </form>
          <script>document.getElementById('payForm').submit();</script>
        </body>
      </html>
    `);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ 建立訂單或準備金流時錯誤:', err);
    next(err);
  } finally {
    client.release();
  }
}



// [POST] 編號 38 : notify(訂單狀態更改，將付款狀態改為1，並新增payment)
async function post_newebpay_notify(req, res, next) {
    try {
    const { TradeInfo, TradeSha } = req.body;

    // 解密資料
    const data = createSesDecrypt(TradeInfo);
    const result = data?.Result;
    console.log('解密後內容:', result);

    if (!result?.MerchantOrderNo) {
      console.log('缺少 MerchantOrderNo');
      return res.status(400).end();
    }

    // 驗證 TradeSha 一致性
    const calculatedSha = createShaEncrypt(TradeInfo);
    if (calculatedSha !== TradeSha) {
      console.log('付款失敗：TradeSha 不一致');
      return res.status(400).end();
    }

    const order_id = result.MerchantOrderNo;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 查詢訂單基本資料
      const orderResult = await client.query(`
        SELECT user_id, address, phone, discount_price
        FROM public."orders"
        WHERE order_id = $1
      `, [order_id]);

      if (orderResult.rowCount === 0) {
        console.log('找不到訂單:', order_id);
        await client.query('ROLLBACK');
        return res.status(404).end();
      }

      const order = orderResult.rows[0];

      // 新增一筆 payment 資料
      await client.query(`
        INSERT INTO public."payment" (
          user_id, order_id, address, phone,
          payment_method, payment_status,
          discount_price, return_data, return_time,
          result_info, result_time,
          created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
      `, [
        order.user_id,
        order_id,
        order.address,
        order.phone,
        result.PaymentType,
        1, // 已付款
        order.discount_price,
        JSON.stringify(data),
        new Date(result.TradeTime),
        result.Message || '',
        new Date(result.PayTime || result.TradeTime)
      ]);

      // 更新 orders.payment_status = 1
      await client.query(`
        UPDATE public."orders"
        SET payment_status = 1
        WHERE order_id = $1
      `, [order_id]);

      // 更新 order_item.payment = 1
      await client.query(`
        UPDATE public."order_item"
        SET payment = 1
        WHERE order_id = $1
      `, [order_id]);

      await client.query('COMMIT');
      console.log('Notify 處理完成：', order_id);
      res.status(200).send('OK');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('資料庫錯誤:', err);
      res.status(500).send('DB Error');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Notify 解密錯誤:', err);
    res.status(400).send('Bad Request');
  }
}


// [GET] 編號 39 : return
async function get_newebpay_return(req, res, next) {
    
}

module.exports = {
  post_newebpay_payment,
  post_newebpay_notify,
  get_newebpay_return

};