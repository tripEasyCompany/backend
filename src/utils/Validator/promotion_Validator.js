const Joi = require('joi');
const supportedLanguages = ['zh-TW', 'en-US'];

const baseSchema = Joi.object({
  tour_ids: Joi.alternatives()
    .try(
      Joi.string().uuid({ version: 'uuidv4' }),
      Joi.array()
        .items(Joi.string().uuid({ version: 'uuidv4' }))
        .min(1)
    )
    .messages({
      'alternatives.match': '「tour_ids」必須是單一 UUID 或 UUID 陣列',
      'any.required': '「tour_ids」為必填欄位',
    }),

  discount_rate: Joi.number().greater(0).less(1).messages({
    'number.base': '「discount_rate」必須是數字',
    'number.greater': '「discount_rate」必須大於 0',
    'number.less': '「discount_rate」必須小於 1',
    'any.required': '「discount_rate」為必填欄位',
  }),

  start_date: Joi.date().iso().messages({
    'date.base': '「start_date」必須是合法日期',
    'any.required': '「start_date」為必填欄位',
  }),

  end_date: Joi.date().iso().min(Joi.ref('start_date')).messages({
    'date.base': '「end_date」必須是合法日期',
    'date.min': '「end_date」不能早於 start_date',
    'any.required': '「end_date」為必填欄位',
  }),
});

const queryPromotionSchema = Joi.object({
  country: Joi.string().optional().messages({
    'string.base': '「國家」必須是文字',
  }),

  region: Joi.string().optional().messages({
    'string.base': '「地區」必須是文字',
  }),

  create_date: Joi.date().iso().optional().messages({
    'date.base': '「建立日期」必須是合法日期',
    'date.format': '「建立日期」格式應為 YYYY-MM-DD',
  }),

  keyword: Joi.string().allow('').optional().messages({
    'string.base': '「關鍵字」必須是文字',
  }),

  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': '「page」必須是數字',
    'number.min': '「page」最小值為 1',
  }),

  limit: Joi.number().integer().min(1).default(10).messages({
    'number.base': '「limit」必須是數字',
    'number.min': '「limit」最小值為 1',
  }),

  lang: Joi.string()
    .valid(...supportedLanguages)
    .default('zh-TW')
    .messages({
      'any.only': '「lang」僅支援 zh-TW、en-US',
      'string.base': '「lang」必須是文字',
    }),
});

const createPromotionSchema = baseSchema.fork(
  ['tour_ids', 'discount_rate', 'start_date', 'end_date'],
  (field) => field.required()
);

const deletePromotionSchema = baseSchema.fork(['tour_ids'], (field) => field.required());

module.exports = {
  queryPromotionSchema,
  createPromotionSchema,
  deletePromotionSchema,
};
