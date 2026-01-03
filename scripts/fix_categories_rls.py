import os
from supabase import create_client, Client

# إعداد اتصال Supabase
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL', 'https://itptinhxsylzvfcpxwpl.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cHRpbmh4c3lsenZmY3B4d3BsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTQ4NjM2NSwiZXhwIjoyMDQ3MDYyMzY1fQ.Qiv3Zu-i7MdtRRWv1TUX7G-W6MRoQTlI9u86MMYC_yM')

def execute_sql(sql_file_path):
    """تنفيذ ملف SQL على قاعدة البيانات"""
    try:
        # قراءة محتوى ملف SQL
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # إنشاء عميل Supabase
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # تنفيذ SQL
        print(f"🔄 جاري تنفيذ: {sql_file_path}")
        result = supabase.rpc('exec_sql', {'query': sql_content}).execute()
        
        print(f"✅ تم تنفيذ {sql_file_path} بنجاح!")
        return True
        
    except Exception as e:
        print(f"❌ خطأ في تنفيذ {sql_file_path}: {str(e)}")
        return False

if __name__ == "__main__":
    # تنفيذ ملف إصلاح سياسات RLS
    sql_file = r"c:\Users\Mohammad AbuAlkheran\bawwabtysemifinal\database\fix_categories_rls.sql"
    execute_sql(sql_file)
