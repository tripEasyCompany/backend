const jwt = require('jsonwebtoken');
const resStatus = require('../utils/resStatus');

const FailedMessageMap = {
  expired: 'Token 已過期',
  invalid: '無效的 token',
  missing: '請先登入',
};

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // 沒帶 token 或格式錯誤
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return resStatus({
      res,
      status: 401,
      message: FailedMessageMap.missing,
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
<<<<<<< HEAD
=======

>>>>>>> origin/main
    next();
  } catch (err) {
    // 分辨過期與其他無效
    const isExpired = err.name === 'TokenExpiredError';
    return resStatus({
      res,
      status: 401,
      message: isExpired ? FailedMessageMap.expired : FailedMessageMap.invalid,
    });
  }
}

module.exports = verifyToken;
