const Joi = require('joi');

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

const createPromotionSchema = baseSchema.fork(
  ['tour_ids', 'discount_rate', 'start_date', 'end_date'],
  (field) => field.required()
);

module.exports = {
  createPromotionSchema,
};
