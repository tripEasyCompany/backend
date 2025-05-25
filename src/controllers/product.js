const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');

// [GET] 編號 22 : 使用者查詢旅遊項目
async function get_tourData(req, res, next) {
  const { id } = req.user || {};
  const { tour_id } = req.params;
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
    page,
    limit,
    sort_by,
    order,
    lang,
  } = req.query;

  try {
    const tourDataRepo = await pool.query(
      `SELECT * from public."tour_travel"($1) t
       WHERE t.旅遊編號 = $2`,
      [id, tour_id]
    );

    if (tourDataRepo.rowCount > 0) {
      return resStatus({
        res,
        status: 200,
        message: '查詢成功',
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

    if (tourDetailsRepo.rowCount > 0) {
      return resStatus({
        res,
        status: 200,
        message: '查詢成功',
        dbdata: tourDetailsRepo.rows,
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
