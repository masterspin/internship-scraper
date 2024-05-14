import requests
import os
from bs4 import BeautifulSoup
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.getenv("NEXT_PUBLIC_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

print("Starting Github scrape...")
current_database = supabase.table('posts').select('*').execute().data
job_post_data = []

def githubScraper(repoLink, repoName):
    githubInternships = requests.get(repoLink)
    soup = BeautifulSoup(githubInternships.text, features="html.parser")

    for internship in soup.select("article table tbody tr"):
        internship_details = internship.find_all("td")
        date = internship_details[4].string

        links = internship_details[3].find_all("a")
        if(len(links) > 0):
            job_link_exists = any(links[0].get("href") == item.get('job_link') for item in current_database)
            if(not job_link_exists):
                print(job_link_exists)
                job_post = {}
                try:
                    job_post["job_link"] = links[0].get("href")
                except:
                    job_post["job_link"] = ""
                
                try:
                    job_post["job_role"] = internship_details[1].string
                except:
                    job_post["job_role"] = ""
                
                try:
                    job_post["company_name"] = internship_details[0].string
                    if(job_post["company_name"] == "↳" and len(job_post_data) > 0):
                        job_post["company_name"] = job_post_data[-1]["company_name"]
                except:
                    job_post["company_name"] = ""

                try:
                    job_post["job_type"] = ""
                except:
                    job_post["job_type"] = ""
                    

                try:
                    job_post["source"] = repoName
                except:
                    job_post["source"] = ""
                
                try:
                    job_post["location"] = internship_details[2].string
                except:
                    job_post["location"] = ""
                
                try:
                    job_post["date"] = date
                except:
                    job_post["date"] = ""
                
                job_post_data.append(job_post)
    

githubScraper("https://github.com/SimplifyJobs/Summer2024-Internships", "PittCSC")
githubScraper("https://github.com/Ouckah/Summer2025-Internships#the-list-", "Ouckah")
print(job_post_data)

for job_post in job_post_data:
    try:
        data, count = supabase.table('posts').insert(job_post).execute()
    except Exception as e:
        print(f"Error inserting job post: {e}")