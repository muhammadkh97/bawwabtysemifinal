-- حذف السياسات القديمة
DROP POLICY IF EXISTS coupons_select_authenticated ON coupons;
DROP POLICY IF EXISTS coupons_insert_authenticated ON coupons;
DROP POLICY IF EXISTS coupons_update_authenticated ON coupons;
DROP POLICY IF EXISTS coupons_delete_authenticated ON coupons;

-- سياسة القراءة: البائعون يمكنهم قراءة كوبوناتهم فقط
CREATE POLICY coupons_select_vendor ON coupons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = coupons.vendor_id
      AND stores.user_id = auth.uid()
    )
  );

-- سياسة الإدراج: البائعون يمكنهم إنشاء كوبونات لمتاجرهم فقط
CREATE POLICY coupons_insert_vendor ON coupons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = coupons.vendor_id
      AND stores.user_id = auth.uid()
    )
  );

-- سياسة التحديث: البائعون يمكنهم تحديث كوبوناتهم فقط
CREATE POLICY coupons_update_vendor ON coupons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = coupons.vendor_id
      AND stores.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = coupons.vendor_id
      AND stores.user_id = auth.uid()
    )
  );

-- سياسة الحذف: البائعون يمكنهم حذف كوبوناتهم فقط
CREATE POLICY coupons_delete_vendor ON coupons
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = coupons.vendor_id
      AND stores.user_id = auth.uid()
    )
  );
