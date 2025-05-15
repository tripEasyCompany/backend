const Joi = require('joi');

// 建立 Joi schema
const paramSchema = Joi.object({
  country_id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.guid': '「國家編號」必須是有效的 UUID 格式',
    'any.required': '「國家編號」為必填欄位',
  }),
});

module.exports = {
  paramSchema,
};
