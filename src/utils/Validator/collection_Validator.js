const Joi = require('joi');

const supportedLanguages = ['zh-TW', 'en-US'];

// UUID 驗證
const UUIDField = Joi.string()
  .guid({ version: ['uuidv4', 'uuidv5'] })
  .required()
  .messages({
    'string.guid': 'ID 格式不正確，需為 UUID 格式',
    'any.required': 'ID 為必填欄位',
    'string.empty': 'ID 不可為空',
  });

// 不為空值的字串
const nonEmptyString = Joi.string().min(1).required().messages({
  'string.base': '欄位必須為字串',
  'string.empty': '欄位不得為空',
  'any.required': '欄位為必填欄位',
});

<<<<<<< HEAD
// 語言驗證
const langSchema = Joi.string()
  .valid(...supportedLanguages)
  .required()
  .messages({
    'any.required': '語系為必填欄位',
    'any.only': '語系僅支援 zh 或 en',
    'string.empty': '語系不得為空',
  });

// 分頁參數驗證
const getSchema = Joi.object({
  lang: langSchema,
=======
// 分頁參數驗證
const getSchema = Joi.object({
  lang: Joi.string()
    .valid(...supportedLanguages)
    .required()
    .messages({
      'any.required': '語系為必填欄位',
      'any.only': '語系僅支援 zh 或 en',
      'string.empty': '語系不得為空',
    }),
>>>>>>> origin/main
  page: Joi.number().integer().min(1).required().messages({
    'number.base': 'page 必須為數字',
    'number.min': 'page 必須為正整數',
    'any.required': 'page 為必填欄位',
  }),
  limit: Joi.number().integer().min(1).required().messages({
    'number.base': 'limit 必須為數字',
    'number.min': 'limit 必須為正整數',
    'any.required': 'limit 為必填欄位',
  }),
});

// POST 請求驗證
const postSchema = Joi.object({
  tour_id: nonEmptyString,
});

// DELETE 或其他需要 ID 的情境
const deleteSchema = Joi.object({
  favorite_id: UUIDField,
});

module.exports = {
  getSchema,
  postSchema,
  deleteSchema,
};
