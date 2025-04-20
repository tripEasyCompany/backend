// app.js - 主應用檔案
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// 導入路由
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

// 設置視圖引擎 (如果需要渲染視圖)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // 使用EJS作為模板引擎，可以根據需要更改

// 中間件設置
app.use(logger('dev')); // HTTP請求日誌
app.use(bodyParser.json()); // 解析JSON請求體
app.use(bodyParser.urlencoded({ extended: false })); // 解析URL編碼請求體
app.use(cookieParser()); // 解析Cookie
app.use(express.static(path.join(__dirname, 'public'))); // 提供靜態檔案

// 設置CORS（跨域資源共享）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    return res.status(200).json({});
  }
  next();
});

// 路由設置
app.use('/', indexRouter);
app.use('/users', usersRouter);

// 404錯誤處理 - 未找到路由時觸發
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  // 設置本地變數，僅在開發環境提供錯誤詳情
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 返回錯誤響應
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
      status: err.status || 500
    }
  });
});

// 設置伺服器埠口
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`伺服器運行在 http://localhost:${port}`);
});

module.exports = app;