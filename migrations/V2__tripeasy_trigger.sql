
/* ----------- 增加 Trigger Update_date 的函數 --------------- */
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$;


/* ----------- 增加 Trigger 事件 --------------- */
---- 1. 會員基本資料 "user"
create trigger trigger_set_updated_at_user before
update
    on
    public."user" for each row execute function set_updated_at();

---- 2. 會員第三方登入資料 "socialLogin"
create trigger trigger_set_updated_at_socialLogin before
update
    on
    public."socialLogin" for each row execute function set_updated_at();

---- 3. 會員等級資料 "user_level"
create trigger trigger_set_updated_at_user_level before
update
    on
    public.user_level for each row execute function set_updated_at();
   
---- 4. 優惠卷資料 "coupon"
create trigger trigger_set_updated_at_coupon before
update
    on
    public.coupon for each row execute function set_updated_at();
   
---- 5. 旅遊項目資料 "tour"
create trigger trigger_set_updated_at_tour before
update
    on
    public.tour for each row execute function set_updated_at();
 
---- 6. 旅遊產品細項資料 "tour_detail"
create trigger trigger_set_updated_at_tour_detail before
update
    on
    public.tour_detail for each row execute function set_updated_at();
   
----- 7. 美食專區資料 "restaurant"
create trigger trigger_set_updated_at_restaurant before
update
    on
    public.restaurant for each row execute function set_updated_at();
   
----- 8. 美食專區營業資料 "restaurant_business"
create trigger trigger_set_updated_at_restaurant_business before
update
    on
    public.restaurant_business for each row execute function set_updated_at();
   
----- 9. 美食專區菜單資料 "restaurant_menu"
create trigger trigger_set_updated_at_restaurant_menu before
update
    on
    public.restaurant_menu for each row execute function set_updated_at();
   
---- 10. 飯店專區資料 "hotel"
create trigger trigger_set_updated_at_hotel before
update
    on
    public.hotel for each row execute function set_updated_at();
   
---- 11. 飯店專區客房資料 "hotel_room"
create trigger trigger_set_updated_at_hotel_room before
update
    on
    public.hotel_room for each row execute function set_updated_at();
   
---- 12. 重要通知資料(促銷/異動) "notification"
create trigger trigger_set_updated_at_notification before
update
    on
    public.notification for each row execute function set_updated_at();
   
---- 13. 國家資料 "country"
create trigger trigger_set_updated_at_country before
update
    on
    public.country for each row execute function set_updated_at();
   
---- 14. 地區資料 "region"
create trigger trigger_set_updated_at_region before
update
    on
    public.region for each row execute function set_updated_at();
   
---- 15. 購物車大項目資料 "cart"
create trigger trigger_set_updated_at_cart before
update
    on
    public.cart for each row execute function set_updated_at();
   
---- 16. 購物車細項資料 "cart_item"
create trigger trigger_set_updated_at_cart_item before
update
    on
    public.cart_item for each row execute function set_updated_at();
   
---- 17. 訂單大項目資料 "orders"
create trigger trigger_set_updated_at_orders before
update
    on
    public.orders for each row execute function set_updated_at();
   
---- 18. 訂單細項資料 "order_item"
create trigger trigger_set_updated_at_order_item before
update
    on
    public.order_item for each row execute function set_updated_at();
   
---- 19. 付款紀錄資料 "payment"
create trigger trigger_set_updated_at_payment before
update
    on
    public.payment for each row execute function set_updated_at();
   
---- 20. 評論資料 "review"
create trigger trigger_set_updated_at_review before
update
    on
    public.review for each row execute function set_updated_at();
   
---- 21. 隱藏玩法資料 "hidden_play"
create trigger trigger_set_updated_at_hidden_play before
update
    on
    public.hidden_play for each row execute function set_updated_at();
   
---- 22. 自動設定資料 "auto_setting"
create trigger trigger_set_updated_at_auto_setting before
update
    on
    public.auto_setting for each row execute function set_updated_at();
    
---- 23. 使用者收藏旅遊商品 "favorite"
create trigger trigger_set_updated_at_favorite before
update
    on
    public.favorite for each row execute function set_updated_at();

---- 24. 會員旅遊積分資料 "point_record"
create trigger trigger_set_updated_at_point_record before
update
    on
    public.point_record for each row execute function set_updated_at();
   
---- 25. 優惠卷與使用者綁定的資料 "user_coupon"
create trigger trigger_set_updated_at_user_coupon before
update
    on
    public.user_coupon for each row execute function set_updated_at();
   
   
   
   
   