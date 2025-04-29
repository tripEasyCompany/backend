--- 安裝 UUID 套件
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

---- 1. 會員基本資料 "user"
CREATE TABLE "user" (
    user_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),  
    name VARCHAR(255) NOT NULL, 
    email VARCHAR(255) NOT NULL, 
    role VARCHAR(255) NOT NULL, 
    password VARCHAR(255) NOT NULL, 
    login_attempts smallint NULL, 
    locked_datetime TIMESTAMP WITH TIME zone NULL, 
    avatar_url VARCHAR(255) NULL,
    preference1 smallint NOT NULL,
    preference2 smallint NOT NULL,
    preference3 smallint NOT NULL,
    login_method smallint NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


---- 2. 會員第三方登入資料 "socialLogin"
CREATE TABLE "socialLogin" (
    login_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), 
    user_id uuid NOT NULL,
    provider_method VARCHAR(255)  NULL,
    provider_id VARCHAR(255)  NULL,
    provider_token VARCHAR(255)  NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id)
);



---- 3. 會員等級資料 "user_level"
create table "user_level" (
	level_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    level VARCHAR(255) NULL, ----- 正式需要 not null
    name VARCHAR(255) NULL, ----- 正式需要 not null
    badge_url VARCHAR(255) NULL, ----- 正式需要 not null
    travel_point INT NULL,
    benefits TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id)
);



---- 4. 優惠卷資料 "coupon"
CREATE TABLE "coupon" (
    coupon_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL,
    discount FLOAT NOT NULL,
    description TEXT NOT NULL,
    expire_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);



---- 5. 旅遊項目資料 "tour"
CREATE TABLE "tour" (
    tour_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL, --  tourgroup、backpacker
    item VARCHAR(100) NOT NULL, -- travel、food、spot、hotel
    status SMALLINT NOT NULL,  -- 1: 上架, 2: 下架
    title VARCHAR(255) NOT NULL,
    slogan VARCHAR(255) NOT NULL,
    tour_start_date TIMESTAMP NULL,
    tour_end_date TIMESTAMP NULL,
    days INT NOT NULL,
    price int NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    address TEXT  NOT NULL,
    google_map_url VARCHAR(255) NOT NULL,
    calendar_url VARCHAR(255) NOT NULL,
    preference1 smallint NOT NULL,
    preference2 smallint NOT NULL,
    preference3 smallint NOT NULL,
    notice TEXT,
    description TEXT  NOT NULL,
    cover_image VARCHAR(255)   NOT NULL,
    img1 VARCHAR(255)   NOT NULL,
    img1_desc VARCHAR(255)   NOT NULL,
    img2 VARCHAR(255)   NOT NULL,
    img2_desc VARCHAR(255)   NOT NULL,
    img3 VARCHAR(255)   NOT NULL,
    img3_desc VARCHAR(255)   NOT NULL,
    img4 VARCHAR(255)   NOT NULL,
    img4_desc VARCHAR(255)   NOT NULL,
    img5 VARCHAR(255)   NOT NULL,
    img5_desc VARCHAR(255)   NOT NULL,
    img6 VARCHAR(255)   NOT NULL,
    img6_desc VARCHAR(255)   NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


---- 6. 旅遊產品細項資料 "tour_detail"
CREATE TABLE "tour_detail" (
    tour_detail_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL,
    feature_img1 VARCHAR(255)  NOT NULL,
    feature_desc1 VARCHAR(255)  NOT NULL,
    feature_img2 VARCHAR(255)  NOT NULL,
    feature_desc2 VARCHAR(255)  NOT NULL,
    feature_img3 VARCHAR(255)  NOT NULL,
    feature_desc3 VARCHAR(255)  NOT NULL,
    itinerary TEXT  NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tour_id) REFERENCES "tour"(tour_id)
);



----- 7. 美食專區資料 "restaurant"
CREATE TABLE "restaurant" (
    restaurant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL,
    reservation_limit INT NOT NULL,
    website_info TEXT  NOT NULL,
    website_url VARCHAR(255)  NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tour_id) REFERENCES "tour"(tour_id)
);




----- 8. 美食專區營業資料 "restaurant_business"
CREATE TABLE "restaurant_business" (
    restaurant_business_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL,
    week VARCHAR(20) NOT NULL, -- 範例：'Monday'、'週一'、'Sat'，視系統設定
    business_hours TEXT NOT NULL, -- 可用 JSON 或簡單字串儲存時段，如：'11:00~14:00, 17:00~21:00'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES "restaurant"(restaurant_id)
);



----- 9. 美食專區菜單資料 "restaurant_menu"
CREATE TABLE "restaurant_menu" (
    restaurant_menu_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    price FLOAT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES "restaurant"(restaurant_id)
);




---- 10. 飯店專區資料 "hotel"
CREATE TABLE "hotel" (
    hotel_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL,
    facility_desc TEXT,
    food_desc TEXT,
    room_desc TEXT,
    leisure_desc TEXT,
    traffic_desc TEXT,
    other_desc TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tour_id) REFERENCES "tour"(tour_id)
);




---- 11. 飯店專區客房資料 "hotel_room"
CREATE TABLE "hotel_room" (
    hotel_room_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    room_count INT NOT NULL,
    image VARCHAR(255)  NOT NULL,
    image_desc VARCHAR(255)  NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES "hotel"(hotel_id)
);



---- 12. 重要通知資料(促銷/異動) "notification"
CREATE TABLE "notification" (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,  -- 促銷 / 異動
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    discount FLOAT NULL,
    promo_price FLOAT NULL,
    change_desc TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tour_id) REFERENCES "tour"(tour_id)
);



---- 13. 國家資料 "country"
CREATE TABLE "country" (
    country_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);



---- 14. 地區資料 "region"
CREATE TABLE "region" (
    region_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (country_id) REFERENCES "country"(country_id)
);



---- 15. 購物車大項目資料 "cart"
CREATE TABLE "cart" (
    cart_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  
    user_id UUID NOT NULL,
    total_price FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id)
);




---- 16. 購物車細項資料 "cart_item"
CREATE TABLE "cart_item" (
    cart_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL,
    tour_id UUID NOT NULL,
    quantity INT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NULL,
    room_type VARCHAR(100) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES "cart"(cart_id),
    FOREIGN KEY (tour_id) REFERENCES "tour"(tour_id)
);



---- 17. 訂單大項目資料 "orders"
CREATE TABLE "orders" (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    address VARCHAR(255)  NULL,
    phone VARCHAR(50)  NULL,
    payment_type VARCHAR(50) NOT NULL,
    discount_type VARCHAR(50)  NULL,
    payment_status SMALLINT NOT NULL DEFAULT 0,  -- 0: 未付款, 1: 已付款
    total_price FLOAT NOT NULL,
    discount_price FLOAT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id)
);



---- 18. 訂單細項資料 "order_item"
CREATE TABLE "order_item" (
    order_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    tour_id UUID NOT NULL,
    payment_status SMALLINT NOT NULL DEFAULT 0, -- 0: 未付款, 1: 已付款
    quantity INT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NULL,
    room_type VARCHAR(100) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES "orders"(order_id),
    FOREIGN KEY (tour_id) REFERENCES "tour"(tour_id)
);



---- 19. 付款紀錄資料 "payment"
CREATE TABLE "payment" (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    order_id UUID NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(50),
    payment_method VARCHAR(50) NOT NULL,
    payment_status SMALLINT NOT NULL DEFAULT 0, -- 0: 未付款, 1: 已付款
    discount_price FLOAT DEFAULT 0,
    return_data TEXT,
    return_time TIMESTAMP WITH TIME ZONE,
    result_info TEXT,
    result_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id),
    FOREIGN KEY (order_id) REFERENCES "orders"(order_id)
);




---- 20. 評論資料 "review"
CREATE TABLE "review" (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    tour_id UUID NULL,
    type VARCHAR(50) NOT NULL,  -- 範例：web / travel / hotel / food / spot
    hashtag VARCHAR(100) null,
    rating INT NOT NULL DEFAULT 1,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id),
    FOREIGN KEY (tour_id) REFERENCES "tour"(tour_id)
);




---- 21. 隱藏玩法資料 "hidden_play"
CREATE TABLE "hidden_play" (
    hidden_play_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    tour_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    share_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id),
    FOREIGN KEY (tour_id) REFERENCES "tour"(tour_id)
);



---- 22. 自動設定資料 "auto_setting"
CREATE TABLE "auto_setting" (
    auto_setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    early_notify SMALLINT NOT NULL DEFAULT 0,        -- 0: 關閉, 1: 開啟
    flexible_notify SMALLINT NOT NULL DEFAULT 0,     -- 0: 關閉, 1: 開啟
    country VARCHAR(100),
    region VARCHAR(100),
    price FLOAT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id)
);




----23. 使用者收藏旅遊商品 "favorite"
CREATE TABLE "favorite" (
    favorite_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    tour_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id),
    FOREIGN KEY (tour_id) REFERENCES "tour"(tour_id)
);


---- 24. 會員旅遊積分資料 "point_record"
CREATE TABLE "point_record" (
    point_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    order_id UUID NULL,
    type VARCHAR(50) NOT NULL, 
    point INT NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id),
    FOREIGN KEY (order_id) REFERENCES "orders"(order_id)
);



---- 25. 優惠卷與使用者綁定的資料 "user_coupon"
CREATE TABLE "user_coupon" (
    user_coupon_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    order_id UUID NULL,
    coupon_id UUID NOT NULL,
    status SMALLINT NOT NULL, -- 1 = 使用, 0 = 未使用
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id),
    FOREIGN KEY (order_id) REFERENCES "orders"(order_id),
    FOREIGN KEY (coupon_id) REFERENCES "coupon"(coupon_id)
);