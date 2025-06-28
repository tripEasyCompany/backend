const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');
const preferenceMap = require('../utils/preferenceMap');
const { v4: uuidv4 } = require('uuid');

function buildDynamicTourSQL(query) {
  const {
    type,
    item,
    tag,
    country,
    region,
    min_price,
    max_price,
    start_date,
    end_date,
    keyword,
    duration,
    lang,
  } = query;

  const whereClauses = [];
  const params = [];
  let index = 2; // PostgreSQL parameter index e.g. $1, $2, ...

  // 以下每一個條件都會動態 push 進 WHERE 子句與 params
  if (type) {
    whereClauses.push(`"大分類" = $${index++}`);
    params.push(type);
  }

  if (item) {
    whereClauses.push(`"小分類" = $${index++}`);
    params.push(item);
  }

  if (tag) {
    const tagId = preferenceMap[tag]; // 中文 ➝ 數字
    if (tagId) {
      whereClauses.push(`$${index++} = ANY (ARRAY["偏好分類1", "偏好分類2", "偏好分類3"])`);
      params.push(tagId);
    }
  }

  if (country) {
    whereClauses.push(`"所屬國家" ILIKE $${index++}`);
    params.push(`%${country}%`);
  }

  if (region) {
    whereClauses.push(`"所屬地區" ILIKE $${index++}`);
    params.push(`%${region}%`);
  }

  if (min_price) {
    whereClauses.push(`"價錢" >= $${index++}`);
    params.push(min_price);
  }

  if (max_price) {
    whereClauses.push(`"價錢" <= $${index++}`);
    params.push(max_price);
  }

  if (start_date) {
    whereClauses.push(`"旅遊開始日期" >= $${index++}`);
    params.push(start_date);
  }

  if (end_date) {
    whereClauses.push(`"旅遊結束日期" <= $${index++}`);
    params.push(end_date);
  }

  if (typeof duration === 'number') {
    whereClauses.push(`"旅遊天數" = $${index++}`);
    params.push(duration);
  }

  if (keyword) {
    whereClauses.push(`("旅遊名稱" ILIKE $${index} OR "旅遊標語" ILIKE $${index + 1})`);
    params.push(`%${keyword}%`, `%${keyword}%`);
    index += 2;
  }

  // 合併 WHERE 子句
  const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  return {
    whereSQL,
    params,
  };
}

// [GET] 編號 22 : 使用者查詢旅遊項目
async function get_tourData(req, res, next) {
  const { id } = req.user || {};
  const { whereSQL, params } = buildDynamicTourSQL(req.query);
  
  // 組完整查詢語句（加入排序、分頁）
  const offset = (req.query.page - 1) * req.query.limit;
  const limit = req.query.limit;
  const sortFieldMap = {
    price: '"價錢"',
    date: '"旅遊開始日期"',
  };
  const sortBy = sortFieldMap[req.query.sort_by] || '"旅遊開始日期"';
  const order = req.query.order.toUpperCase(); // ASC or DESC

  try {
    const sql = `
      SELECT *
      FROM (
        SELECT * FROM public."tour_travel"($1::uuid)
      ) AS sub
      ${whereSQL}
      ORDER BY ${sortBy} ${order}
      LIMIT $${params.length + 2} OFFSET $${params.length + 3}
    `;

    const finalParams = [id, ...params, limit, offset];
    const result = await pool.query(sql, finalParams);

    const reverseMap = Object.fromEntries(
      Object.entries(preferenceMap).map(([k, v]) => [v, k])
    );

    const mappedRows = result.rows.map(row => {
      const tags = [
        reverseMap[row['偏好分類1']],
        reverseMap[row['偏好分類2']],
        reverseMap[row['偏好分類3']],
      ].filter(Boolean);

      // 排除原始偏好分類欄位
      const {
        ['偏好分類1']: _p1,
        ['偏好分類2']: _p2,
        ['偏好分類3']: _p3,
        ...rest
      } = row;

      return {
        ...rest,
        tags,
      };
    });

    if (result.rowCount > 0) {
      return resStatus({
        res,
        status: 200,
        message: '查詢成功',
        dbdata : mappedRows
      });
    } else {
      return resStatus({
        res,
        status: 200,
        message: '查無此旅遊項目',
      });
    }
  } catch (error) {
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 編號 23 : 使用者查看旅遊項目詳細資料
async function get_tourDetails(req, res, next) {
  const { id } = req.user || {};
  const { tour_id } = req.params;
  const { lang } = req.query;

  try {
    const tourRepo = await pool.query(
      `SELECT type, item
       FROM public."tour" t
       WHERE t.tour_id = $1 and status = 1`,
      [tour_id]
    );

    const type = tourRepo.rows[0]?.type;
    const item = tourRepo.rows[0]?.item;

    let sql = '';
    let params = [tour_id, id];

    // 決定查詢的 table 名稱
    let detailTable = '';
    if (type === 'tourgroup' && item === 'travel') {
      detailTable = 'public.tour_tour_detail';
    } else if (type === 'backpacker') {
      if (item === 'spot') detailTable = 'public.tour_tour_detail';
      if (item === 'hotel') detailTable = 'public.tour_hotel';
      if (item === 'food') detailTable = 'public.tour_restaurant';
    }

    // 組 where 條件
    sql = `SELECT * FROM ${detailTable}($2) WHERE 旅遊編號 = $1`;
    const tourDetailsRepo = await pool.query(sql, params);

    const reverseMap = Object.fromEntries(
      Object.entries(preferenceMap).map(([label, id]) => [id, label])
    );
    const preferences = [
      reverseMap[tourDetailsRepo.rows[0]["偏好設定分類 1"]],
      reverseMap[tourDetailsRepo.rows[0]["偏好設定分類 2"]],
      reverseMap[tourDetailsRepo.rows[0]["偏好設定分類 3"]],
    ].filter(Boolean); // 避免 null 或 undefined


    if (tourDetailsRepo.rowCount > 0) {
      if (item === 'food') {
        return resStatus({
          res,
          status: 200,
          message: '查詢成功',
          dbdata: {
            tour_id: tourDetailsRepo.rows[0].旅遊編號,
            title: tourDetailsRepo.rows[0].旅遊名稱,
            title_slogan: tourDetailsRepo.rows[0].旅遊標語,
            type: tourDetailsRepo.rows[0].大分類,
            item: tourDetailsRepo.rows[0].小分類,
            image_url: tourDetailsRepo.rows[0]['旅遊代表圖 Url'],
            image_spot: [
              {
                description: tourDetailsRepo.rows[0]['旅遊圖1 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖1 Url'],
              },
              {
                description: tourDetailsRepo.rows[0]['旅遊圖2 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖2 Url'],
              },
              {
                description: tourDetailsRepo.rows[0]['旅遊圖3 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖3 Url'],
              },
              {
                description: tourDetailsRepo.rows[0]['旅遊圖4 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖4 Url'],
              },
              {
                description: tourDetailsRepo.rows[0]['旅遊圖5 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖5 Url'],
              },
              {
                description: tourDetailsRepo.rows[0]['旅遊圖6 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖6 Url'],
              },
            ],
            price: tourDetailsRepo.rows[0].價錢,
            date_start: tourDetailsRepo.rows[0].旅遊開始日期,
            date_end: tourDetailsRepo.rows[0].旅遊結束日期,
            feature: {
              about: {
                people: tourDetailsRepo.rows[0].餐廳人員限制,
                description: tourDetailsRepo.rows[0].官網介紹,
                web_url: tourDetailsRepo.rows[0]['官網 url'],
              },
              menu: tourDetailsRepo.rows.map((row) => ({
                name: row.菜單名稱,
                description: row.菜單描述,
                price: row.菜單價錢,
              })),
              opening: tourDetailsRepo.rows.map((row) => ({
                week: row.營業星期,
                time: row.營業時間,
              })),
            },
            location: {
              country: tourDetailsRepo.rows[0].所屬國家,
              region: tourDetailsRepo.rows[0].所屬地區,
              address: tourDetailsRepo.rows[0].地址,
              google_map: tourDetailsRepo.rows[0]['Google Map Url'],
            },
            description: tourDetailsRepo.rows[0].旅遊描述,
            tags: preferences,
            is_favorited: tourDetailsRepo.rows[0].收藏狀態,
            emergency_notice: tourDetailsRepo.rows[0].異動通知內容,
            promotion: {
              is_promoted: tourDetailsRepo.rows[0].促銷價錢 ? true : false,
              promo_price: tourDetailsRepo.rows[0].促銷價錢,
              tag: tourDetailsRepo.rows[0].通知狀態,
              start_at: tourDetailsRepo.rows[0].促銷開始日期,
              end_at: tourDetailsRepo.rows[0].促銷結束日期,
            },
          },
        });
      } else if (item === 'spot' || item === 'travel') {
        return resStatus({
          res,
          status: 200,
          message: '查詢成功',
          dbdata: {
            tour_id: tourDetailsRepo.rows[0].旅遊編號,
            title: tourDetailsRepo.rows[0].旅遊名稱,
            title_slogan: tourDetailsRepo.rows[0].旅遊標語,
            type: tourDetailsRepo.rows[0].大分類,
            item: tourDetailsRepo.rows[0].小分類,
            image_url: tourDetailsRepo.rows[0]['旅遊代表圖 Url'],
            image_spot: [
              {
                description: tourDetailsRepo.rows[0]['旅遊圖1 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖1 Url'],
              },
              {
                description: tourDetailsRepo.rows[0]['旅遊圖2 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖2 Url'],
              },
              {
                description: tourDetailsRepo.rows[0]['旅遊圖3 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖3 Url'],
              },
              {
                description: tourDetailsRepo.rows[0]['旅遊圖4 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖4 Url'],
              },
              {
                description: tourDetailsRepo.rows[0]['旅遊圖5 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖5 Url'],
              },
              {
                description: tourDetailsRepo.rows[0]['旅遊圖6 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖6 Url'],
              },
            ],
            price: tourDetailsRepo.rows[0].價錢,
            date_start: tourDetailsRepo.rows[0].旅遊開始日期,
            date_end: tourDetailsRepo.rows[0].旅遊結束日期,
            feature: [
              {
                description: tourDetailsRepo.rows[0]['特色圖1 描述'],
                image_url: tourDetailsRepo.rows[0]['特色圖1 url'],
              },
              {
                description: tourDetailsRepo.rows[0]['特色圖2 描述'],
                image_url: tourDetailsRepo.rows[0]['特色圖2 url'],
              },
              {
                description: tourDetailsRepo.rows[0]['特色圖3 描述'],
                image_url: tourDetailsRepo.rows[0]['特色圖3 url'],
              },
            ],
            itinerary: tourDetailsRepo.rows[0].行程規劃,
            location: {
              country: tourDetailsRepo.rows[0].所屬國家,
              region: tourDetailsRepo.rows[0].所屬地區,
              address: tourDetailsRepo.rows[0].地址,
              google_map: tourDetailsRepo.rows[0]['Google Map Url'],
            },
            description: tourDetailsRepo.rows[0].旅遊描述,
            tags: preferences,
            is_favorited: tourDetailsRepo.rows[0].收藏狀態,
            emergency_notice: tourDetailsRepo.rows[0].異動通知內容,
            promotion: {
              is_promoted: tourDetailsRepo.rows[0].促銷價錢 ? true : false,
              promo_price: tourDetailsRepo.rows[0].促銷價錢,
              tag: tourDetailsRepo.rows[0].通知狀態,
              start_at: tourDetailsRepo.rows[0].促銷開始日期,
              end_at: tourDetailsRepo.rows[0].促銷結束日期,
            },
          },
        });
      } else if (item === 'hotel') {
        return resStatus({
          res,
          status: 200,
          message: '查詢成功',
          dbdata: {
            tour_id: tourDetailsRepo.rows[0].旅遊編號,
            title: tourDetailsRepo.rows[0].旅遊名稱,
            title_slogan: tourDetailsRepo.rows[0].旅遊標語,
            type: tourDetailsRepo.rows[0].大分類,
            item: tourDetailsRepo.rows[0].小分類,
            image_url: tourDetailsRepo.rows[0]['旅遊代表圖 Url'],
            image_spot: [
              {
                description: tourDetailsRepo.rows[0]['旅遊圖1 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖1 Url'],
              },
              {
                description: tourDetailsRepo.rows[0]['旅遊圖2 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖2 Url'],
              },
              {
                description: tourDetailsRepo.rows[0]['旅遊圖3 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖3 Url'],
              },
              {
                description: tourDetailsRepo.rows[0]['旅遊圖4 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖4 Url'],
              },
              {
                description: tourDetailsRepo.rows[0]['旅遊圖5 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖5 Url'],
              },
              {
                description: tourDetailsRepo.rows[0]['旅遊圖6 描述'],
                image_url: tourDetailsRepo.rows[0]['旅遊圖6 Url'],
              },
            ],
            price: tourDetailsRepo.rows[0].價錢,
            date_start: tourDetailsRepo.rows[0].旅遊開始日期,
            date_end: tourDetailsRepo.rows[0].旅遊結束日期,
            feature: {
              room: tourDetailsRepo.rows.map((row) => ({
                name: row.房型名稱,
                description: row.房型描述,
                capacity: row.房型容納人數,
                room_count: row.房型數量,
                image_url: row['房型代表圖 url'],
              })),
              service: [
                {
                  name: '基本設施與服務',
                  item: tourDetailsRepo.rows[0].基本設施與服務,
                },
                {
                  name: '餐飲相關服務',
                  item: tourDetailsRepo.rows[0].餐飲相關服務,
                },
                {
                  name: '客房與設施',
                  item: tourDetailsRepo.rows[0].客房與設施,
                },
                {
                  name: '交通與停車',
                  item: tourDetailsRepo.rows[0].交通與停車,
                },
                {
                  name: '其他便利服務',
                  item: tourDetailsRepo.rows[0].其他便利服務,
                },
              ],
            },
            location: {
              country: tourDetailsRepo.rows[0].所屬國家,
              region: tourDetailsRepo.rows[0].所屬地區,
              address: tourDetailsRepo.rows[0].地址,
              google_map: tourDetailsRepo.rows[0]['Google Map Url'],
            },
            description: tourDetailsRepo.rows[0].旅遊描述,
            tags: preferences,
            is_favorited: tourDetailsRepo.rows[0].收藏狀態,
            emergency_notice: tourDetailsRepo.rows[0].異動通知內容,
            promotion: {
              is_promoted: tourDetailsRepo.rows[0].促銷價錢 ? true : false,
              promo_price: tourDetailsRepo.rows[0].促銷價錢,
              tag: tourDetailsRepo.rows[0].通知狀態,
              start_at: tourDetailsRepo.rows[0].促銷開始日期,
              end_at: tourDetailsRepo.rows[0].促銷結束日期,
            },
          },
        });
      }
    } else {
      return resStatus({
        res,
        status: 200,
        message: '查無此旅遊項目',
      });
    }
  } catch (error) {
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 編號 24 : 使用者查看細項資料好評分數、評論
async function get_tourReview(req, res, next) {
  const { tour_id } = req.params;
  const { page, limit, lang } = req.query;

  try {
    const avgRatingRepo = await pool.query(
      `SELECT AVG(r.rating) AS average_rating
       FROM public."review" r
       WHERE r.tour_id = $1`,
      [tour_id]
    );

    let avgRating = avgRatingRepo.rows[0]?.average_rating ?? 0;

    const reviewsRepo = await pool.query(
      `SELECT r.*,
            u.名稱,
            u."個人照片 Url",
            u.旅遊等級,
            u.旅遊等級名稱,
            u."旅遊徽章 Url"
       FROM public."review" r
       inner JOIN public."user_user_level" u ON r.user_id = u.使用者編號
       WHERE r.tour_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [tour_id, limit, (page - 1) * limit]
    );

    if (reviewsRepo.rowCount > 0) {
      return resStatus({
        res,
        status: 200,
        message: '查詢成功',
        dbdata: {
          average_rating: Math.round(parseFloat(avgRating) * 10) / 10,
          reviews: reviewsRepo.rows.map((row) => ({
            review_id: row.review_id,
            name: row.名稱,
            avatar: row['個人照片 Url'],
            level: {
              name: row.旅遊等級名稱,
              level: row.旅遊等級,
              badge_icon: row['旅遊徽章 Url'],
            },
            review_type: row.type,
            rating: Number(row.rating),
            content: row.content,
            create_date: row.created_at,
          })),
        },
      });
    } else {
      return resStatus({
        res,
        status: 200,
        message: '暫無此旅遊項目評論',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 編號 25 : 使用者查看細項資料隱藏玩法
async function get_tourHiddenPlay(req, res, next) {
  const { tour_id } = req.params;
  const { page, limit, lang } = req.query;

  try {
    const hiddenPlayRepo = await pool.query(
      `SELECT r.*,
            u.名稱,
            u."個人照片 Url",
            u.旅遊等級,
            u.旅遊等級名稱,
            u."旅遊徽章 Url"
       FROM public."hidden_play" r
       inner JOIN public."user_user_level" u ON r.user_id = u.使用者編號
       WHERE r.tour_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [tour_id, limit, (page - 1) * limit]
    );

    if (hiddenPlayRepo.rowCount > 0) {
      return resStatus({
        res,
        status: 200,
        message: '查詢成功',
        dbdata: hiddenPlayRepo.rows.map((row) => ({
          shares_id: row.hidden_play_id,
          name: row.名稱,
          avatar: row['個人照片 Url'],
          level: {
            name: row.旅遊等級名稱,
            level: row.旅遊等級,
            badge_icon: row['旅遊徽章 Url'],
          },
          title: row.type,
          content: row.content,
          url: row.share_url,
          create_date: row.created_at,
        })),
      });
    } else {
      return resStatus({
        res,
        status: 200,
        message: '暫無此旅遊項目額外分享內容',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [POST] 編號 46 : 管理者新增旅遊項目
async function post_admin_product(req, res, next) {
  const {
    // Tour 欄位
    product_name, product_price, product_description, product_type, product_item,
    product_status, product_slogan, product_days, product_country, product_region,
    product_address, product_google_map_url, product_calendar_url,
    product_preference1, product_preference2, product_preference3, product_notice,
    product_cover_image, product_img1, product_img1_desc, product_img2, product_img2_desc,
    product_img3, product_img3_desc, product_img4, product_img4_desc, product_img5,
    product_img5_desc, product_img6, product_img6_desc, product_start_date, product_end_date,
    // 相關實體的巢狀物件
    product_detail, product_restaurant, product_hotel,
  } = req.body;

  const tour_id = uuidv4(); // 產生唯一的 tour_id
  const client = await pool.connect();
  const createdData = {};

  try {
    await client.query('BEGIN');

    // 1. 新增到 "tour" 資料表
    const tourQuery = `
      INSERT INTO public."tour" (
        tour_id, type, item, status, title, slogan, tour_start_date, tour_end_date,
        days, price, country, region, address, google_map_url, calendar_url,
        preference1, preference2, preference3, notice, description, cover_image,
        img1, img1_desc, img2, img2_desc, img3, img3_desc, img4, img4_desc,
        img5, img5_desc, img6, img6_desc
      ) 
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
      )
      RETURNING *
    `;
    const tourValues = [
      tour_id, product_type, product_item, product_status, product_name, product_slogan,
      product_start_date || null, product_end_date || null, product_days, product_price,
      product_country, product_region, product_address, product_google_map_url,
      product_calendar_url, product_preference1, product_preference2, product_preference3,
      product_notice || null, product_description, product_cover_image, product_img1,
      product_img1_desc, product_img2, product_img2_desc, product_img3, product_img3_desc,
      product_img4, product_img4_desc, product_img5, product_img5_desc, product_img6,
      product_img6_desc,
    ];
    const tourResult = await client.query(tourQuery, tourValues);
    createdData.tour = tourResult.rows[0];

    // 2. 條件性新增到 "tour_detail"
    if (product_detail && Object.keys(product_detail).length > 0) {
      const { feature_img1, feature_desc1, feature_img2, feature_desc2, feature_img3, feature_desc3, itinerary } = product_detail;
      const detailQuery = `
        INSERT INTO public."tour_detail" (
          tour_id, feature_img1, feature_desc1, feature_img2, feature_desc2,
          feature_img3, feature_desc3, itinerary
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const detailValues = [
        tour_id, feature_img1, feature_desc1, feature_img2, feature_desc2,
        feature_img3, feature_desc3, itinerary,
      ];
      const detailResult = await client.query(detailQuery, detailValues);
      createdData.tour_detail = detailResult.rows[0];
    }

    // 3. 條件性新增到 "restaurant" 及其相關資料表
    if (product_item === 'food' && product_restaurant && Object.keys(product_restaurant).length > 0) {
      const { reservation_limit, website_info, website_url, business_hours_list, menu_items } = product_restaurant;
      const restaurantQuery = `
        INSERT INTO public."restaurant" (tour_id, reservation_limit, website_info, website_url)
        VALUES ($1, $2, $3, $4)
        RETURNING restaurant_id, tour_id
      `;
      const restaurantValues = [tour_id, reservation_limit, website_info, website_url];
      const restaurantResult = await client.query(restaurantQuery, restaurantValues);
      const restaurant_id = restaurantResult.rows[0].restaurant_id;
      createdData.restaurant = restaurantResult.rows[0];
      createdData.restaurant.business_hours = [];
      createdData.restaurant.menu = [];

      // 新增到 "restaurant_business"
      if (business_hours_list && business_hours_list.length > 0) {
        for (const bizHour of business_hours_list) {
          const bizQuery = `
            INSERT INTO public."restaurant_business" (restaurant_id, week, business_hours)
            VALUES ($1, $2, $3)
            RETURNING *
          `;
          const bizValues = [restaurant_id, bizHour.week, bizHour.business_hours];
          const bizResult = await client.query(bizQuery, bizValues);
          createdData.restaurant.business_hours.push(bizResult.rows[0]);
        }
      }

      // 新增到 "restaurant_menu"
      if (menu_items && menu_items.length > 0) {
        for (const menuItem of menu_items) {
          const menuQuery = `
            INSERT INTO public."restaurant_menu" (restaurant_id, name, price, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `;
          const menuValues = [restaurant_id, menuItem.name, menuItem.price, menuItem.description || null];
          const menuResult = await client.query(menuQuery, menuValues);
          createdData.restaurant.menu.push(menuResult.rows[0]);
        }
      }
    }

    // 4. 條件性新增到 "hotel" 和 "hotel_room"
    if (product_item === 'hotel' && product_hotel && Object.keys(product_hotel).length > 0) {
      const { facility_desc, food_desc, room_desc, leisure_desc, traffic_desc, other_desc, rooms } = product_hotel;
      const hotelQuery = `
        INSERT INTO public."hotel" (
          tour_id, facility_desc, food_desc, room_desc, leisure_desc, traffic_desc, other_desc
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING hotel_id, tour_id
      `;
      const hotelValues = [
        tour_id, facility_desc || null, food_desc || null, room_desc || null,
        leisure_desc || null, traffic_desc || null, other_desc || null,
      ];
      const hotelResult = await client.query(hotelQuery, hotelValues);
      const hotel_id = hotelResult.rows[0].hotel_id;
      createdData.hotel = hotelResult.rows[0];
      createdData.hotel.rooms = [];

      if (rooms && rooms.length > 0) {
        for (const room of rooms) {
          const roomQuery = `
            INSERT INTO public."hotel_room" (
              hotel_id, title, capacity, room_count, image, image_desc
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `;
          const roomValues = [hotel_id, room.title, room.capacity, room.room_count, room.image, room.image_desc];
          const roomResult = await client.query(roomQuery, roomValues);
          createdData.hotel.rooms.push(roomResult.rows[0]);
        }
      }
    }

    await client.query('COMMIT');
    resStatus({
      res,
      status: 201,
      message: '旅遊項目及其相關資料新增成功',
      dbdata: createdData,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('新增旅遊項目及相關資料錯誤:', error);
    // 將錯誤傳遞給集中的錯誤處理中間件
    next(error);
  } finally {
    client.release();
  }
}

//[POST] 46 : 管理者新增旅遊項目
/*
async function post_Touradd(req, res, next) {
  try {
    const { tour_product, travel, food, hotel } = req.body;

    const tourConditions = [];
    const valuesIndex = [];
    const values = [];
    let index = 1;

    tourConditions.push(`"status"`);
    valuesIndex.push(`$${index++}`);
    values.push(1);
    if (tour_product.item) {
      tourConditions.push(`"item"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.item);
    }
    if (tour_product.type) {
      tourConditions.push(`"type"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.type);
    }
    if (tour_product.title) {
      tourConditions.push(`"title"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.title);
    }
    if (tour_product.subtitle) {
      tourConditions.push(`"slogan"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.subtitle);
    }
    if (tour_product.start_date) {
      tourConditions.push(`"tour_start_date"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.start_date);
    }
    if (tour_product.end_date) {
      tourConditions.push(`"tour_end_date"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.end_date);
    }
    if (tour_product.duration) {
      tourConditions.push(`"days"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.duration);
    }
    if (tour_product.price) {
      tourConditions.push(`"price"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.price);
    }
    if (tour_product.location.country) {
      tourConditions.push(`"country"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.location.country);
    }
    if (tour_product.location.region) {
      tourConditions.push(`"region"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.location.region);
    }
    if (tour_product.address) {
      tourConditions.push(`"address"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.address);
    }
    if (tour_product.map_url) {
      tourConditions.push(`"google_map_url"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.map_url);
    }
    if (tour_product.calendar_url) {
      tourConditions.push(`"calendar_url"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.calendar_url);
    }
    if (tour_product.tags.length > 0) {
      const tags = tour_product.tags.slice(0, 3); // 只取前三個標籤
      for (let i = 0; i < 3; i++) {
        if (tags[i]) {
          tourConditions.push(`"preference${i + 1}"`);
          valuesIndex.push(`$${index++}`);
          values.push(tags[i]);
        } else {
          console.log('缺少標籤 ${i + 1}');
        }
      }
    }
    if (tour_product.important_notice) {
      tourConditions.push(`"notice"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.important_notice);
    }
    if (tour_product.description) {
      tourConditions.push(`"description"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.description);
    }
    if (tour_product.cover_img_url) {
      tourConditions.push(`"cover_image"`);
      valuesIndex.push(`$${index++}`);
      values.push(tour_product.cover_img_url);
    }
    if (tour_product.scenic_images.length > 0){
      for (let i = 0; i < 6; i++) {
        if (tour_product.scenic_images[i]) {
          tourConditions.push(`"img${i + 1}"`);
          valuesIndex.push(`$${index++}`);
          values.push(tour_product.scenic_images[i].img_url);
        } else {
          console.log('缺少景點圖片 ${i + 1}');
        }
      }
    }
    if (tour_product.scenic_images.length > 0){
      for (let i = 0; i < 6; i++) {
        if (tour_product.scenic_images[i]) {
          tourConditions.push(`"img${i + 1}_desc"`);
          valuesIndex.push(`$${index++}`);
          values.push(tour_product.scenic_images[i].description);
        } else {
          console.log('缺少景點圖片 ${i + 1}');
        }
      }
    }

    const valuesSQL = tourConditions.length ? `(${tourConditions.join(', ')})` : '';
    const indexSQL = valuesIndex.length ? `(${valuesIndex.join(', ')})` : '';
    const tourInsert = `
      INSERT INTO public."tour" ${valuesSQL} 
      VALUES ${indexSQL} RETURNING "tour_id"`;

    const repo = await pool.query(tourInsert, values);
    const tour_id = repo.rows[0].tour_id;

    if(tour_product && travel){
      console.log('travel:');

      const travelInsert = `
        INSERT INTO public."tour_detail"
        (tour_id, feature_img1, feature_desc1, feature_img2, feature_desc2, feature_img3, feature_desc3, itinerary)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
      const travelValues = [ 
        tour_id,
        travel.features[0].img_url, travel.features[0].description, 
        travel.features[1].img_url, travel.features[1].description, 
        travel.features[2].img_url, travel.features[2].description, 
        travel.itinerary ];

      await pool.query(travelInsert, travelValues);
    }
    if(tour_product && food){
      console.log('food');

      const foodInsert = `
        INSERT INTO public."restaurant"
        (tour_id, reservation_limit, website_info, website_url)
        VALUES ($1, $2, $3, $4) RETURNING "restaurant_id"`;
      const foodValues = [ 
        tour_id,
        food.max_people_per_day, food.description, food.link_url
        ];
      const foodInsertRepo = await pool.query(foodInsert, foodValues);
      const restaurant_id = foodInsertRepo.rows[0].restaurant_id;
      if(foodInsertRepo.rowCount === 0) {
        return resStatus({
          message: '新增旅遊項目失敗，請檢查輸入資料是否正確',
        });
      }

      const times = Object.entries(food.open_times).flatMap(([day, times]) =>
        times.map(time => ({ day, time }))
      );
      const businessInsert = `
        INSERT INTO public."restaurant_business" 
        (restaurant_id, week, business_hours)
        VALUES ($1, $2, $3)`;
      const businessRepo = times.map( (time) => { 
        pool.query(
        businessInsert,
        [restaurant_id, time.day, time.time]
      )});
      await Promise.all(businessRepo);
    }
    if(tour_product && hotel){
      console.log('HHhotel:');

      const hotelInsert = `
        INSERT INTO public."hotel"
        (tour_id, facility_desc, food_desc, room_desc, leisure_desc, traffic_desc, other_desc)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING "hotel_id"`;
      const hotelValues = [ 
        tour_id,
        (hotel.services.basic || []).join(', '),
        (hotel.services.dining || []).join(', '),
        (hotel.services.room || []).join(', '),
        (hotel.services.leisure || []).join(', '),
        (hotel.services.transport || []).join(', '),
        (hotel.services.others || []).join(', ')
        ];
      const hotelInsertRepo = await pool.query(hotelInsert, hotelValues);
      const hotel_id = hotelInsertRepo.rows[0].hotel_id;

      const hotelRoomInsert = `
        INSERT INTO public."hotel_room"
        (hotel_id, title, capacity, room_count, image, image_desc)
        VALUES ($1, $2, $3, $4, $5, $6)`;
      const hotelRoomInsertRepo = hotel.rooms.map( (room) => { pool.query(
        hotelRoomInsert,
        [hotel_id, room.name, room.quantity, room.capacity, room.image_url, room.description]
      )});
      await Promise.all(hotelRoomInsertRepo);
    }

    resStatus({
      res: res,
      status: 200,
      message: '新增成功',
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}*/

// [GET] 47 : 管理者查看刊登的旅遊項目
async function get_tourSearch(req, res, next) {
  try {
    const { status, country, region, create_date, keyword, page = 1, limit = 10, lang } = req.query;
    const conditions =[];
    const values = [];
    let index = 1;
    if(status) {
      conditions.push(`"上下架狀態" = $${index++}`);
      values.push(status);
    }
    if(country) {
      conditions.push(`"所屬國家" = $${index++}`);
      values.push(country);
    }
    if(region) { 
      conditions.push(`"所屬地區" = $${index++}`);
      values.push(region);
    }
    if(create_date) {
      conditions.push(`"建立時間" = $${index++}`);  
      values.push(create_date);
    }
    if(keyword) {
      conditions.push(`("旅遊名稱" ILIKE $${index} OR "旅遊描述" ILIKE $${index})`);
      values.push(`%${keyword}%`);
      index++;
    }

    // 分頁設定
    const offset = (Number(page) - 1) * Number(limit);
    values.push(limit);
    values.push(offset);
    const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const select = '旅遊編號, 上下架狀態, 旅遊名稱, 旅遊描述, 所屬國家, 所屬地區, 建立時間, 價錢, "旅遊代表圖 Url"';

    const query = `
      SELECT ${select} FROM public."tour_base"
      ${whereSQL}
      ORDER BY "建立時間" DESC
      LIMIT $${index++}
      OFFSET $${index}
    `;
    const Repo = await pool.query(query, values);

    resStatus({
      res: res,
      status: 200,
      message: '查詢成功',
      dbdata: Repo.rows
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 48 : 管理者查看旅遊項目詳細內容
async function get_tourDetail(req, res, next) {
  try {
    const Repo = {};
    const { tour_id } = req.params;

    const tourDetailsRepo = await pool.query(
      'SELECT * from public."tour" WHERE "tour_id" = $1',
      [tour_id]
    );
    Repo.tour_product = tourDetailsRepo.rows[0] || null;

//travel
    const travelRepo = await pool.query(
      'SELECT * FROM public."tour_detail" WHERE "tour_id" = $1',  
      [tour_id]
    );
    if( travelRepo.rows.length > 0) {
       Repo.travel = {
        features: [
          {
            img_url: travelRepo.rows[0].feature_img1,
            description: travelRepo.rows[0].feature_desc1
          },
          {
            img_url: travelRepo.rows[0].feature_img2,
            description: travelRepo.rows[0].feature_desc2
          },
          {
            img_url: travelRepo.rows[0].feature_img3,
            description: travelRepo.rows[0].feature_desc3
          }
        ],
        itinerary: travelRepo.rows[0].itinerary || ''
       };
    }

//restaurant
    const restaurantRepo = await pool.query(
      'SELECT * FROM public."restaurant" WHERE "tour_id" = $1',  
      [tour_id]
    );
    if( restaurantRepo.rows.length > 0) {
      Repo.food = {
        max_people_per_day: restaurantRepo.rows[0].reservation_limit,
        description: restaurantRepo.rows[0].website_info,
        link_url: restaurantRepo.rows[0].web_url,
        open_times: {}
      }

      const restaurant_id = restaurantRepo.rows[0].restaurant_id;
      const businessRepo = await pool.query(
        'SELECT * FROM public."restaurant_business" WHERE "restaurant_id" = $1',  
        [restaurant_id]
      );
      businessRepo.rows.forEach(row => {
        const day = row.week;         
        const time = row.business_hours;

        if (!Repo.food.open_times[day]) {
          Repo.food.open_times[day] = [];
        }

        Repo.food.open_times[day].push(time);
      });
    }

//hotel
    const hotelSQL = 'hotel_id, facility_desc, food_desc, room_desc, leisure_desc, traffic_desc, other_desc';
    const hotelRepo = await pool.query(
      `SELECT ${hotelSQL} FROM public."hotel" WHERE "tour_id" = $1`,  
      [tour_id]
    );
    if( hotelRepo.rows.length > 0) {
      Repo.hotel = {
        services: {
          facility_desc: hotelRepo.rows[0].facility_desc,
          food_desc: hotelRepo.rows[0].food_desc,
          room_desc: hotelRepo.rows[0].room_desc,
          leisure_desc: hotelRepo.rows[0].leisure_desc,
          traffic_desc: hotelRepo.rows[0].traffic_desc,
          other_desc: hotelRepo.rows[0].other_desc
        },
        rooms: []
      };

      const hotel_id = hotelRepo.rows[0].hotel_id;
      const hotelroomSQL = 'title, capacity, room_count, image, image_desc';
      const hotelroomRepo = await pool.query(
      `SELECT ${hotelroomSQL} FROM public."hotel_room" WHERE "hotel_id" = $1`,  
      [hotel_id]);
      Repo.hotel.rooms = hotelroomRepo.rows;
    }

    resStatus({
      res: res,
      status: 200,
      message: '查詢成功',
      dbdata: Repo      
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [PATCH] 49 : 管理者修改旅遊項目細項內容
async function patch_tourInfo(req, res, next){
  try{
    const { tour_product, travel, food, hotel } = req.body;
    const { tour_id } = req.params;
    let updateStatus = 0;

    const setValuesSQL = `
      type = $2, item = $3, status = $4, title = $5, 
      slogan = $6, tour_start_date = $7, tour_end_date = $8, 
      days = $9, price = $10, country = $11, region = $12,
      address = $13, google_map_url = $14, calendar_url = $15,
      preference1 = $16, preference2 = $17, preference3 = $18,
      notice = $19, description = $20, cover_image = $21,
      img1 = $22, img1_desc = $23, img2 = $24, img2_desc = $25,
      img3 = $26, img3_desc = $27, img4 = $28, img4_desc = $29,
      img5 = $30, img5_desc = $31, img6 = $32, img6_desc = $33
    `;
    const setValues = [
      tour_product.type, tour_product.item, '2', tour_product.title,
      tour_product.subtitle, tour_product.start_date || null, tour_product.end_date || null,
      tour_product.duration || null, tour_product.price, tour_product.location.country,
      tour_product.location.region, tour_product.address, tour_product.map_url,
      tour_product.calendar_url, tour_product.tags[0] || null, tour_product.tags[1] || null,
      tour_product.tags[2] || null, tour_product.important_notice || null, tour_product.description,
      tour_product.cover_img_url,
      tour_product.scenic_images[0]?.img_url || null, tour_product.scenic_images[0]?.description || null,
      tour_product.scenic_images[1]?.img_url || null, tour_product.scenic_images[1]?.description || null,
      tour_product.scenic_images[2]?.img_url || null, tour_product.scenic_images[2]?.description || null,
      tour_product.scenic_images[3]?.img_url || null, tour_product.scenic_images[3]?.description || null,
      tour_product.scenic_images[4]?.img_url || null, tour_product.scenic_images[4]?.description || null,
      tour_product.scenic_images[5]?.img_url || null, tour_product.scenic_images[5]?.description || null
    ];
    const updatePromises = await pool.query(
      `UPDATE public."tour" SET ${setValuesSQL} WHERE tour_id = $1
      RETURNING tour_id`,
      [tour_id, ...setValues]
    );
    if(updatePromises.rowCount > 0) {
      updateStatus = 1;
    }

    if(tour_product && travel){
      const travelSQL = `feature_img1 = $2, feature_desc1 = $3,
        feature_img2 = $4, feature_desc2 = $5, feature_img3 = $6, 
        feature_desc3 = $7, itinerary = $8`;
      const travelValues = [
        travel.features[0].img_url, travel.features[0].description,
        travel.features[1].img_url, travel.features[1].description,
        travel.features[2].img_url, travel.features[2].description,
        travel.itinerary || null
      ];
      const updatePromises = await pool.query(
        `UPDATE public."tour_detail" SET ${travelSQL} WHERE tour_id = $1
        RETURNING tour_id`,
        [tour_id, ...travelValues]
      );
      if(updatePromises.rowCount > 0) {
        updateStatus = 1;
      }
    }

    if(tour_product && food){
      const foodSQL = `reservation_limit = $2, website_info = $3, website_url = $4`;
      const foodValues = [
        food.max_people_per_day, food.description, food.link_url
      ];
      const updatePromises = await pool.query(
        `UPDATE public."restaurant" SET ${foodSQL} WHERE tour_id = $1
        RETURNING restaurant_id`,
        [tour_id, ...foodValues]
      );
      if(updatePromises.rowCount === 0) {
        updateStatus = 0;
      }

      const restaurant_id = updatePromises.rows[0].restaurant_id;
      const businessSQL = `week = $2, business_hours = $3`;
      const times = Object.entries(food.open_times).flatMap(([day, times]) =>
        times.map(time => ({ day, time }))
      );
      const businessRepo = times.map( (time) => { pool.query(
          `UPDATE public."restaurant_business" SET ${businessSQL} WHERE restaurant_id = $1
          AND week = $2`,
          [restaurant_id, time.day, time.time]
      )})
    }

    if(tour_product && hotel){
      const servicesSQL = `
        facility_desc = $2, food_desc = $3, room_desc = $4,
        leisure_desc = $5, traffic_desc = $6, other_desc = $7`;
      const servicesValues = [
        (hotel.services.basic || []).join(', '),
        (hotel.services.dining || []).join(', '),
        (hotel.services.room || []).join(', '),
        (hotel.services.leisure || []).join(', '),
        (hotel.services.transport || []).join(', '),
        (hotel.services.others || []).join(', ')
      ];
      const updatePromises = await pool.query(
        `UPDATE public."hotel" SET ${servicesSQL} WHERE tour_id = $1
        RETURNING hotel_id`,
        [tour_id, ...servicesValues]
      );
      if(updatePromises.rowCount === 0) {
        updateStatus = 0;
      }

      const hotel_id = updatePromises.rows[0].hotel_id;
      const roomSQL = `title = $2, capacity = $3, room_count = $4, image = $5, image_desc = $6`;
      const roomUpdateRepo = hotel.rooms.map( (room) => { pool.query(
      `UPDATE public."hotel_room" SET ${roomSQL} WHERE
      hotel_id = $1`,
      [hotel_id, room.name, room.quantity, room.capacity, room.image_url, room.description]
      )});
      await Promise.all(roomUpdateRepo);
      if(roomUpdateRepo.rowCount > 0) {
        updateStatus = 1;
      }
    }

    if(updateStatus === 1) {
      resStatus({
        res: res,
        status: 200,
        message: '上架成功',
      });
    }
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [PATCH] 50 : 管理者上架刊登旅遊項目
async function patch_tourStatus(req, res, next){
  try{
    const { tour_ids, tour_status } = req.body;

    const updatePromises = tour_ids.map((tour_id) => pool.query(
        'UPDATE public."tour" SET status = $1 WHERE tour_id = $2',
        [tour_status, tour_id]
      )
    );
    await Promise.all(updatePromises);

    resStatus({
      res: res,
      status: 200,
      message: '上架成功',
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [DELETE] 51 : 管理者刪除旅遊項目
async function delete_tourProduct(req, res, next) {
  try {
    const { tour_ids } = req.body;

    const client = await pool.connect();
    for (const tour_id of tour_ids) {

      const tourDetail_id = await client.query(
        'SELECT tour_detail_id FROM public."tour_detail" WHERE tour_id = $1',
        [tour_id]
      );
      if(tourDetail_id.rowCount > 0){
        await client.query(
          'DELETE FROM public."tour_detail" WHERE tour_id = $1',
          [tour_id]
        );
        await client.query(
          'DELETE FROM public."tour" WHERE "tour_id" = $1',
          [tour_id]
        );
      }

      const restaurant_id = await client.query(
        'SELECT restaurant_id FROM public."restaurant" WHERE tour_id = $1',
        [tour_id]
      );
      if(restaurant_id.rowCount > 0){
        await client.query(
          'DELETE FROM public."restaurant_business" WHERE restaurant_id = $1',
          [restaurant_id.rows[0]?.restaurant_id]
        );
        await client.query(
          'DELETE FROM public."restaurant_menu" WHERE restaurant_id = $1',
          [restaurant_id.rows[0]?.restaurant_id]
        );
        await client.query(
          'DELETE FROM public."restaurant" WHERE tour_id = $1',
          [tour_id]
        );
        await client.query(
          'DELETE FROM public."tour" WHERE "tour_id" = $1',
          [tour_id]
        );
      }
      
      const hotel_id = await client.query(
        'SELECT hotel_id FROM public."hotel" WHERE tour_id = $1',
        [tour_id]
      );
      if(hotel_id.rowCount > 0){
        await client.query(
          'DELETE FROM public."hotel_room" WHERE hotel_id = $1',
          [hotel_id.rows[0]?.hotel_id]
        );
        await client.query(
          'DELETE FROM public."hotel" WHERE tour_id = $1',
          [tour_id]
        );
        await client.query(
          'DELETE FROM public."tour" WHERE "tour_id" = $1',
          [tour_id]
        );
      }
    }
    
    resStatus({
      res: res,
      status: 200,
      message: '刪除成功',
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

module.exports = {
  get_tourData,
  get_tourDetails,
  get_tourReview,
  get_tourHiddenPlay,
  post_admin_product,
  // post_Touradd,
  get_tourSearch,
  get_tourDetail,
  patch_tourInfo,
  patch_tourStatus,
  delete_tourProduct, 
};
