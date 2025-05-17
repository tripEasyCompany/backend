const resStatus = require('../utils/resStatus');
const { pool } = require('../config/database');

// [GET] 編號 26 : 使用者查看旅行團、背包客熱門、促銷等項目
async function get_home_Product(req, res, next) {
  const { type, item, lang, page, limit } = req.query;
  const user = req.user;
  let tourData = '';

  try {
    if (type === 'tourgroup') {
      if (item === 'popular') {
        tourData = await pool.query(
          `select * from public.tour_base tb 
                                     inner join public.tour_travel_popular($1,$2) as tf 
                                     on tb.旅遊編號 = tf.tour_id 
                                     ORDER BY 購買排行 ASC LIMIT $3 OFFSET $4;`,
          ['tourgroup', 'travel', limit, (page - 1) * limit]
        );

        if (user) {
          tourData = await pool.query(
            `select * from public.tour_travel($1) tb 
                                       inner join public.tour_travel_popular($2,$3) as tf 
                                       on tb.旅遊編號 = tf.tour_id 
                                       ORDER BY 購買排行 ASC LIMIT $4 OFFSET $5;`,
            [user.id, 'tourgroup', 'travel', limit, (page - 1) * limit]
          );
        }
      } else if (item === 'promotion') {
        tourData = await pool.query(
          `SELECT * FROM public."tour_base" 
                                     WHERE 大分類 = $1 and 小分類 = $2 and 通知狀態 = $3 
                                     ORDER BY 旅遊開始日期 DESC LIMIT $4 OFFSET $5;`,
          ['tourgroup', 'travel', '促銷', limit, (page - 1) * limit]
        );

        if (user) {
          tourData = await pool.query(
            `SELECT * FROM public.tour_travel($1)
                                      WHERE 大分類 = $2 and 小分類 = $3 and 通知狀態 = $4 
                                      ORDER BY 旅遊開始日期 DESC LIMIT $5 OFFSET $6;`,
            [user.id, 'tourgroup', 'travel', '促銷', limit, (page - 1) * limit]
          );
        }
      } else if (item === 'most_favorited') {
        tourData = await pool.query(
          `select * from public.tour_base tb 
                                     inner join public.tour_travel_most_favorited($1,$2) as tf 
                                     on tb.旅遊編號 = tf.tour_id 
                                     ORDER BY 收藏排行 ASC LIMIT $3 OFFSET $4;`,
          ['tourgroup', 'travel', limit, (page - 1) * limit]
        );

        if (user) {
          tourData = await pool.query(
            `select * from public.tour_travel($1) tb 
                                       inner join public.tour_travel_most_favorited($2,$3) as tf 
                                       on tb.旅遊編號 = tf.tour_id 
                                       ORDER BY 收藏排行 ASC LIMIT $4 OFFSET $5;`,
            [user.id, 'tourgroup', 'travel', limit, (page - 1) * limit]
          );
        }
      }
    } else if (type === 'backpacker') {
      tourData = await pool.query(
        `select * from public.tour_base tb 
                                    inner join public.tour_travel_popular($1,$2) as tf 
                                    on tb.旅遊編號 = tf.tour_id 
                                    ORDER BY 購買排行 ASC LIMIT $3 OFFSET $4;`,
        [type, item, limit, (page - 1) * limit]
      );

      if (user) {
        tourData = await pool.query(
          `select * from public.tour_travel($1) tb 
                                       inner join public.tour_travel_popular($2,$3) as tf 
                                       on tb.旅遊編號 = tf.tour_id 
                                       ORDER BY 購買排行 ASC LIMIT $4 OFFSET $5;`,
          [user.id, type, item, limit, (page - 1) * limit]
        );
      }
    }

    // [HTTP 200] 呈現資料
    resStatus({
      res: res,
      status: 200,
      message: '查詢成功',
      dbdata: tourData.rows,
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

// [GET] 編號 27 : 使用者查看此網頁好評內容
async function get_home_Review(req, res, next) {
  const { lang, page, limit } = req.query;

  try {
    //取資料庫資料
    const reviewData = await pool.query(
      'select * from public."user_level_review_forHome" ORDER BY 評論時間 DESC LIMIT $1 OFFSET $2;',
      [limit, (page - 1) * limit]
    );

    // [HTTP 200] 呈現資料
    resStatus({
      res: res,
      status: 200,
      message: '查詢成功',
      dbdata: reviewData.rows,
    });
  } catch (error) {
    // [HTTP 500] 伺服器異常
    console.error('❌ 伺服器內部錯誤:', error);
    next(error);
  }
}

module.exports = {
  get_home_Product,
  get_home_Review,
};
