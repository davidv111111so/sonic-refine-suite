import os
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_KEY')
supabase = create_client(url, key)

task_id = '84c49f18c38a'
res = supabase.table('job_logs').select('*').eq('task_id', task_id).execute()
if res.data:
    print(json.dumps(res.data[0], indent=2))
else:
    print(f"Task {task_id} not found")
