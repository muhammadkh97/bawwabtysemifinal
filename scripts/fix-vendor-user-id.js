const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrqglrpljcysxdiuxzka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycWdscnBsamN5c3hkaXV4emthIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkwNTA3OSwiZXhwIjoyMDgyNDgxMDc5fQ.kp36zU83tXOjFuPxNf4-hGdooypHG2111GLrr8RXQQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSqlFile(filePath) {
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ خطأ في تنفيذ SQL:', error);
      
      // محاولة تنفيذ SQL مباشرة إذا فشل RPC
      const { data: data2, error: error2 } = await supabase.from('_sql').rpc(sql);
      
      if (error2) {
        console.error('❌ فشل التنفيذ:', error2);
        process.exit(1);
      }
    }
    
    
  } catch (err) {
    console.error('❌ خطأ غير متوقع:', err);
    process.exit(1);
  }
}

// تنفيذ الملف
const sqlFile = './database/fix_vendor_user_id.sql';
executeSqlFile(sqlFile).then(() => {
  process.exit(0);
});
