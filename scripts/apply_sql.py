import json
import subprocess
import sys

def apply_sql(project_id, sql_file):
    with open(sql_file, 'r') as f:
        sql_query = f.read()
    
    input_data = {
        "project_id": project_id,
        "name": "rebuild_categories_system",
        "query": sql_query
    }
    
    cmd = [
        "manus-mcp-cli", "tool", "call", "apply_migration",
        "--server", "supabase",
        "--input", json.dumps(input_data)
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)
    print(result.stderr)

if __name__ == "__main__":
    apply_sql("itptinhxsylzvfcpxwpl", "/home/ubuntu/bawwabtysemifinal/database/new_categories.sql")
