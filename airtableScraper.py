import json
import os
from urllib.parse import unquote

import pandas as pd
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

def scrape_airtable(job_function: str):
    url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key: str = os.getenv("NEXT_PUBLIC_SERVICE_ROLE_KEY")
    supabase: Client = create_client(url, key)

    print("Starting Airtable scrape...")
    current_data = supabase.table('posts').select('job_link').execute().data

    # Initialize existing_links from Supabase data
    existing_links = set(record['job_link'] for record in current_data)
    s = requests.Session()

    headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Connection': 'keep-alive',
        'Host': 'airtable.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'
    }

    url = 'https://airtable.com/appmXHK6JoqQcSKf6/shruwVkAKPjHFdVJu/tbl0U5gfpdphUO2KF?viewControls=on'
    step = s.get(url, headers=headers)

    # Get data table URL
    start = 'urlWithParams: '
    end = 'earlyPrefetchSpan:'
    x = step.text
    new_url = 'https://airtable.com' + x[x.find(start) + len(start):x.rfind(end)].strip().replace('u002F', '').replace('"', '').replace('\\', '/')[:-1]

    # Get Airtable auth
    start = 'var headers = '
    end = "headers['x-time-zone'] "
    dirty_auth_json = x[x.find(start) + len(start):x.rfind(end)].strip()[:-1]
    auth_json = json.loads(dirty_auth_json)

    new_headers = {
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Airtable-Accept-Msgpack': 'true',
        'X-Airtable-Application-Id': auth_json['x-airtable-application-id'],
        'X-Airtable-Inter-Service-Client': 'webClient',
        'X-Airtable-Page-Load-Id': auth_json['x-airtable-page-load-id'],
        'X-Early-Prefetch': 'true',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Time-Zone': 'Europe/London',
        'X-User-Locale': 'en'
    }

    json_data = s.get(new_url, headers=new_headers).json()

    # Create DataFrame from column and row data
    cols = {x['id']: x['name'] for x in json_data['data']['table']['columns']}
    rows = json_data['data']['table']['rows']

    df = pd.json_normalize(rows)
    ugly_col = df.columns

    clean_col = [next((x.replace('cellValuesByColumnId.', '').replace(k, v) for k, v in cols.items() if k in x), x) for x in ugly_col]
    df.columns = clean_col

    choice_dict = {}

    for col in json_data['data']['table']['columns']:
        if col['name'] == 'Job Function':
            choice_dict = {k: v['name'] for k, v in col['typeOptions']['choices'].items()}

    df['Job Function'] = df['Job Function'].map(choice_dict)

    # Filter by the provided Job Function
    df = df[df['Job Function'] == job_function]

    df = df.rename(columns={
        'Apply.url': 'job_link',
        'Company': 'company_name',
        'Position Title': 'job_role',
        'Date': 'date',
        'Location': 'location'
    })

    columns_to_keep = ['job_link', 'company_name', 'job_role', 'date', 'location']

    df = df[columns_to_keep]

    df['source'] = 'airtable'
    if(job_function == "Electrical and Controls Engineering"):
        df['job_type'] = 'EE'
    elif(job_function == "Hardware Engineering"):
        df['job_type'] = 'Hardware'

    # Ensure job_link URLs are properly encoded and decoded
    df['job_link'] = df['job_link'].apply(lambda x: unquote(x))

    data_list = df.to_dict(orient='records')

    # Check for new records
    new_records = [record for record in data_list if record['job_link'] not in existing_links]

    if new_records:
        response = supabase.table('posts').upsert(new_records).execute()
        print(f"Inserted {len(new_records)} new records.")
    else:
        print("No new records to insert.")

    print(f"Number of new records for {job_function}: {len(new_records)}")

scrape_airtable('Electrical and Controls Engineering')
scrape_airtable('Hardware Engineering')
