const Joi = require('joi');

const cartIDSchema = Joi.object({
  cart_id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.base': '「cart_id」必須是文字',
    'string.guid': '「cart_id」必須是有效的 UUID 格式',
    'any.required': '「cart_id」為必填欄位',
  }),
});

const orderIDSchema = Joi.object({
  order_id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.base': '「order_id」必須是文字',
    'string.guid': '「order_id」必須是有效的 UUID 格式',
    'any.required': '「order_id」為必填欄位',
  }),
});

const postSchema = Joi.object({
  user: Joi.object({
    name: Joi.string()
      .pattern(/^[\u4e00-\u9fa5a-zA-Z0-9]{2,10}$/) // 中文、英數、2~10 字元，不含空白與特殊字元
      .required()
      .messages({
        'string.pattern.base': '使用者名稱需為 2~10 字元，且不得包含空白或特殊字元',
        'string.empty': '使用者名稱為必填欄位',
      }),

    email: Joi.string().email().required().messages({
      'string.email': 'Email 格式錯誤',
      'any.required': 'Email 為必填欄位',
    }),

    address: Joi.string().required().messages({
      'string.base': '地址需為文字',
      'any.required': '地址為必填欄位',
    }),

    phone_number: Joi.string()
      .pattern(/^[0-9]{8,12}$/)
      .required()
      .messages({
        'string.pattern.base': '電話僅允許 8~12 碼的數字',
        'any.required': '電話為必填欄位',
      }),
  }).required(),

  payment_method: Joi.string().valid('credit_card', 'atm', 'cvs').required().messages({
    'any.only': '付款方式僅支援 credit_card、atm、cvs',
    'any.required': '付款方式為必填欄位',
  }),

  installment: Joi.alternatives().conditional('payment_method', {
    is: 'credit_card',
    then: Joi.number().valid(3, 6, 12).messages({
      'number.base': '分期付款必須是數字',
      'any.only': '分期付款僅支援 3、6、12 期',
    }),
    otherwise: Joi.forbidden().messages({
      'any.unknown': '只有在使用信用卡付款時才能選擇分期',
    }),
  }),

  discount: Joi.object({
    type: Joi.string().valid('coupon', 'point').optional().messages({
      'any.only': '優惠方式只能是 coupon 或 point',
    }),

    coupon_id: Joi.alternatives().conditional('type', {
      is: 'coupon',
      then: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
        'any.required': '優惠券代碼為必填',
        'string.guid': '優惠券代碼格式需為 UUIDv4',
      }),
      otherwise: Joi.string().allow('', null).optional(),
    }),

    used_point: Joi.number().min(0).optional().messages({
      'number.base': '旅遊積分必須是數字',
      'number.min': '旅遊積分不得小於 0',
    }),
  }).optional(),

  agree_terms: Joi.boolean().optional().messages({
    'boolean.base': '是否願意接受通知格式錯誤',
  }),
});

module.exports = {
  cartIDSchema,
  orderIDSchema,
  postSchema,
};
