const Joi = require('joi');

const early_schema = Joi.object({
  notifi_settings_enabled: Joi.boolean().required().messages({
    'any.required': '「notifi_settings_enabled」 為必填欄位',
    'boolean.base': '「notifi_settings_enabled」 必須是布林值 true 或 false',
  }),
});

const price_schema = Joi.object({
  price_tracking_enabled: Joi.boolean().required().messages({
    'boolean.base': '「price_tracking_enabled」必須是布林值',
    'any.required': '「price_tracking_enabled」為必填欄位',
  }),

  country: Joi.string().when('price_tracking_enabled', {
    is: true,
    then: Joi.required().messages({
      'any.required': '「country」為必填欄位，當 price_tracking_enabled 為 true 時',
      'string.base': '「country」必須是文字',
    }),
    otherwise: Joi.optional(),
  }),

  region: Joi.string().when('price_tracking_enabled', {
    is: true,
    then: Joi.required().messages({
      'any.required': '「region」為必填欄位，當 price_tracking_enabled 為 true 時',
      'string.base': '「region」必須是文字',
    }),
    otherwise: Joi.optional(),
  }),

  max_price: Joi.number()
    .integer()
    .min(0)
    .when('price_tracking_enabled', {
      is: true,
      then: Joi.required().messages({
        'any.required': '「max_price」為必填欄位，當 price_tracking_enabled 為 true 時',
        'number.base': '「max_price」必須是數字',
        'number.min': '「max_price」不可小於 0',
        'number.integer': '「max_price」必須是整數',
      }),
      otherwise: Joi.optional(),
    }),
});

module.exports = {
  early_schema,
  price_schema,
};
