-- تعطيل RLS مؤقتاً على coupons لحل المشكلة
-- يمكن تفعيله لاحقاً بعد التأكد من السياسات

ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage DISABLE ROW LEVEL SECURITY;

SELECT 'RLS disabled on coupons tables' as status;
