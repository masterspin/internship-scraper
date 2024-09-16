import requests
import os
from bs4 import BeautifulSoup
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
            job_link_exists = any(links[0].get("href").split("?",1)[0] == item.get('job_link').split("?",1)[0] for item in current_database)
            if(not job_link_exists):
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


                details_element = internship_details[2].find("details")
                if details_element:
                    summary_element = details_element.find("summary")
                    if summary_element:
                        text_after_summary = "\n".join([str(sibling) for sibling in summary_element.next_siblings if sibling.name is None])
                        try:
                            job_post["location"] = text_after_summary
                        except:
                            job_post["location"] = ""
                else:
                    try:
                        text = internship_details[2].get_text(separator="\n")
                        job_post["location"] = text
                    except:
                        job_post["location"] = ""

                try:
                    job_post["term"] = ""
                except:
                    job_post["term"] = ""
                
                try:
                    job_post["date"] = date
                except:
                    job_post["date"] = ""
                
                job_post_data.append(job_post)



def githubOffSeasonScraper(repoLink, repoName):
    githubInternships = requests.get(repoLink)
    soup = BeautifulSoup(githubInternships.text, features="html.parser")

    for internship in soup.select("article table tbody tr"):
        internship_details = internship.find_all("td")
        date = internship_details[5].string
        links = internship_details[4].find_all("a")
        if(len(links) > 0):
            job_link_exists = any(links[0].get("href").split("?",1)[0] == item.get('job_link').split("?",1)[0] for item in current_database)
            if(not job_link_exists):
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


                details_element = internship_details[2].find("details")
                if details_element:
                    summary_element = details_element.find("summary")
                    if summary_element:
                        text_after_summary = "\n".join([str(sibling) for sibling in summary_element.next_siblings if sibling.name is None])
                        try:
                            job_post["location"] = text_after_summary
                        except:
                            job_post["location"] = ""
                else:
                    try:
                        text = internship_details[2].get_text(separator="\n")
                        job_post["location"] = text
                    except:
                        job_post["location"] = ""

                try:
                    text = internship_details[3].get_text(separator="\n")
                    job_post["term"] = text
                except:
                    job_post["term"] = ""
                
                if(repoName == "PittCSC Off-Season" and "2025" not in job_post["term"]):
                    continue
                
                try:
                    job_post["date"] = date
                except:
                    job_post["date"] = ""
                
                job_post_data.append(job_post)



githubScraper("https://github.com/SimplifyJobs/Summer2025-Internships", "PittCSC")
githubOffSeasonScraper("https://github.com/SimplifyJobs/Summer2024-Internships/blob/dev/README-Off-Season.md", "PittCSC Off-Season")
githubScraper("https://github.com/Ouckah/Summer2025-Internships#the-list-", "Ouckah")
githubScraper("https://github.com/SimplifyJobs/New-Grad-Positions", "PittCSC New Grad")
print(job_post_data)

for job_post in job_post_data:
    try:
        data, count = supabase.table('posts').insert(job_post).execute()
    except Exception as e:
        print(f"Error inserting job post: {e}")
