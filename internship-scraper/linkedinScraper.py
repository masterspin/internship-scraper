import requests
import os
from bs4 import BeautifulSoup
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import aiohttp
import asyncio
import time

load_dotenv()

url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.getenv("NEXT_PUBLIC_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

swe_queries = [
    "software engineer intern",
    "backend engineer intern",
    "data science intern",
    "cyber security intern",
    "AI/machine learning intern",
    "mobile engineer intern",
    "full stack developer intern",
    "frontend developer intern",
    "cloud engineer intern",
    "game development intern",
    "systems engineer intern",
    "computer vision intern",
    "natural language processing (NLP) intern",
    "augmented/virutal reality intern",
]

quant_queries = [
    "quantitative developer intern",
    "quantitative trading intern",
    "quantitative analysis intern"
]

current_database = supabase.table('posts').select('*').execute().data
job_id_list = []

def parseQuery(query):
    for i in range(0,976,25):
        list_url = f"https://www.linkedin.com/jobs/search/?f_E=1&f_TPR=r86400&keywords={query}&location=United%20States&start={i}"
        response = requests.get(list_url)

        while(response.status_code != 200):
            time.sleep(0.5)
            print(list_url)
            response = requests.get(list_url)

        list_data = response.text
        list_soup = BeautifulSoup(list_data, "html.parser")

        page_jobs = list_soup.find_all("li")

        for job in page_jobs:

            base_card_div = job.find("div", {"class" : "base-card"})
            if(base_card_div == None):
                continue
            job_id = base_card_div.get("data-entity-urn").split(":")[3]
            job_link_exists = any(f"https://www.linkedin.com/jobs/view/{job_id}" == item.get('job_link') for item in current_database)
            if(not job_link_exists and job_id not in job_id_list):
                job_id_list.append(job_id)
        time.sleep(0.1)
    print("finished parsing ", query)

job_post_data =[]
def getJobData(jobType):
    for job_id in job_id_list:
        job_url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}"
        job_response = requests.get(job_url)
        while(job_response.status_code != 200):
            time.sleep(0.5)
            print(job_url)
            job_response = requests.get(job_url)
        job_data = job_response.text
        job_soup = BeautifulSoup(job_data, "html.parser")
        job_post = {}

        try:
            job_post["job_link"] = f"https://www.linkedin.com/jobs/view/{job_id}"
        except:
            job_post["job_link"] = ""

        try:
            job_post["job_role"] = job_soup.find("h2", {"class" : "top-card-layout__title font-sans text-lg papabear:text-xl font-bold leading-open text-color-text mb-0 topcard__title"}).text.strip()
        except:
            job_post["job_role"] = ""
        
        if jobType == "QUANT" and not any(keyword in job_post["job_role"].lower() for keyword in ["quant", "trad", "analys"]):
            continue

        if any(word in job_post["job_role"].lower() for word in ["supply chain", "trainee", "behavior", "sr", "senior", "tech lead", "market", "sale", "business", "mechanical", "benefit", "inclusion", "coordinator", "clearing", "electric", "design", "client", "legal", "tax", "social", "process", "accounting", "retail", "training", "customer", "administrative", "human resources", "operations analyst", "management", "apprentice", "unpaid", "phd", "civil engineer"]):
            continue

        try:
            job_post["company_name"] = " ".join(job_soup.find("a", {"class": "topcard__org-name-link topcard__flavor--black-link"}).stripped_strings)
        except:
            job_post["company_name"] = ""
        
        try:
            job_post["job_type"] = jobType
        except:
            job_post["job_type"] = ""


        try:
            job_post["source"] = "LinkedIn"
        except:
            job_post["source"] = ""

        try:
            job_post["location"] = " ".join(job_soup.find('span', class_='topcard__flavor topcard__flavor--bullet').stripped_strings)
        except:
            job_post["location"] = ""

        try:
            job_post["date"] = datetime.now().strftime("%m-%d-%Y")
        except:
            job_post["date"] = ""
        
        job_post_data.append(job_post)
        time.sleep(0.1)




for sweJob in swe_queries:
    parseQuery(sweJob)

getJobData("SWE")

print("got job data for SWE")

job_id_list =[]

for quantJob in quant_queries:
    parseQuery(quantJob)

getJobData("QUANT")

print("got job data for QUANT")

print(job_post_data)

for job_post in job_post_data:
    try:
        data, count = supabase.table('posts').insert(job_post).execute()
    except Exception as e:
        print(f"Error inserting job post: {e}")


# parseQuery("business intern")
# getJobData("BUS")
# job_id_list =[]
# parseQuery("quant dev intern")
# getJobData("QUANT")

# print(job_post_data)

# for job_post in job_post_data:
#     try:
#         data, count = supabase.table('posts').insert(job_post).execute()
#     except Exception as e:
#         print(f"Error inserting job post: {e}")


################################################################################################################################################################################################################################





# import os
# import asyncio
# from datetime import datetime
# from bs4 import BeautifulSoup
# import aiohttp
# from supabase import create_client, Client
# from dotenv import load_dotenv
# import random

# load_dotenv()

# url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
# key: str = os.getenv("NEXT_PUBLIC_SERVICE_ROLE_KEY")
# supabase: Client = create_client(url, key)

# swe_queries = [
#     "software engineer intern",
#     "backend engineer intern",
#     "data science intern",
#     "cyber security intern",
#     "AI/machine learning intern",
#     "mobile engineer intern",
#     "full stack developer intern",
#     "frontend developer intern",
#     "cloud engineer intern",
#     # "DevOps engineer intern",
#     # "Quality Assurance engineer intern",
#     # "game development intern",
#     # "systems engineer intern",
#     "security engineer intern",
#     "computer vision intern",
#     # "natural language processing (NLP) intern",
#     "augmented/virutal reality intern",
# ]

# quant_queries = [
#     "quantitative developer intern",
#     # "quantitative research intern",
#     "quantitative trading intern",
#     "quantitative analysis intern"
# ]

# current_database = supabase.table('posts').select('*').execute().data
# job_id_list = []

# async def fetch_job_ids(query, semaphore):
#     async with semaphore:
#         async with aiohttp.ClientSession() as session:
#             for i in range(0, 976, 25):
#                 list_url = f"https://www.linkedin.com/jobs/search/?f_E=1&f_TPR=r86400&keywords={query}&location=United%20States&start={i}"
#                 while True:
#                     async with session.get(list_url) as response:
#                         if response.status == 200:

#                             list_data = await response.text()
#                             list_soup = BeautifulSoup(list_data, "html.parser")

#                             page_jobs = list_soup.find_all("li")

#                             for job in page_jobs:
#                                 base_card_div = job.find("div", {"class": "base-card"})
#                                 if base_card_div is None:
#                                     continue
#                                 job_id = base_card_div.get("data-entity-urn").split(":")[3]
#                                 job_link_exists = any(f"https://www.linkedin.com/jobs/view/{job_id}" == item.get('job_link') for item in current_database)
#                                 if not job_link_exists:
#                                     job_id_list.append(job_id)
#                             break
#                         else:
#                             print(f"Failed to fetch for {list_url} with status code {response.status}")
#                             await asyncio.sleep(random.uniform(1, 3))

# async def fetch_job_data(job_id, job_type, semaphore):
#     async with semaphore:
#         async with aiohttp.ClientSession() as session:
#             job_url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}"
#             while True:
#                 async with session.get(job_url) as response:
#                     if response.status == 200:
#                         job_data = await response.text()
#                         job_soup = BeautifulSoup(job_data, "html.parser")
#                         job_post = {}

#                         try:
#                             job_post["job_link"] = f"https://www.linkedin.com/jobs/view/{job_id}"
#                         except:
#                             job_post["job_link"] = ""

#                         try:
#                             job_post["job_role"] = job_soup.find("h2", {"class" : "top-card-layout__title font-sans text-lg papabear:text-xl font-bold leading-open text-color-text mb-0 topcard__title"}).text.strip()
#                         except:
#                             job_post["job_role"] = ""
                        
#                         if job_type == "QUANT" and not any(keyword in job_post["job_role"].lower() for keyword in ["quant", "trad", "analys"]):
#                             continue

#                         if any(word in job_post["job_role"].lower() for word in ["supply chain", "trainee", "behavior", "sr", "senior", "tech lead", "market", "sale", "business", "mechanical", "benefit", "inclusion", "coordinator", "clearing", "electric", "design", "client", "legal", "tax", "social", "process", "accounting", "retail", "training", "customer", "administrative", "human resources", "operations analyst", "management", "apprentice", "environment", "justice"]):
#                             continue

#                         try:
#                             job_post["company_name"] = " ".join(job_soup.find("a", {"class": "topcard__org-name-link topcard__flavor--black-link"}).stripped_strings)
#                         except:
#                             job_post["company_name"] = ""
                        
#                         try:
#                             job_post["job_type"] = job_type
#                         except:
#                             job_post["job_type"] = ""

#                         try:
#                             job_post["source"] = "LinkedIn"
#                         except:
#                             job_post["source"] = ""

#                         try:
#                             job_post["location"] = " ".join(job_soup.find('span', class_='topcard__flavor topcard__flavor--bullet').stripped_strings)
#                         except:
#                             job_post["location"] = ""

#                         try:
#                             job_post["date"] = datetime.now().strftime("%m-%d-%Y")
#                         except:
#                             job_post["date"] = ""

#                         return job_post
#                     else:
#                         print(f"Failed to fetch job data for {job_id} with status code {response.status}")
#                         await asyncio.sleep(random.uniform(0.5, 3))

# async def main():
#     semaphore = asyncio.Semaphore(10)
#     tasks = [fetch_job_ids(query, semaphore) for query in swe_queries]
#     await asyncio.gather(*tasks)
#     print("Got job IDs for SWE")

#     swe_jobs = await asyncio.gather(*[fetch_job_data(job_id, "SWE", semaphore) for job_id in job_id_list])
#     print(swe_jobs)
#     job_id_list.clear()

#     tasks = [fetch_job_ids(query, semaphore) for query in quant_queries]
#     await asyncio.gather(*tasks)
#     print("Got job IDs for QUANT")

#     quant_jobs = await asyncio.gather(*[fetch_job_data(job_id, "QUANT", semaphore) for job_id in job_id_list])

#     all_jobs = swe_jobs + quant_jobs
#     print(all_jobs)
#     for job_post in all_jobs:
#         if job_post:
#             try:
#                 data, count = supabase.table('posts').insert(job_post).execute()
#             except Exception as e:
#                 print(f"Error inserting job post: {e}")

# if __name__ == "__main__":
#     asyncio.run(main())