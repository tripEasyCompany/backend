const Joi = require('joi');

const supportedLanguages = ['zh-TW', 'en-US'];
const supportedType = ['tourgroup', 'backpacker'];
const itemOptions = {
  tourgroup: ['travel'],
  backpacker: ['hotel', 'food', 'spot'],
};
const supportedTags = [
  '探索冒險',
  '放鬆療癒',
  '文化體驗',
  '美食探索',
  '都市感官',
  '自然療癒',
  '親子家庭',
  '拍照打卡',
  '懶人輕鬆',
  '特殊主題',
];

const queryschema = Joi.object({
  type: Joi.string()
    .valid(...supportedType)
    .required()
    .messages({
      'any.required': '請輸入「type」',
      'any.only': `「type」僅能為 ${supportedType.join('、')}`,
      'string.base': '「type」必須是字串',
    }),
  item: Joi.string().required().messages({
    'any.required': '請輸入「item」',
    'string.base': '「item」必須是字串',
  }),
  tag: Joi.string()
    .valid(...supportedTags)
    .optional()
    .messages({
      'string.base': '「tag」必須是字串',
      'any.only': `「tag」僅能為 ${supportedTags.join('、')}`,
    }),
  country: Joi.string().optional().messages({
    'string.base': '「country」必須是字串',
  }),
  region: Joi.string().optional().messages({
    'string.base': '「region」必須是字串',
  }),
  min_price: Joi.number().optional().messages({
    'number.base': '「min_price」必須是數字',
  }),
  max_price: Joi.number().optional().messages({
    'number.base': '「max_price」必須是數字',
  }),
  start_date: Joi.date().iso().optional().messages({
    'date.base': '「start_date」必須是日期格式',
    'date.format': '「start_date」格式錯誤，請用 yyyy-mm-dd',
  }),
  end_date: Joi.date().iso().optional().messages({
    'date.base': '「end_date」必須是日期格式',
    'date.format': '「end_date」格式錯誤，請用 yyyy-mm-dd',
  }),
  keyword: Joi.string().optional().messages({
    'string.base': '「keyword」必須是字串',
  }),
  duration: Joi.number().integer().optional().messages({
    'number.base': '「duration」必須是數字',
    'number.integer': '「duration」必須是整數',
  }),
  page: Joi.number().integer().min(1).default(1).required().messages({
    'any.required': '請輸入「page」',
    'number.base': '「page」必須是數字',
    'number.min': '「page」必須大於等於 1',
    'number.integer': '「page」必須是整數',
  }),
  limit: Joi.number().integer().min(1).default(10).required().messages({
    'any.required': '請輸入「limit」',
    'number.base': '「limit」必須是數字',
    'number.min': '「limit」必須大於等於 1',
    'number.integer': '「limit」必須是整數',
  }),
  sort_by: Joi.string().valid('price', 'date').default('date').required().messages({
    'any.required': '請輸入「sort_by」',
    'string.base': '「sort_by」必須是字串',
    'any.only': '「sort_by」僅能為 price 或 date',
  }),
  order: Joi.string().valid('asc', 'desc').default('asc').required().messages({
    'any.required': '請輸入「order」',
    'string.base': '「order」必須是字串',
    'any.only': '「order」僅能為 asc 或 desc',
  }),
  lang: Joi.string()
    .valid(...supportedLanguages)
    .default('zh-TW')
    .required()
    .messages({
      'any.required': '請輸入「lang」',
      'string.base': '「lang」必須是字串',
      'any.only': `「lang」僅能為 ${supportedLanguages.join('、')}`,
    }),
}).custom((value, helpers) => {
  const { type, item, start_date, end_date, min_price, max_price, duration } = value;
  // type/item 關聯
  if (type && item) {
    const validItems = itemOptions[type];
    if (!validItems || !validItems.includes(item)) {
      return helpers.message(
        `當「type」為「${type}」時，「item」僅能為：${validItems ? validItems.join('、') : '（無可選項）'}`
      );
    }
  }
  // 日期區間
  if (start_date && end_date) {
    if (new Date(start_date) > new Date(end_date)) {
      return helpers.message('「start_date」不可大於「end_date」');
    }
  }
  // 價格區間
  if (typeof min_price === 'number' && typeof max_price === 'number' && min_price > max_price) {
    return helpers.message('「min_price」不可大於「max_price」');
  }
  // duration 應等於日期差
  if (start_date && end_date && typeof duration === 'number') {
    const start = new Date(start_date);
    const end = new Date(end_date);
    const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const days = Math.floor((endUTC - startUTC) / (1000 * 60 * 60 * 24));
    if (duration !== days) {
      return helpers.message(
        `「duration」必須等於「end_date」減「start_date」的天數差（目前應為 ${days}）`
      );
    }
  }
  return value;
});

// baseSchema、tourIDSchema、detailsSchema、reviewSchema、hiddenPlaySchema 都照這個格式調整即可
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
      'any.only': `「lang」僅支援：${supportedLanguages.join('、')}`,
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

const detailsSchema = baseSchema.fork(['lang'], (field) => field.required());
const reviewSchema = baseSchema.fork(['page', 'limit', 'lang'], (field) => field.required());
const hiddenPlaySchema = baseSchema.fork(['page', 'limit', 'lang'], (field) => field.required());

module.exports = {
  tourIDSchema,
  queryschema,
  detailsSchema,
  reviewSchema,
  hiddenPlaySchema,
};
