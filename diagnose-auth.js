// ═══════════════════════════════════════════════════════════
// سكريبت تشخيص شامل لمشاكل تسجيل الدخول والصلاحيات
// Comprehensive Diagnostics for Login & Permissions Issues
// ═══════════════════════════════════════════════════════════
//
// انسخ هذا الكود بالكامل والصقه في Developer Console (F12)
// Copy this entire code and paste it in Developer Console (F12)
//
// ═══════════════════════════════════════════════════════════

(async function diagnose() {
  console.clear();
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 بدء التشخيص الشامل | Starting Comprehensive Diagnostics');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1️⃣ فحص Supabase Client
  console.log('1️⃣ فحص Supabase Client:');
  console.log('-----------------------------------------------------------');
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase client غير موجود!');
    console.log('💡 تأكد من أنك في صفحة التطبيق');
    return;
  }
  console.log('✅ Supabase client موجود\n');

  // 2️⃣ فحص Session
  console.log('2️⃣ فحص Session:');
  console.log('-----------------------------------------------------------');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ خطأ في جلب Session:', sessionError);
  } else if (!session) {
    console.error('❌ لا توجد Session نشطة');
    console.log('💡 يجب تسجيل الدخول أولاً');
    return;
  } else {
    console.log('✅ Session موجودة');
    console.log('   User ID:', session.user.id);
    console.log('   Email:', session.user.email);
    console.log('   Created:', new Date(session.user.created_at).toLocaleString('ar-EG'));
  }
  console.log('');

  // 3️⃣ فحص auth.users metadata
  console.log('3️⃣ فحص User Metadata من auth.users:');
  console.log('-----------------------------------------------------------');
  const authUser = session.user;
  console.log('   user_metadata:', authUser.user_metadata);
  console.log('   app_metadata:', authUser.app_metadata);
  console.log('   raw_user_meta_data:', (authUser as any).raw_user_meta_data);
  console.log('');

  // 4️⃣ فحص public.users عبر RPC
  console.log('4️⃣ فحص بيانات public.users عبر get_current_user():');
  console.log('-----------------------------------------------------------');
  try {
    const { data: userData, error: userError } = await supabase
      .rpc('get_current_user')
      .single();

    if (userError) {
      console.error('❌ خطأ في get_current_user():', userError);
      console.log('   Message:', userError.message);
      console.log('   Code:', userError.code);
      console.log('   Details:', userError.details);
    } else if (!userData) {
      console.error('❌ لا توجد بيانات في public.users');
      console.log('💡 قد تحتاج لتشغيل sync-auth-users.sql');
    } else {
      console.log('✅ البيانات من public.users:');
      console.log('   ID:', userData.id);
      console.log('   Email:', userData.email);
      console.log('   Name:', userData.name);
      console.log('   Full Name:', userData.full_name);
      console.log('   Role:', userData.role, '⭐');
      console.log('   Phone:', userData.phone || 'غير محدد');
      console.log('   Store Name:', userData.store_name || 'غير محدد');
      console.log('   Vehicle Type:', userData.vehicle_type || 'غير محدد');
    }
  } catch (e) {
    console.error('❌ خطأ غير متوقع:', e);
  }
  console.log('');

  // 5️⃣ فحص public.users مباشرة
  console.log('5️⃣ فحص public.users مباشرة (عبر SELECT):');
  console.log('-----------------------------------------------------------');
  try {
    const { data: directData, error: directError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (directError) {
      console.error('❌ خطأ في SELECT:', directError);
      console.log('   Message:', directError.message);
      console.log('   Hint:', directError.hint);
      console.log('💡 قد يكون RLS Policy يمنع القراءة');
    } else if (!directData) {
      console.error('❌ لا توجد بيانات');
    } else {
      console.log('✅ البيانات المباشرة:');
      console.log('   Role:', directData.role, '⭐');
      console.log('   كل البيانات:', directData);
    }
  } catch (e) {
    console.error('❌ خطأ:', e);
  }
  console.log('');

  // 6️⃣ اختبار getCurrentUser من lib/auth
  console.log('6️⃣ اختبار getCurrentUser() من التطبيق:');
  console.log('-----------------------------------------------------------');
  if (typeof getCurrentUser !== 'undefined') {
    try {
      const result = await getCurrentUser();
      console.log('   النتيجة:', result);
      if (result.user) {
        console.log('   ✅ User موجود');
        console.log('   Role:', (result.user as any).role);
      } else {
        console.error('   ❌ User غير موجود');
        console.log('   Error:', result.error);
      }
    } catch (e) {
      console.error('   ❌ خطأ:', e);
    }
  } else {
    console.log('   ⚠️ getCurrentUser غير متوفر في هذا السياق');
  }
  console.log('');

  // 7️⃣ فحص localStorage
  console.log('7️⃣ فحص localStorage:');
  console.log('-----------------------------------------------------------');
  const authToken = localStorage.getItem('supabase.auth.token');
  if (authToken) {
    console.log('✅ Token موجود في localStorage');
    try {
      const parsed = JSON.parse(authToken);
      console.log('   Access Token:', parsed.access_token ? 'موجود ✅' : 'غير موجود ❌');
      console.log('   Refresh Token:', parsed.refresh_token ? 'موجود ✅' : 'غير موجود ❌');
      console.log('   Expires:', parsed.expires_at ? new Date(parsed.expires_at * 1000).toLocaleString('ar-EG') : 'غير محدد');
    } catch (e) {
      console.error('❌ خطأ في قراءة Token');
    }
  } else {
    console.error('❌ لا يوجد Token في localStorage');
  }
  console.log('');

  // 8️⃣ الخلاصة والتوصيات
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 الخلاصة | Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('📝 التوصيات | Recommendations:');
  console.log('-----------------------------------------------------------');
  
  if (!session) {
    console.log('❌ المشكلة: لا توجد جلسة نشطة');
    console.log('✅ الحل: سجل دخول من /auth/login');
  } else {
    console.log('✅ الجلسة نشطة');
    
    // تحقق من get_current_user
    const { data: userData } = await supabase.rpc('get_current_user').single();
    if (!userData) {
      console.log('❌ المشكلة: المستخدم غير موجود في public.users');
      console.log('✅ الحل: شغّل sync-auth-users.sql في Supabase SQL Editor');
    } else {
      console.log('✅ المستخدم موجود في public.users');
      console.log('   الدور الحالي:', userData.role);
      
      if (userData.role === 'customer') {
        console.log('⚠️  الدور هو customer - لا يمكن الوصول للوحات التحكم');
        console.log('✅ الحل: غيّر الدور في Supabase Dashboard أو شغّل make-admin.sql');
      } else {
        console.log('✅ الدور صحيح:', userData.role);
        console.log('');
        console.log('🔗 يمكنك الآن الوصول إلى:');
        if (userData.role === 'admin') {
          console.log('   - /dashboard/admin');
        }
        if (userData.role === 'vendor' || userData.role === 'admin') {
          console.log('   - /dashboard/vendor');
        }
        if (userData.role === 'driver' || userData.role === 'admin') {
          console.log('   - /dashboard/driver');
        }
      }
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ انتهى التشخيص | Diagnostics Complete');
  console.log('═══════════════════════════════════════════════════════════');
})();
