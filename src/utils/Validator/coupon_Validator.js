const Joi = require('joi');

const baseSchema = Joi.object({
  coupon_ids: Joi.alternatives()
    .try(
      Joi.string().uuid({ version: 'uuidv4' }),
      Joi.array()
        .items(Joi.string().uuid({ version: 'uuidv4' }))
        .min(1)
    )
    .messages({
      'alternatives.match': '「coupon_ids」必須是單一 UUID 或 UUID 陣列',
      'any.required': '「coupon_ids」為必填欄位',
    }),

  user_ids: Joi.alternatives()
    .try(
      Joi.string().uuid({ version: 'uuidv4' }),
      Joi.array()
        .items(Joi.string().uuid({ version: 'uuidv4' }))
        .min(1)
    )
    .messages({
      'alternatives.match': '「user_ids」必須是單一 UUID 或 UUID 陣列',
      'any.required': '「user_ids」為必填欄位',
    }),

  user_id: Joi.string().uuid({ version: 'uuidv4' }).messages({
    'string.base': '「user_id」必須是文字格式',
    'string.guid': '「user_id」必須是有效的 UUIDv4 格式',
    'any.required': '「user_id」為必填欄位',
  }),

  coupon: Joi.string().messages({
    'string.base': '「優惠卷代碼」必須是文字',
    'string.empty': '「優惠卷代碼」不可為空',
    'any.required': '「優惠卷代碼」為必填欄位',
  }),

  end_date: Joi.date().iso().messages({
    'date.base': '「優惠卷結束日期」必須是合法日期',
    'any.required': '「優惠卷結束日期」為必填欄位',
  }),

  discount_amount: Joi.number().greater(0).messages({
    'number.base': '「優惠折扣數」必須是數字',
    'number.greater': '「優惠折扣數」必須大於 0',
    'any.required': '「優惠折扣數」為必填欄位',
  }),

  description: Joi.string().messages({
    'string.base': '「優惠卷描述」必須是文字',
    'string.empty': '「優惠卷描述」不可為空',
    'any.required': '「優惠卷描述」為必填欄位',
  }),

  coupon_id: Joi.string().uuid({ version: 'uuidv4' }).messages({
    'string.base': '「coupon_id」必須是文字',
    'string.guid': '「coupon_id」必須是有效的 UUID 格式',
    'any.required': '「coupon_id」為必填欄位',
  }),
});

const createCouponSchema = baseSchema.fork(
  ['coupon', 'end_date', 'discount_amount', 'description'],
  (field) => field.required()
);
const queryCouponSchema = Joi.object({
  coupon: baseSchema.extract('coupon'),
});
const getCouponDetailSchema = baseSchema.fork(['coupon_id'], (field) => field.required());
const updateCouponSchema = baseSchema
  .fork(['coupon', 'end_date', 'discount_amount', 'description'], (field) => field.optional())
  .or('coupon', 'end_date', 'discount_amount', 'description')
  .messages({
    'object.missing': '請至少填寫一個欄位進行更新',
  });
const updateCouponExpirySchema = baseSchema.fork(['coupon_ids', 'end_date'], (field) =>
  field.required()
);
const deleteCouponSchema = baseSchema.fork(['coupon_ids'], (field) => field.required());
const postCouponAssignSchema = baseSchema.fork(['coupon', 'user_ids'], (field) => field.required());
const getuserCouponSchema = baseSchema.fork(['user_id'], (field) => field.required());
const deleteuserCouponSchema = baseSchema.fork(['coupon_id'], (field) => field.required());

module.exports = {
  createCouponSchema,
  queryCouponSchema,
  getCouponDetailSchema,
  updateCouponSchema,
  updateCouponExpirySchema,
  deleteCouponSchema,
  postCouponAssignSchema,
  getuserCouponSchema,
  deleteuserCouponSchema,
};
