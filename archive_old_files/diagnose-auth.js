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

  // 1️⃣ فحص Supabase Client
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase client غير موجود!');
    return;
  }

  // 2️⃣ فحص Session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ خطأ في جلب Session:', sessionError);
  } else if (!session) {
    console.error('❌ لا توجد Session نشطة');
    return;
  } else {
  }

  // 3️⃣ فحص auth.users metadata
  const authUser = session.user;

  // 4️⃣ فحص public.users عبر RPC
  try {
    const { data: userData, error: userError } = await supabase
      .rpc('get_current_user')
      .single();

    if (userError) {
      console.error('❌ خطأ في get_current_user():', userError);
    } else if (!userData) {
      console.error('❌ لا توجد بيانات في public.users');
    } else {
    }
  } catch (e) {
    console.error('❌ خطأ غير متوقع:', e);
  }

  // 5️⃣ فحص public.users مباشرة
  try {
    const { data: directData, error: directError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (directError) {
      console.error('❌ خطأ في SELECT:', directError);
    } else if (!directData) {
      console.error('❌ لا توجد بيانات');
    } else {
    }
  } catch (e) {
    console.error('❌ خطأ:', e);
  }

  // 6️⃣ اختبار getCurrentUser من lib/auth
  if (typeof getCurrentUser !== 'undefined') {
    try {
      const result = await getCurrentUser();
      if (result.user) {
      } else {
        console.error('   ❌ User غير موجود');
      }
    } catch (e) {
      console.error('   ❌ خطأ:', e);
    }
  } else {
  }

  // 7️⃣ فحص localStorage
  const authToken = (typeof window !== 'undefined' ? localStorage.getItem('supabase.auth.token') : null);
  if (authToken) {
    try {
      const parsed = JSON.parse(authToken);
    } catch (e) {
      console.error('❌ خطأ في قراءة Token');
    }
  } else {
    console.error('❌ لا يوجد Token في localStorage');
  }

  // 8️⃣ الخلاصة والتوصيات
  
  if (!session) {
  } else {
    
    // تحقق من get_current_user
    const { data: userData } = await supabase.rpc('get_current_user').single();
    if (!userData) {
    } else {
      
      if (userData.role === 'customer') {
      } else {
        if (userData.role === 'admin') {
        }
        if (userData.role === 'vendor' || userData.role === 'admin') {
        }
        if (userData.role === 'driver' || userData.role === 'admin') {
        }
      }
    }
  }

})();
