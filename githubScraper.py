import re
import os
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

load_dotenv()

url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.getenv("NEXT_PUBLIC_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

print("Starting Github scrape...")
current_database = [post for post in supabase.table('posts').select('*').execute().data if post['source'] not in ['PittCSC', 'PittCSC Off-Season']]
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
    # Set up Selenium WebDriver
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in headless mode
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=chrome_options)

    try:
        driver.get(repoLink)
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "table")))
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, features="html.parser")
    finally:
        driver.quit()
    # print(soup)

    for internship in soup.select("article table tbody tr"):
        internship_details = internship.find_all("td")
        date = internship_details[4].string

        links = internship_details[3].find_all("a")
        if(len(links) > 0):
            job_link_exists = any(links[0].get("href") == item.get('job_link') for item in current_database)
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

def cscareersScraper(repoLink, repoName):
    response = requests.get(repoLink)
    if not response.ok:
        print("Failed to fetch README.")
        return   
    
    content = response.text

    # Find the start and end of the internship table
    table_start = content.find('TABLE_START')
    table_end = content.find('TABLE_END')
    if table_start == -1 or table_end == -1:
        print("Could not find the internship table in the README.")
        return

    table_content = content[table_start:table_end].strip()
    lines = table_content.split('\n')

    for line in lines[4:]:
        if not line.startswith('|'):
            continue
        columns = [col.strip() for col in line.split('|')[1:-1]]

        if len(columns) != 5:
            continue

        # Extract the URL from the Markdown link

        html_string = columns[3]
        if html_string == "🔒":
            continue
        soup = BeautifulSoup(html_string, 'html.parser')
        print(soup)
        job_link = soup.find('a')['href']

        location = columns[2]
        soup = BeautifulSoup(location, 'html.parser')

        # Remove all <summary> tags and their content
        for summary in soup.find_all('summary'):
            summary.decompose()

        # Replace all <br> tags with commas
        for br in soup.find_all(['br']):
            br.replace_with(', ')

        # Get text, split by commas, strip whitespace, and remove empty entries
        locations = [loc.strip() for loc in soup.get_text(separator=', ').split(',') if loc.strip()]

        # Join back into a single comma-separated string
        locs = ', '.join(locations)

        job_post = {
            'company_name': columns[0],
            'job_role': columns[1],
            'location': locs,
            'job_link': job_link,
            'date': columns[4],
            'source': repoName
        }

        print(job_post)
        # Handle subsidiary listings
        if job_post['company_name'] == '↳' and job_post_data:
            job_post['company_name'] = job_post_data[-1]['company_name']

        job_post_data.append(job_post)

    # Print results
    for post in job_post_data:
        print(post)

githubScraper("https://github.com/SimplifyJobs/Summer2025-Internships", "PittCSC")
githubOffSeasonScraper("https://github.com/SimplifyJobs/Summer2025-Internships/blob/dev/README-Off-Season.md", "PittCSC Off-Season")
# cscareersScraper("https://raw.githubusercontent.com/vanshb03/Summer2025-Internships/refs/heads/dev/README.md", "CSCareers")
# cscareersScraper("https://raw.githubusercontent.com/vanshb03/Summer2025-Internships/refs/heads/dev/OFFSEASON_README.md", "CSCareers Off-Season")
githubScraper("https://github.com/SimplifyJobs/New-Grad-Positions", "PittCSC New Grad")
# print(job_post_data)

for job_post in job_post_data:
    try:
        # Check if the job post already exists in the database
        existing_posts = supabase.table('posts').select('*').eq('job_link', job_post['job_link']).execute().data
        if existing_posts:
            existing_post = existing_posts[0]
            # Update the date if the source matches and is either PittCSC or PittCSC Off-Season
            if existing_post['source'] in ['PittCSC', 'PittCSC Off-Season'] and existing_post['source'] == job_post['source']:
                print("Updating existing job post...")
                supabase.table('posts').update({'date': job_post['date']}).eq('job_link', existing_post['job_link']).execute()
        else:
            # Insert the new job post if it doesn't exist
            data, count = supabase.table('posts').insert(job_post).execute()
    except Exception as e:
        print(f"Error processing job post: {e}")
