const Joi = require('joi');

// ✅ 可集中管理所有支援語言
const supportedLanguages = ['zh-TW', 'en-US'];
const supportedType = ['tourgroup','backpacker'];
const itemOptions = {
  tourgroup: ['popular', 'promotion', 'most_favorited'],
  backpacker: ['hotel', 'food', 'spot'],
};

const baseSchema = Joi.object({
  type: Joi.string()
    .valid(...supportedType)
    .default('tourgroup')
    .messages({
      'any.only': `「type」僅支援：${supportedType.join(', ')}`,
      'string.base': '「type」必須是文字',
      'any.required': '「type」為必填欄位',
    }),

  item: Joi.alternatives()
    .conditional('type', {
      is: 'tourgroup',
      then: Joi.string().valid(...itemOptions.tourgroup).default('popular'),
    })
    .conditional('type', {
      is: 'backpacker',
      then: Joi.string().valid(...itemOptions.backpacker).default('hotel'),
    })
    .messages({
      'any.only': '「item」值不符合對應的 type 選項',
      'string.base': '「item」必須是文字',
      'any.required': '「item」為必填欄位',
    }),

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

const homeSchema = baseSchema.fork(['type','item','page', 'limit', 'lang'], (field) => field.required());
const reviewSchema = baseSchema.fork(['page', 'limit', 'lang'], (field) => field.required());

module.exports = {
  homeSchema,
  reviewSchema
};
