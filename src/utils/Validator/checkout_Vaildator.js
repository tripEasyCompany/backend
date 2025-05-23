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

module.exports = {
  cartIDSchema,
  orderIDSchema,
};
