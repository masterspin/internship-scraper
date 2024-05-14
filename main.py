from bs4 import BeautifulSoup
from typing import List
import aiohttp
import asyncio
import time
from aiohttp import ClientSession
import requests

async def fetchHTML(url: str, session: ClientSession) -> str:
    resp = await session.request(method="GET", url=url)
    html = await resp.text()
    if(len(html) == 0):
        print("Hit rate limit for LinkedIn requests")
    return html

async def gatherTopLevelSearch(searchTerms: List[str]) -> List[str]:
    htmlList = []
    semaphore = asyncio.Semaphore(2)
    async with semaphore:
        async with aiohttp.ClientSession() as session:
            for searchTerm in searchTerms:
                requestStr = "https://www.linkedin.com/jobs/search?keywords={}&location=United%20States".format(searchTerm)
                html = await fetchHTML(requestStr, session)
                htmlList.append(html)
    return htmlList

async def parseJobLinksFromSearch(searchTerms: List[str]) -> List[str]:
    jobLinks = []
    topLevelSearchHTMLList = await gatherTopLevelSearch(searchTerms)
    for html in topLevelSearchHTMLList:
        soup = BeautifulSoup(html, features="html.parser")
        for jobCard in soup.select("ul.jobs-search__results-list"):
            jobPostDetails = jobCard.find("a", class_=["base-card__full-link"])
            if jobPostDetails:
                jobPostLink = jobPostDetails.get("href")
                jobLinks.append(jobPostLink)
            applyButton = jobCard.find("button", class_=["jobs-apply-button"])
            if applyButton:
                applyLink = applyButton.get("href")
                if applyLink and "externalApply" in applyLink:
                    jobLinks.append(applyLink)
    return jobLinks

def scrapeJobs(searchTerms: List[str]) -> List[str]:
    print("Starting LinkedIn scrape...")
    if not searchTerms:
        print("searchTerms cannot be empty")
        return None

    time.sleep(1)
    print("Searching for jobs in the United States...")
    jobLinks = asyncio.run(parseJobLinksFromSearch(searchTerms))
    print("Found {} job links".format(len(jobLinks)))
    return jobLinks

# Example usage
searchTerms = ["software", "engineer"]
jobLinks = scrapeJobs(searchTerms)
print(jobLinks)
