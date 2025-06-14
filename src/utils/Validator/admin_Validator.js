const Joi = require('joi');

const supportedLanguages = ['zh-TW', 'en-US'];
const supportedRoles = ['admin', 'user'];
const supportedStatuses = ['','1', '2'];

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
// 字串驗證
const stringField = Joi.string().allow(null, '').messages({
  'string.base': '欄位必須為字串',
});

// 語言驗證
const langSchema = Joi.string()
  .valid(...supportedLanguages)
  .required()
  .messages({
    'any.required': '語系為必填欄位',
    'any.only': '語系僅支援 zh-TW 或 en-US',
    'string.empty': '語系不得為空',
  });

// 分頁驗證
const limitSchema = Joi.number().integer().min(1).required().messages({
  'number.base': 'limit 必須為數字',
  'number.min': 'limit 必須為正整數',
  'any.required': 'limit 為必填欄位',
});
const pageSchema = Joi.number().integer().min(1).required().messages({
  'number.base': 'page 必須為數字',
  'number.min': 'page 必須為正整數',
  'any.required': 'page 為必填欄位',
});

// 42
const userinfoSchema = Joi.object({
    lang: langSchema,
    page: pageSchema,
    limit: limitSchema,
});

// 43
const userDetailinfoSchema = Joi.object({
  lang: langSchema,
  user_id: UUIDField,
});

// 44
const userPurviewSchema = Joi.object({
  user_ids: Joi.array().items(UUIDField).min(1).required().messages({
    'array.base': 'user_ids 必須為 UUID 陣列',
    'array.min': 'user_ids 至少需包含一個 UUID',
    'any.required': 'user_ids 為必填欄位',
  }),
  role: Joi.string()
    .valid(...supportedRoles)
    .required()
    .messages({
      'any.required': 'role 為必填欄位',
      'any.only': 'role 僅支援 admin 或 user',
      'string.empty': 'role 不可為空',
    }),
});

// 45
const userSearchSchema = Joi.object({
  user_id: UUIDField,
});

const postChangeinfo = Joi.object({
  tour_id: nonEmptyString, //UUIDField
  message: nonEmptyString,
});

const getChangeinfo = Joi.object({
  status: Joi.string().valid(...supportedStatuses) .optional().messages({
    'any.only': 'status 為 1 或 2',
  }),
  page: pageSchema,
  limit: limitSchema,
  lang: langSchema,
});

const patchChangeinfo = Joi.object({
  tour_id:  Joi.array().items(UUIDField).min(1).required().messages({
    'array.base': 'user_ids 必須為 UUID 陣列',
    'array.min': 'user_ids 至少需包含一個 UUID',
    'any.required': 'user_ids 為必填欄位',
  }),
  message: nonEmptyString,
});

const deleteChangeinfo = Joi.object({
  tour_id: nonEmptyString //UUIDField
});

module.exports = {
    userinfoSchema,
    userDetailinfoSchema,
    userPurviewSchema,
    userSearchSchema,
    postChangeinfo,
    getChangeinfo,
    patchChangeinfo,
    deleteChangeinfo
};
