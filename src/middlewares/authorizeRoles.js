const resStatus = require('../utils/resStatus');

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!allowedRoles.includes(userRole)) {
      return resStatus({
        res,
        status: 403,
        message: '您沒有權限進行此操作',
      });
    }
    next();
  };
}

module.exports = authorizeRoles;
