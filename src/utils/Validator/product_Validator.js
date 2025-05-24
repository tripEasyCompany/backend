const Joi = require('joi');

// ✅ 可集中管理所有支援語言
const supportedLanguages = ['zh-TW', 'en-US'];
const supportedType = ['tourgroup', 'backpacker'];
const itemOptions = {
  tourgroup: ['travel'],
  backpacker: ['hotel', 'food', 'spot'],
};

const baseSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': '「page」必須是數字',
    'number.integer': '「page」必須是整數',
    'number.min': '「page」至少是 1',
    'any.required': '「page」為必填欄位',
  }),

  limit: Joi.number().integer().min(1).default(4).messages({
    'number.base': '「limit」必須是數字',
    'number.integer': '「limit」必須是整數',
    'number.min': '「limit」至少是 1',
    'any.required': '「limit」為必填欄位',
  }),

  lang: Joi.string()
    .valid(...supportedLanguages)
    .default('zh-TW')
    .messages({
      'any.only': `「lang」僅支援：${supportedLanguages.join(', ')}`,
      'string.base': '「lang」必須是文字',
      'any.required': '「lang」為必填欄位',
    }),
});

const tourIDSchema = Joi.object({
  tour_id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.base': '「tour_id」必須是文字',
    'string.guid': '「tour_id」必須是有效的 UUID 格式',
    'any.required': '「tour_id」為必填欄位',
  }),
});

const reviewSchema = baseSchema.fork(['page', 'limit', 'lang'], (field) => field.required());
const hiddenPlaySchema = baseSchema.fork(['page', 'limit', 'lang'], (field) => field.required());

module.exports = {
  tourIDSchema,
  reviewSchema,
  hiddenPlaySchema,
};
