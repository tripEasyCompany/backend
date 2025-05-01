// validators/userInfoValidator.js
const Joi = require('joi');

// 只允許中英數、不得含特殊符號與空白（2~5字）
const namePattern = /^[a-zA-Z0-9\u4e00-\u9fa5]{2,5}$/;

// 密碼需含大小寫字母與數字，禁止特殊符號與空白（8~32字）
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,32}$/;

const userInfoSchema = Joi.object({
  name: Joi.string()
    .pattern(namePattern)
    .required()
    .messages({
      'string.pattern.base': '使用者名稱不符合規則，最少 2 個字元，最長 5 字元，不得包含特殊字元與空白。',
      'any.required': '「使用者」為必填欄位',
    }),

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

  preference: Joi.array()
    .items(Joi.string())
    .length(3)
    .required()
    .messages({
      'array.base': '個人偏好需為陣列資料格式。',
      'array.length': '個人偏好需選擇 3 項內容。',
      'any.required': '「個人偏好」為必填欄位',
    }),
});

module.exports = userInfoSchema;
