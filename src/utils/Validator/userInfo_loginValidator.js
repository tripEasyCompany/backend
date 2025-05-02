const Joi = require('joi');

// 密碼需含大小寫字母與數字，禁止特殊符號與空白（8~32字）
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,32}$/;

const userInfoSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email不符合規則，需符合 Email 格式。',
      'any.required': '「Email」為必填欄位',
    }),

  password: Joi.string()
    .pattern(passwordPattern)
    .required()
    .messages({
      'string.pattern.base': '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字',
      'any.required': '「密碼」為必填欄位',
    }),
});

module.exports = userInfoSchema;
