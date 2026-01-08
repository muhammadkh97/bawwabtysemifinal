// ملف اختبار سريع لفحص تسجيل الدخول
// يمكن تشغيله في Developer Console للتحقق من حالة المصادقة

async function testAuth() {
  
  // 1. التحقق من localStorage
  const authToken = (typeof window !== 'undefined' ? localStorage.getItem('supabase.auth.token') : null);
  if (authToken) {
    try {
      const parsed = JSON.parse(authToken);
    } catch (e) {
    }
  } else {
  }
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
    } else if (session) {
    } else {
    }
  } catch (e) {
  }
  
  try {
    const { data, error } = await supabase.rpc('get_current_user').single();
    if (error) {
    } else if (data) {
    } else {
    }
  } catch (e) {
  }
  
  
}

async function testLogin(email, password) {
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return;
    }
    
    
    // التحقق من Session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
    } else {
    }
    
    // جلب بيانات المستخدم
    const { data: userData } = await supabase.rpc('get_current_user').single();
    if (userData) {
    }
    
  } catch (e) {
  }
}

async function clearAuth() {
  (typeof window !== 'undefined' ? localStorage.removeItem('supabase.auth.token') : null);
  await supabase.auth.signOut();
}

// عرض التعليمات
