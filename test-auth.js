// ملف اختبار سريع لفحص تسجيل الدخول
// يمكن تشغيله في Developer Console للتحقق من حالة المصادقة

async function testAuth() {
  console.log('🔍 بدء اختبار تسجيل الدخول...\n');
  
  // 1. التحقق من localStorage
  console.log('1️⃣ فحص localStorage:');
  const authToken = localStorage.getItem('supabase.auth.token');
  if (authToken) {
    console.log('✅ توكن موجود في localStorage');
    try {
      const parsed = JSON.parse(authToken);
      console.log('   - Access Token موجود:', !!parsed.access_token);
      console.log('   - Refresh Token موجود:', !!parsed.refresh_token);
      console.log('   - Expires At:', new Date(parsed.expires_at * 1000).toLocaleString('ar-EG'));
    } catch (e) {
      console.log('❌ خطأ في قراءة التوكن:', e);
    }
  } else {
    console.log('❌ لا يوجد توكن في localStorage');
  }
  
  console.log('\n2️⃣ فحص Session الحالية:');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ خطأ في جلب Session:', error);
    } else if (session) {
      console.log('✅ Session موجودة');
      console.log('   - User ID:', session.user.id);
      console.log('   - Email:', session.user.email);
      console.log('   - Role:', session.user.user_metadata?.role || 'غير محدد');
    } else {
      console.log('❌ لا توجد Session نشطة');
    }
  } catch (e) {
    console.log('❌ خطأ في فحص Session:', e);
  }
  
  console.log('\n3️⃣ فحص بيانات المستخدم من public.users:');
  try {
    const { data, error } = await supabase.rpc('get_current_user').single();
    if (error) {
      console.log('❌ خطأ في جلب بيانات المستخدم:', error);
    } else if (data) {
      console.log('✅ بيانات المستخدم موجودة');
      console.log('   - ID:', data.id);
      console.log('   - Email:', data.email);
      console.log('   - Name:', data.full_name);
      console.log('   - Role:', data.role);
    } else {
      console.log('⚠️ لا توجد بيانات للمستخدم');
    }
  } catch (e) {
    console.log('❌ خطأ في جلب بيانات المستخدم:', e);
  }
  
  console.log('\n4️⃣ اختبار تسجيل الدخول (اختياري):');
  console.log('لاختبار تسجيل الدخول، قم بتشغيل:');
  console.log('testLogin("email@example.com", "password")');
  
  console.log('\n✅ انتهى الاختبار');
}

async function testLogin(email, password) {
  console.log('🔐 اختبار تسجيل الدخول...');
  console.log('Email:', email);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.log('❌ فشل تسجيل الدخول:', error.message);
      return;
    }
    
    console.log('✅ تم تسجيل الدخول بنجاح!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    
    // التحقق من Session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('✅ Session تم إنشاؤها');
    } else {
      console.log('❌ Session لم يتم إنشاؤها');
    }
    
    // جلب بيانات المستخدم
    const { data: userData } = await supabase.rpc('get_current_user').single();
    if (userData) {
      console.log('✅ بيانات المستخدم:', userData);
    }
    
  } catch (e) {
    console.log('❌ خطأ:', e);
  }
}

async function clearAuth() {
  console.log('🧹 مسح بيانات المصادقة...');
  localStorage.removeItem('supabase.auth.token');
  await supabase.auth.signOut();
  console.log('✅ تم المسح');
}

// عرض التعليمات
console.log('📋 الأوامر المتاحة:');
console.log('  testAuth()           - اختبار حالة المصادقة الحالية');
console.log('  testLogin(email, pw) - اختبار تسجيل الدخول');
console.log('  clearAuth()          - مسح بيانات المصادقة');
console.log('\nمثال: testLogin("admin@bawwabty.com", "admin123")');
