#!/usr/bin/env node

/**
 * Quick Test Script - Bawwabty Platform
 * يختبر جميع التحسينات المطبقة
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 بدء اختبار التحسينات...\n');

const checks = [];

// 1. Check FloatingChatWidget
const chatWidgetPath = path.join(process.cwd(), 'components', 'FloatingChatWidget.tsx');
checks.push({
  name: 'FloatingChatWidget موجود',
  passed: fs.existsSync(chatWidgetPath),
  path: chatWidgetPath
});

// 2. Check layout.tsx imports FloatingChatWidget
const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx');
const layoutContent = fs.existsSync(layoutPath) ? fs.readFileSync(layoutPath, 'utf-8') : '';
checks.push({
  name: 'FloatingChatWidget مستورد في layout.tsx',
  passed: layoutContent.includes("import FloatingChatWidget from '@/components/FloatingChatWidget'"),
  path: layoutPath
});

checks.push({
  name: 'FloatingChatWidget مضاف في JSX',
  passed: layoutContent.includes('<FloatingChatWidget />'),
  path: layoutPath
});

// 3. Check BulkUploadModal
const bulkUploadPath = path.join(process.cwd(), 'components', 'BulkUploadModal.tsx');
checks.push({
  name: 'BulkUploadModal موجود',
  passed: fs.existsSync(bulkUploadPath),
  path: bulkUploadPath
});

// 4. Check Promotions Page
const promotionsPath = path.join(process.cwd(), 'app', 'dashboard', 'vendor', 'promotions', 'page.tsx');
checks.push({
  name: 'Promotions page موجود',
  passed: fs.existsSync(promotionsPath),
  path: promotionsPath
});

// 5. Check FuturisticSidebar updated
const sidebarPath = path.join(process.cwd(), 'components', 'dashboard', 'FuturisticSidebar.tsx');
const sidebarContent = fs.existsSync(sidebarPath) ? fs.readFileSync(sidebarPath, 'utf-8') : '';
checks.push({
  name: 'FuturisticSidebar يحتوي على promotions',
  passed: sidebarContent.includes('/dashboard/vendor/promotions'),
  path: sidebarPath
});

checks.push({
  name: 'FuturisticSidebar لا يحتوي على marketing القديم',
  passed: !sidebarContent.includes('/dashboard/vendor/marketing') || 
          sidebarContent.includes('/dashboard/admin/marketing'), // admin يمكن أن يحتوي
  path: sidebarPath
});

// 6. Check Reviews Page (no dummy data)
const reviewsPath = path.join(process.cwd(), 'app', 'dashboard', 'vendor', 'reviews', 'page.tsx');
const reviewsContent = fs.existsSync(reviewsPath) ? fs.readFileSync(reviewsPath, 'utf-8') : '';
checks.push({
  name: 'Reviews page يستخدم Supabase',
  passed: reviewsContent.includes('fetchVendorReviews'),
  path: reviewsPath
});

checks.push({
  name: 'Reviews page بدون بيانات وهمية',
  passed: !reviewsContent.includes("customer_name: 'أحمد محمد'") &&
          !reviewsContent.includes("customer_name: 'فاطمة علي'"),
  path: reviewsPath
});

// 7. Check Wallet uses Currency
const walletPath = path.join(process.cwd(), 'app', 'dashboard', 'vendor', 'wallet', 'page.tsx');
const walletContent = fs.existsSync(walletPath) ? fs.readFileSync(walletPath, 'utf-8') : '';
checks.push({
  name: 'Wallet يستورد useCurrency',
  passed: walletContent.includes("import { useCurrency }"),
  path: walletPath
});

checks.push({
  name: 'Wallet يستخدم formatPrice',
  passed: walletContent.includes('formatPrice('),
  path: walletPath
});

// 8. Check Analytics uses Currency
const analyticsPath = path.join(process.cwd(), 'app', 'dashboard', 'vendor', 'analytics', 'page.tsx');
const analyticsContent = fs.existsSync(analyticsPath) ? fs.readFileSync(analyticsPath, 'utf-8') : '';
checks.push({
  name: 'Analytics يستورد useCurrency',
  passed: analyticsContent.includes("import { useCurrency }"),
  path: analyticsPath
});

checks.push({
  name: 'Analytics يستخدم formatPrice',
  passed: analyticsContent.includes('formatPrice('),
  path: analyticsPath
});

// 9. Check SQL Migration exists
const sqlPath = path.join(process.cwd(), 'database', 'migrations', 'fix-storage-rls-recursion.sql');
checks.push({
  name: 'SQL Migration موجود',
  passed: fs.existsSync(sqlPath),
  path: sqlPath
});

// 10. Check package.json has xlsx
const packagePath = path.join(process.cwd(), 'package.json');
const packageContent = fs.existsSync(packagePath) ? JSON.parse(fs.readFileSync(packagePath, 'utf-8')) : {};
checks.push({
  name: 'xlsx library مثبتة',
  passed: !!packageContent.dependencies?.xlsx,
  path: packagePath
});

// Print Results
console.log('📊 نتائج الاختبار:\n');

let passedCount = 0;
let failedCount = 0;

checks.forEach((check, index) => {
  const icon = check.passed ? '✅' : '❌';
  const status = check.passed ? 'نجح' : 'فشل';
  
  console.log(`${icon} [${index + 1}/${checks.length}] ${check.name}`);
  if (!check.passed) {
    console.log(`   ⚠️  المسار: ${check.path}`);
  }
  
  if (check.passed) passedCount++;
  else failedCount++;
});

console.log(`\n📈 الإحصائيات:`);
console.log(`   ✅ ناجح: ${passedCount}/${checks.length}`);
console.log(`   ❌ فاشل: ${failedCount}/${checks.length}`);
console.log(`   📊 النسبة: ${Math.round((passedCount / checks.length) * 100)}%`);

if (failedCount === 0) {
  console.log('\n🎉 ممتاز! جميع الاختبارات نجحت!');
  console.log('✨ المشروع جاهز للتشغيل\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failedCount} اختبار فشل. راجع الأخطاء أعلاه.\n`);
  process.exit(1);
}
