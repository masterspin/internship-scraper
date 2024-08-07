import requests
import os
from bs4 import BeautifulSoup
from supabase import create_client, Client
from dotenv import load_dotenv
import time

load_dotenv()

url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.getenv("NEXT_PUBLIC_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)


current_database = supabase.table('posts').select('*').eq('source', 'LinkedIn').execute().data

print(len(current_database))

job_list = []

MAX_RETRIES = 25

for entry in current_database:
    link = entry.get('job_link')
    oldLink = link
    print(link)
    statuses = supabase.table('statuses').select('*').eq('job', oldLink).execute().data
    filtered_count = len([status for status in statuses if status.get('status') != 'Not Applied'])
    if(filtered_count > 0):
        continue
    link = "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/" + link.split('/')[-1]
    response = requests.get(link)
    retries = 0
    while(response.status_code != 200 and retries < MAX_RETRIES):
        print("HELP")
        time.sleep(0.15)
        response = requests.get(link)
        retries+=1
            

    if(response.status_code != 200):
        job_list.append(oldLink)
        print(statuses)
        print(filtered_count)
    else:
        data = response.text
        soup = BeautifulSoup(data, "html.parser")
        feedback_message = soup.find('figcaption', class_='closed-job__flavor--closed')
        if(feedback_message and "No longer accepting applications" in feedback_message.get_text()):
            job_list.append(oldLink)
            print(feedback_message.get_text())
            print(statuses)
            print(filtered_count)
            
print(job_list)
for link in job_list:
    try:
        response = supabase.table('posts').delete().eq('job_link', link).execute()
    except Exception as e:
        print(f"An error occurred: {e}")
print(len(job_list))