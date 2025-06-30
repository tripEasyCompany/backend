const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');
const preferenceMap = require('../utils/preferenceMap');
const { v4: uuidv4 } = require('uuid');
// === 新增：Firebase 上傳輔助函數 ===
const { uploadProductImages } = require('../utils/firebaseUpload');

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

// === 更新：[POST] 編號 46 : 管理者新增旅遊項目 (包含Firebase圖片上傳) ===
async function post_admin_product(req, res, next) {
  const {
    // Tour 欄位
    product_name, product_price, product_description, product_type, product_item,
    product_status, product_slogan, product_days, product_country, product_region,
    product_address, product_google_map_url, product_calendar_url,
    product_preference1, product_preference2, product_preference3, product_notice,
    product_img1_desc, product_img2_desc, product_img3_desc, product_img4_desc, 
    product_img5_desc, product_img6_desc, product_start_date, product_end_date,
    // 相關實體的巢狀物件
    product_detail, product_restaurant, product_hotel,
  } = req.body;

  const tour_id = uuidv4(); // 產生唯一的 tour_id
  const client = await pool.connect();
  const createdData = {};

  try {
    await client.query('BEGIN');

    // === 新增：步驟 1 - 上傳所有圖片到 Firebase Storage ===
    console.log('🔄 開始上傳產品圖片到 Firebase Storage...');
    const imageUrls = await uploadProductImages(req.files, product_name);
    console.log('✅ 所有圖片上傳完成:', Object.keys(imageUrls));

    // === 更新：步驟 2 - 新增到 "tour" 資料表 (使用Firebase圖片URL) ===
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
      product_notice || null, product_description, 
      // === 使用 Firebase 上傳的圖片 URL ===
      imageUrls.product_cover_image, imageUrls.product_img1, product_img1_desc, 
      imageUrls.product_img2, product_img2_desc, imageUrls.product_img3, product_img3_desc,
      imageUrls.product_img4, product_img4_desc, imageUrls.product_img5, product_img5_desc, 
      imageUrls.product_img6, product_img6_desc,
    ];
    const tourResult = await client.query(tourQuery, tourValues);
    createdData.tour = tourResult.rows[0];
    console.log('✅ 旅遊項目基本資料新增完成');

    // === 保持原有：步驟 3 - 條件性新增到 "tour_detail" ===
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
      // 從 imageUrls 物件中取得上傳後的圖片網址
      const detailValues = [
        tour_id, 
        imageUrls.feature_img1, // 使用上傳後的 URL
        feature_desc1, 
        imageUrls.feature_img2, // 使用上傳後的 URL
        feature_desc2, 
        imageUrls.feature_img3, // 使用上傳後的 URL
        feature_desc3, 
        itinerary,
      ];
      const detailResult = await client.query(detailQuery, detailValues);
      createdData.tour_detail = detailResult.rows[0];
      console.log('✅ 旅遊詳細資訊新增完成');
    }

    // === 保持原有：步驟 4 - 條件性新增到 "restaurant" 及其相關資料表 ===
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
        console.log(`✅ 餐廳營業時間新增完成 (${business_hours_list.length} 筆)`);
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
        console.log(`✅ 餐廳菜單項目新增完成 (${menu_items.length} 筆)`);
      }
      console.log('✅ 餐廳資訊新增完成');
    }

    // === 保持原有：步驟 5 - 條件性新增到 "hotel" 和 "hotel_room" ===
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
        console.log(`✅ 飯店房間資訊新增完成 (${rooms.length} 筆)`);
      }
      console.log('✅ 飯店資訊新增完成');
    }

    await client.query('COMMIT');
    console.log('✅ 所有資料庫操作完成，交易已提交');

    // === 更新：回傳結果包含圖片URL ===
    resStatus({
      res,
      status: 201,
      message: '旅遊項目及其相關資料新增成功',
      dbdata: {
        ...createdData,
        tour_id: tour_id,
        product_name: product_name,
        image_urls: imageUrls, // 新增：回傳所有圖片URL
      },
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.log('❌ 資料庫交易已回滾');
    
    // === 新增：Firebase 錯誤處理 ===
    if (error.message && error.message.includes('Firebase')) {
      console.error('❌ Firebase 上傳錯誤:', error);
      return resStatus({
        res: res,
        status: 500,
        message: '圖片上傳失敗，請檢查圖片格式和網路連線',
      });
    }
    
    console.error('新增旅遊項目及相關資料錯誤:', error);
    // 將錯誤傳遞給集中的錯誤處理中間件
    next(error);
  } finally {
    client.release();
    console.log('🔄 資料庫連線已釋放');
  }
}

module.exports = {
  get_tourData,
  get_tourDetails,
  get_tourReview,
  get_tourHiddenPlay,
  post_admin_product,
};
