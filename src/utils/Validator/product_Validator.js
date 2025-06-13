const Joi = require('joi');

const supportedLanguages = ['zh-TW', 'en-US'];
const supportedType = ['tourgroup', 'backpacker'];
const itemOptions = {
  tourgroup: ['travel'],
  backpacker: ['hotel', 'food', 'spot'],
};
const supportedTags = [
  '探索冒險',
  '放鬆療癒',
  '文化體驗',
  '美食探索',
  '都市感官',
  '自然療癒',
  '親子家庭',
  '拍照打卡',
  '懶人輕鬆',
  '特殊主題',
];

const queryschema = Joi.object({
  type: Joi.string()
    .valid(...supportedType)
    .optional()
    .messages({
      'any.only': `「type」僅能為 ${supportedType.join('、')}`,
      'string.base': '「type」必須是字串',
    }),
  item: Joi.string().optional().messages({
    'string.base': '「item」必須是字串',
  }),
  tag: Joi.string()
    .valid(...supportedTags)
    .optional()
    .messages({
      'string.base': '「tag」必須是字串',
      'any.only': `「tag」僅能為 ${supportedTags.join('、')}`,
    }),
  country: Joi.string().optional().messages({
    'string.base': '「country」必須是字串',
  }),
  region: Joi.string().optional().messages({
    'string.base': '「region」必須是字串',
  }),
  min_price: Joi.number().optional().messages({
    'number.base': '「min_price」必須是數字',
  }),
  max_price: Joi.number().optional().messages({
    'number.base': '「max_price」必須是數字',
  }),
  start_date: Joi.date().iso().optional().messages({
    'date.base': '「start_date」必須是日期格式',
    'date.format': '「start_date」格式錯誤，請用 yyyy-mm-dd',
  }),
  end_date: Joi.date().iso().optional().messages({
    'date.base': '「end_date」必須是日期格式',
    'date.format': '「end_date」格式錯誤，請用 yyyy-mm-dd',
  }),
  keyword: Joi.string().optional().messages({
    'string.base': '「keyword」必須是字串',
  }),
  duration: Joi.number().integer().optional().messages({
    'number.base': '「duration」必須是數字',
    'number.integer': '「duration」必須是整數',
  }),
  page: Joi.number().integer().min(1).default(1).required().messages({
    'any.required': '請輸入「page」',
    'number.base': '「page」必須是數字',
    'number.min': '「page」必須大於等於 1',
    'number.integer': '「page」必須是整數',
  }),
  limit: Joi.number().integer().min(1).default(10).required().messages({
    'any.required': '請輸入「limit」',
    'number.base': '「limit」必須是數字',
    'number.min': '「limit」必須大於等於 1',
    'number.integer': '「limit」必須是整數',
  }),
  sort_by: Joi.string().valid('price', 'date').default('date').required().messages({
    'any.required': '請輸入「sort_by」',
    'string.base': '「sort_by」必須是字串',
    'any.only': '「sort_by」僅能為 price 或 date',
  }),
  order: Joi.string().valid('asc', 'desc').default('asc').required().messages({
    'any.required': '請輸入「order」',
    'string.base': '「order」必須是字串',
    'any.only': '「order」僅能為 asc 或 desc',
  }),
  lang: Joi.string()
    .valid(...supportedLanguages)
    .default('zh-TW')
    .required()
    .messages({
      'any.required': '請輸入「lang」',
      'string.base': '「lang」必須是字串',
      'any.only': `「lang」僅能為 ${supportedLanguages.join('、')}`,
    }),
}).custom((value, helpers) => {
  const { type, item, start_date, end_date, min_price, max_price, duration } = value;
  // type/item 關聯
  if (type && item) {
    const validItems = itemOptions[type];
    if (!validItems || !validItems.includes(item)) {
      return helpers.message(
        `當「type」為「${type}」時，「item」僅能為：${validItems ? validItems.join('、') : '（無可選項）'}`
      );
    }
  }
  // 日期區間
  if (start_date && end_date) {
    if (new Date(start_date) > new Date(end_date)) {
      return helpers.message('「start_date」不可大於「end_date」');
    }
  }
  // 價格區間
  if (typeof min_price === 'number' && typeof max_price === 'number' && min_price > max_price) {
    return helpers.message('「min_price」不可大於「max_price」');
  }
  // duration 應等於日期差
  if (start_date && end_date && typeof duration === 'number') {
    const start = new Date(start_date);
    const end = new Date(end_date);
    const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const days = Math.floor((endUTC - startUTC) / (1000 * 60 * 60 * 24));
    if (duration !== days) {
      return helpers.message(
        `「duration」必須等於「end_date」減「start_date」的天數差（目前應為 ${days}）`
      );
    }
  }
  return value;
});

// baseSchema、tourIDSchema、detailsSchema、reviewSchema、hiddenPlaySchema 都照這個格式調整即可
const baseSchema = Joi.object({
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
      'any.only': `「lang」僅支援：${supportedLanguages.join('、')}`,
      'string.base': '「lang」必須是文字',
      'any.required': '「lang」為必填欄位',
    }),
});

const tourIDSchema = Joi.object({
  tour_id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.base': '「tour_id」必須是文字',
    'string.guid': '「tour_id」必須是有效的 UUID 格式',
    'any.required': '「tour_id」為必填欄位',
  }),
});

const detailsSchema = baseSchema.fork(['lang'], (field) => field.required());
const reviewSchema = baseSchema.fork(['page', 'limit', 'lang'], (field) => field.required());
const hiddenPlaySchema = baseSchema.fork(['page', 'limit', 'lang'], (field) => field.required());

// tour_detail 的驗證模型
const tourDetailSchema = Joi.object({
  feature_img1: Joi.string().uri().required().messages({
    'string.uri': '「feature_img1」連結格式不正確',
    'any.required': '請提供「feature_img1」',
    'string.empty': '「feature_img1」不可為空',
  }),
  feature_desc1: Joi.string().required().messages({
    'any.required': '請提供「feature_desc1」',
    'string.empty': '「feature_desc1」不可為空',
  }),
  feature_img2: Joi.string().uri().required().messages({
    'string.uri': '「feature_img2」連結格式不正確',
    'any.required': '請提供「feature_img2」',
    'string.empty': '「feature_img2」不可為空',
  }),
  feature_desc2: Joi.string().required().messages({
    'any.required': '請提供「feature_desc2」',
    'string.empty': '「feature_desc2」不可為空',
  }),
  feature_img3: Joi.string().uri().required().messages({
    'string.uri': '「feature_img3」連結格式不正確',
    'any.required': '請提供「feature_img3」',
    'string.empty': '「feature_img3」不可為空',
  }),
  feature_desc3: Joi.string().required().messages({
    'any.required': '請提供「feature_desc3」',
    'string.empty': '「feature_desc3」不可為空',
  }),
  itinerary: Joi.string().required().messages({
    'any.required': '請提供「itinerary」',
    'string.empty': '「itinerary」不可為空',
  }),
});

// restaurant_business 的驗證模型
const restaurantBusinessSchema = Joi.object({
  week: Joi.string().required().messages({
    'any.required': '請提供「week」',
    'string.empty': '「week」不可為空',
  }),
  business_hours: Joi.string().required().messages({
    'any.required': '請提供「business_hours」',
    'string.empty': '「business_hours」不可為空',
  }),
});

// restaurant_menu 的驗證模型
const restaurantMenuSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': '請提供「name」',
    'string.empty': '「name」不可為空',
  }),
  price: Joi.number().min(0).required().messages({
    'number.base': '「price」必須是數字',
    'number.min': '「price」不可為負數',
    'any.required': '請提供「price」',
  }),
  description: Joi.string().optional().allow('', null),
});

// restaurant 的驗證模型
const restaurantSchema = Joi.object({
  reservation_limit: Joi.number().integer().min(0).required().messages({
    'number.base': '「reservation_limit」必須是數字',
    'number.integer': '「reservation_limit」必須是整數',
    'number.min': '「reservation_limit」不可為負數',
    'any.required': '請提供「reservation_limit」',
  }),
  website_info: Joi.string().required().messages({
    'any.required': '請提供「website_info」',
    'string.empty': '「website_info」不可為空',
  }),
  website_url: Joi.string().uri().required().messages({
    'string.uri': '「website_url」連結格式不正確',
    'any.required': '請提供「website_url」',
    'string.empty': '「website_url」不可為空',
  }),
  business_hours_list: Joi.array().items(restaurantBusinessSchema).optional().min(0).messages({
    'array.base': '「business_hours_list」必須是陣列格式',
  }),
  menu_items: Joi.array().items(restaurantMenuSchema).optional().min(0).messages({
    'array.base': '「menu_items」必須是陣列格式',
  }),
});

// hotel_room 的驗證模型
const hotelRoomSchema = Joi.object({
  title: Joi.string().required().messages({
    'any.required': '請提供「title」',
    'string.empty': '「title」不可為空',
  }),
  capacity: Joi.number().integer().min(1).required().messages({
    'number.base': '「capacity」必須是數字',
    'number.integer': '「capacity」必須是整數',
    'number.min': '「capacity」至少為 1',
    'any.required': '請提供「capacity」',
  }),
  room_count: Joi.number().integer().min(1).required().messages({
    'number.base': '「room_count」必須是數字',
    'number.integer': '「room_count」必須是整數',
    'number.min': '「room_count」至少為 1',
    'any.required': '請提供「room_count」',
  }),
  image: Joi.string().uri().required().messages({
    'string.uri': '「image」連結格式不正確',
    'any.required': '請提供「image」',
    'string.empty': '「image」不可為空',
  }),
  image_desc: Joi.string().required().messages({
    'any.required': '請提供「image_desc」',
    'string.empty': '「image_desc」不可為空',
  }),
});

// hotel 的驗證模型
const hotelSchema = Joi.object({
  facility_desc: Joi.string().optional().allow('', null),
  food_desc: Joi.string().optional().allow('', null),
  room_desc: Joi.string().optional().allow('', null),
  leisure_desc: Joi.string().optional().allow('', null),
  traffic_desc: Joi.string().optional().allow('', null),
  other_desc: Joi.string().optional().allow('', null),
  rooms: Joi.array().items(hotelRoomSchema).optional().min(0).messages({
    'array.base': '「rooms」必須是陣列格式',
  }),
});

// 新增產品的主要驗證模型
const createProductSchema = Joi.object({
  product_name: Joi.string().required().max(255).messages({
    'string.empty': '「product_name」不可為空',
    'string.max': '「product_name」最多 255 個字元',
    'any.required': '請提供「product_name」',
  }),
  product_price: Joi.number().required().min(0).messages({
    'number.base': '「product_price」必須是數字',
    'number.min': '「product_price」不可為負數',
    'any.required': '請提供「product_price」',
  }),
  product_description: Joi.string().required().messages({
    'string.empty': '「product_description」不可為空',
    'any.required': '請提供「product_description」',
  }),
  product_type: Joi.string().required().valid('tourgroup', 'backpacker').messages({
    'string.empty': '「product_type」不可為空',
    'any.only': '「product_type」僅能為 tourgroup 或 backpacker',
    'any.required': '請提供「product_type」',
  }),
  product_item: Joi.string().required().valid('travel', 'food', 'spot', 'hotel').messages({
    'string.empty': '「product_item」不可為空',
    'any.only': '「product_item」僅能為 travel、food、spot 或 hotel',
    'any.required': '請提供「product_item」',
  }),
  product_status: Joi.number().integer().required().valid(1, 2).messages({
    'number.base': '「product_status」必須是數字',
    'number.integer': '「product_status」必須是整數',
    'any.only': '「product_status」僅能為 1 或 2',
    'any.required': '請提供「product_status」',
  }),
  product_slogan: Joi.string().required().max(255).messages({
    'string.empty': '「product_slogan」不可為空',
    'string.max': '「product_slogan」最多 255 個字元',
    'any.required': '請提供「product_slogan」',
  }),
  product_days: Joi.number().integer().required().min(1).messages({
    'number.base': '「product_days」必須是數字',
    'number.integer': '「product_days」必須是整數',
    'number.min': '「product_days」必須大於 0',
    'any.required': '請提供「product_days」',
  }),
  product_country: Joi.string().required().messages({
    'string.empty': '「product_country」不可為空',
    'any.required': '請提供「product_country」',
  }),
  product_region: Joi.string().required().messages({
    'string.empty': '「product_region」不可為空',
    'any.required': '請提供「product_region」',
  }),
  product_address: Joi.string().required().messages({
    'string.empty': '「product_address」不可為空',
    'any.required': '請提供「product_address」',
  }),
  product_google_map_url: Joi.string().required().uri().messages({
    'string.empty': '「product_google_map_url」不可為空',
    'string.uri': '「product_google_map_url」連結格式不正確',
    'any.required': '請提供「product_google_map_url」',
  }),
  product_calendar_url: Joi.string().required().uri().messages({
    'string.empty': '「product_calendar_url」不可為空',
    'string.uri': '「product_calendar_url」連結格式不正確',
    'any.required': '請提供「product_calendar_url」',
  }),
  product_preference1: Joi.number().integer().required().messages({
    'number.base': '「product_preference1」必須是數字',
    'number.integer': '「product_preference1」必須是整數',
    'any.required': '請提供「product_preference1」',
  }),
  product_preference2: Joi.number().integer().required().messages({
    'number.base': '「product_preference2」必須是數字',
    'number.integer': '「product_preference2」必須是整數',
    'any.required': '請提供「product_preference2」',
  }),
  product_preference3: Joi.number().integer().required().messages({
    'number.base': '「product_preference3」必須是數字',
    'number.integer': '「product_preference3」必須是整數',
    'any.required': '請提供「product_preference3」',
  }),
  product_notice: Joi.string().optional().allow('', null),
  product_cover_image: Joi.string().required().uri().messages({
    'string.empty': '「product_cover_image」不可為空',
    'string.uri': '「product_cover_image」連結格式不正確',
    'any.required': '請提供「product_cover_image」',
  }),
  product_img1: Joi.string().required().uri().messages({
    'string.empty': '「product_img1」不可為空',
    'string.uri': '「product_img1」連結格式不正確',
    'any.required': '請提供「product_img1」',
  }),
  product_img1_desc: Joi.string().required().max(255).messages({
    'string.empty': '「product_img1_desc」不可為空',
    'string.max': '「product_img1_desc」最多 255 個字元',
    'any.required': '請提供「product_img1_desc」',
  }),
  product_img2: Joi.string().required().uri().messages({
    'string.empty': '「product_img2」不可為空',
    'string.uri': '「product_img2」連結格式不正確',
    'any.required': '請提供「product_img2」',
  }),
  product_img2_desc: Joi.string().required().max(255).messages({
    'string.empty': '「product_img2_desc」不可為空',
    'string.max': '「product_img2_desc」最多 255 個字元',
    'any.required': '請提供「product_img2_desc」',
  }),
  product_img3: Joi.string().required().uri().messages({
    'string.empty': '「product_img3」不可為空',
    'string.uri': '「product_img3」連結格式不正確',
    'any.required': '請提供「product_img3」',
  }),
  product_img3_desc: Joi.string().required().max(255).messages({
    'string.empty': '「product_img3_desc」不可為空',
    'string.max': '「product_img3_desc」最多 255 個字元',
    'any.required': '請提供「product_img3_desc」',
  }),
  product_img4: Joi.string().required().uri().messages({
    'string.empty': '「product_img4」不可為空',
    'string.uri': '「product_img4」連結格式不正確',
    'any.required': '請提供「product_img4」',
  }),
  product_img4_desc: Joi.string().required().max(255).messages({
    'string.empty': '「product_img4_desc」不可為空',
    'string.max': '「product_img4_desc」最多 255 個字元',
    'any.required': '請提供「product_img4_desc」',
  }),
  product_img5: Joi.string().required().uri().messages({
    'string.empty': '「product_img5」不可為空',
    'string.uri': '「product_img5」連結格式不正確',
    'any.required': '請提供「product_img5」',
  }),
  product_img5_desc: Joi.string().required().max(255).messages({
    'string.empty': '「product_img5_desc」不可為空',
    'string.max': '「product_img5_desc」最多 255 個字元',
    'any.required': '請提供「product_img5_desc」',
  }),
  product_img6: Joi.string().required().uri().messages({
    'string.empty': '「product_img6」不可為空',
    'string.uri': '「product_img6」連結格式不正確',
    'any.required': '請提供「product_img6」',
  }),
  product_img6_desc: Joi.string().required().max(255).messages({
    'string.empty': '「product_img6_desc」不可為空',
    'string.max': '「product_img6_desc」最多 255 個字元',
    'any.required': '請提供「product_img6_desc」',
  }),
  product_start_date: Joi.date().iso().optional().allow(null).messages({
    'date.format': '「product_start_date」格式錯誤，需為 ISO 格式',
  }),
  product_end_date: Joi.date().iso().optional().allow(null)
    .when('product_start_date', {
      is: Joi.date().iso().required(),
      then: Joi.date().iso().greater(Joi.ref('product_start_date')),
      otherwise: Joi.optional(),
    })
    .messages({
      'date.format': '「product_end_date」格式錯誤，需為 ISO 格式',
      'date.greater': '「product_end_date」必須晚於「product_start_date」',
    }),

  // 其他詳細資訊的可選巢狀物件
  product_detail: tourDetailSchema.optional(),
  product_restaurant: restaurantSchema.optional(),
  product_hotel: hotelSchema.optional(),
});

module.exports = {
  tourIDSchema,
  queryschema,
  detailsSchema,
  reviewSchema,
  hiddenPlaySchema,
  createProductSchema,
};
