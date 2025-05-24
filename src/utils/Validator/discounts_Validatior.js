const Joi = require('joi');

const baseschema = Joi.object({
  type: Joi.string().valid('coupon', 'point').required().messages({
    'any.required': 'type 為必填欄位',
    'any.only': 'type 只能是 coupon 或 point',
  }),
  discount: Joi.object({
    coupon: Joi.string()
      .pattern(/^[A-Z0-9]{6}$/)
      .messages({
        'string.pattern.base': 'coupon 必須是 6 碼大寫英數組合',
      }),
    point: Joi.number().integer().min(0).messages({
      'number.base': 'point 必須是數字',
      'number.integer': 'point 必須是整數',
      'number.min': 'point 最小值為 0',
    }),
  })
    .xor('coupon', 'point')
    .required()
    .messages({
      'object.xor': 'coupon 與 point 只能擇一填寫',
      'any.required': 'discount 為必填欄位',
    }),
});

const orderIDSchema = Joi.object({
  order_id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.base': '「order_id」必須是文字',
    'string.guid': '「order_id」必須是有效的 UUID 格式',
    'any.required': '「order_id」為必填欄位',
  }),
});

module.exports = {
  baseschema,
  orderIDSchema,
};
