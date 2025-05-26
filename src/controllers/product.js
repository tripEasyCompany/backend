const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');
const preferenceMap = require('../utils/preferenceMap');

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

module.exports = {
  get_tourData,
  get_tourDetails,
  get_tourReview,
  get_tourHiddenPlay,
};
