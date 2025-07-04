const Joi = require('joi');

// ✅ 可集中管理所有支援語言
const supportedLanguages = ['zh-TW', 'en-US'];

const hotelSchema = Joi.object({
  start_date: Joi.date().iso().required().messages({
    'any.required': '請填寫「入住時間」',
    'date.base': '「入住時間」必須是合法日期',
  }),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required().messages({
    'any.required': '請填寫「退房時間」',
    'date.base': '「退房時間」必須是合法日期',
    'date.min': '退房時間不能早於入住時間',
  }),
  room_type: Joi.string().required().messages({
    'any.required': '請選擇「房型」',
    'string.base': '「房型」必須是文字',
  }),
});

const foodSchema = Joi.object({
  start_date: Joi.date().iso().required().messages({
    'any.required': '請填寫「預約時間」',
    'date.base': '「預約時間」必須是合法日期',
  }),
});

const travelSchema = Joi.object({
  start_date: Joi.date().iso().required().messages({
    'any.required': '請填寫「旅程開始時間」',
    'date.base': '「旅程開始時間」必須是合法日期',
  }),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required().messages({
    'any.required': '請填寫「旅程結束時間」',
    'date.base': '「旅程結束時間」必須是合法日期',
    'date.min': '旅程結束時間不能早於開始時間',
  }),
});

const baseSchema = Joi.object({
  type: Joi.string().valid('backpacker', 'tourgroup').required(),
  item: Joi.string().valid('hotel', 'food', 'spot', 'travel').required(),
  people: Joi.number().integer().min(1).required().messages({
    'any.required': '請填寫「人數」',
    'number.base': '「人數」必須是數字',
    'number.min': '「人數」至少為 1 人',
  }),
  options: Joi.when('item', {
    switch: [
      { is: 'hotel', then: hotelSchema },
      { is: 'food', then: foodSchema },
      { is: 'spot', then: travelSchema },
      { is: 'travel', then: travelSchema },
    ],
    otherwise: Joi.forbidden().messages({ 'any.unknown': '未知的 options 組合' }),
  })
    .not(null)
    .required()
    .messages({
      'any.invalid': '「options」不可為 null',
      'any.required': '請提供 options 設定',
    }),
})
  .custom((value, helpers) => {
    const { type, item } = value;

    const allowedCombos = {
      backpacker: ['hotel', 'food', 'spot'],
      tourgroup: ['travel'],
    };

    if (!allowedCombos[type]?.includes(item)) {
      return helpers.error('any.invalidCombo');
    }

    return value;
  }, 'Type-Item Combo Validation')
  .messages({
    'any.invalidCombo': '「type」與「item」的組合不合法',
  });

const paramsSchema = Joi.object({
  tour_id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.base': '「tour_id」必須是文字',
    'string.guid': '「tour_id」必須是有效的 UUID 格式',
    'any.required': '「tour_id」為必填欄位',
  }),
});

const cartIDSchema = Joi.object({
  cart_item_id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.base': '「cart_item_id」必須是文字',
    'string.guid': '「cart_item_id」必須是有效的 UUID 格式',
    'any.required': '「cart_item_id」為必填欄位',
  }),
});

const commonSchema = Joi.object({
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

module.exports = {
  baseSchema,
  paramsSchema,
  cartIDSchema,
  commonSchema,
};
