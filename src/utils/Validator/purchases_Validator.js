const Joi = require('joi');

// ✅ 可集中管理所有支援語言
const supportedLanguages = ['zh-TW', 'en-US'];

// 建立 Joi schema
const paramSchema = Joi.object({
  order_item_id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.guid': '「訂單編號」必須是有效的 UUID 格式',
    'string.base': '「訂單編號」必須是文字',
    'string.empty': '「訂單編號」不可為空',
    'any.required': '「訂單編號」為必填欄位',
  }),
});

const querySchema = Joi.object({
  lang: Joi.string()
    .valid(...supportedLanguages)
    .default('zh-TW')
    .messages({
      'any.only': `「lang」僅支援：${supportedLanguages.join(', ')}`,
      'string.base': '「lang」必須是文字',
      'any.required': '「lang」為必填欄位',
    }),
});

module.exports = {
  paramSchema,
  querySchema,
};
