const Joi = require('joi');

const userInfoSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email不符合規則，需符合 Email 格式。',
      'any.required': '「Email」為必填欄位',
    }),
});

module.exports = userInfoSchema;
