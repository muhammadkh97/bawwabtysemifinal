/**
 * Script لتفعيل جميع التصنيفات في قاعدة البيانات
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function activateCategories() {
  try {
    console.log('🔍 جاري البحث عن التصنيفات...');
    
    // جلب جميع التصنيفات
    const { data: allCategories, error: fetchError } = await supabase
      .from('categories')
      .select('id, name, name_ar, is_active, parent_id')
      .order('created_at');

    if (fetchError) {
      console.error('❌ خطأ في جلب التصنيفات:', fetchError);
      return;
    }

    console.log(`📊 تم العثور على ${allCategories?.length || 0} تصنيف`);
    
    if (!allCategories || allCategories.length === 0) {
      console.log('⚠️ لا توجد تصنيفات في قاعدة البيانات');
      console.log('💡 يمكنك إنشاء تصنيفات من لوحة التحكم');
      return;
    }

    // عرض التصنيفات الحالية
    console.log('\n📋 التصنيفات الحالية:');
    allCategories.forEach((cat) => {
      const status = cat.is_active ? '✅' : '❌';
      const type = cat.parent_id ? '   ↳ فرعي' : 'رئيسي';
      console.log(`${status} [${type}] ${cat.name_ar || cat.name} (ID: ${cat.id})`);
    });

    // عد التصنيفات غير النشطة
    const inactiveCount = allCategories.filter(cat => !cat.is_active).length;
    
    if (inactiveCount === 0) {
      console.log('\n✅ جميع التصنيفات نشطة بالفعل!');
      return;
    }

    console.log(`\n🔄 سيتم تفعيل ${inactiveCount} تصنيف...`);

    // تفعيل جميع التصنيفات
    const { error: updateError } = await supabase
      .from('categories')
      .update({ is_active: true })
      .eq('is_active', false);

    if (updateError) {
      console.error('❌ خطأ في تفعيل التصنيفات:', updateError);
      return;
    }

    console.log('✅ تم تفعيل جميع التصنيفات بنجاح!');
    
    // عرض النتيجة النهائية
    const { data: updatedCategories } = await supabase
      .from('categories')
      .select('id, name, name_ar, is_active, parent_id')
      .order('created_at');

    console.log('\n📋 التصنيفات بعد التفعيل:');
    updatedCategories?.forEach((cat) => {
      const status = cat.is_active ? '✅' : '❌';
      const type = cat.parent_id ? '   ↳ فرعي' : 'رئيسي';
      console.log(`${status} [${type}] ${cat.name_ar || cat.name} (ID: ${cat.id})`);
    });

  } catch (error) {
    console.error('❌ خطأ غير متوقع:', error);
  }
}

// تشغيل السكريبت
activateCategories();
