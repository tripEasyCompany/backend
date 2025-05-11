const Joi = require('joi');

const UUIDPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const baseSchema = Joi.object({
    id : Joi.string().pattern(UUIDPattern).messages({
        'string.empty': '使用者ID為必填欄位',
        'string.pattern.base': '使用者ID格式不正確',
        'any.required': '使用者ID為必填欄位',
    }),
    lang: Joi.string().valid('zh-TW', 'en-US').messages({
        'string.empty': '語系為必填欄位',
        'any.only': '語系不符合規則',
        'any.required': '語系為必填欄位',
    }),
    page: Joi.string().pattern(/^[0-9]+$/).messages({
        'string.empty': '頁碼為必填欄位',
        'string.pattern.base': '頁碼格式不正確',
        'any.required': '頁碼為必填欄位',
    }),
});

const getSchema = baseSchema.fork(['lang','page'], (field) => field.required());

module.exports = {
    getSchema,
};